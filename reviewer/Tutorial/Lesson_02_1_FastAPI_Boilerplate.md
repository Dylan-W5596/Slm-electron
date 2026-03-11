# 第 2.1 課：FastAPI 基礎工程 - Boilerplate 與 Lifespan 機制

我們開始「逐行」拆解 **`backend/main.py`**。
這堂課的重點在於：一個伺服器是如何從「死」的代碼，變成「活」的服務。

---

## 1. 導入 (Imports) 的藝術
請看 `main.py` 的第 1-5 行：
```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
```
*   **`FastAPI`**：就像是遊戲引擎。
*   **`Depends` (相依注入)**：這是本專案的「高級技巧」。它讓函數能主動「伸手」去拿它需要的東西（例如資料庫連線），而不用我們手動傳來傳去。
*   **`HTTPException`**：專門用來「報警」。如果前端做錯事，我們就丟出這個錯誤。

---

## 2. Windows 特殊啟動處理
在第 11-14 行，我們看到了一段處理編碼的代碼：
```python
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
```
### 為什麼要這樣寫？ (極深解析)
Windows 的傳統控制台 (CMD) 使用的是 Big5 或 CP950 編碼。但 AI 模型噴出來的字串（包含 Emoji 或一些特殊數字符號）都是 **UTF-8**。
如果我們不強制 Python 把輸出的「管子」換成 UTF-8，當 Python 噴出一個他不認識的字時，整個程式會因為 `UnicodeEncodeError` 而崩潰掛掉。

---

## 3. Lifespan：伺服器的生命之書
請看第 48 行：
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 【第一部分：啟動前的準備】
    console.print(Panel("[bold green]後端伺服器啟動成功[/bold green]"))
    init_db() # 呼叫資料庫初始化
    yield      # 重點：這一行代表伺服器開始工作，停在這裡
    # 【第二部分：關閉時的清理】
    console.print("[yellow]應用程式關閉中...[/yellow]")
```
### 深度探討：
在以前，開發者會把啟動邏輯寫在全域。這很危險，因為如果資料庫還沒載入好，使用者就進來，程式會掛掉。
`lifespan` 確保了：
1.  **原子性**：啟動邏輯跑完了，`yield` 才會放行，讓路由開始接收請求。
2.  **安全性**：即使伺服器是因為噴錯崩潰，`yield` 後面的清理邏輯也有機會被執行，避免損毀資料。

---

## 4. 初始化 FastAPI
```python
app = FastAPI(title="Llama Electron API", lifespan=lifespan)
```
這一行正式把上面的生命週期管理，掛鉤到這個伺服器實體上。

---

## 🔍 教學思考：
如果我把 `init_db()` 移出 `lifespan` 直接放在檔案最下方，會發生什麼事？
> **深度解答**：雖然功能上看似一樣，但如果你使用了 `lifespan`，FastAPI 的內建測試工具可以模擬啟動與關閉的完整流程。如果不放進去，你的單元測試可能根本沒辦法自動觸發資料庫的建立！

---
**下一課預告**：Lesson 2.2 —— 什麼是 Middleware？為什麼 React 和 Python 之間有一道看不見的牆？
