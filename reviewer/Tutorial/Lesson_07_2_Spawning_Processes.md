# 第 7.2 課：啟動子進程 - spawn 技術的精髓

這節課解析 **`main.cjs`** 中的 `startBackend()` 函數（第 59-110 行）。這是 App 賦予「生命」的一刻。

---

## 1. 什麼是 Child Process (子進程)？

在作業系統中，一個 App 可以要求開啟另一個 App。這在程式中稱為 `spawn`。
我們在這裡啟動了 `python.exe` 並告訴它去執行 `main.py`。

---

## 2. 代碼路徑的「三級跳」

在 Windows 上開發 Electron 最痛苦的就是路徑。請看第 70-71 行：
```javascript
pythonPath = path.join(__dirname, '../../venv/Scripts/python.exe');
scriptPath = path.join(__dirname, '../../backend/main.py');
```
### 為什麼要這麼多 `../`？
1.  `__dirname` 是 `frontend/electron` 目錄。
2.  第一個 `../` 到了 `frontend`。
3.  第二個 `../` 到了專案根目錄。
4.  最後進入 `venv`。

這種「相對路徑」的設計，保證了只要整包檔案移動，程式仍然能準確找到 Python，而不需要寫死像 `D:\Downloads\...` 這種固定路徑。

---

## 3. 工作目錄 (CWD) 的重要性

```javascript
backendProcess = spawn(pythonPath, [scriptPath], {
    cwd: path.dirname(scriptPath), // 固定在 backend 資料夾執行
});
```
**深度解析**：Python 代碼裡會寫 `sqlite:///./chat_history.db`。如果我們不指定 `cwd` (Current Working Directory)，資料庫檔案可能會被亂丟到 Electron 的安裝目錄下。指定之後，資料庫就一定會乖乖出現在 `backend` 資料夾內。

---

## 4. 殭屍進程的防範 (Zombies)

```javascript
app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill();
});
```
這是開發者的良心。我們必須在老闆要下班時，確保外包的 Python 經理也跟著領便當，否則使用者的電腦記憶體會被慢慢啃光。

---

## 🔍 教學思考：
如果不小心重複執行了兩遍 `startBackend()` 會怎樣？
> **深度解答**：第一個 Python 會正常佔用 8000 埠。第二個 Python 啟動後，會報出 `Address already in use` 並瞬間崩潰退出。雖然 App 還能用，但你會在後台看到一個慘烈的錯誤報告。所以我們使用了全域變數 `backendProcess` 來確保只有一個小孩在場。

---
**下一課預告**：Lesson 7.3 —— IPC 通訊。
我們將學習老板和門市人員如何傳紙條。
