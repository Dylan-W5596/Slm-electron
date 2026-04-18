# 錯誤日誌：AttributeError - 'ModelEngine' has no attribute 'has_gpu'

## 問題徵兆
前端發送 `/status` 請求時，後端報出 `500 Internal Server Error`，日誌顯示 `AttributeError: 'ModelEngine' object has no attribute 'has_gpu'`。

## 根本原因
在從 `llama.cpp` 遷移至 `Ollama` 的過程中，`ModelEngine` 類別被重構，移除了舊有的 `has_gpu` 布林值屬性，但 `/status` 路由接口仍在使用該屬性判斷設備顯示。

## 解決路徑
在 `ModelEngine` 類別中重新定義 `has_gpu` 屬性。在 Ollama 環境下，可以預設為 `True`（因為 Ollama 會自動優先使用 GPU 加速），或透過 API 動態檢查。

## 預防措施
重構核心類別時，應使用 `grep` 搜尋整個專案中對該類別屬性的引用，確保所有接口同步更新。
