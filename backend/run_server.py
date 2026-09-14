"""
APEX 4 Standalone Backend Entrypoint
Executed directly or packaged with PyInstaller into apex4-backend.exe
"""
import sys
import os
import argparse
import multiprocessing
import uvicorn
from app.main import app
from app.core.config import settings

def main():
    multiprocessing.freeze_support()
    
    parser = argparse.ArgumentParser(description="APEX 4 Rehabilitation Hardware Bridge Backend")
    parser.add_argument("--host", default="127.0.0.1", help="Host address to bind")
    parser.add_argument("--port", type=int, default=settings.PORT, help="Port to bind")
    args = parser.parse_args()

    print(f"[APEX4-BACKEND] Starting APEX 4 Core Hardware Bridge on http://{args.host}:{args.port}")
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info",
        access_log=False
    )

if __name__ == "__main__":
    main()
