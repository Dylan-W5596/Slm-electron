import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/UpdateLog.css';

function UpdateLog({ onBack, t }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await api.getUpdateLog();
                const parsedLogs = parseMarkdown(data.content);
                setLogs(parsedLogs.reverse());
            } catch (error) {
                console.error('Failed to fetch update logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const parseMarkdown = (md) => {
        const lines = md.split('\n');
        const results = [];
        let currentVersion = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Match ## [ 2026/01/24 ] or ## 2026/01/24
            const versionMatch = trimmedLine.match(/^##\s+(?:\[\s*)?(\d{4}\/\d{2}\/\d{2})(?:\s*\])?/);
            // Match ### version Alpha 0.0.1
            const subVersionMatch = trimmedLine.match(/^###\s+version\s+(.*)/);
            // Match #### Added, #### Changed, #### Fixed
            const categoryMatch = trimmedLine.match(/^####\s+(Added|Changed|Fixed)/i);
            // Match - **Title** : Desc
            const itemMatchWithTitle = trimmedLine.match(/^-\s+\*\*(.*?)\*\*\s*[:：]\s*(.*)/);
            // Match - Desc
            const itemMatchSimple = trimmedLine.match(/^-\s+(.*)/);

            if (versionMatch) {
                if (currentVersion) results.push(currentVersion);
                currentVersion = { date: versionMatch[1], version: '', categories: {} };
                currentVersion.lastCategory = 'Added'; // Default category for legacy logs
            } else if (subVersionMatch && currentVersion) {
                currentVersion.version = subVersionMatch[1];
            } else if (categoryMatch && currentVersion) {
                const cat = categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1).toLowerCase();
                if (!currentVersion.categories[cat]) currentVersion.categories[cat] = [];
                currentVersion.lastCategory = cat;
            } else if (itemMatchSimple && currentVersion && currentVersion.lastCategory) {
                const content = itemMatchSimple[1].trim();

                // 確保容器存在
                if (!currentVersion.categories[currentVersion.lastCategory]) {
                    currentVersion.categories[currentVersion.lastCategory] = [];
                }

                // 強效解析：只要這行裡面有 **，就把它拆開
                if (content.includes('**')) {
                    const parts = content.split('**');
                    // parts[1] 是被雙星號包裹的內容
                    const title = parts[1] ? parts[1].trim() : '';
                    let desc = parts.slice(2).join('').trim();
                    // 移除後方剩餘的冒號或空格
                    desc = desc.replace(/^[:：\s]+/, '');

                    currentVersion.categories[currentVersion.lastCategory].push({
                        title: title,
                        description: desc || ''
                    });
                } else {
                    currentVersion.categories[currentVersion.lastCategory].push({
                        title: '',
                        description: content
                    });
                }
            }
        });

        if (currentVersion) results.push(currentVersion);
        return results;
    };

    if (loading) {
        return (
            <div className="updatelog-view loading">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="updatelog-view">
            <div className="updatelog-header">
                <button className="back-btn" onClick={onBack}>
                    <span className="arrow">←</span> {t ? t.back : '返回'}
                </button>
                <h1 className="updatelog-title">{t ? t.updateLogTitle : '版本更新日誌'}</h1>
            </div>

            <div className="timeline-container">
                {logs.map((log, index) => (
                    <div
                        key={index}
                        className="timeline-item"
                        style={{ '--item-index': index }}
                    >
                        <div className="timeline-marker">
                            <div className="marker-dot"></div>
                            <div className="marker-line"></div>
                        </div>
                        <div className="timeline-content">
                            <div className="log-card">
                                <div className="card-header">
                                    {log.version && <span className="version-tag">{log.version}</span>}
                                    <span className="date-tag">{log.date}</span>
                                </div>
                                <div className="card-body">
                                    {Object.entries(log.categories).map(([cat, items]) => (
                                        <div key={cat} className="category-section">
                                            <h4 className={`category-title ${cat.toLowerCase()}`}>{cat}</h4>
                                            <ul className="item-list">
                                                {items.map((item, idx) => (
                                                    <li key={idx}>
                                                        <div className="item-content">
                                                            {item.title && <span className="item-title">{item.title}</span>}
                                                            <span className="item-desc">{item.description}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UpdateLog;
