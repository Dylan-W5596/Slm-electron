# 全權重 (Full Weights) vs GGUF 模型格式比較

在本地端執行大型語言模型 (LLM) 時，選擇正確的模型格式至關重要。本專案選擇使用 **GGUF** 格式，以下是與傳統 **全權重 (Full Weights)** 格式的詳細比較。

## 1. 什麼是全權重 (Full Weights/FP16/FP32)?
通常指模型訓練完成後的原始狀態，或未經壓縮的狀態。
- **格式**: 通常為 `.safetensors` 或 PyTorch 的 `.bin` / `.pt`。
- **精度**:
    - **FP32 (32-bit Floating Point)**: 單精度浮點數，訓練時的標準。
    - **FP16 / BF16 (16-bit)**: 半精度，推論時的標準，與 FP32 相比幾乎無損，但記憶體需求減半。
- **載入方式**: 通常使用 HuggingFace `transformers` 庫載入。

## 2. 什麼是 GGUF (GPT-Generated Unified Format)?
GGUF 是由 `llama.cpp` 團隊開發，專為 **CPU + GPU 混合推論** 最佳化的二進位格式。它主要利用 **量化 (Quantization)** 技術來壓縮模型。
- **格式**: `.gguf`
- **精度**: 使用整數 (Integer) 量化，如 4-bit (Q4_K_M), 8-bit (Q8_0) 等。
- **載入方式**: 使用 `llama.cpp` 或 `llama-cpp-python` 載入。

## 3. 詳細比較表

| 特性 | 全權重 (Full Weights - FP16) | GGUF (Quantized - Q4_K_M / Q8_0) |
| :--- | :--- | :--- |
| **檔案大小 (1B 模型)** | 約 2.5 GB (FP16) | 約 700MB (Q4) ~ 1.2GB (Q8) |
| **VRAM (顯示記憶體) 需求** | 高。需要完整的浮點數儲存空間。 | **極低**。大幅降低 VRAM 需求，讓消費級顯卡也能跑大模型。 |
| **載入速度** | 較慢，需完整讀取並轉換資料結構。 | **極快**。支援 `mmap` (記憶體映射)，可瞬間載入。 |
| **推論速度 (純 GPU)** | 最快 (在 VRAM 足夠時)。 | 快。雖然需要即時反量化 (Dequantize)，但因記憶體頻寬壓力小，通常在消費級硬體上更快。 |
| **推論速度 (CPU)** | 慢。FP32/FP16 在 CPU 上運算較吃力。 | **極快**。針對 AVX/AVX2/ARM NEON 指令集高度優化。 |
| **硬體相容性** | 主要是 NVIDIA GPU (CUDA)。 | **廣泛**。NVIDIA, AMD, Intel, Apple Silicon (Metal), 純 CPU。 |
| **精度損失 (品質)** | 無損失 (基準)。 | 輕微損失。Q8 (8-bit) 幾乎無損；Q4 (4-bit) 損失極小，肉眼難以分辨。 |
| **生態系工具** | HuggingFace Transformers, PyTorch | llama.cpp, Ollama, LM Studio, LocalAI |

## 4. 本專案為何選擇 GGUF?

1.  **降低硬體門檻**:
    - 使用 Llama 3.2 1B FP16 可能需要 3GB+ VRAM (含 Context)。
    - 使用 GGUF Q8_0 僅需約 1.5GB VRAM，甚至可以在沒有顯卡的老舊筆電上用 CPU 順暢執行。

2.  **易於部署**:
    - GGUF 是單一檔案 (`.gguf`)，包含了模型權重、詞彙表 (Tokenizer) 和超參數設定。不需要像 Transformers 那樣管理多個設定檔 (`config.json`, `tokenizer.json` 等)。

3.  **llama-cpp-python 的優勢**:
    - 這是一個 Python 綁定庫，它底層呼叫 C++ 編譯的 `llama.cpp`，效率極高。
    - 它能自動處理 **GPU Offload** (將部分層丟給 GPU，部分留給 CPU)，這在 VRAM 不足時非常有用 (例如 8B 模型在 6GB 顯卡上跑)。

## 5. 常見量化術語解釋
- **Q8_0**: 8-bit 量化。品質最接近原始模型，速度快，但壓縮率較低。
- **Q4_K_M**: 4-bit 量化 (推薦平衡點)。品質損失極低，且記憶體佔用極小。大多數情況下的首選。
- **Q2_K**: 2-bit 量化。品質損失明顯，僅在極端硬體限制下使用。

---
**總結**: 對於 Electron 桌面應用程式而言，**GGUF** 是提供流暢、低資源佔用體驗的最佳選擇。

---
**最後更新**: 2026-02-14  
**狀態**: 內容經查核依然適用於 Llama 3.2 1B 系列模型。
