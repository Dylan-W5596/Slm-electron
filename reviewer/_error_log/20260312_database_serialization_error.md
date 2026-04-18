# 錯誤日誌 - 資料庫內容讀取失敗 (2026-03-12)

## 問題徵兆
使用者反應無法讀取到 Database (資料庫) 內的內容（如會話列表或群組）。前端可能顯示空白或發生 500 Internal Server Error。

## 根本原因
1. **循環序列化報錯**: 在 `main.py` 的 API 端點（如 `/groups` 與 `/sessions`）中，直接回傳了 SQLAlchemy 的 ORM 對象。由於 `Group` 與 `ChatSession` 之間存在 `relationship` 雙向關聯，FastAPI 的 JSON 序列化器在處理這些對象時會陷入無限循環或拋出型別錯誤，導致 API 崩潰。
2. **環境相依性遺漏**: 雖然資料庫文件 `chat_history.db` 存在且有數據，但先前在 `venv` 虛擬環境中未安裝 `yfinance` 等新依賴，導致後端啟動時可能發生隱性錯誤。

## 解決路徑
1. **實作投影字典**: 修改 `main.py` 中的資料庫讀取端點，不直接回傳模型對象，而是手動將其轉換為純 Python 字典 (List of Dicts)，藉此剔除引起循環的 relationship 屬性。
   - `list_groups`: 僅回傳 id, name, order。
   - `list_sessions`: 僅回傳 id, title, group_id, order, created_at。
   - `get_history`: 僅回傳訊息的基本欄位。
2. **依賴環境補全**: 在根目錄的 `venv` 環境中重新安裝 `yfinance`, `pandas` 與 `json5`，確保整個系統路徑正確。
3. **驗證測試**: 透過 Python 腳本直接測試 `db.query().count()` 確保連線正常，並透過 `py_compile` 驗證 `main.py` 語法無誤。

## 預防措施
1. 未來開發資料庫 API 時，強烈建議定義專門的 **Pydantic Schema (Response Model)** 或手動進行字典轉換，避免直接回傳 ORM 模型。
2. 任何涉及資料結構變動的重構，應優先測試 API 的 JSON 序列化結果。
