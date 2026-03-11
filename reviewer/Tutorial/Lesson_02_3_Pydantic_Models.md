# 第 2.3 課：Pydantic 模型 - 數據的品質控管

這節課我們要看 **`backend/main.py`** 第 71-93 行。這是後端如何確保拿到的資料「不是垃圾」的關鍵技術。

---

## 1. 為什麼需要數據驗證？

在沒有驗證的情況下，如果前端傳來一個 `{"session_id": "我是壞人"}`，而您的資料庫預期是一個整數，程式在嘗試寫入時會瞬間崩潰。

**Pydantic** 是 Python 中最強大的數據驗證庫。它能幫我們做：
1.  **類型轉換**：自動把字串 `"5"` 轉成整數 `5`。
2.  **預設值填充**：如果前端沒傳，我們就補上預設值。
3.  **自動報錯**：格式不對，直接拒絕，不浪費運算資源。

---

## 2. 代碼範例詳解

請看 `CreateMessage` 模型的定義：
```python
class CreateMessage(BaseModel):
    session_id: int   # 必須是整數
    content: str      # 必須是字串
    role: str = "user" # 如果前端沒傳，預設就是 "user"
```

### 深度解析：
*   **`BaseModel`**：繼承自 Pydantic 的基礎類別。
*   **`Optional`**：在某些模型中（如 `GroupUpdate`），我們使用了 `Optional[str]`。這代表這個欄位「可有可無」。如果前端只想改名稱而不改排序，就只傳名稱，後端也不會報錯。

---

## 3. 在路由中的實戰應用

當我們在路由函數定義中寫下 `message: CreateMessage` 時：
```python
@app.post("/chat")
def chat(message: CreateMessage):
    # 此時 message 已經是一個已經驗證過的「物件」
    # 你可以直接用點號存取屬性：message.content
```
FastAPI 會在執行函數內部的代碼 **之前**，先跑完 Pydantic 的檢查。這是一種 **「提前失敗 (Fail Fast)」** 的策略，非常有助於維持系統穩定。

---

## 4. 產出 JSON Schema (進階觀念)

Pydantic 最厲害的地方在於：它能自動根據這些類別，生成一份標準的 **JSON Schema**。
如果您啟動後端並開啟 `http://127.0.0.1:8000/docs`（這是 FastAPI 自動產生的文件頁面），您會發現所有 API 的輸入規格都已經被寫得清清楚楚了，這都是 Pydantic 的功勞。

---

## 🔍 教學思考：
如果我在 `BaseModel` 之外隨便定義一個簡單的 Python `class` 當作路由的參數，會發生什麼？
> **深度解答**：FastAPI 會不知道如何去「解析」來自 JSON 的數據。它會把它當作一般的路徑參數或查詢參數（Query Parameter），而不是去讀取請求的主體 (Body)。結果通常是前端傳來的 JSON 數據被無視，後端變數變成空的。

---
**下一課預告**：進入 Phase 3 —— 數據的永恆記憶。
我們將從 `database.py` 的第一行開始，學習 ORM 的連線技巧。
