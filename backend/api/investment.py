from fastapi import APIRouter
import yfinance as yf
import json
import pandas as pd
from rich.console import Console
from datetime import date

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from globals import model_engine
from api.news import get_all_global_news

console = Console()
router = APIRouter(prefix="/investment", tags=["investment"])

class NetworkManager:
    def __init__(self):
        self.allow_network = False 
    
    def set_allow_network(self, allowed: bool):
        self.allow_network = allowed
        console.print(f"[info]聯網權限已設定為: {'開啟' if allowed else '關閉'}[/info]")
    
    def is_allowed(self):
        return self.allow_network

nm = NetworkManager()

class StockDataEngine:
    def get_stock_snapshot(self, symbol: str):
        if not nm.is_allowed():
            return {"error": "聯網權限未開啟"}
        
        if symbol.isdigit() and len(symbol) >= 4:
            symbol = f"{symbol}.TW"
        
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            price = info.get('regularMarketPrice') or info.get('currentPrice')
            prev_close = info.get('previousClose')
            change = price - prev_close if price and prev_close else 0
            pct_change = (change / prev_close * 100) if prev_close else 0
            
            return {
                "symbol": symbol,
                "name": info.get('longName') or info.get('shortName'),
                "price": price,
                "change": round(change, 2) if change else 0,
                "pct_change": round(pct_change, 2) if pct_change else 0,
                "currency": info.get('currency'),
                "industry": info.get('industry'),
                "sector": info.get('sector'),
                "summary": info.get('longBusinessSummary')
            }
        except Exception as e:
            return {"error": str(e)}

    def get_fundamental_data(self, symbol: str):
        if not nm.is_allowed():
            return {"error": "聯網權限未開啟"}
        
        if symbol.isdigit() and len(symbol) >= 4:
            symbol = f"{symbol}.TW"
            
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            fundamentals = {
                "pe_ratio": info.get('trailingPE'),
                "market_cap": info.get('marketCap'),
                "dividend_yield": info.get('dividendYield'),
                "roe": info.get('returnOnEquity'),
                "debt_to_equity": info.get('debtToEquity'),
                "revenue_growth": info.get('revenueGrowth'),
            }
            return fundamentals
        except Exception as e:
            return {"error": str(e)}

    def get_global_news(self):
        if not nm.is_allowed():
            return {"error": "聯網權限未開啟"}
        
        # 呼叫新實作的 RSS 引擎
        return get_all_global_news()

    def get_historical_data(self, symbol: str, period: str = "3y"):
        if not nm.is_allowed():
            return {"error": "聯網權限未開啟"}
        
        if symbol.isdigit() and len(symbol) >= 4:
            symbol = f"{symbol}.TW"
            
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            if hist.empty:
                return {"error": "無法獲取歷史數據"}
            
            hist.reset_index(inplace=True)
            # Ensure index name is Date
            if 'Date' in hist.columns:
                date_col = 'Date'
            elif 'Datetime' in hist.columns:
                date_col = 'Datetime'
            else:
                date_col = hist.columns[0]
                
            hist[date_col] = hist[date_col].dt.strftime('%Y-%m-%d')
            
            records = []
            for _, row in hist.iterrows():
                try:
                    records.append({
                        "date": row[date_col],
                        "close": row['Close'],
                        "volume": row['Volume']
                    })
                except KeyError:
                    pass
            
            today_str = date.today().strftime('%Y-%m-%d')
            if records and records[-1]['date'] == today_str:
                records = records[:-1]
                
            return {"symbol": symbol, "history": records}
        except Exception as e:
            return {"error": str(e)}

stock_engine = StockDataEngine()

@router.get("/network_status")
def get_network_status():
    return {"allow_network": nm.is_allowed()}

@router.post("/toggle_network")
def toggle_network(data: dict):
    allowed = data.get("allowed", False)
    nm.set_allow_network(allowed)
    return {"allow_network": nm.is_allowed()}

@router.get("/stock/{symbol}")
def get_stock_data(symbol: str):
    return stock_engine.get_stock_snapshot(symbol)

@router.get("/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    return stock_engine.get_fundamental_data(symbol)

@router.get("/global_news")
def get_global_news():
    return stock_engine.get_global_news()

@router.get("/history/{symbol}")
def get_historical_data(symbol: str):
    return stock_engine.get_historical_data(symbol, period="3y")

@router.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    if not nm.is_allowed():
        return {"error": "聯網權限未開啟"}
    
    data = stock_engine.get_stock_snapshot(symbol)
    fundamentals = stock_engine.get_fundamental_data(symbol)
    
    if "error" in data or "error" in fundamentals:
        return {"error": "無法獲取足夠的數據進行分析"}
    
    context = [
        {"role": "system", "content": "你是一位專業的台股分析師。請基於提供的數據，分析該公司的基本面優劣勢、風險與展望。"},
        {"role": "user", "content": f"請分析 {symbol} ({data['name']})。\n即時行情: {json.dumps(data)}\n財務指標: {json.dumps(fundamentals)}"}
    ]
    
    try:
        analysis = model_engine.generate(context)
        return {"analysis": analysis}
    except Exception as e:
        return {"error": f"AI 分析失敗: {str(e)}"}
