import importlib.util
from pathlib import Path
import uvicorn

p = Path(__file__).resolve().parents[1] / "ai-service" / "main.py"
spec = importlib.util.spec_from_file_location("ai_main", str(p))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
app = getattr(mod, "app")

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=9000)
