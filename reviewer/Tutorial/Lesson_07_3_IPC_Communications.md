# 第 7.3 課：IPC 通訊 - 主從進程的秘密紙條

這節課解析 Electron 的 **IPC (Inter-Process Communication)**，它是主進程與渲染進程對話的唯一管道。

---

## 1. 為什麼不能直接傳變數？

因為 React 住在瀏覽器的泡泡裡，JavaScript 住在電腦的系統層裡，它們的 **記憶體空間是不相通的**。
你不能直接把一個 JavaScript 的物件指派給 Electron 的變數。你必須把訊息「打包」成封包，丟過大牆。

---

## 2. 代碼解析：發送與接收

### 模式一：老闆對員工說話 (`webContents.send`)
請看 `main.cjs`：
```javascript
monitorWindow.webContents.send('backend-log', text);
```
這就像是老闆用廣播器大喊：「標籤叫做 backend-log，內容是這串字！」

### 模式二：員工對老闆說話 (`ipcMain.on`)
請看 `main.cjs` 第 125 行：
```javascript
ipcMain.on('open-monitor', () => {
    // 老闆聽到這則標籤後，執行開窗動作
});
```

---

## 3. 非同步與同步的差別

*   **`send` / `on`**：這是非同步的。你丟出紙條後就不理他了，這不會卡住 App。
*   **本專案選擇**：我們全程使用非同步。因為 AI 推論很慢，如果我們用同步等待，視窗會瞬間結凍，產生「程式沒有回應」的負評。

---

## 4. 資料序列化 (Serialization)

當你傳遞資料時，Electron 在背後會自動幫你做 `JSON.stringify`。這代表你只能傳傳文字、數字、物件。
你**不能**傳一個「函數 (Function)」過去。如果你傳了一個帶有函數的物件，那個函數在牆的另一端會變成 `undefined`。

---

## 🔍 教學思考：
我能不能在 `App.jsx` 直接印出 `process.resourcesPath` 來找圖片？
> **深度解答**：不能。在 `contextIsolation` 開啟的正確設計下，`process` 變數在前端是隱形的。這就是為什麼我們需要老闆 (Main) 先查好路徑，再透過 `send` 把字串告訴前端。

---
**下一課預告**：Lesson 7.4 —— 日誌捕捉。
我們將學習如何把 Python 噴出來的字變成畫面上跳動的文字。
