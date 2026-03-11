# 第 5.3 課：生命週期鉤子 (useEffect) - 數據的副作用管理

這節課我們要解析 **`App.jsx`** 中所有的 `useEffect`。這是 React 自動化任務的核心。

---

## 1. 自動存檔機制 (Persistent Config)

```javascript
useEffect(() => {
    localStorage.setItem('llama-config', JSON.stringify(config));
}, [config]);
```
*   **第 1 個參數**：要做的事（寫入硬碟）。
*   **第 2 個參數 `[config]`**：**依賴項陣列**。
這代表：「只有當 `config` 變更時，才去存檔」。這避免了在使用者打字或切換視窗時做無謂的寫入。

---

## 2. 初始化數據抓取 (Initial Mount)

```javascript
useEffect(() => {
    fetchData();
}, []);
```
*   **空陣列 `[]`**：這代表「只在組件剛出生（掛載）時執行一次」。這就是為什麼你剛打開 App，它就會去後端抓對話紀錄的原因。

---

## 3. 自動捲動 (The Scrolling Effect)

```javascript
useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```
這是一段「視覺副作用」。每當訊息陣列變長，React 就會命令瀏覽器執行這個 API 動作。這確保了 AI 吐字時，畫面會跟著跳動。

---

## 4. 主題的 CSS 刷漆 (Theme Application)

在 `index.css` 與 `App.js` 的聯動中：
```javascript
useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
}, [config.theme]);
```
**深度技術**：我們不是在 HTML 上改 `class`，而是改 `data-theme` 屬性。這讓 CSS 可以用 `[data-theme='light']` 這種高效能的選擇器來一次切換全域顏色。

---

## 🔍 教學思考：
如果我忘了寫依賴項陣列（也就是 `useEffect(() => { ... })`），會發生什麼？
> **深度解答**：這會造成致命的 **「無窮迴圈」**。
> 1. 渲染 (Render) 畫面。
> 2. 執行 Effect（這裡面改了某個狀態）。
> 3. 因為狀態變了，React 再次渲染。
> 4. 再次執行 Effect。
> 你的電腦風扇會瞬間狂飆，App 隨即當機。一定要記得檢查依賴項！

---
**下一課預告**：進入 Phase 6 —— API 層次細節。
我們將學習如何讓 API 層代碼更現代化。
