import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import '../styles/OmniWindow.css';
import { ICONS } from '../assets/assets';

function OmniWindow({ content, type, visible, onClose, t }) {
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [url, setUrl] = useState('https://www.google.com');
    const [chartImage, setChartImage] = useState(null);
    const [execLogs, setExecLogs] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Resize Logic (Reverse: Drag from left edge)
    const [windowWidth, setWindowWidth] = useState(() => {
        const saved = localStorage.getItem('omni_window_width');
        return saved ? parseInt(saved) : window.innerWidth / 2;
    });
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
        localStorage.setItem('omni_window_width', windowWidth.toString());
    };

    const resize = (e) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > window.innerWidth * 0.3 && newWidth < window.innerWidth * 0.8) {
                setWindowWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, windowWidth]);

    // Initialize and update tabs from content/type props
    useEffect(() => {
        if (visible && type && content) {
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
    }, [type, content, visible]);

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

    const handleUrlChange = (e) => setUrl(e.target.value);

    const handleRunPython = async (codeToRun) => {
        setIsExecuting(true);
        try {
            const result = await api.runPython(codeToRun || content);
            if (result.status === 'success') {
                setChartImage(result.chart);
                setExecLogs(result.logs || '執行成功，無日誌輸出。');

                // Add or update Chart tab only
                setTabs(prev => {
                    let nextTabs = [...prev];

                    // Add Chart tab if image exists
                    if (result.chart && !nextTabs.find(t => t.id === 'python-chart')) {
                        nextTabs.push({ id: 'python-chart', title: t.chartOutput, type: 'chart' });
                    }

                    return nextTabs;
                });

                // Switch to Chart if available, else stay on code to show logs
                if (result.chart) setActiveTabId('python-chart');

            } else {
                setExecLogs(`錯誤: ${result.message}\n${result.logs || ''}`);
            }
        } catch (error) {
            setExecLogs(`請求失敗: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div
            className={`omni-window ${isResizing ? 'resizing' : ''}`}
            style={{ width: visible ? `${windowWidth}px` : '0' }}
        >
            <div className="omni-resize-handle" onMouseDown={startResizing} />

            <div className="omni-tabs-container">
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
                    {/* Add Run button here if active tab is related to python */}
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
                        <button className="add-tab-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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

            <div className="omni-content">
                {tabs.map(tab => (
                    <div key={tab.id} className={`omni-content-panel ${activeTabId === tab.id ? 'active' : ''}`}>
                        {tab.type === 'code' && (
                            <div className="code-viewer">
                                <div className="code-content-wrapper">
                                    <ReactMarkdown>
                                        {`\`\`\`${tab.lang}\n${tab.content}\n\`\`\``}
                                    </ReactMarkdown>
                                </div>
                                {tab.id === 'ai-code' && tab.lang === 'python' && execLogs && (
                                    <div className="logs-viewer embedded">
                                        <div className="logs-header">Execution Output</div>
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
                                        defaultValue={tab.url}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const newUrl = e.target.value;
                                                setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: newUrl } : t));
                                            }
                                        }}
                                    />
                                </div>
                                <webview
                                    src={tab.url}
                                    style={{ flex: 1, background: 'white' }}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {tabs.length === 0 && (
                    <div className="omni-empty">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</span>
                        <p>{t.omniWindowNone}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OmniWindow;
