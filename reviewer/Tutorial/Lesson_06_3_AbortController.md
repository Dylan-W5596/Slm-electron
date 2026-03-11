# 第 6.3 課：進階非同步 - AbortController 中止機制

這節課是本專案中最高級的前端技巧之一：**如何讓已經發出的 AI 請求「停下來」？**

---

## 1. 什麼是中斷控制器 (AbortController)？

想像你在餐廳點了餐，但發現錢包沒帶。
*   **一般請求**：服務生已經把菜單交給廚師，廚師在做菜。你只能等菜做完付錢。
*   **AbortController**：服務生端出菜盤前，你大喊一聲：「取消！」他立刻把菜倒掉，不再算你的錢。

---

## 2. 代碼實作解析

在 `App.jsx` 中：
```javascript
const abortControllerRef = useRef(null);

// 1. 發送時建立控制器
const handleSendMessage = async () => {
    abortControllerRef.current = new AbortController();
    const res = await api.chat(..., { 
        signal: abortControllerRef.current.signal 
    });
};

// 2. 按按鈕時觸發
const handleStopGeneration = () => {
    abortControllerRef.current?.abort(); // 取消！
};
```

---

## 3. 為什麼要寫在 `useRef` 裡？

這是一個極深的概念：
如果你把 `abortController` 寫在 `useState` 裡，切換控制器會觸發畫面重繪，這沒必要。
`useRef` 像是一個 **「記憶體抽屜」**：
1.  它跨越渲染 (Renders) 存在。
2.  改掉它的內容不會重新畫畫面。
3.  它非常適合存這種「控制型物件」。

---

## 4. 後端的配合 (極重要)

當前端執行 `abort()` 時，網路請求會被中斷。
後端的 FastAPI 會報出一個 `ConnectionClosed` 的隱形錯誤。
**在本專案中**：後端捕捉到這個斷線後，就會停止 `llama-cpp` 的矩陣運算。這能有效防止你的顯卡風扇在請求取消後還無謂地狂飆。

---

## 🔍 教學思考：
如果我在一個對話還沒結束時，就快速點選左邊另一個對話，舊的 AI 請求會怎樣？
> **深度解答**：如果您沒有在載入新對話時主動呼叫 `abort()`，舊的請求會繼續在後台跑，直到它跑完為止。這會造成嚴重的資源浪費。
> **建議擴充**：在切換 Session 的函數開頭，第一行就先寫 `handleStopGeneration()` 是一個頂級開發者的專業素養。

---
**下一課預告**：進入 Phase 7 —— Electron 核心。
我們將學習主進程與渲染進程的對決。
