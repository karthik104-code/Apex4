"""
APEX 4 - Standalone Backend Build Script
Bundles FastAPI + Uvicorn + Hardware Bridge into a single directory distribution for Electron
"""
import os
import sys
import subprocess
import shutil

def build():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(backend_dir, "dist", "apex4-backend")
    build_dir = os.path.join(backend_dir, "build")
    
    print("[BUILD] Cleaning previous build artifacts...")
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir, ignore_errors=True)
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir, ignore_errors=True)

    entrypoint = os.path.join(backend_dir, "run_server.py")
    
    hidden_imports = [
        "uvicorn",
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "uvicorn.lifespan.off",
        "fastapi",
        "pydantic",
        "pydantic_settings",
        "serial",
        "hid",
        "starlette",
        "anyio",
        "email_validator"
    ]
    
    cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--name=apex4-backend",
        "--onedir",
        "--noconfirm",
        "--clean",
        "--noconsole",
        f"--distpath={os.path.join(backend_dir, 'dist')}",
        f"--workpath={build_dir}",
    ]
    
    for imp in hidden_imports:
        cmd.extend(["--hidden-import", imp])
        
    cmd.extend(["--collect-all", "hid"])
    cmd.extend(["--collect-all", "hidapi"])
        
    cmd.append(entrypoint)
    
    print(f"[BUILD] Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=backend_dir)
    if res.returncode != 0:
        print("[BUILD] PyInstaller failed with exit code", res.returncode)
        sys.exit(res.returncode)
    
    print("[BUILD] Backend successfully built to:", dist_dir)

if __name__ == "__main__":
    build()
