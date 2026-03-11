# 第 3.3 課：資料庫事件與 PRAGMA - 修復 SQLite 的隱藏缺陷

這節課我們要看 **`backend/database.py`** 的第 8-12 行。這是一段「底層駭客」等級的代碼，用來解決 SQLite 的一個歷史包袱。

---

## 1. 什麼是 PRAGMA？

在 SQL 的世界中，有些設定不屬於「增刪改查」資料，而是屬於「設定資料庫的行為」。在 SQLite 中，這些設定被稱為 **PRAGMA**。

---

## 2. SQLite 的歷史懸案：外鍵失靈

即便我們在定義資料表時寫了 `ForeignKey`（外鍵），但在預設的情況下，SQLite 竟然是「無視」它的。
*   **後果**：你可以刪除一個群組，但底下的會話雖然指著那個不存在的群組，卻依然存在。這會導致資料庫出現邏輯混亂的「髒資料」。

---

## 3. 代碼解析：監聽器 (Listener) 的介入

為了讓 SQLite 每次啟動時都乖乖聽話，我們寫了這段代碼：

```python
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

### 深度解析：
*   **`@event.listens_for(Engine, "connect")`**：這是一個裝飾器 (Decorator)。它的意思是：**「每當有人試圖連線到資料庫引擎時，請暫停一下，先跑我這個函數。」**
*   **`PRAGMA foreign_keys=ON`**：這就是關鍵咒語。它強制開啟外鍵約束功能。
*   **為什麼要在 connect 時跑？** 因為 PRAGMA 設定通常是「會話層級」的，這次連線關閉後，下次進來又會變回預設。所以我們必須在每次連線時都唸一遍咒語。

---

## 4. 為什麼我們不在 `init_db` 寫一次就好？

這是一個常見的錯誤想法。`init_db` 只在程式剛架起來的那一秒鐘執行一次。
外鍵檢查是持續性的行為。如果您不在每次連線時開啟，那麼隨後發生的刪除操作，資料庫就不會去幫您檢查關聯性了。

---

## 🔍 教學思考：
如果我把這段代碼註解掉，我的程式還能跑嗎？
> **深度解答**：程式表面上能跑，API 也不會報錯。但隨著時間推移，您的資料庫會充滿了「幽靈會話」（ group_id 指向一個已經不存在的 id）。當您的前端試圖讀取這些會話並尋找群組名稱時，程式就會噴出 Null Pointer 之類的錯誤。

---
**下一課預告**：Lesson 3.4 —— 級聯刪除。
我們將學習如何利用剛剛啟用的外鍵功能，實現「一鍵清理」的乾淨邏輯。
