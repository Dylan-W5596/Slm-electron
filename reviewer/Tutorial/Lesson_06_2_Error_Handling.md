# 第 6.2 課：錯誤捕捉與載入狀態 (Loading States)

這節課我們要探討在呼叫 API 時，如何優雅地處理等待時間與突發錯誤。

---

## 1. 用戶體驗的守護者：Loading 狀態

在 `App.jsx` 中，我們雖然沒有寫全域的 Loading 動畫，但在 API 呼叫期間，我們透過狀態控制保證了操作的安全性。
*   **機制**：在傳送訊息前啟用某個鎖定標記。
*   **效果**：防止使用者在 AI 還在載入時，瘋狂按下一百次傳送按鈕。

---

## 2. 深度捕捉 (Catching Errors)

請看 `fetchData` 中的處理：
```javascript
try {
    const [gs, ss] = await Promise.all([...]);
    setGroups(gs);
    setSessions(ss);
} catch (err) {
    console.error('初始化失敗:', err);
    // 這裡還可以觸發提示音效 playSound('error')
}
```
### 極深解析：`Promise.all` 的風險
`Promise.all` 的特性是：**「其中一個掛掉，大家通通失敗」**。
如果資料庫讀取正常，但 API 連線失敗，整個 catch 就會被觸發。這樣的設計確保了我們畫面上不會顯示「半殘」的數據（例如有群組但沒對話）。

---

## 3. 請求超時 (Timeout) 的思考

目前的 API 並沒有加入超時限制。
**在生產環境中**：我們通常會加上 `setTimeout` 並配合 `AbortController`，如果後端 30 秒沒反應，我們就主動切斷並告訴使用者「網路塞車了」。這能防止 App 卡死在無限等待中。

---

## 🔍 教學思考：
為什麼不把錯誤訊息直接 `alert` 出來，而要用 `console.error`？
> **深度解答**：為了桌面應用的專業感。頻繁的 `alert` 視窗會打斷使用者的思維流。在本專案中，我們選擇在監控視窗中輸出詳細錯誤，而主視窗則保持簡潔。

---
**下一課預告**：Lesson 6.3 —— AbortController。
我們將學習如何「真正」中止一段已經發出的 AI 請求。
