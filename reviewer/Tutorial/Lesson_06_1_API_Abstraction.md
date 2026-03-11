# 第 6.1 課：API 抽象層 (api.js) - 劃清界線的設計

這節課我們要解析 **`frontend/src/api.js`**。這是前端與後端之間的「緩衝墊」。

---

## 1. 為什麼要抽離 API？

在很多初學者的代碼中，`fetch` 是直接寫在 `App.jsx` 裡的。
**本專案選擇抽離，原因如下：**
1.  **環境適應性**：如果我們要從 `127.0.0.1` 換成伺服器 IP，只要改 `BACKEND_URL` 一行。
2.  **單一職責**：`App.jsx` 負責「畫畫」，`api.js` 負責「搬運」。

---

## 2. 代碼解析：非同步物件模式

```javascript
export const api = {
    async getSessions() {
        const res = await fetch(`${BACKEND_URL}/sessions`);
        if (!res.ok) throw new Error('無法取得會話列表');
        return res.json();
    },
    // ... 其他方法
};
```
我們使用了 `async/await`。這讓非同步代碼看起來像同步代碼一樣好讀，避免了早期的 `then().then().then()` 回呼地獄 (Callback Hell)。

---

## 3. 防禦性程式設計 (Defensive Coding)

請看每一段 `fetch` 後面的：
`if (!res.ok) throw new Error(...)`
**為什麼非寫不可？** 
因為即使後端掛掉了、噴錯了 (500 Error)，`fetch` 本身並不會在 `await` 時噴出錯誤。它會回傳一個帶有「我不 OK」標籤的 Response。如果我們不主動拋出錯誤，前端會試圖解析錯誤訊息變成 JSON，導致 App 莫名其妙崩潰。

---

## 🔍 教學思考：
如果我把 `BACKEND_URL` 設為空的，會發生什麼？
> **深度解答**：所有請求會發往當前的來源（也就是 Vite 的 5173 埠）。你會看到後端控制台完全沒動靜，但瀏覽器的控制台會報出一堆 404 錯誤，因為 5173 那邊並沒有定義這套 API 路由。

---
**下一課預告**：Lesson 6.2 —— 錯誤與載入狀態。
我們將學習如何在 API 層處理各種突如其來的「意外」。
