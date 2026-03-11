# 錯誤日誌：資料庫欄位缺失 (OperationalError: no such column)

## 1. 問題描述 (Issue)
後端啟動後，在讀取會話列表或建立會話時報錯：
`sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: sessions.group_id`

同時前端會顯示 `500 (Internal Server Error)`。

---

## 2. 根本原因分析 (Root Cause)
*   **模型更新但未遷移**: 我們在 `database.py` 中為 `ChatSession` 模型新增了 `group_id` 與 `order` 欄位。
*   **SQLAlchemy 限制**: `Base.metadata.create_all()` 僅會建立「不存在的資料表」，但不會對「已存在的資料表」進行結構變更 (Alter Table)。因此原本的 `chat_history.db` 仍然維持舊的結構。

---

## 3. 解決方案 (Solution)
1.  **撰寫遷移腳本**: 撰寫 `backend/migrate_db.py` 使用原生的 `sqlite3` 模組執行 `ALTER TABLE sessions ADD COLUMN ...`。
2.  **執行遷移**: 執行該腳本手動補齊缺失的欄位。
3.  **重啟服務**: 修復後重新啟動 Python 後端即可正常運作。

---

## 4. 解決歷程 (Solution History)
1. **觸發**: 實作「群組管理」功能時，為了支援分類儲存，在後端 Python 模型新增了 `group_id` 關聯。
2. **現象**: 前端在獲取會話清單時報出 500 錯誤。查看 Python 控制台呈現 SQL 報錯：`no such column: sessions.group_id`。
3. **診斷**: 確認 `database.py` 已更新，但本地 SQLite 檔案已有舊版資料表，SQLAlchemy 不會自動更新已存在的表結構。
4. **修補**: 
   - 快速撰寫 `migrate_db.py` 自動化遷移腳本。
   - 使用 SQLite 原生語法 `ADD COLUMN` 補正資料表。
   - 執行腳本成功後重啟伺服器。
5. **驗證**: API 回傳正常架構 JSON 資料，資料庫架構成功升級。

---

## 5. 預防措施 (Prevention)
*   未來若有重大欄位變更，應優先考慮使用 `Alembic` 等專門的資料庫遷移工具。
*   或在開發階段，若資料不重要，可直接刪除 `.db` 檔案讓系統自動重新建立最完整架構的資料庫。

---
**紀錄日期**: 2026-01-22  
**處理人員**: Antigravity (AI Assistant)
