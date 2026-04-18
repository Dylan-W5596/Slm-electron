import sys
import os

# 將當前目錄加入路徑以便引入 model_engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_engine import ModelEngine

def test_engine():
    engine = ModelEngine()
    
    print("\n--- [Test 1] Initializing connection ---")
    engine.load_model()
    if not engine.is_loaded():
        print("[ERROR] Failed to connect to Ollama. Please ensure Ollama is running.")
        return

    print("\n--- [Test 2] Generation Test (Default: Gemma 4 E2B) ---")
    test_messages = [{"role": "user", "content": "你好，請用繁體中文自我介紹一下。"}]
    response = engine.generate(test_messages)
    print(f"\nAI Response:\n{response}")

    print("\n--- [Test 3] Model Switch Test (Switching to Llama) ---")
    engine.switch_model("Llama_3.2")
    response = engine.generate([{"role": "user", "content": "你現在是哪個模型？"}])
    print(f"\nAI Response:\n{response}")

if __name__ == "__main__":
    try:
        test_engine()
    except Exception as e:
        print(f"測試過程中發生崩潰: {e}")
