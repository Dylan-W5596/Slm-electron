# Hello Everyone

## 簡介
- 這是一份基於Electron + Reac配上本地端模型運算的軟體，能解決付費, 隱私. 自訂義, 知識, 程式開發, 投資分析(Main)等等功能。

## 技術棧 (Tech Stack)
### **核心架構**
- **Runtime:** Electron (桌面應用外殼)
- **Frontend:** React 19 + Vite (高速渲染與開發物料)
- **Backend:** Python 3 + FastAPI (高效能異步 API 伺服器)
- **Database:** SQLite + SQLAlchemy (輕量級本地數據持久化)
### **人工智慧**
- **Engine:** Ollama (本地大型語言模型運算)
- **Models:** Gemma 3 / Llama 3.2 (隱私優先、離線分析)
- **Logic:** Prompt Engineering + Regex Validation (結構化數據輸出確保)
### **數據視覺化**
- **Charting:** Recharts (動態金融圖表)
- **Mapping:** D3-geo / React Simple Maps (全球新聞地圖)
- **3D Effects:** Three.js / React Three Fiber (現代感視覺特效)
### **開發與測試**
- **Testing:** Vitest + React Testing Library (自動化邏輯校驗)
- **Bundler:** Vite (前端打包) / Electron-builder (安裝檔打包)

## 文件結構
```
llm_electron-Test/
├── 📂 backend/                # 後端邏輯核心 (Python / FastAPI)
│   ├── 📂 api/                # API 路由分組 (新聞、金融分析等)
│   ├── 📂 scripts/            # 工具指令與自動化腳本
│   ├── 📄 main.py             # 後端主入口 (FastAPI 啟動)
│   ├── 📄 model_engine.py     # AI 模型對接引擎 (Ollama 通訊邏輯)
│   ├── 📄 database.py         # 資料庫封裝 (SQLAlchemy / CRUD)
│   ├── 📄 globals.py          # 全域變數與系統提示詞 (Prompts)
│   └── 📄 chat_history.db     # 本地聊天紀錄資料庫 (SQLite)
│
├── 📂 frontend/               # 前端介面 (React / Vite)
│   ├── 📂 src/
│   │   ├── 📂 components/     # UI 元件 (地圖、圖表、主視窗)
│   │   ├── 📂 context/        # 全域狀態管理 (Context API)
│   │   ├── 📂 assets/         # 靜態資源 (圖示、更新日誌、音效)
│   │   ├── 📂 styles/         # CSS 樣式表 (CSS Modules)
│   │   ├── 📂 translations/   # 多國語系語系檔 (i18n)
│   │   ├── 📄 api.js          # 前端 API 通訊層
│   │   └── 📄 main.jsx        # 前端渲染主入口
│   ├── 📄 index.html          # HTML 模板
│   ├── 📄 package.json            # 前端及 Electron 依賴清單
│   └── 📄 vite.config.js      # Vite 構建配置
│
├── 📂 reviewer/
│   ├── 📂 _error_log/
│   ├── 📂 design/
│   └── 📄 system_architecture.svg # 系統架構圖 (剛生成的圖檔)
│
├── 📂 install/                # 安裝與建置指令腳本
├── 📄 README.MD               # 專案說明文件
└── 📄 .gitignore              # 排除追蹤清單
```
## Others
截止至 2026/4/18 Ver.Alpha 2.1.0