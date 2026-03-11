# 第 3.1 課：ORM 基礎與 SQLite 連結 - 數據的翻譯官

我們開始拆解 **`backend/database.py`**。
如果您很久沒寫程式，這部分是這幾年「進步最快」的地方。以前我們要自己寫一堆 SQL 指令，現在我們用一個叫做 **SQLAlchemy** 的庫來處理。

---

## 1. 什麼是 ORM (對象關係映射)？

簡單來說，ORM 就是一個 **「翻譯官」**。
*   **Python 的語言**：物件、屬性 (例如 `session.title`)。
*   **SQL 的語言**：資料表、欄位 (例如 `SELECT title FROM sessions`)。

ORM 讓我們可以用 Python 語法「點出」資料，它會自動在後台幫我們翻譯成 SQL 送給資料庫。

---

## 2. 建立資料庫引擎與會話

請看第 14-18 行：
```python
DATABASE_URL = "sqlite:///./chat_history.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### 關鍵參數解析：
*   **`sqlite:///`**：這告訴程式我們使用的是 SQLite，這是一種「檔案型資料庫」。它不需要安裝伺服器，對話紀錄就存在您的 `chat_history.db` 這個檔案裡。
*   **`check_same_thread=False`**：**（極深解析）** SQLite 預設很保守，它不准許不同的執行緒同時讀取。但 FastAPI 是非同步架構，會有很多請求同時進來。設定為 `False` 才能釋放它的效能，讓它能在多任務環境下正常運作。
*   **`Base`**：這是我們的「祖譜」。所有後面要定義的模型都要繼承它，這樣 SQLAlchemy 才能把它們統一管理起來。

---

## 3. 會話 (Session) 的概念

`SessionLocal` 並不是一個實際的連線，而是一個 **「連線工廠」**。
在 `database.py` 的最後，我們看到：
```python
def get_db():
    db = SessionLocal() # 工廠生產出一個當下的連線
    try:
        yield db        # 把連線借給路由函數使用
    finally:
        db.close()     # 任務結束，不論成功失敗，這條線一定要斷掉（釋放資源）
```

---

## 🔍 教學思考：
如果我忘了寫 `db.close()` 會怎樣？
> **深度解答**：這會造成所謂的 **「連線洩漏 (Connection Leak)」**。每一次 API 請求都會占用一個資源。如果累積久了，SQLite 會因為檔案被太多「幽靈連線」占用而導致 **`Database is locked`** 的報錯，讓您的程式完全無法讀寫。

---
**下一課預告**：Lesson 3.2 —— 模型關聯。
我們將學習如何定義「一對多」的關係，讓群組真的能管到會話。
