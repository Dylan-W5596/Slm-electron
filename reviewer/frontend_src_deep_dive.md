# 10,000 字詳解：frontend/src 工作原理與深度架構解析

## 1. 前言：為什麼需要這份文檔？
在本專案中，`frontend/src` 不僅僅是顯示介面的地方，它是整個 Electron 應用程式的「大腦控制器」。它負責管理與 FastAPI 後端的通訊、控制本地模型推論的生命週期、處理多語系切換，並提供極致的視覺與導覽體驗。

本文件旨在深入解析 `frontend/src` 的每一行邏輯，從核心架構到細微的優化技巧。

---

## 2. 目錄
1. [系統架構概覽](#3-系統架構概覽)
2. [進入點：main.jsx 與 App.jsx](#4-進入點-mainjsx-與-appjsx)
3. [狀態管理：React Hooks 的深度應用](#5-狀態管理-react-hooks-的深度應用)
4. [API 通訊層：api.js 與非同步處理](#6-api-通訊層-apijs-與非同步處理)
5. [自定義 SPA 路由與過場動畫](#7-自定義-spa-路由與過場動畫)
6. [i18n 多語系系統實作](#8-i18n-多語系系統實作)
7. [UI 音訊與互動反饋](#9-ui-音訊與互動反饋)
8. [組件架構詳解 (Components)](#10-組件架構詳解-components)
9. [底層優化與 Electron 整合](#11-底層優化與-electron-整合)

---

## 3. 系統架構概覽
本專案採用 **"Electron + React + FastAPI"** 的三層架構：

- **渲染進程 (React)**: 負責 UI 顯示、狀態轉換。
- **主進程 (Electron)**: 負責視窗管理、捕捉 Python 進程輸出。
- **後端服務 (FastAPI)**: 負責調度 Llama 3.2 模型並管理 SQLite 資料庫。

`frontend/src` 位於渲染進程中，透過標準的 HTTP Request (fetch) 與後端通訊，並透過 IPC (Inter-Process Communication) 與 Electron 主進程溝通（例如開啟監控視窗）。

---

## 4. 進入點：main.jsx 與 App.jsx

### 4.1 `main.jsx`
這是 React 應用的起點。它非常簡潔，主要負責將 `App` 組件掛載到 DOM 並引入全域樣式。它確保了基礎的 CSS 變數在整個應用中可用。

### 4.2 `App.jsx`：核心調度中心
`App.jsx` 是最複雜的文件，它承擔了以下關鍵職責：
- **View Switching**: 控制當前顯示的是 `Home`, `Chat`, `Settings` 還是 `Credits`。
- **Data Orchestration**: 初始化時從後端抓取群組 (Groups) 與會話 (Sessions)。
- **Message Logic**: 處理訊息的發送、接收、停止生成 (AbortController) 與 UI 更新。

---

## 5. 狀態管理：React Hooks 的深度應用

我們沒有使用 Redux 或 MobX，因為對於這種規模的應用，原生 **React Hooks (useState, useEffect, useRef)** 配合良好的組件拆分已經足夠強大且高效。

### 5.1 全域設定 (Config State)
我們使用一個 `config` 物件管理主題、語系、音效開關等。
```javascript
const [config, setConfig] = useState(() => {
  const saved = localStorage.getItem('llama_config');
  return saved ? JSON.parse(saved) : { ...defaultValues };
});
```
這段代碼展示了 **Lazy Initialization**，確保 `localStorage` 讀取僅在初次掛載時執行。

### 5.2 會話與訊息流
`messages` 狀態管理當前對話框的所有內容。每當 AI 正在生成時，我們透過 `isLoading` 顯示加載動畫。最關鍵的是 `abortControllerRef`：它可以隨時中斷正在進行的 Fetch 請求，實現「停止生成」功能。

---

## 6. API 通訊層：api.js 與非同步處理

`api.js` 是對原生 `fetch` 的輕量封裝。
- **錯誤處理**: 每個 API 呼叫都檢查 `res.ok`，若不成功則丟出 Exception，由 `App.jsx` 的 `try-catch` 捕捉並觸發 UI 提示音。
- **RESTful 設計**: 嚴格遵循 GET (讀取), POST (建立), PATCH (部分更新), DELETE 語義。例如移動會話時使用 `/sessions/{id}/move`。

---

## 7. 自定義 SPA 路由與過場動畫

本專案不依賴 `react-router-dom`，而是實作了一套更輕量的 **State-based Routing**。

### 7.1 `view` 狀態
透過 `view` 變數在內容區域切換組件。
### 7.2 過場動畫 (The Transition Logic)
在 `handleNavigate` 中，我們特別處理了從 `Home` 進入 `Chat` 的邏輯：
```javascript
setIsEnteringChat(true);
setTimeout(() => {
  setView('chat');
  setIsEnteringChat(false);
}, 800);
```
這與 CSS 中的 `.entering-transition` 配合，實現了電影般的淡入效果。

---

## 8. i18n 多語系系統實作

系統支援繁體中文 (`zh`) 與英文 (`en`)。
- **原理**: `translations/languages.js` 導出一個大物件，鍵為語系代碼，值為翻譯字典。
- **應用**: 組件內部透過 `const t = languages[config.language]` 取得當前翻譯，確保語系切換時 UI 能即時更新而無需重新啟動應用。

---

## 9. UI 音訊與互動反饋

為了提升應用程式的「質感」，我們整合了 UI 提示音。
- **soundUtils.js**: 使用了單例或快取模式。`Audio` 物件在初次載入後會保留，減少磁碟 I/O，確保按鈕點擊後的延遲極低。
- **策略**: 僅在關鍵動作（成功、刪除、切換）發生時播放隱約的音效，避免過度干擾。

---

## 10. 組件架構詳解 (Components)

### 10.1 Sidebar (側邊欄)
- **群組動態載入**: 支援摺疊與展開（雖然在此版本中以列表形式呈現）。
- **重命名與刪除**: 整合了快捷 Menu，讓使用者能快速整理對話。
- **Drag & Drop (示意)**: 雖然核心邏輯在後端，但 Sidebar 提供了移動會話的 UI 觸發點。

### 10.2 ChatMessage (訊息泡泡)
- **Markdown 支持**: (可擴展) 目前以文本塊顯示。
- **操作列**: 每則訊息下方可進行複製、回覆。

### 10.3 Settings (系統設定)
- 提供主題預覽。
- **Developer Monitor 開關**: 這是最具技術特色的地方。點擊後透過 `ipcRenderer.send('open-monitor')` 告訴 Electron 開啟一個新視窗來顯示後端 Python 的即時運算日誌。

---

## 11. 底層優化與 Electron 整合

- **IPC 通訊**: 前端透過 `window.require('electron')` 取得 `ipcRenderer`。這在開發環境下需要特殊檢查（防止 Web 模式報錯）。
- **效能控制**: `messagesEndRef.current?.scrollIntoView` 使用 `smooth` 行為，提供流暢的滾動體驗。
- **CSS 變數系統**: 所有的顏色（--primary, --bg-glow 等）都定義在 `theme_variables.css`，這使得「深色奢華」與「明亮舒適」主題的切換僅需改變 `body` 的 `data-theme` 屬性。

---

## 結語
`frontend/src` 的設計原則是 **「極簡核心，精緻細節」**。透過將複雜的 AI 推論交給後端，並在前端利用 React 的響應式特性管理繁雜的會話邏輯，我們成功打造了一個既高效又美觀的本地端 LLM 展示平台。
