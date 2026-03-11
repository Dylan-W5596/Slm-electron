# 第六課：前端 API 與非同步 - 連結 React 與 Python 的神經

這節課我們要拆解 **`frontend/src/api.js`** 以及它在 **`App.jsx`** 中是如何被呼叫的。

---

## 1. `api.js`：隔離邊界

我們不在組件裡直接寫 `fetch('...')`。為什麼？
1.  **易於更換**：如果明天後端從路徑 A 搬到路徑 B，我只需要改一個地方。
2.  **型別統一**：我們可以在這裡處理數據的預處理（例如把日期字串轉成日期物件）。

---

## 2. 高級非同步技巧：中斷請求 (AbortController)

這是本專案最精華的代碼片段之一（`App.jsx` 第 200 行附近）：

```javascript
const abortControllerRef = useRef(null);

const handleSendMessage = async () => {
    // 建立一個新掛勾
    abortControllerRef.current = new AbortController();
    
    try {
        const response = await api.chat(..., { 
            signal: abortControllerRef.current.signal 
        });
        // ...處理回應
    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('使用者點擊了停止！');
        }
    }
}
```

### 為什麼這非常重要？
> **深度解析**：AI 生成文字可能需要 10 秒。如果使用者發現 AI 開始胡言亂語想讓它停止，我們不能只是在前端把視窗關掉，我們必須「真正地斷開網路連線」。這就是 `AbortController` 的作用。當你呼叫 `.abort()`，瀏覽器會直接切斷那條網路線，後端也會因此收到信號並停止計算，節省電力。

---

## 3. 非同步陷阱：Race Condition (競態條件)

在 `App.jsx` 的 `fetchData` 中：
```javascript
const [gs, ss] = await Promise.all([api.getGroups(), api.getSessions()]);
```
我們使用了 `Promise.all` 同時發起兩個請求。
*   **優點**：比起一個等一個，這樣快了一倍。
*   **重點**：這能避免資料「不對齊」。如果我們先抓群組，抓完後正好有對話被刪除，接著再抓對話，資料就會出錯。`Promise.all` 能讓我們在同一時間點拿到數據的「快照」。

---

## 4. 錯誤處理的層級

*   **API 層**：檢查 `res.ok`，如果不對就丟出錯誤訊息。
*   **UI 層 (App.jsx)**：使用 `try...catch` 捕捉錯誤，並彈出 `alert` 或顯示紅字給使用者看。

---

## 🔍 教學思考：
如果不處理 `AbortError`，停止按鈕按下後會發生什麼？
> **深度解答**：雖然連線斷了，但 `try...catch` 會捕捉到一個「網路錯誤」。如果你沒有檢查 `err.name === 'AbortError'`，你的程式可能會誤以為伺服器壞了，並跳出「伺服器無回應」的錯誤警報，嚇到使用者。

---
**下一課預告**：第七課 —— Electron 軀殼。
我們將揭開 `.exe` 外殼下的秘密：它是如何啟動 Python 的？
