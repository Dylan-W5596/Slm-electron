# 後端架構審查 (Backend Review)

## 檔案總覽

### `backend/main.py`
這是 FastAPI 應用程式的入口點與控制器。
- **功能**:
    - 使用 `lifespan` 初始化資料庫與 AI 引擎。
    - **路由管理**: 管理包括對話、訊息、群組管理、跨群組移動及系統狀態查詢等 12+ 個端點。
- **關鍵點**:
    - **日誌優化**: 整合 `RichHandler` 提供美觀的終端機輸出，並過濾掉 200 OK 等冗餘資訊。
    - **編碼處理**: 強制 UTF-8 輸出，解決 Windows 環境下的編碼衝突。

### `backend/model_engine.py`
封裝了 LLM 的推論邏輯。
- **功能**:
    - 載入 Llama 3.2 1B (GGUF 格式)。
    - **動態 DLL 載入**: 自動偵測並加入 CUDA 相關 DLL 路徑，確保 GPU 加速順利啟動。
    - **智慧快取**: 支援模型延遲載入 (Lazy Loading) 與單例模式。

### `backend/database.py`
提供持久化存儲與關聯查詢。
- **技術特色**: 
    - 封裝為 SQLAlchemy ORM，支援 SQLite。
    - 完美支持級聯刪除 (Cascading Delete) 與 Foreign Key 約束 (透過 PRAGMA 設定)。

---

## 研發亮點：即時運算監控 (Developer Visibility)
- **原理**: 後端腳本無需修改，Electron 透過 `child_process.spawn` 的 `stdio` 接口直接讀取實體標準輸出字串。
- **應用**: 搭配 `Rich` 庫生成的 ANSI 色彩代碼，在前端監控視窗中重現高品質的開發者控制台體驗。

---
**最後更新**: 2026-02-14  
**狀態**: 已同步 Alpha 0.0.4 架構。
