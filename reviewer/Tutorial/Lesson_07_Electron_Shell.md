# 第七課：Electron 橋樑 - 如何指揮 Python 工作？

這節課我們要解析 **`frontend/electron/main.cjs`**。這是整個桌面應用的「總司令」。它是用 Node.js 寫成的，它可以跳過瀏覽器的限制，直接操作你的作業系統。

---

## 1. 啟動後端：`spawn` 魔法

請看第 82 行：
```javascript
backendProcess = spawn(pythonPath, [scriptPath], {
    cwd: path.dirname(scriptPath),
    stdio: 'pipe' 
});
```
### 這是什麼意思？
這代表 Electron 就像是一個家長，主動生出一個「子進程 (Child Process)」。這個子進程就是我們的 FastAPI 伺服器。
*   **`stdio: 'pipe'`**：這就像是在兩個人之間接了一根管子。Python 在終端機印出的任何東西，都會流進這根管子裡。

---

## 2. 跨進程日誌監視器 (IPC Communication)

這是本專案非常有創意的地方。我們如何讓前端看到後端的黑框框輸出？

```javascript
// 在 main.cjs 中截獲 Python 的輸出
backendProcess.stdout.on('data', (data) => {
    const text = data.toString();
    if (monitorWindow) {
        monitorWindow.webContents.send('backend-log', text);
    }
});
```

### 運作原理：
1.  **Python (後端)**：印出 `AI > Hello`。
2.  **Main Process (Node.js)**：從管子接到 `Hello`。
3.  **IPC (通訊)**：透過 `webContents.send` 把文字「射」給監控視窗。
4.  **Monitor (前端頁面)**：接收到訊息，把字印在美美的網頁控制台上。

---

## 3. 視窗管理與電力優化

請看第 44-52 行：
```javascript
mainWindow.on('focus', () => {
    mainWindow.webContents.send('app-focus-changed', true);
});
```
我們監聽了視窗是否有被點選。
*   **深度設計**：當使用者把視窗最小化或切換到別的程式時，我們會通知前端組件。前端組件（例如背景的 Shader 動畫）可以選擇「暫停播放」，這能大幅減少筆記型電腦的電力消耗。

---

## 4. 資源清理：不留下幽靈進程

當你按右上角的紅叉叉關閉程式時，發生了什麼？

```javascript
app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill(); // 這是重點！
    }
});
```
### 為什麼要這樣做？
> **深度思考**：如果您不寫這行，當您關閉視窗後，那個 Python 後端伺服器其實還會悄悄地躲在工作管理員裡繼續跑。使用者開十次 App，電腦就會多出十個 Python 被佔著資源。這就是所謂的「殭屍進程」。

---

## 🔍 教學思考：
為什麼我們不讓前端 React 自己去啟動 Python？
> **深度解答**：因為瀏覽器為了安全，嚴禁網頁代碼 (`App.jsx`) 執行電腦裡的 `.exe` 檔案。只有 Electron 的「主進程 (Main Process)」具備完整的 Node.js 權限，才能勝任這份工作。這就是 Electron 存在的最大意義。

---
**下一課預告**：第八課 —— 質感與打磨。
我們將學習 CSS 變數主題切換，以及如何用「聲音」提升使用者的愉悅感。
