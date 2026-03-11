# 錯誤日誌：日誌輸出優化引發的編碼與邏輯錯誤

## 1. 問題描述 (Issue)
在嘗試將後端控制台輸出「美化」 (整合 Rich 套件、加入顏色與 Emoji) 的過程中，連續發生了兩次導致系統崩潰的錯誤：
1.  **UnicodeEncodeError**: 輸出 Emoji (✅) 時，因 Windows 控制台編碼不相容而崩潰。
2.  **NameError**: 修復編碼問題後，因程式碼重構遺漏了 `Panel` 的匯入，導致啟動時找不到定義。

---

## 2. 根本原因分析 (Root Cause)
*   **編碼衝突 (Encoding)**: 傳統 Windows CMD 預設使用 `CP950` (繁體中文)，不支援包含 Emoji 在內的廣義 Unicode 字元。當 Python 嘗試輸出這些字元到不支援的終端機時會報錯。
*   **重構疏漏 (Logic)**: 在緊急修復編碼問題、頻繁更動 `main.py` 的過程中，雖然代碼中使用了 `Panel` 元件，但頂部的 `import` 宣告未同步更新。
*   **生命週期陷阱**: 錯誤發生在 FastAPI 的 `lifespan` 啟動階段。此階段的任何報錯都會導致伺服器直接中斷執行 (Application startup failed)。

---

## 3. 解決方案 (Solution)
1.  **保守輸出策略**: 
    - 暫時移除了所有 Emoji 以及可能造成編碼衝突的特殊符號。
    - 將 `sys.stdout` 強制重新封裝為 `utf-8` 編碼 (雖然此舉在舊版 CMD 效果有限，但能避免 Python 因報錯而崩潰)。
2.  **補齊匯入宣告**: 
    - 在 `main.py` 補上 `from rich.panel import Panel`。
3.  **環境相容性設定**: 
    - 初始化 `Rich` 的 `Console` 時，加入 `legacy_windows=True` 相關參數或設定更穩健的輸出的主題。

---

## 4. 解決歷程 (Solution History)
1. **第一次修復**: 嘗試加入 Rich 優化 UI，但因 Emoji 導致啟動時報編碼錯誤。隨後實施 UTF-8 包裝策略。
2. **第二次修復**: 調整完編碼後重啟，發現 `NameError: name 'Panel' is not defined`。發現是在整理 import 區塊時漏掉了。
3. **最終穩定**: 補齊所有匯入並將 Emoji 替換為 ASCII 符號，後端控制台終告平穩啟動。

---

## 5. 預防措施 (Prevention)
*   **控制台降級處理**: 針對 Windows 環境，系統偵測後應自動退回「無樣式 (Plain Text)」模式，而非強行執行美化排版。
*   **全面檢查機制**:
    - 在每次修改匯入後，應先執行 `python -m py_compile main.py` 檢查語法。
    - 建立統整的日誌模組，集中管理 `Rich` 或 `Colorama` 的邏輯，避免在各個檔案中重複零散的匯入與配置。

---
**紀錄日期**: 2026-01-21  
**處理人員**: Antigravity (AI Assistant)
