import React, { useState, useEffect, memo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, Graticule } from "react-simple-maps";
import { api } from '../api';
import '../styles/NewsMap.css';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const countryToRegionMap = {
    // 北美 (NA)
    "United States of America": "NA", "Canada": "NA",
    // 歐洲 (EU)
    "United Kingdom": "EU", "France": "EU", "Germany": "EU", "Italy": "EU", "Spain": "EU", "Russia": "EU", "Ukraine": "EU",
    // 東亞 (EA)
    "Taiwan": "EA", "Japan": "EA", "China": "EA", "South Korea": "EA", "North Korea": "EA", "Mongolia": "EA",
    // 東南亞與大洋洲 (SEA_OC)
    "Australia": "SEA_OC", "New Zealand": "SEA_OC", "Indonesia": "SEA_OC", "Vietnam": "SEA_OC", "Thailand": "SEA_OC", "Philippines": "SEA_OC", "Malaysia": "SEA_OC",
    // 南亞 (SA)
    "India": "SA", "Pakistan": "SA", "Bangladesh": "SA",
    // 拉丁美洲 (LATAM)
    "Brazil": "LATAM", "Mexico": "LATAM", "Argentina": "LATAM", "Chile": "LATAM", "Colombia": "LATAM",
    // 中東與非洲 (MEA)
    "Saudi Arabia": "MEA", "South Africa": "MEA", "Egypt": "MEA", "Nigeria": "MEA", "Israel": "MEA", "Turkey": "MEA", "Iran": "MEA"
};

function NewsMap({ onNavigate, t }) {
    const [news, setNews] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null); // 用於儲存點擊後的詳細新聞

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const data = await api.getGlobalNews();
            setNews(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const regions = [
        { id: 'NA', name: '北美金融', coordinates: [-100, 40] },
        { id: 'EU', name: '歐洲市場', coordinates: [15, 50] },
        { id: 'EA', name: '東亞經濟', coordinates: [120, 35] },
        { id: 'SA', name: '南亞發展', coordinates: [78, 22] },
        { id: 'SEA_OC', name: '亞太與大洋洲', coordinates: [125, -15] },
        { id: 'LATAM', name: '拉美市場', coordinates: [-60, -15] },
        { id: 'MEA', name: '中東與非洲', coordinates: [25, 10] },
        { id: 'GLOBAL', name: '全球金融概況', coordinates: [0, -40] }
    ];

    const handleCloseModal = () => {
        setSelectedRegion(null);
        setSelectedArticle(null);
    };

    const handleCountryClick = (geo) => {
        const countryName = geo.properties.name;
        const regionId = countryToRegionMap[countryName];
        
        if (regionId) {
            const reg = regions.find(r => r.id === regionId);
            setSelectedRegion({ id: regionId, name: `${reg.name} (${countryName})` });
        } else {
            // 如果沒定義區域，則顯示該國家的全域新聞 (預設 GLOBAL)
            setSelectedRegion({ id: "GLOBAL", name: countryName });
        }
        setSelectedArticle(null);
    };

    const handleMarkerClick = (reg) => {
        setSelectedRegion({ id: reg.id, name: reg.name });
        setSelectedArticle(null);
    };

    const handleArticleClick = (item) => {
        setSelectedArticle(item);
    };

    const handleBackToList = () => {
        setSelectedArticle(null);
    };

    const mapWidth = 1000;
    const mapScale = mapWidth / (2 * Math.PI);
    const offsets = [-2, -1, 0, 1, 2];

    return (
        <div className="newsmap-view">
            <div className="newsmap-header">
                <h1 className="newsmap-title">全球新聞地圖</h1>
                <p className="newsmap-subtitle">使用滑鼠拖曳與滾輪縮放以探索全球</p>
            </div>

            <div className="map-container-full">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: mapScale, center: [0, 20] }}
                    width={1200}
                    height={600}
                    style={{ width: "100%", height: "100%" }}
                >
                    <ZoomableGroup
                        zoom={1}
                        minZoom={1}
                        maxZoom={6}
                        translateExtent={[[-mapWidth * 2, -100], [mapWidth * 3, 700]]}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) => (
                                <>
                                    {offsets.map(offset => (
                                        <g key={offset} transform={`translate(${offset * mapWidth}, 0)`}>
                                            <Graticule stroke="rgba(56, 189, 248, 0.15)" strokeWidth={0.5} />

                                            {geographies.map(geo => {
                                                const isHighlight = selectedRegion &&
                                                    (countryToRegionMap[geo.properties.name] === selectedRegion.id ||
                                                        geo.properties.name === selectedRegion.name);

                                                return (
                                                    <Geography
                                                        key={`${geo.rsmKey}-${offset}`}
                                                        geography={geo}
                                                        onClick={() => handleCountryClick(geo)}
                                                        fill={isHighlight ? "#0ea5e9" : "#1e293b"}
                                                        stroke="#334155"
                                                        strokeWidth={0.5}
                                                        style={{
                                                            default: { outline: "none", transition: "all 150ms" },
                                                            hover: { fill: "#38bdf8", outline: "none", cursor: "pointer" },
                                                            pressed: { fill: "#0284c7", outline: "none" },
                                                        }}
                                                    />
                                                );
                                            })}

                                            {regions.map(reg => (
                                                <Marker
                                                    key={`${reg.id}-${offset}`}
                                                    coordinates={reg.coordinates}
                                                    onClick={() => handleMarkerClick(reg)}
                                                    style={{
                                                        default: { outline: "none" },
                                                        hover: { outline: "none", cursor: "pointer" },
                                                        pressed: { outline: "none" },
                                                    }}
                                                >
                                                    <circle r={6} fill="#38bdf8" opacity={0.3} className="pulse-circle" />
                                                    <circle r={3} fill="#0ea5e9" />
                                                    <circle r={1.5} fill="#ffffff" />
                                                    <text
                                                        textAnchor="middle"
                                                        y={14}
                                                        style={{ fontFamily: "system-ui", fill: "#e2e8f0", fontSize: "7px", fontWeight: "bold" }}
                                                    >
                                                        {reg.name}
                                                    </text>
                                                </Marker>
                                            ))}
                                        </g>
                                    ))}
                                </>
                            )}
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
            </div>

            {/* Glassmorphism News Modal */}
            {selectedRegion && (
                <div className="news-modal-overlay" onClick={handleCloseModal}>
                    <div className="news-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="news-modal-close" onClick={handleCloseModal}>✕</button>
                        
                        <h3 className="news-modal-title">
                            {selectedRegion.name} 即時趨勢
                        </h3>

                        {!selectedArticle ? (
                            <div className="news-modal-list">
                                {news[selectedRegion.id]?.length > 0 ? (
                                    news[selectedRegion.id].map((item, i) => (
                                        <div key={i} className="news-modal-item" onClick={() => handleArticleClick(item)}>
                                            <div className="news-modal-meta">
                                                <span className="news-modal-time">
                                                    {new Date(item.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="news-modal-publisher">{item.publisher}</span>
                                            </div>
                                            <div className="news-modal-link">
                                                {item.title}
                                            </div>
                                            {item.summary && item.summary.length > 0 && (
                                                <div className="news-modal-summary">
                                                    {item.summary.length > 150 
                                                        ? item.summary.substring(0, 150) + "..." 
                                                        : item.summary
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="news-modal-empty">
                                        <span className="empty-icon">📰</span>
                                        <p>目前該地區尚無即時消息</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="news-detail-view">
                                <button className="news-detail-back" onClick={handleBackToList}>
                                    ← 返回列表
                                </button>
                                
                                <div className="news-detail-header">
                                    <div className="news-modal-meta">
                                        <span className="news-modal-time">
                                            {new Date(selectedArticle.time * 1000).toLocaleString()}
                                        </span>
                                        <span className="news-modal-publisher">{selectedArticle.publisher}</span>
                                    </div>
                                    <h4 className="news-detail-title">{selectedArticle.title}</h4>
                                </div>

                                <div className="news-detail-content" 
                                     dangerouslySetInnerHTML={{ __html: selectedArticle.summary || "暫無詳細摘要內容。" }}>
                                </div>

                                <div className="news-detail-footer">
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>區域: {selectedArticle.region || selectedRegion.id}</span>
                                    <a href={selectedArticle.link} target="_blank" rel="noreferrer" className="news-detail-action">
                                        查看原文連結
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(NewsMap);
