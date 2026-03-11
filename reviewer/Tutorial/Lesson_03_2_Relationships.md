# 第 3.2 課：資料模型與關聯 - 群組、會話與訊息的愛恨情仇

這節課我們要看 **`backend/database.py`** 的核心部分：第 20-48 行。這是我們定義資料表結構的地方。

---

## 1. 資料庫的三劍客

我們的應用程式有三層數據需求：
1.  **Group (群組)**：像是檔案夾。
2.  **ChatSession (會話)**：像是檔案夾裡的單一檔案。
3.  **Message (訊息)**：則是檔案裡的一行一行文字。

---

## 2. 模型宣告 (Declarative Models)

請看 `Group` 的定義：
```python
class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="未分類")
    order = Column(Integer, default=0)
```
*   **`id`**：這是「身分證字號」。`primary_key=True` 代表它是唯一的且不可重複。
*   **`index=True`**：這就像是幫資料庫做「索引頁」。雖然會稍微增加儲存空間，但這能讓查詢速度快上幾百倍。

---

## 3. 深度解析：關聯性 (Relationship)

這是最吸引人的地方：
```python
class ChatSession(Base):
    # ...
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)
    group = relationship("Group", back_populates="sessions")
```

### 這裡發生了兩件事：
1.  **ForeignKey (外鍵)**：這是在資料庫層級掛鉤。`group_id` 紀錄了它是屬於哪一個群組身分證號。
2.  **Relationship (邏輯關聯)**：這是在 Python 層級掛鉤。它讓我們在代碼中可以直接寫 `session.group.name` 來拿到群組名稱，而不需要再去查一次資料庫。這就是 ORM 的精髓！

### 術語：`back_populates`
這代表「雙向通訊」。
*   當我說 `session.group` 時，它能找到誰是主人。
*   反之，當我說 `group.sessions` 時，它能列出所有在這個群組下的小弟。

---

## 🔍 教學思考：
為什麼 `group_id` 要設定為 `nullable=True`？
> **深度解答**：因為有些對話可能剛建立，使用者還沒有幫它分類。如果設定為不可為空 (False)，那您就必須在建立對話的一瞬間強制分配一個群組，這會讓使用者體驗變得太僵硬。

---
**下一課預告**：Lesson 3.3 —— PRAGMA 與事件。
我們將學習如何解決 SQLite 一個困擾全球開發者的外鍵「失靈」問題。
