import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/Investment.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ReactMarkdown from 'react-markdown'

// 所有股票
const ALL_STOCKS = [
    // 大盤指數
    { symbol: '^TWII', name: '發行量加權股價指數' },
    { symbol: '^GSPC', name: '標普 500 指數' },
    // ETF
    { symbol: '0050', name: '元大台灣50' },
    { symbol: '0056', name: '元大高股息' },
    { symbol: '00878', name: '國泰永續高股息' },
    // 權值股
    { symbol: '2330', name: '台積電' },
    { symbol: '2317', name: '鴻海' },
    { symbol: '2454', name: '聯發科' },
    { symbol: '2308', name: '台達電' },
    { symbol: '2881', name: '富邦金' },
    { symbol: '2882', name: '國泰金' },
    { symbol: '3231', name: '緯創' },
    { symbol: '2382', name: '廣達' },
];

const Investment = ({ onNavigate, t }) => {
    const [networkAllowed, setNetworkAllowed] = useState(false);

    // 自選清單（目前展示的左側清單）
    const [stocks, setStocks] = useState([
        { symbol: '2330', name: '台積電', price: 0, change: 0, pct: 0 },
        { symbol: '2317', name: '鴻海', price: 0, change: 0, pct: 0 },
        { symbol: '2454', name: '聯發科', price: 0, change: 0, pct: 0 }
    ]);
    const [loading, setLoading] = useState(false);

    // 搜尋與下拉選單狀態
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // 詳細資料狀態
    const [selectedStock, setSelectedStock] = useState(null);
    const [fundamental, setFundamental] = useState(null);
    const [historyData, setHistoryData] = useState([]);

    // AI 狀態
    const [showAI, setShowAI] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const status = await api.getNetworkStatus();
            setNetworkAllowed(status.allow_network);
            if (status.allow_network) {
                refreshAllStocks();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleNetwork = async () => {
        try {
            const res = await api.toggleNetwork(!networkAllowed);
            setNetworkAllowed(res.allow_network);
            if (res.allow_network) {
                refreshAllStocks();
            }
        } catch (err) {
            alert('切換聯網失敗');
        }
    };

    // 取得左側列表的基本報價
    const refreshAllStocks = async () => {
        setLoading(true);
        const updatedStocks = await Promise.all(stocks.map(async (s) => {
            try {
                const data = await api.getStockData(s.symbol);
                if (data.error) return s;
                return {
                    ...s,
                    price: data.price,
                    change: data.change,
                    pct: data.pct_change,
                    name: data.name,
                    summary: data.summary // 利用此機會把 summary 也存起來
                };
            } catch {
                return s;
            }
        }));
        setStocks(updatedStocks);
        setLoading(false);
    };

    // 選取股票後，拉取完整財報與三年走勢 (On-Demand Fetching)
    const handleStockSelect = async (symbol) => {
        const found = ALL_STOCKS.find(s => s.symbol === symbol) || { symbol, name: '未知' };

        // 若該股票不在清單中，將其加入清單
        let currentStock = stocks.find(s => s.symbol === symbol);
        if (!currentStock) {
            currentStock = { ...found, price: 0, change: 0, pct: 0 };
            setStocks(prev => [...prev, currentStock]);
            // 立即去後端要一次 Snapshot
            if (networkAllowed) {
                api.getStockData(symbol).then(data => {
                    if (!data.error) {
                        setStocks(prev => prev.map(s => s.symbol === symbol ? {
                            ...s, price: data.price, change: data.change, pct: data.pct_change, name: data.name, summary: data.summary
                        } : s));
                        setSelectedStock(prev => prev && prev.symbol === symbol ? { ...prev, ...data } : prev);
                    }
                });
            }
        }

        // 觸發詳細資訊載入
        setSelectedStock(currentStock);
        setFundamental(null);
        setHistoryData([]);

        if (networkAllowed) {
            try {
                // 並行獲取財報與歷史走勢圖
                const [fundData, histData] = await Promise.all([
                    api.getFundamentals(symbol).catch(() => null),
                    fetch(`http://127.0.0.1:8000/investment/history/${symbol}`).then(res => res.json()).catch(() => null)
                ]);

                if (fundData && !fundData.error) setFundamental(fundData);
                if (histData && histData.history) setHistoryData(histData.history);

                // 順便確認 summary 存不存在，不存在的話補拉
                if (!currentStock.summary) {
                    const snap = await api.getStockData(symbol);
                    if (!snap.error) {
                        setStocks(prev => prev.map(s => s.symbol === symbol ? { ...s, summary: snap.summary } : s));
                        setSelectedStock(prev => ({ ...prev, summary: snap.summary }));
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleAIAnalysis = async () => {
        if (!selectedStock || !networkAllowed) return;
        setShowAI(true);
        setAiLoading(true);
        setAiAnalysis("");
        try {
            const res = await api.analyzeStock(selectedStock.symbol);
            if (res.error) {
                setAiAnalysis("分析失敗: " + res.error);
            } else {
                setAiAnalysis(res.analysis);
            }
        } catch (err) {
            setAiAnalysis("發生錯誤: 無法連線至 AI 引擎");
        } finally {
            setAiLoading(false);
        }
    };

    // 過濾搜尋結果
    const filteredStocks = ALL_STOCKS.filter(s =>
        s.symbol.includes(searchTerm) || s.name.includes(searchTerm)
    );

    return (
        <div className="investment-view">
            <div className="investment-header">
                <h1 className="investment-title">投資研究中樞</h1>
                <div className={`network-toggle ${networkAllowed ? 'online' : 'offline'}`} onClick={handleToggleNetwork}>
                    <div className="status-dot"></div>
                    <span>{networkAllowed ? '聯網模式: 開啟' : '聯網模式: 關閉'}</span>
                </div>
            </div>

            <div className="investment-grid">
                {/* 左側：自選清單與搜查欄位 */}
                <div className="watchlist-section">
                    <div className="section-header">
                        <h2>台股自選</h2>
                        <button className="refresh-btn" onClick={refreshAllStocks} disabled={!networkAllowed || loading}>
                            {loading ? '...' : '↻'}
                        </button>
                    </div>

                    {/* 滾拉式欄位 (Dropdown Search) */}
                    <div className="dropdown-container">
                        <input
                            type="text"
                            className="stock-search-input"
                            placeholder="輸入代碼或名稱搜尋..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        />
                        {showDropdown && searchTerm && (
                            <ul className="search-dropdown">
                                {filteredStocks.length > 0 ? (
                                    filteredStocks.map(s => (
                                        <li key={s.symbol} onMouseDown={() => handleStockSelect(s.symbol)}>
                                            <span className="s-symbol">{s.symbol}</span>
                                            <span className="s-name">{s.name}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="no-result">無符合結果，仍可點擊搜尋</li>
                                )}
                            </ul>
                        )}
                    </div>

                    <div className="stock-list">
                        {stocks.map((stock) => (
                            <div
                                key={stock.symbol}
                                className={`stock-card ${selectedStock?.symbol === stock.symbol ? 'active' : ''}`}
                                onClick={() => handleStockSelect(stock.symbol)}
                            >
                                <div className="stock-info">
                                    <span className="stock-symbol">{stock.symbol}</span>
                                    <span className="stock-name">{stock.name}</span>
                                </div>
                                <div className={`stock-price-info ${stock.change >= 0 ? 'up' : 'down'}`}>
                                    <span className="stock-price">{stock.price.toFixed(2)}</span>
                                    <span className="stock-change">
                                        {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.pct}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右側：詳細分析圖表與 AI */}
                <div className="analysis-section scrollable">
                    {!selectedStock ? (
                        <div className="empty-analysis">
                            <div className="placeholder-icon">📈</div>
                            <p>選擇一支股票以開啟深度分析</p>
                        </div>
                    ) : (
                        <div className="stock-detail">
                            <div className="detail-header">
                                <div>
                                    <h2 className="detail-name">{selectedStock.name}</h2>
                                    <span className="detail-symbol">{selectedStock.symbol}.TW</span>
                                </div>
                                <button className="ai-btn" onClick={handleAIAnalysis} disabled={!networkAllowed || aiLoading}>
                                    ✨ AI 基本面分析
                                </button>
                            </div>

                            {/* 公司資訊 - 新增區塊 */}
                            {selectedStock.summary && (
                                <div className="company-summary">
                                    <h3>公司簡介</h3>
                                    <p>{selectedStock.summary}</p>
                                </div>
                            )}

                            {/* 本益比等財經資訊 */}
                            <div className="fundamental-grid">
                                <div className="fund-item">
                                    <span className="label">本益比 (P/E)</span>
                                    <span className="value">{fundamental?.pe_ratio?.toFixed(2) || '--'}</span>
                                </div>
                                <div className="fund-item">
                                    <span className="label">股東權益報酬率 (ROE)</span>
                                    <span className="value">{fundamental?.roe ? (fundamental.roe * 100).toFixed(2) + '%' : '--'}</span>
                                </div>
                                <div className="fund-item">
                                    <span className="label">殖利率 (Yield)</span>
                                    <span className="value">{fundamental?.dividend_yield ? (fundamental.dividend_yield * 100).toFixed(2) + '%' : '--'}</span>
                                </div>
                                <div className="fund-item">
                                    <span className="label">負債比 (D/E)</span>
                                    <span className="value">{fundamental?.debt_to_equity?.toFixed(2) || '--'}</span>
                                </div>
                            </div>

                            {/* 3年歷史走勢圖 - 新增區塊 */}
                            <div className="chart-container">
                                <h3>歷史股價走勢w</h3>
                                {historyData.length > 0 ? (
                                    <div className="chart-wrapper" style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#888"
                                                    tickFormatter={(tick) => tick.substring(0, 7)}
                                                    minTickGap={30}
                                                />
                                                <YAxis
                                                    domain={['auto', 'auto']}
                                                    stroke="#888"
                                                    tickFormatter={(tick) => `$${tick}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                                    labelStyle={{ color: '#aaa', marginBottom: '5px' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="close"
                                                    name="收盤價"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 6, fill: '#10b981' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="chart-loading">
                                        {!networkAllowed ? "請先開啟聯網權限以載入圖表" : "正在載入圖表資料..."}
                                    </div>
                                )}
                            </div>

                            <div className="global-entry" onClick={() => onNavigate('newsmap')}>
                                <div className="entry-content">
                                    <h3>全球新聞地圖</h3>
                                    <p>掌握影響台股的全球總經動態</p>
                                </div>
                                <span className="entry-arrow">→</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Modal */}
            {showAI && (
                <div className="ai-modal-overlay" onClick={() => setShowAI(false)}>
                    <div className="ai-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>AI 投資助手 - {selectedStock?.name} 分析報告</h3>
                            <button className="close-btn" onClick={() => setShowAI(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {aiLoading ? (
                                <div className="ai-loading">正在彙整最新財報數據並從 AI 引擎生成分析報告...</div>
                            ) : (
                                <div className="ai-analysis-markdown">
                                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Investment;
