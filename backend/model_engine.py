from typing import List, Dict, Optional
import os
import sys
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

# 強制使用 UTF-8 輸出以減少 Windows 編碼報錯，雖然仍受限於終端機能否顯示
console = Console(theme=custom_theme, force_terminal=True, legacy_windows=None)

# 取得 models 資料夾的絕對路徑
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

# [提前載入 CUDA DLL] 放在任何 import llama_cpp 之前
if sys.platform == "win32":
    cuda_paths = [
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.0\bin",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.1\bin",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4\bin",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1\bin",
        os.path.expanduser(r"~\.lmstudio\extensions\backends\vendor\win-llama-cuda12-vendor-v2")
    ]
    for path in cuda_paths:
        if os.path.exists(path):
            try:
                os.add_dll_directory(path)
            except Exception:
                pass

models_path = {
    "Gemma3_4b_it_Q4_K_M": os.path.join(MODELS_DIR, "Gemma3_4b_it_Q4_K_M.gguf"),
    "Llama_3.2_3B_It_Q4_K_M": os.path.join(MODELS_DIR, "Llama_3.2_3B_It_Q4_K_M.gguf")
}
DEFULT_MODEL_PATH = models_path["Llama_3.2_3B_It_Q4_K_M"]

class ModelEngine:
    def __init__(self):
        self.llm = None
        self.has_gpu = False
        self.current_use_model_path = DEFULT_MODEL_PATH # 預設模型路徑
        
    def load_model(self, use_model_path=None):
        if self.llm:
            return

        # 沒傳路徑則使用目前設定的路徑
        target_path = use_model_path if use_model_path else self.current_use_model_path

        console.print(Panel(f"正在載入模型，位置: [bold yellow]{target_path}[/bold yellow]", title="[bold blue]AI 引擎初始化[/bold blue]", border_style="blue"))
        
        if not target_path or not os.path.exists(target_path):
            console.print(f"[danger]找不到模型檔案！ 路徑: {target_path}[/danger]")
            raise FileNotFoundError(f"在 {target_path} 找不到模型")

        try:
            from llama_cpp import Llama
            
            self.llm = Llama(
                model_path=target_path,
                n_gpu_layers=-1, 
                n_ctx=8192,      
                verbose=True    # 改為 True 以便我們在 Debug 時看到更多資訊
            )
            self.has_gpu = True
            console.print(Panel("[success]模型載入成功[/success]", border_style="green"))
            
        except ImportError as e:
            console.print(Panel(f"[danger]尚未安裝 llama-cpp-python 或載入失敗。[/danger]\n詳細錯誤: {e}", title="載入錯誤", border_style="red"))
            self.llm = None
        except Exception as e:
            # 移除所有可能無法在 CP950 顯示的特殊字元
            console.print(Panel(
                f"[danger]載入模型時發生未預期的錯誤[/danger]\n\n"
                f"這通常代表系統環境缺少相依檔案。\n"
                f"建議檢查: [bold]NVIDIA CUDA Toolkit[/bold] 或 [bold]VC++ Redistributable[/bold]\n\n"
                f"系統詳細報錯: {str(e)}", 
                title="引擎啟動失敗", 
                border_style="red"
            ))
            self.llm = None

    def is_loaded(self):
        return self.llm is not None

    def get_current_model_id(self):
        for model_id, path in models_path.items():
            if path == self.current_use_model_path:
                return model_id
        return None

    def generate(self, messages: List[Dict[str, str]]) -> str:
        """
        messages: [{"role": "user", "content": "..."}, ...]
        """
        if not self.llm:
            try:
                self.load_model()
            except Exception:
                return "錯誤: 模型載入失敗，請檢查後端日誌。"
        
        if not self.llm:
            return "錯誤: 模型未載入。"

        try:
            # 安全輸出日誌
            last_msg = messages[-1]["content"] if messages else ""
            log_text = f"USER > {last_msg[:30].strip()}..."
            console.print(log_text, style="cyan")
            
            response = self.llm.create_chat_completion(
                messages=messages,
                max_tokens=1024,
                stop=["<|eot_id|>", "<|end_of_text|>", "<end_of_turn>", "<start_of_turn>"],
                temperature=0.7
            )
            
            ans = response["choices"][0]["message"]["content"]
            ans_display = ans[:30].strip().replace("\n", " ")
            console.print(f"AI   > {ans_display}...", style="dim green")
            return ans
        except Exception as e:
            try:
                console.print(f"Error during generation: {str(e)}", style="bold red")
            except:
                print(f"Error during generation (plain): {str(e)}")
            return f"生成過程中發生錯誤: {str(e)}"

    def switch_model(self, model_id : str):
        if self.llm:
            del self.llm
            self.llm = None
            import gc; gc.collect()
            console.print("[success]先前模型已成功卸載並釋放顯存[/success]")

        self.current_use_model_path = models_path.get(model_id)
        if not self.current_use_model_path:
            console.print(f"[danger]錯誤: 找不到模型 ID {model_id} 對應的路徑[/danger]")
            return

        self.load_model(self.current_use_model_path)
