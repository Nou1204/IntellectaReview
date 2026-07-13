import importlib.util
import sys
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "ai-service" / "main.py"
spec = importlib.util.spec_from_file_location("ai_main", str(p))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
app = getattr(mod, "app", None)
if app is None:
    print("No app found in ai-service/main.py")
    sys.exit(2)

print("Routes found:")
for r in app.routes:
    try:
        print(r.path)
    except Exception:
        print(repr(r))
