import feedparser
import time

import re

RSS_FEEDS = {
    "NA": "https://finance.yahoo.com/news/rss", # North America (Confirmed Working)
    "EU": "https://finance.yahoo.com/news/rss", # Fallback to Global Finance
    "EA": "https://tw.stock.yahoo.com/rss?category=intl-markets", # East Asia (Confirmed Working, Big5)
    "SEA_OC": "https://au.finance.yahoo.com/news/rss", # Oceania (Confirmed Working)
    "SA": "https://news.yahoo.com/rss/world", # South Asia Fallback
    "LATAM": "https://news.yahoo.com/rss/world", # Latin America Fallback
    "MEA": "https://news.yahoo.com/rss/world", # Middle East & Africa Fallback
    "GLOBAL": "https://finance.yahoo.com/news/rss" # Global Markets (Confirmed Working)
}

def clean_html(text: str):
    """移除 HTML 標籤"""
    return re.sub(r'<[^>]*>', '', text)

def fetch_rss_news(region_id: str, limit: int = 15):
    """
    獲取指定區域的 Yahoo Finance RSS 新聞
    """
    url = RSS_FEEDS.get(region_id, RSS_FEEDS["GLOBAL"])
    
    # 常用 User-Agent
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        # 使用自定義 Header 抓取資料 (feedparser 不直接支援 headers，需配合 urllib 或 requests)
        import urllib.request
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = response.read()
            feed = feedparser.parse(data)
        
        # 處理某些 Feed 可能空的狀況，嘗試使用備援 (全球新聞)
        if (not feed.entries or len(feed.entries) == 0) and region_id != "GLOBAL":
            return fetch_rss_news("GLOBAL", limit)

        news_list = []
        for entry in feed.entries[:limit]:
            published_parsed = getattr(entry, "published_parsed", None)
            timestamp = time.mktime(published_parsed) if published_parsed else time.time()
            
            publisher = "Yahoo Finance"
            if " - " in entry.title:
                parts = entry.title.split(" - ")
                if len(parts) > 1:
                    publisher = parts[-1]
            
            title = clean_html(entry.title).strip()
            summary = clean_html(getattr(entry, "summary", "")).strip()
            
            # 獲取各區域對應的國家標籤（簡單映射）
            news_list.append({
                "title": title,
                "link": entry.link,
                "summary": summary,
                "time": int(timestamp),
                "publisher": clean_html(publisher).strip(),
                "region": region_id
            })
            
        return news_list
    except Exception as e:
        print(f"Error fetching RSS ({region_id}) from {url}: {e}")
        # 如果失敗且不是 GLOBAL，嘗試抓取 GLOBAL 作為最後防線
        if region_id != "GLOBAL":
            return fetch_rss_news("GLOBAL", limit)
        return []

def get_all_global_news():
    """
    獲取 8 大區域的新聞快照
    """
    results = {}
    for region in RSS_FEEDS.keys():
        results[region] = fetch_rss_news(region, limit=10)
    return results
