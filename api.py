"""
FastAPI Backend for AgenticTableTop
Provides REST API endpoints for the UI to interact with D&D content generation

This file now imports the modular API structure from src/api/server
"""

import sys
from pathlib import Path

# Add src/ to Python path so we can import modules directly
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from dotenv import load_dotenv  # noqa: E402

# Load environment variables from .env file
load_dotenv()

# Import the modular API app
# We need to temporarily remove 'api' from sys.modules if it exists (this file)
# to avoid name conflicts when importing the api package from src/
_api_module_backup = None
if "api" in sys.modules and sys.modules["api"].__file__ == __file__:
    _api_module_backup = sys.modules.pop("api")

try:
    # Now we can import the api package from src/
    from api.server import app  # noqa: E402
finally:
    # Restore the api module (this file) if we removed it
    if _api_module_backup is not None:
        sys.modules["api"] = _api_module_backup

if __name__ == "__main__":
    import uvicorn

    print("Starting AgenticTableTop API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Interactive API: http://localhost:8000/redoc")
    # Note: reload=True requires running as module (uvicorn api:app --reload)
    # For direct execution, we disable reload for stability
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
