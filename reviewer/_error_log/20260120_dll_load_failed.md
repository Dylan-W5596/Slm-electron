# 錯誤日誌：llama.dll 載入失敗 (CUDA 版本衝突)

## 1. 問題描述 (Issue)
在啟動應用程式並嘗試載入 Llama 模型進行對話時，後端發生嚴重崩潰。

**報錯訊息範例：**
```text
RuntimeError: Failed to load shared library '...venv\Lib\site-packages\llama_cpp\lib\llama.dll': 
Could not find module '...llama.dll' (or one of its dependencies).
```
雖然手動檢查發現 `llama.dll` 檔案確實存在於該路徑，但系統依然回報找不到模組。

---

## 2. 根本原因分析 (Root Cause)

### A. 相依地獄 (Dependency Mismatch)
`llama-cpp-python` 的 GPU (CUDA) 版本是一個編譯過的二進位檔。它載入時會去尋找系統中的 CUDA Runtime DLLs (例如 `cudart64_12.dll`, `cublas64_12.dll`)。
*   **現況**: 專案安裝的套件是針對 **CUDA 12.x** 編譯的。
*   **衝突**: 使用者電腦安裝的是 **CUDA 13.1**。
*   **結果**: 當 `llama.dll` 啟動後，它向系統要「12 版的地圖」，但系統只有「13 版」，導致連結中斷。

### B. Windows DLL 搜尋機制
Python 3.8 之後的版本在 Windows 上安全性提高，它不再主動搜尋系統的 `PATH` 環境變數。即便安裝了 CUDA，如果沒有手動在代碼中使用 `os.add_dll_directory()` 加進去，Python 也會裝作沒看到。

---

## 3. 解決方案 (Solution)

我們採取了**「手動補齊相依性」**的綠色化方案：

1.  **定位 DLLs**: 從使用者現有的其他 AI 工具 (LM Studio) 目錄中，找出缺失的 CUDA 12 專用檔案：
    *   `cudart64_12.dll`
    *   `cublas64_12.dll`
    *   `cublasLt64_12.dll`
2.  **強制植入**: 將這些檔案直接複製到專案虛擬環境的庫目錄下：
    *   路徑：`venv\Lib\site-packages\llama_cpp\lib\`
3.  **代碼補丁**: 在 `model_engine.py` 中，載入 `llama_cpp` 之前加入以下代碼，確保 Python 搜尋正確的目錄：
    ```python
    if sys.platform == "win32":
        os.add_dll_directory(r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.1\bin")
    ```

---

## 4. 解決歷程 (Solution History)
1. **偵測**: 啟動 FastAPI 時，`ModelEngine` 初始化失敗並拋出 `llama.dll` 找不到模組的錯誤。
2. **診斷**: 透過 `dependencies.exe` 或觀察電腦安裝的 CUDA 版本 (13.1)，確認套件編譯時針對的是 12.x 版本。
3. **實驗**: 嘗試重新編譯 `llama-cpp-python` 但權限或環境受限，決定改用 DLL 模擬方案。
4. **執行**: 從 external 工具提取所需的 `cudart64_12.dll` 等檔案，並植入 venv 目錄。
5. **最終修復**: 結合 `os.add_dll_directory` 修改，成功讓 `llama-cpp` 識別到 GPU 核心組件。

---

## 5. 預防措施 (Prevention)

*   **全包裝部署**: 未來釋出版本時，不應要求使用者自行安裝 CUDA Toolkit。應將所有核心 DLLs (Runtime) 直接打包在應用程式安裝包內。
*   **版本鎖定**: 在安裝 `llama-cpp-python` 時，應明確指定與當前驅動程式及系統環境最匹配的 `extra-index-url` 版本。
*   **環境檢查腳本**: 在 `startup_event` 加入一個預檢查功能，若偵測到 Windows 環境缺少 CUDA DLLs，主動提醒或引導使用者。

---
**紀錄日期**: 2026-01-20  
**處理人員**: Antigravity (AI Assistant)
