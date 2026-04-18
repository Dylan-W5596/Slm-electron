import ollama
from typing import List, Dict, Optional
from rich.console import Console
from rich.panel import Panel
from rich.theme import Theme

# 定義主題
custom_theme = Theme({
    "info": "dim cyan",
    "warning": "magenta",
    "danger": "bold red",
    "success": "bold green"
})

console = Console(theme=custom_theme, force_terminal=True)

# 將原本的 GGUF 路徑改為 Ollama 模型標籤 (Tag)
# 保留相同的 Key 以便前端無需修改即可調用
OLLAMA_MODEL_TAGS = {
    "Gemma4_e2b": "gemma4:e2b",
    "Llama_3.2": "llama3.2:latest"
}
DEFAULT_MODEL_ID = "Gemma4_e2b"

class ModelEngine:
    def __init__(self):
        self.client = ollama
        self.current_model_id = DEFAULT_MODEL_ID
        self.is_connected = False
        self.has_gpu = True # 補回屬性以相容舊有的 API 介面
        
    def load_model(self, model_id=None):
        """
        在 Ollama 架構中，load_model 主要是檢查服務是否可用
        """
        target_id = model_id if model_id else self.current_model_id
        tag = OLLAMA_MODEL_TAGS.get(target_id, "llama3.2")
        
        console.print(Panel(f"正在連線至 Ollama 服務，準備調用模型: [bold yellow]{tag}[/bold yellow]", title="[bold blue]Ollama AI 引擎初始化[/bold blue]", border_style="blue"))
        
        try:
            # 檢查 Ollama 服務是否運作
            ollama.list()
            self.is_connected = True
            self.current_model_id = target_id
            console.print(Panel(f"[success]成功連線至 Ollama！已準備好使用 {tag}[/success]", border_style="green"))
            
        except Exception as e:
            console.print(Panel(
                f"[danger]無法連線至 Ollama 服務[/danger]\n\n"
                f"請確保你已安裝 Ollama 並已【手動點開】運行 (System Tray 需有圖示)。\n"
                f"系統錯誤訊號: {str(e)}", 
                title="引擎啟動失敗", 
                border_style="red"
            ))
            self.is_connected = False

    def is_loaded(self):
        return self.is_connected

    def get_current_model_id(self):
        return self.current_model_id

    def generate(self, messages: List[Dict[str, str]]) -> str:
        """
        使用 Ollama 進行文本生成
        """
        tag = OLLAMA_MODEL_TAGS.get(self.current_model_id, "llama3.2")
        
        if not self.is_connected:
            self.load_model()
        
        if not self.is_connected:
            return "錯誤: 無法連線至 Ollama 服務，請確認 Ollama 是否已啟動。"

        try:
            last_msg = messages[-1]["content"] if messages else ""
            log_text = f"USER > {last_msg[:30].strip()}..."
            console.print(log_text, style="cyan")
            
            # 呼叫 Ollama Chat API
            response = self.client.chat(
                model=tag,
                messages=messages,
                options={
                    "temperature": 0.7,
                    "num_ctx": 8192
                }
            )
            
            ans = response['message']['content']
            ans_display = ans[:30].strip().replace("\n", " ")
            console.print(f"AI   > {ans_display}...", style="dim green")
            return ans
            
        except Exception as e:
            console.print(f"Ollama 生成錯誤: {str(e)}", style="bold red")
            return f"生成過程中發生錯誤: {str(e)}"

    def switch_model(self, model_id : str):
        """
        切換模型 ID，Ollama 會在下次 generate 時自動載入對應模型
        """
        if model_id not in OLLAMA_MODEL_TAGS:
            console.print(f"[danger]錯誤: 不支援的模型 ID {model_id}[/danger]")
            return

        console.print(f"[info]正在切換 AI 模型為: {model_id}[/info]")
        self.current_model_id = model_id
        # Ollama 會自動管理顯存，我們只需要更新 ID 即可
        console.print(Panel(f"[success]模型切換成功：{OLLAMA_MODEL_TAGS[model_id]}[/success]", border_style="green"))
