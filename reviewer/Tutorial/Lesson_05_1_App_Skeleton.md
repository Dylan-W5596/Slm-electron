# 第 5.1 課：React 環境與 App.jsx 的骨架結構

這節課我們要解析 **`frontend/src/App.jsx`** 的宏觀結構。這是前端應用程式的進入點與靈魂。

---

## 1. 組件結構 (Component Skeleton)

`App.jsx` 是一個大的函數組件。它的結構遵循以下邏輯：
1.  **Imports**：引入 React Hooks、子組件、API 工具、樣式與資源。
2.  **State Definitions**：定義驅動畫面的變數（見 5.2 課）。
3.  **Ref Definitions**：定義不觸發重繪但需要保持引用的「指針」（例如滾動位置、AbortController）。
4.  **Lifecycle Effects**：處理啟動任務與副作用（見 5.3 課）。
5.  **Handler Functions**：處理按鈕點擊與邏輯運算。
6.  **JSX Return**：描述畫面長怎樣。

---

## 2. 佈局邏輯：條件渲染 (Conditional Rendering)

請看代碼中的轉場邏輯：
```javascript
{view === 'home' && <Home ... />}
{view === 'chat' && <ChatView ... />}
{view === 'settings' && <Settings ... />}
```
這種寫法在 React 裡非常常見。它不是「隱藏」組件，而是「卸載 (Unmount)」與「掛載 (Mount)」。
*   當 `view` 變更時，舊的畫面會從記憶體中被銷毀。
*   新的畫面會重新執行它的初始邏輯。

---

## 3. 資源的「懶引入」與 Assets 管理

在開頭我們看到了：
```javascript
import assistantAvatar from './assets/icons/IM742001_account_circle_24dp.png';
import { playSound } from './utils/soundUtils';
```
透過 Vite 的打包機制，這些路徑在最終產出的 App 中會被轉化為優化過的二進位連結，這能保證在各個平台（Mac, Windows）上路徑都不會死掉。

---

## 🔍 教學思考：
為什麼不把所有代碼都塞進 `App.jsx`，而要拆分出 `Sidebar.jsx`, `ChatInput.jsx`？
> **深度解答**：這叫 **「關注點分離 (Separation of Concerns)」**。如果全部寫在一起，這個檔案會超過 2000 行，除錯時會找不到北。拆分組件能讓 React 的虛擬 DOM (Virtual DOM) 比對速度更快，因為當你輸入文字時，只有 `ChatInput` 需要重繪。

---
**下一課預告**：Lesson 5.2 —— 狀態管理。
我們將學習如何區分「複雜物件」與「原子狀態」。
