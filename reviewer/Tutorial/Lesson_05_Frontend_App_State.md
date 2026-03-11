# 第五課：前端 React 精髓 - 狀態管理與 `App.jsx` 核心

這節課我們要解析 **`frontend/src/App.jsx`**。它是前端的「大腦」，負責連結側邊欄、聊天視窗和所有設置。

---

## 1. 狀態建模：我們如何描述這個 App？

React 的核心就是「狀態決定畫面」。在 `App.jsx` 的開頭（第 15-40 行），我們定義了幾個關鍵狀態：

```javascript
const [sessions, setSessions] = useState([]); // 所有的對話紀錄
const [groups, setGroups] = useState([]);     // 所有的群組分類
const [messages, setMessages] = useState([]); // 當前對話中的訊息
const [currentSessionId, setCurrentSessionId] = useState(null);
const [config, setConfig] = useState(() => {
  // 從本地儲存恢復設定
  const saved = localStorage.getItem('llama-config');
  return saved ? JSON.parse(saved) : { ...預設值 };
});
```

### 深度解析：
*   **`config` 的初始化函數**：我們傳入一個箭頭函數 `() => { ... }`。這叫 **Lazy Initializer**。React 只會在元件第一次渲染時執行它，這比起每次渲染都讀取一次 `localStorage` 效能要好得多。
*   **原子化 vs 集中化**：我們沒有把所有東西塞進一個超大的 `state` 物件，而是拆分成 `sessions`, `messages` 等。這樣當你輸入文字時，只有文字相關的組件會重繪，側邊欄不會跟著閃爍。

---

## 2. 偽路由 (Pseudo-Routing) 機制

本專案沒有使用 `react-router`，而是用了一個簡單的 `view` 狀態：
```javascript
const [view, setView] = useState('home'); // 'home', 'chat', 'settings', 'credits'
```
### 為什麼這樣設計？
> **深度思考**：對於桌面應用程式來說，我們不需要瀏覽器的「上一頁/下一頁」按鈕。使用單一狀態來切換組件，可以讓轉場動畫更平滑，且減少了複雜的路由配置。

---

## 3. 持久化設定 (Persistence)

```javascript
useEffect(() => {
  localStorage.setItem('llama-config', JSON.stringify(config));
}, [config]);
```
這是一個標準模式：每當 `config` 發生變更，我們就把它寫入瀏覽器的「硬碟」。這讓使用者下次打開 App 時，主題色和 AI 參數都能自動恢復。

---

## 4. 自動捲動的奧秘

請看最後幾行有關 `messagesEndRef` 的代碼：
```javascript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```
**技術細節**：我們在對話的最底部放了一個看不到的 `div`。每當 `messages` 陣列變長（AI 說話了），我們就要求瀏覽器「滑」向那個 `div`。這造就了現代聊天軟體那種流暢的自動捲動體驗。

---

## 🔍 教學思考：
如果我把 `messages` 放在 `localStorage` 裡會發生什麼事？
> **深度解答**：這會導致效能災難。`localStorage` 大約只有 5MB-10MB 的上限。當對話變多，你的 App 會越跑越慢，甚至因為空間不足而報錯。這就是為什麼我們把對話交給後端的 SQLite 資料庫，而只在前端儲存「設定值」的原因。

---
**下一課預告**：第六課 —— API 與非同步處理。
我們將學習如何處理 AI 那種「慢吞吞」的請求，以及如何讓它「立刻閉嘴」。
