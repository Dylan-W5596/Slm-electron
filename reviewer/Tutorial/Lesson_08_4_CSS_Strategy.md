# 第 8.4 課：大型專案中的 CSS 管理與快速排版

在這種包含多個頁面與複雜介面的專案中，CSS 如果亂寫，很快就會變成一場「命名衝突」與「樣式覆蓋」的噩夢。

這節課我們要解析：我是如何設計這個專案的 CSS 架構，讓你即使新增 100 個頁面也不會撞名，並能快速完成排版。

---

## 1. 檔案組織：元件化 CSS (Componentized CSS)

請看 `frontend/src/styles/` 資料夾。我們沒有把所有東西塞進一格 `index.css`，而是依照功能拆分：
*   `theme_variables.css`：專門存放變數（顏色、間距）。
*   `Home.css`：只管首頁。
*   `Sidebar.css`：只管側邊欄。

**設計原則**：**一個 JSX 檔案就對應一個 CSS 檔案**。這樣當你修改首頁時，你絕對不會不小心動到設定頁的樣式。

---

## 2. 核心技術：變數驅動設計 (Variable-First)

所有的顏色都定義在 `theme_variables.css`。
**為什麼這能防止障礙？**
因為如果你想改「主色調」，你不需要去搜尋全專案的 `#d4af37`。你只需要在變數檔改掉 `--accent-luxury`，全專案就會同步更新。這保證了介面的「一致性」。

---

## 3. 防撞名大招：命名空間 (Namespace)

為了防止 `.button` 或 `.container` 這種菜市場名互相打架，我在每個檔案都使用了 **「根類別 (Root Class)」** 策略：

```css
/* Home.css */
.home-container { ... }
.home-title { ... }

/* Settings.css */
.settings-container { ... }
.settings-title { ... }
```
**關鍵**：所有的選擇器都以該「頁面名稱」開頭。這就像是給每個頁面的元件都發了一張「身分證」，永遠不會誤認。

---

## 4. 快速排版的神器：Flex 與 Grid

如果你要設計一個新頁面，請記住這兩個「排版咒語」：

### A. 水平/垂直置中 (Flexbox)
只要三行，就能讓內容完美排好：
```css
.new-page {
  display: flex;
  justify-content: center; /* 水平置中 */
  align-items: center;     /* 垂直置中 */
}
```

### B. 複雜網格 (Grid)
如果你要像側邊欄那樣有固定寬度的左邊和自動延伸的右邊：
```css
.layout {
  display: grid;
  grid-template-columns: 280px 1fr; /* 左邊 280px，右邊剩餘空間 */
}
```

---

## 5. 如何快速調整？（即時回饋循環）

1.  **善用瀏覽器開發者工具 (F12)**：
    *   不要直接在代碼改。先在瀏覽器的「Elements」分頁直接調整數值。
    *   調到完美後，再把數值複製回 CSS 檔案。
2.  **使用絕對單位與相對單位的組合**：
    *   寬度用 `%` 或 `fr`（適應螢幕）。
    *   間距 (Padding/Margin) 用 `px` 或 `rem`（保持精緻感）。

---

## 🔍 教學思考：
如果兩個頁面真的有相同的樣式（例如按鈕），該怎麼辦？
> **深度解答**：這時候我們會把它放進 `base.css`。這是一個「公用池」。我會在裡面定義像 `.btn-primary` 這種通用樣式。頁面專用的樣式則留在各自的 CSS 裡。這就是 **「全域公用 + 局部專用」** 的平衡。

---
**小練習**：
試著建立一個 `TestPage.css`，並給它一個 `.test-page-hero` 的類別，設置 `display: flex` 與 `background: var(--bg-deep)`。看看你能多快畫出一個漂亮的區塊！
