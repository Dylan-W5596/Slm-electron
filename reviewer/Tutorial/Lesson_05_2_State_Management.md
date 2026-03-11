# 第 5.2 課：狀態管理 - 複雜物件 vs 原子狀態

這節課我們要深入 **`App.jsx`** 的第 15-40 行，探討 React 狀態設定的藝術。

---

## 1. 原子狀態 (Atomic States)

例如：
```javascript
const [view, setView] = useState('home');
const [hasSeenEntryAnim, setHasSeenEntryAnim] = useState(false);
```
這些是單一、純粹的標籤。切換它們非常快速，且邏輯簡單。

---

## 2. 複雜物件與陣列 (Complex States)

例如：
```javascript
const [sessions, setSessions] = useState([]);
const [messages, setMessages] = useState([]);
```
當我們處理對話紀錄時，這是一個包含無數物件的陣列。

### 重點：React 的「不可變性 (Immutability)」
在 React 中，你**絕對不能**這樣寫：
`sessions.push(newSession);` (這是錯誤的！)

你必須這樣寫：
`setSessions([...sessions, newSession]);` 
這樣寫代表「建立一個全新的陣列複本」。React 看到「記憶體地址變了」，才會觸發畫面更新。

---

## 3. 設定的持久化初始化 (Lazy Initializer)

這是一個本專案中使用的高級模式：
```javascript
const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('llama-config');
    return saved ? JSON.parse(saved) : { ...預設值 };
});
```
### 為什麼要這樣寫？
如果直接在 `useState` 括號裡寫資料，React 每次重新渲染（例如你打一個字）都會去讀取一次硬碟 (`localStorage`)。
寫成一個「函數」，則只會在這個組件「出生」的那一瞬間執行一次，效能提升巨大。

---

## 4. 全域傳遞 (Prop Drilling)

你會在 JSX 裡看到很多：
`<Sidebar sessions={sessions} onNavigate={handleNavigate} ... />`
這代表我們把 `App.jsx` 的狀態「往下傳」。子組件不需要知道怎麼建立對話，它只需要負責「把這一串 sessions 畫出來」就好。

---

## 🔍 教學思考：
如果我的對話有 1 萬條訊息，`messages` 狀態會不會讓畫面變卡？
> **深度解答**：會。這就是為什麼在大規模應用中，我們會引入「虛擬列表 (Virtual List)」技術，只畫出使用者看得到的那 10 幾條。在目前本專案的規模下，直接存放在 state 中是開發效率最高的選擇。

---
**下一課預告**：Lesson 5.3 —— 生命周期鉤子 (useEffect)。
我們將學習如何讓數據隨時隨地自動存檔。
