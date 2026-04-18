from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys
import io

# 強制設定標準輸出為 UTF-8 以解決 Windows CP950/Big5 編碼問題
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 將當前目錄加入路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import init_db
import logging
from rich.logging import RichHandler
from rich.console import Console
from rich.panel import Panel
from contextlib import asynccontextmanager

from api.api_manager import api_router

# 設定 Rich 終端機
console = Console()

# 配置日誌
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True, console=console)]
)

# 取得 uvicorn 的 access logger 並過濾
class AccessLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # 過濾掉 status code 為 200 的訊息，保持介面乾淨
        return " 200 OK" not in record.getMessage()

logging.getLogger("uvicorn.access").addFilter(AccessLogFilter())
log = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    console.print(Panel("[bold green]後端伺服器啟動成功[/bold green]", title="系統狀態", border_style="green"))
    # 初始化資料庫
    init_db()
    yield
    console.print("[yellow]應用程式關閉中...[/yellow]")

app = FastAPI(title="Llama Electron API", lifespan=lifespan)

# 啟用 Electron 的 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 准許所有來源
    allow_credentials=True,
    allow_methods=["*"], # 准許所有動作 (GET, POST, DELETE...)
    allow_headers=["*"], # 准許所有表頭 (Content-Type 等)
)

# 掛載所有的 API 路由
app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
