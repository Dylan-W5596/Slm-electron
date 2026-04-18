/* eslint-disable react/no-unknown-property */
import { useRef, useEffect, forwardRef, useMemo, useState } from 'react';
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, wrapEffect } from '@react-three/postprocessing';
import { Effect } from 'postprocessing';
import * as THREE from 'three';
import '../styles/Credits.css';

// --- Shaders ---
const waveVertexShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
}
`;

const waveFragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform float mouseRadius;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed;
  return fbm(p + fbm(p2)); 
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv -= 0.5;
  uv.x *= resolution.x / resolution.y;
  float f = pattern(uv);
  
  vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
  mouseNDC.x *= resolution.x / resolution.y;
  float dist = length(uv - mouseNDC);
  float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
  f -= 0.5 * effect;

  vec3 col = mix(vec3(0.0), waveColor, f);
  gl_FragColor = vec4(col, 1.0);
}
`;

const ditherFragmentShader = `
precision highp float;
uniform float colorNum;
uniform float pixelSize;
const float bayerMatrix8x8[64] = float[64](
  0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
  8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
  2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
);

vec3 dither(vec2 uv, vec3 color, vec2 resolution) {
  vec2 scaledCoord = floor(uv * resolution / pixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
  float step = 1.0 / (colorNum - 1.0);
  color += threshold * step;
  float bias = 0.2;
  color = clamp(color - bias, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void mainImage(in vec4 inputColor, in vec2 uv, out vec4 outputColor) {
  vec2 normalizedPixelSize = pixelSize / resolution;
  vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
  vec4 color = texture2D(inputBuffer, uvPixel);
  color.rgb = dither(uv, color.rgb, resolution);
  outputColor = color;
}
`;

// --- Post-processing Effect ---
class RetroEffectImpl extends Effect {
    constructor() {
        const uniforms = new Map([
            ['colorNum', new THREE.Uniform(4.0)],
            ['pixelSize', new THREE.Uniform(2.0)]
        ]);
        super('RetroEffect', ditherFragmentShader, { uniforms });
        this.uniforms = uniforms;
    }
}
const WrappedRetro = wrapEffect(RetroEffectImpl);
const RetroEffect = forwardRef((props, ref) => {
    return <WrappedRetro ref={ref} colorNum={props.colorNum} pixelSize={props.pixelSize} />;
});
RetroEffect.displayName = 'RetroEffect';

// --- Inner Wave Component (Optimized) ---
function DitheredWaves({ containerRef }) {
    const mesh = useRef();
    const { viewport, size, gl } = useThree();
    const mousePos = useRef(new THREE.Vector2(0, 0));

    // Initial uniforms
    const uniforms = useMemo(() => ({
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(0, 0) },
        waveSpeed: { value: 0.04 },
        waveFrequency: { value: 2.0 },
        waveAmplitude: { value: 0.3 },
        waveColor: { value: new THREE.Color(0.1, 0.2, 0.35) },
        mousePos: { value: new THREE.Vector2(0, 0) },
        mouseRadius: { value: 0.45 }
    }), []);

    useEffect(() => {
        const dpr = gl.getPixelRatio();
        uniforms.resolution.value.set(size.width * dpr, size.height * dpr);

        const handleMove = (e) => {
            const rect = gl.domElement.getBoundingClientRect();
            mousePos.current.set(
                (e.clientX - rect.left) * dpr,
                (e.clientY - rect.top) * dpr
            );
        };

        // Listen on the container to capture moves even over gaps
        const target = containerRef.current || window;

        let isFocused = true;
        const handleFocusChange = (e, focused) => {
            isFocused = focused;
        };

        if (ipcRenderer) {
            ipcRenderer.on('app-focus-changed', handleFocusChange);
        }

        target.addEventListener('mousemove', handleMove);
        return () => {
            target.removeEventListener('mousemove', handleMove);
            if (ipcRenderer) {
                ipcRenderer.removeListener('app-focus-changed', handleFocusChange);
            }
        };
    }, [gl, size, uniforms, containerRef]);

    useFrame((state) => {
        // 資源優化：若視窗失去焦點，則跳過 Uniform 更新與相關計算
        // 注意：useFrame 的內容會直接影響 Render Loop
        // 這裡我們暫停 CPU 端的狀態更新
        if (ipcRenderer && !document.hasFocus()) {
            return;
        }

        uniforms.time.value = state.clock.getElapsedTime();
        uniforms.mousePos.value.copy(mousePos.current);
    });

    return (
        <>
            <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
                <planeGeometry args={[1, 1]} />
                <shaderMaterial
                    vertexShader={waveVertexShader}
                    fragmentShader={waveFragmentShader}
                    uniforms={uniforms}
                />
            </mesh>
            <EffectComposer>
                <RetroEffect colorNum={4} pixelSize={2} />
            </EffectComposer>
        </>
    );
}

function Credits({ onBack, t }) {
    const pageRef = useRef();
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            if (!pageRef.current) return;

            // 基準設計解析度 (1200x850)，可根據內容豐富度微調
            const baseWidth = 1200;
            const baseHeight = 850;

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // 計算寬高縮放比，取較小值以確保內容完整顯示
            const scaleX = windowWidth / baseWidth;
            const scaleY = windowHeight / baseHeight;
            const newScale = Math.min(scaleX, scaleY, 1); // 不放大，只縮小 (或若需要放大可移除 1)

            setScale(newScale);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className="credits-page"
            ref={pageRef}
            onClick={onBack}
            style={{ cursor: 'pointer' }}
        >
            <div className="credits-dither-bg">
                <Canvas
                    camera={{ position: [0, 0, 6] }}
                    dpr={1}
                    gl={{ antialias: true }}
                    style={{ background: '#020617', pointerEvents: 'none' }}
                >
                    <DitheredWaves containerRef={pageRef} />
                </Canvas>
            </div>

            <div
                className="credits-container"
                onClick={(e) => e.stopPropagation()}
                style={{
                    cursor: 'default',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '1200px', // 固定基準寬度
                    transformOrigin: 'center'
                }}
            >
                <div className="credits-header">
                    <h1 className="credits-title">{t.creditsTitle}</h1>
                    <div className="credits-line"></div>
                </div>

                <div className="credits-content-grid">
                    <div className="credits-card tech">
                        <div className="card-icon">🚀</div>
                        <h3>{t.systemArchitecture}</h3>
                        <p>{t.creditsTech}</p>
                    </div>

                    <div className="credits-card model">
                        <div className="card-icon">🧠</div>
                        <h3>{t.openSourceModel}</h3>
                        <p>{t.creditsModel}</p>
                    </div>

                    <div className="credits-card art">
                        <div className="card-icon">🎨</div>
                        <h3>{t.visualArts}</h3>
                        <p>{t.creditsArt}</p>
                    </div>

                    <div className="credits-card special">
                        <div className="card-icon">🤝</div>
                        <h3>{t.specialThanks}</h3>
                        <p>{t.creditsSpecial}</p>
                    </div>
                </div>

                <div className="credits-footer">
                    <p>Powered by X_OO</p>
                    <p className="version-text">Version {t.version}</p>
                </div>
            </div>
        </div>
    );
}

export default Credits;
