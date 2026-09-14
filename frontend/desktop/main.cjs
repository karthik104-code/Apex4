const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 8000;
const BACKEND_HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;

let mainWindow = null;
let backendProcess = null;
let backendReady = false;

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(BACKEND_HEALTH_URL, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxAttempts = 30, intervalMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const ok = await checkBackendHealth();
    if (ok) {
      backendReady = true;
      console.log(`[APEX4-DESKTOP] Backend healthy and responding on port ${BACKEND_PORT}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

function getBackendExecutablePath() {
  if (app.isPackaged) {
    // Packaged path inside resources/backend/
    const packagedPath = path.join(process.resourcesPath, 'backend', 'apex4-backend', 'apex4-backend.exe');
    if (fs.existsSync(packagedPath)) return packagedPath;
    
    // Alternative flat executable
    const flatPath = path.join(process.resourcesPath, 'backend', 'apex4-backend.exe');
    if (fs.existsSync(flatPath)) return flatPath;
  }
  
  // Local development / unpacked dist path
  const localDistPath = path.resolve(__dirname, '..', '..', 'backend', 'dist', 'apex4-backend', 'apex4-backend.exe');
  if (fs.existsSync(localDistPath)) return localDistPath;

  return null;
}

function startBackend() {
  return new Promise(async (resolve) => {
    const isAlreadyRunning = await checkBackendHealth();
    if (isAlreadyRunning) {
      console.log('[APEX4-DESKTOP] Backend is already running on port ' + BACKEND_PORT);
      backendReady = true;
      return resolve(true);
    }

    const exePath = getBackendExecutablePath();
    if (exePath && fs.existsSync(exePath)) {
      console.log('[APEX4-DESKTOP] Spawning backend binary:', exePath);
      backendProcess = spawn(exePath, ['--port', String(BACKEND_PORT)], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(`[BACKEND-STDOUT] ${data.toString().trim()}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(`[BACKEND-STDERR] ${data.toString().trim()}`);
      });

      backendProcess.on('exit', (code, signal) => {
        console.log(`[APEX4-DESKTOP] Backend exited with code ${code}, signal ${signal}`);
        backendProcess = null;
      });
    } else {
      console.log('[APEX4-DESKTOP] Standalone backend binary not found. Running in development/external backend mode.');
    }

    const ready = await waitForBackend();
    resolve(ready);
  });
}

function killBackend() {
  if (backendProcess && backendProcess.pid) {
    const pid = backendProcess.pid;
    console.log(`[APEX4-DESKTOP] Terminating backend process (PID: ${pid})...`);
    if (process.platform === 'win32') {
      exec(`taskkill /F /T /PID ${pid}`, (err) => {
        if (err) console.warn('[APEX4-DESKTOP] taskkill error:', err.message);
      });
    } else {
      backendProcess.kill('SIGKILL');
    }
    backendProcess = null;
  }
}

  const iconPath = path.join(__dirname, '..', 'public', 'apex4-logo.png');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'APEX 4 — Rehabilitation Assessment Platform',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Handle native camera & media permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'camera' || permission === 'microphone') {
      return callback(true);
    }
    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'camera' || permission === 'microphone') {
      return true;
    }
    return false;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev && !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback to static dist if dev server not active
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-backend-status', () => ({
  ready: backendReady,
  port: BACKEND_PORT,
  hasProcess: !!backendProcess
}));
ipcMain.handle('open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

// App Lifecycle
app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  killBackend();
});

app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
