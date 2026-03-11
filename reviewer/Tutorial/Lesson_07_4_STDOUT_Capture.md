# 第 7.4 課：STDOUT 捕捉 - 實作網頁版「終端機」

這節課要解析本專案最酷的視覺功能：**後端監控視窗 (Monitor Window)** 的數據流。

---

## 1. 什麼是 STDOUT 與 STDERR？

在電腦中，每個程式都有三個出口：
1.  **STDIN**：嘴巴（輸入）。
2.  **STDOUT**：說話（正常輸出）。
3.  **STDERR**：尖叫（報錯）。

---

## 2. 代碼橋接流

這裡發生了兩次接力：
1.  **接力一**：Python 將 `AI > 你好` 噴到 STDOUT。這被 `main.cjs` 的 `backendProcess.stdout.on` 抓到。
2.  **接力二**：`main.cjs` 將內容透過 IPC 包裝，射向 `monitor.html`。

---

## 3. `monitor.html` 的接收端

這是一個極簡的網頁：
```javascript
const { ipcRenderer } = require('electron');
ipcRenderer.on('backend-log', (event, text) => {
    const logDiv = document.getElementById('log');
    logDiv.innerText += text;
    // 自動捲動到底部
    window.scrollTo(0, document.body.scrollHeight);
});
```
**深度技術**：我們直接把文字「累加 (`+=`)」進 HTML 中。這在數據量極大時（例如 AI 吐了幾萬字日誌）會讓網頁變慢。
*   **優化思考**：在正式產品中，我們會限制顯示的行數（例如只留最後 500 行），舊的就把它砍掉，這叫 **「滾動緩衝區 (Scrolling Buffer)」**。

---

## 4. 錯誤標記 (Highlighting Errors)

請看 `main.cjs` 第 99 行：
`monitorWindow.webContents.send('backend-log', "[ERROR] " + text);`
當 Python 出事時，我們手動加上了 `[ERROR]` 前綴。前端可以根據這個關鍵字，讓字體變紅。這讓開發者一眼就能看出 AI 是否在搞鬼。

---

## 🔍 教學思考：
為什麼不直接讓 Python 把日誌寫進一個檔案，監控視窗再去讀檔案？
> **深度解答**：效率太低。寫入檔案需要頻繁操作硬碟，這會拖慢 AI 推論。使用 STDOUT 是「記憶體對記憶體」的通訊，速度近乎光速，適合這種即時監測。

---
**下一課預告**：進入最終 Phase 8 —— 質感優化。
我們將學習如何讓 App 變得美輪美奐。
