# 前端架構審查 (Frontend Review) - Alpha 0.0.3 更新

## 檔案總覽

### `frontend/electron/main.cjs` [UPDATED]
- **功能**: 電子桌面環境的主程序，負責視窗生命週期。
- **後端監控 (IPC)**: 
    - 創立 `monitorWindow` 用於顯示後端日誌。
    - 透過監聽 Python 子程序的 `stdout` 與 `stderr`，將即時輸出經由 IPC 傳送至監控網頁。
- **路徑管理**: 根據開發/生產環境自動切換 `monitor.html` 的加載路徑。

### `frontend/src/App.jsx` [UPDATED]
- **全域狀態與路由**: 
    - 實作自定義 SPA 路由路由邏輯，切換 `home` / `chat` / `settings` / `credits` 視圖。
    - 整合 `AbortController` 支援即時停止 AI 生成。
    - 入場動畫流程管理：確保過場順暢。
- **持久化設定**: 使用 `localStorage` 儲存主題、語系、音感偏好及模型參數。

### `frontend/src/components/Home.jsx` & `Credits.jsx` [NEW]
- **`Home.jsx`**: 精緻的儀表板入口，具備 Shader 背景動畫與互動式導覽。
- **`Credits.jsx`**: 全螢幕沉浸式致謝頁面，支援點擊背景返回。

### `frontend/src/translations/languages.js` [UPDATED]
- **功能**: 翻譯鍵值對管理中心。
- **架構**: 擴展至全功能的 UI 字串（含 Credits, Reset, Monitor 等描述）。

### `frontend/src/utils/soundUtils.js` [RE-STORED & ENHANCED]
- **策略**: 封裝 `Audio` 對象快取機制，提供 `click`, `success`, `error` 提示音。

---

## 核心技術棧與亮點

| 功能 | 說明 | 關鍵技術 |
| :--- | :--- | :--- |
| **自定義 SPA 路由** | 極簡視圖切換邏輯，支援過場動畫 | React State + Transition Hooks |
| **i18n 系統** | 無需重新啟動即可變更介面語系 | Static Dictionary Mapping |
| **後端即時監控** | 開發者可觀察模型推論的底層 Token 輸出 | IPC Pipe + Stream + Term Styling |
| **強健的會話管理** | 支援群組、排序、拖拽移動與標題重命名 | React-reorder-logic + RESTful API |

---
**最後更新**: 2026-02-14  
**狀態**: 已同步最新精簡架構與沉浸式 UI 更新。
