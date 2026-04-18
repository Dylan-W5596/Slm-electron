# 錯誤日誌：Ollama 連線失敗與 CP950 編碼報錯

## 問題徵兆
1. 執行 `test_ollama_bridge.py` 時，出現 `Failed to connect to Ollama`。
2. 發生 Python 錯誤：`'cp950' codec can't encode character '\u274c'...` 導致測試腳本中途崩潰。

## 根本原因
1. **連線問題**：後端程式碼無法透過預設埠口 (11434) 存取 Ollama 服務，可能是 Ollama 尚未啟動或防火牆阻擋。
2. **編碼問題**：Windows 終端機預設使用 CP950 (繁體中文)，不支援測試腳本中使用的 Emoji (❌)。

## 解決路徑
1. **修正編碼**：將測試腳本與 `ModelEngine` 中的 Emoji 替換為標準 ASCII 字符 (如 [ERR], [SUCCESS])。
2. **連線檢查**：建議用戶手動點開 Ollama 應用程式，並確認系統匣 (System Tray) 有出現 Ollama 圖示。

## 預防措施
1. 在所有後端 Log 輸出中使用 `rich` 的安全替代方案，或避免直接 print 複雜字符。
2. 在執行 AI 功能前，增加更友善的「請開啟 Ollama」提示介面。
