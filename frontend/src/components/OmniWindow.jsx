import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import '../styles/OmniWindow.css';
import { ICONS } from '../assets/assets';
import InteractiveChart from './InteractiveChart';

function OmniWindow({ content, type, visible, onClose, t }) {
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [url, setUrl] = useState('https://www.google.com');
    const [chartImage, setChartImage] = useState(null);
    const [execLogs, setExecLogs] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const containerRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper to normalize chart data from various AI formats
    const normalizeChartData = useCallback((data) => {
        if (!data || typeof data !== 'object') return null;

        let root = data;
        // Handle common nesting patterns: { chart: { ... } } or { config: { ... } }
        if (data.chart && typeof data.chart === 'object') root = data.chart;
        else if (data.config && typeof data.config === 'object') root = data.config;

        // Must have data to be a chart
        const plotData = root.data || root.datasets || root.rows;
        if (!Array.isArray(plotData)) return null;

        // Extract metadata with fallbacks
        const chartType = root.type || root.chartType || 'line';
        const title = root.title || data.title || 'AI Generated Chart';

        // Smarter xAxis detection
        let xAxis = root.xAxis || root.xKey || root.x_axis;
        if (!xAxis && plotData.length > 0) {
            const firstEntry = plotData[0];
            // Prefer the first string field as the axis
            xAxis = Object.keys(firstEntry).find(k => typeof firstEntry[k] === 'string') || Object.keys(firstEntry)[0];
        }

        // Smarter series detection (all numeric fields except xAxis)
        let series = root.series || root.yKeys;
        if (!series && plotData.length > 0) {
            const firstEntry = plotData[0];
            series = Object.keys(firstEntry)
                .filter(k => k !== xAxis && (typeof firstEntry[k] === 'number' || !isNaN(parseFloat(firstEntry[k]))))
                .map(k => ({ key: k, label: k }));
        }

        // Ensure series is in the format Recharts expects: [{ key, label }]
        const normalizedSeries = Array.isArray(series)
            ? series.map(s => typeof s === 'string' ? { key: s, label: s } : s)
            : [];

        return {
            title,
            chartType,
            data: plotData,
            xAxis,
            series: normalizedSeries
        };
    }, []);

    // Resize Logic
    const [windowWidth, setWindowWidth] = useState(parseInt(localStorage.getItem('omni_window_width') || '450', 10));
    const [isResizing, setIsResizing] = useState(false);
    const windowWidthRef = useRef(windowWidth);

    // 同補 Ref 寬度，避免 stopResizing 頻繁觸發依賴更新
    useEffect(() => {
        windowWidthRef.current = windowWidth;
    }, [windowWidth]);

    const resize = useCallback((e) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX;
        // 限制寬度在 350px 之間
        const minW = 350;
        const maxW = window.innerWidth * 0.6; // 最多佔視窗 60%，留空間給聊天區

        if (newWidth >= minW && newWidth <= maxW) {
            setWindowWidth(newWidth);
        }
    }, [isResizing]);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        localStorage.setItem('omni_window_width', windowWidthRef.current.toString());
    }, []);

    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing, isResizing]);

    const handleRunPython = useCallback(async (codeToRun) => {
        setIsExecuting(true);
        try {
            const result = await api.runPython(codeToRun || content);
            if (result.status === 'success') {
                setChartImage(result.chart);
                setExecLogs(result.logs || '執行成功，無日誌輸出。');

                setTabs(prev => {
                    let nextTabs = [...prev];
                    if (result.chart && !nextTabs.find(t => t.id === 'python-chart')) {
                        nextTabs.push({ id: 'python-chart', title: t.chartOutput, type: 'chart' });
                    }
                    return nextTabs;
                });

                if (result.chart) setActiveTabId('python-chart');

            } else {
                setExecLogs(`錯誤: ${result.message}\n${result.logs || ''}`);
            }
        } catch (error) {
            setExecLogs(`請求失敗: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    }, [content, t.chartOutput]);

    // Initialize and update tabs from content/type props
    useEffect(() => {
        if (!content) {
            setTabs([]);
        } else if (visible && type && content) {
            const existingCodeTab = tabs.find(t => t.id === 'ai-code');
            const newContent = content;

            // Reset chart and logs when high-level content changes
            setChartImage(null);
            setExecLogs('');

            if (type === 'html' || type === 'python' || type === 'javascript') {
                if (!existingCodeTab) {
                    const newTab = { id: 'ai-code', title: `( ${type.toUpperCase()} )`, type: 'code', lang: type, content: newContent };
                    setTabs(prev => [newTab, ...prev]);
                    setActiveTabId('ai-code');
                } else {
                    // Update existing AI code tab
                    setTabs(prev => prev.map(t => t.id === 'ai-code' ? { ...t, content: newContent, lang: type, title: `( ${type.toUpperCase()} )` } : t));
                    setActiveTabId('ai-code');
                }
                // If Python, auto-run only if it contains matplotlib content
                if (type === 'python') {
                    const isMatplotlib = newContent.includes('matplotlib') || newContent.includes('plt.');
                    if (isMatplotlib) {
                        handleRunPython(newContent);
                    }
                }
            } else if (type === 'json' || newContent.includes('json:chart')) {
                // Detect interactive chart JSON
                try {
                    let jsonData;
                    if (newContent.includes('json:chart')) {
                        const match = newContent.match(/```json:chart\n([\s\S]*?)```/);
                        if (match) jsonData = JSON.parse(match[1]);
                    } else {
                        // Try to parse the entire content if type is json
                        try {
                            jsonData = JSON.parse(newContent);
                        } catch (e) {
                            // If direct parse fails, look for any json block inside
                            const jsonMatch = newContent.match(/```(?:json)?\n([\s\S]*?)```/);
                            if (jsonMatch) jsonData = JSON.parse(jsonMatch[1]);
                        }
                    }

                    const normalized = normalizeChartData(jsonData);

                    if (normalized) {
                        const existingChartTab = tabs.find(t => t.id === 'interactive-chart');
                        if (!existingChartTab) {
                            const newTab = { id: 'interactive-chart', title: '📈 互動圖表', type: 'interactive-chart', content: normalized };
                            setTabs(prev => [...prev, newTab]);
                            setActiveTabId('interactive-chart');
                        } else {
                            setTabs(prev => prev.map(t => t.id === 'interactive-chart' ? { ...t, content: normalized } : t));
                            setActiveTabId('interactive-chart');
                        }
                    } else if (type === 'json') {
                        // Fallback to showing raw JSON if it's not a chart
                        if (!existingCodeTab) {
                            const newTab = { id: 'ai-code', title: `( JSON )`, type: 'code', lang: 'json', content: newContent };
                            setTabs(prev => [newTab, ...prev]);
                            setActiveTabId('ai-code');
                        } else {
                            setTabs(prev => prev.map(t => t.id === 'ai-code' ? { ...t, content: newContent, lang: 'json', title: `( JSON )` } : t));
                            setActiveTabId('ai-code');
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse chart JSON:', e);
                }
            } else if (type === 'web') {
                const existingWebTab = tabs.find(t => t.id === 'ai-web');
                if (!existingWebTab) {
                    const newTab = { id: 'ai-web', title: t.webPreview, type: 'web', content: newContent };
                    setTabs(prev => [newTab, ...prev]);
                    setActiveTabId('ai-web');
                } else {
                    setTabs(prev => prev.map(t => t.id === 'ai-web' ? { ...t, content: newContent } : t));
                    setActiveTabId('ai-web');
                }
            }
        }
    }, [type, content, visible, handleRunPython, normalizeChartData, t.webPreview]);

    const addBrowserTab = () => {
        const id = `browser-${Date.now()}`;
        const newTab = { id, title: t.browser, type: 'browser', url: 'https://www.google.com' };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(id);
        setIsMenuOpen(false);
    };

    const closeTab = (e, id) => {
        e.stopPropagation();
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            if (activeTabId === id && newTabs.length > 0) {
                setActiveTabId(newTabs[0].id);
            } else if (newTabs.length === 0) {
                setActiveTabId(null);
            }
            return newTabs;
        });
    };

    const onDragStart = (e, index) => {
        e.dataTransfer.setData('tabIndex', index);
    };

    const onDrop = (e, targetIndex) => {
        const sourceIndex = parseInt(e.dataTransfer.getData('tabIndex'));
        const newTabs = [...tabs];
        const [movedTab] = newTabs.splice(sourceIndex, 1);
        newTabs.splice(targetIndex, 0, movedTab);
        setTabs(newTabs);
    };

    if (!visible) return null;

    return (
        <div
            className={`omni-window ${isResizing ? 'resizing' : ''}`}
            style={{
                width: visible ? `${windowWidth}px` : '0',
                maxWidth: visible ? `${windowWidth}px` : '90vw',
                flexBasis: visible ? `${windowWidth}px` : '0',
                flexShrink: 0,
                flexGrow: 0,
                display: visible ? 'flex' : 'none',
                transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <div className="omni-resize-handle" onMouseDown={startResizing} />

            {/* 縮放時的簡單防干擾遮罩 */}
            {isResizing && <div className="omni-resize-overlay" />}

            <div className="omni-window-header">
                <div className="omni-tabs">
                    {tabs.map((tab, index) => (
                        <div
                            key={tab.id}
                            className={`omni-tab ${activeTabId === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTabId(tab.id)}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDrop(e, index)}
                        >
                            <span className="tab-title">{tab.title}</span>
                            <button className="tab-close" onClick={(e) => closeTab(e, tab.id)}>×</button>
                        </div>
                    ))}
                </div>

                <div className="omni-tab-actions">
                    {activeTabId === 'ai-code' && tabs.find(t => t.id === 'ai-code')?.lang === 'python' && (
                        <button
                            className="omni-action-btn run-btn"
                            onClick={() => handleRunPython(tabs.find(t => t.id === 'ai-code')?.content)}
                            disabled={isExecuting}
                            title={t.runDescription}
                        >
                            {isExecuting ? '⌛' : '▶'} {t.run}
                        </button>
                    )}

                    <div className="omni-dropdown-container">
                        <button className="omni-action-btn add-tab-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            +
                        </button>
                        {isMenuOpen && (
                            <div className="omni-dropdown-menu">
                                <div className="dropdown-item" onClick={addBrowserTab}>
                                    <img className="dropdown-icon" src={ICONS.global} />
                                    {t.newWebBrowser}
                                </div>
                            </div>
                        )}
                    </div>
                    <button className="omni-close-btn" onClick={onClose}>×</button>
                </div>
            </div>

            <div className="omni-window-content">
                {tabs.length === 0 ? (
                    <div className="omni-empty">
                        <span style={{ fontSize: '3rem', opacity: 0.5 }}>
                            <img src={ICONS.omniSys} alt="Omni System" />
                        </span>
                        <p>{t.omniWindowNone}</p>
                    </div>
                ) : (
                    tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`omni-content-panel ${activeTabId === tab.id ? 'active' : ''}`}
                        >
                            {tab.type === 'code' && (
                                <div className="code-viewer">
                                    <div className="code-content-wrapper">
                                        <ReactMarkdown
                                            children={`\`\`\`${tab.lang}\n${tab.content}\n\`\`\``}
                                        />
                                    </div>
                                    {execLogs && (
                                        <div className="logs-viewer embedded">
                                            <div className="logs-header">{t.executionLogs}</div>
                                            <pre className="logs-content">{execLogs}</pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {tab.type === 'chart' && (
                                <div className="chart-viewer">
                                    <div className="chart-frame">
                                        {chartImage ? (
                                            <img src={`data:image/png;base64,${chartImage}`} alt="Chart Output" />
                                        ) : (
                                            <div className="empty-chart">Generating chart...</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {tab.type === 'interactive-chart' && activeTabId === tab.id && (
                                <div className="interactive-chart-viewer" style={{ flex: 1, display: 'flex', background: '#1e1e1e', overflow: 'hidden' }}>
                                    <InteractiveChart config={tab.content} />
                                </div>
                            )}

                            {tab.type === 'web' && (
                                <iframe
                                    className="web-preview"
                                    srcDoc={tab.content}
                                    sandbox="allow-scripts allow-popups allow-forms"
                                    title={t.webPreview}
                                />
                            )}

                            {tab.type === 'browser' && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div className="browser-header">
                                        <input
                                            className="browser-url-bar"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const newUrl = e.target.value;
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: newUrl } : t));
                                                }
                                            }}
                                            defaultValue={tab.url}
                                        />
                                    </div>
                                    <webview
                                        src={tab.url}
                                        style={{ flex: 1, background: 'white' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default memo(OmniWindow);
