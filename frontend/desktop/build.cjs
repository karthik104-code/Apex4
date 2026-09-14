const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..', '..');
const backendDist = path.join(rootDir, 'backend', 'dist', 'apex4-backend');

console.log('[DESKTOP-BUILD] Verifying PyInstaller standalone backend build...');

if (!fs.existsSync(backendDist) || !fs.existsSync(path.join(backendDist, 'apex4-backend.exe'))) {
  console.log('[DESKTOP-BUILD] Backend distribution not found. Invoking PyInstaller build...');
  try {
    execSync('python backend/build_backend.py', {
      cwd: rootDir,
      stdio: 'inherit'
    });
  } catch (err) {
    console.error('[DESKTOP-BUILD] Failed to build backend with PyInstaller:', err);
    process.exit(1);
  }
} else {
  console.log('[DESKTOP-BUILD] Found existing standalone backend binary at:', backendDist);
}

console.log('[DESKTOP-BUILD] Pre-build verification completed successfully.');
