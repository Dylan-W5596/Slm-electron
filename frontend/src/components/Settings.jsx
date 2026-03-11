import { ICONS } from '../assets/assets';
import '../styles/Settings.css';

function Settings({ config, onUpdateConfig, onBack, onPlayClick, onOpenMonitor, selectedModel, isModelLoading, onModelChange, t }) {
    const handleThemeChange = (theme) => {
        onPlayClick();
        onUpdateConfig({ ...config, theme });
    };

    const handleParamChange = (key, value) => {
        onUpdateConfig({ ...config, [key]: parseFloat(value) });
    };

    const handleLanguageChange = (lang) => {
        onPlayClick();
        onUpdateConfig({ ...config, language: lang });
    };

    const handleResetDefaults = () => {
        onPlayClick(true);
        if (window.confirm(t.confirmReset || "確定要恢復預設值嗎？")) {
            onUpdateConfig({
                theme: 'dark',
                temperature: 0.7,
                maxTokens: 512,
                soundEnabled: true,
                language: 'zh',
            });
        }
    };

    return (
        <div className="settings-view">
            <div className="settings-header">
                <button className="back-btn" onClick={onBack}>{t.backToChat}</button>
                <h2>{t.settings}</h2>
            </div>

            <div className="settings-content">
                <section className="settings-section">
                    <h3>{t.language}</h3>
                    <div className="language-options">
                        <button
                            className={`lang-btn ${config.language === 'zh' ? 'active' : ''}`}
                            onClick={() => handleLanguageChange('zh')}
                        >繁體中文</button>
                        <button
                            className={`lang-btn ${config.language === 'en' ? 'active' : ''}`}
                            onClick={() => handleLanguageChange('en')}
                        >English</button>
                    </div>
                </section>

                <section className="settings-section">
                    <h3>{t.audioSettings}</h3>
                    <div className="setting-item toggle">
                        <label>{t.soundInteractions}</label>
                        <button
                            className={`toggle-btn ${config.soundEnabled ? 'on' : 'off'}`}
                            onClick={() => {
                                if (!config.soundEnabled) {
                                    onUpdateConfig({ ...config, soundEnabled: true });
                                    onPlayClick(true);
                                } else {
                                    onPlayClick();
                                    onUpdateConfig({ ...config, soundEnabled: false });
                                }
                            }}
                        >
                            {config.soundEnabled ? t.on : t.off}
                        </button>
                    </div>
                </section>

                <section className="settings-section">
                    <h3>{t.interfaceTheme}</h3>
                    <div className="theme-options">
                        <button
                            className={`theme-btn dark ${config.theme === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('dark')}
                        >{t.darkLuxury}</button>
                        <button
                            className={`theme-btn light ${config.theme === 'light' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('light')}
                        >{t.brightComfort}</button>
                        <button
                            className={`theme-btn cyber ${config.theme === 'cyber' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('cyber')}
                        >{t.cyberpunk}</button>
                    </div>
                </section>

                <section className="settings-section">
                    <h3>{t.modelSettings}</h3>
                    <div className="setting-item">
                        <label>Gemma3 Series</label>
                        <div className="Model">
                            <input
                                type="radio"
                                name='modelChange'
                                checked={selectedModel === 'Gemma3_4b_it_Q4_K_M'}
                                onChange={() => onModelChange("Gemma3_4b_it_Q4_K_M")}
                                disabled={isModelLoading}
                            />
                            <span>Gemma3_4B_Q4_K_M</span>
                            {isModelLoading && selectedModel === "Gemma3_4b_it_Q4_K_M" && (
                                <div className="NotificationDiv">
                                    <span className='Notification'>Model is loading...</span>
                                    <img src={ICONS.progress} alt="loading" className="model-loader" />
                                </div>
                            )}
                        </div>
                        <label>Llama3.2 Series</label>
                        <div className="Model">
                            <input
                                type="radio"
                                name='modelChange'
                                checked={selectedModel === 'Llama_3.2_3B_It_Q4_K_M'}
                                onChange={() => onModelChange("Llama_3.2_3B_It_Q4_K_M")}
                                disabled={isModelLoading}
                            />
                            <span>Llama_3.2_3B_It_Q4_K_M</span>
                            {isModelLoading && selectedModel === "Llama_3.2_3B_It_Q4_K_M" && (
                                <div className="NotificationDiv">
                                    <span className='Notification'>Model is loading...</span>
                                    <img src={ICONS.progress} alt="loading" className="model-loader" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="setting-item">
                        <label>Temperature: {config.temperature}</label>
                        <input
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={config.temperature}
                            onChange={(e) => onUpdateConfig({ ...config, temperature: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div className="setting-item">
                        <label>Max Tokens: {config.maxTokens}</label>
                        <input
                            type="range"
                            min="64"
                            max="4096"
                            step="64"
                            value={config.maxTokens}
                            onChange={(e) => onUpdateConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="setting-item">
                        <label>Generate Core</label>
                        <div className="GenerateCore">
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input  // xx
                                    type="radio"
                                    name='deviceChange'
                                />
                                <span>CPU</span>
                            </div>
                            <span> |</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input  // xx
                                    type="radio"
                                    name='deviceChange'
                                />
                                <span>GPU Cuda</span>
                            </div>
                        </div>
                    </div>
                    <div className="setting-item no-border">
                        <button className="reset-prev-btn" onClick={handleResetDefaults}>
                            {t.resetDefaults}
                        </button>
                    </div>
                </section>

                <section className="settings-section dev-section">
                    <h3>{t.devSettings}</h3>
                    <div className="setting-item">
                        <label>{t.backendMonitor}</label>
                        <button className="monitor-btn" onClick={() => onOpenMonitor()}>
                            {t.openMonitor}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Settings;
