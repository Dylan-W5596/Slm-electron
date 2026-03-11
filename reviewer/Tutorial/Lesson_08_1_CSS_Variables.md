# 第 8.1 課：CSS 變數與多主題切換系統

這節課解析 **`frontend/src/index.css`**。這是讓 App 從「陽春」變「奢華」的關鍵。

---

## 1. CSS 變數的概念 (:root)

在傳統 CSS 中，顏色是寫死的。在本專案中，我們使用了「語義化變數」。
*   `--bg-deep`: 背景深黑色。
*   `--accent-luxury`: 黃金主題色。

這讓我們的代碼更有閱讀性。我們不是在畫 `color: #d4af37;`，而是在寫 `color: var(--accent-luxury);`。

---

## 2. 主題切換的實作邏輯

在 `index.css` 的後半段：
```css
[data-theme='light'] {
    --bg-deep: #f5f5f7;
    --text-main: #1d1d1f;
    /* ...改為亮色系 */
}
```
### 極深解析：
為什麼我們用 `[data-theme='light']` 而不是 `.light-theme` 類別？
> **答案**：效能。CSS 屬性選擇器效能極高，且它不會與組件內部的 class 產生命名衝突。

---

## 3. 動態轉場動畫 (Transitions)

我們在全域加上了：
`transition: background 0.3s ease-in-out, color 0.3s;`
如果你按主題切換按鈕，畫面不是閃一下變色，而是像「刷漆」或是「燈光漸暗」一樣優雅地變色。這種 **0.3 秒** 的過渡，是提升產品「高級感」最簡單也最有效的手段。

---

## 4. 自定義滾動條 (Scrollbar Styling)

```css
::-webkit-scrollbar {
    width: 6px;
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}
```
原本 Windows 的滾動條又粗又灰，非常醜陋。我們透過這幾行，把它變成了像 Mac 一樣精緻、半透明且會自動隱藏的樣式。

---

## 🔍 教學思考：
為什麼主題色不直接寫在 React 的 JS 物件裡，而要寫在 CSS 裡？
> **深度解答**：如果你寫在 JS 裡，每次換顏色 React 都要重新計算上千個組件的 Style。寫在 CSS 裡，瀏覽器引擎會接手所有的「換色」工作，它是用顯卡來運算的，速度比 JavaScript 快上一個維度。

---
**下一課預告**：Lesson 8.2 —— 提示音訊。
我們將學習如何用聲音與使用者建立情感連結。
