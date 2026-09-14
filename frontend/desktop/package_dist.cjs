/**
 * APEX 4 Standalone Distribution Packager
 * Assembles the full standalone Windows distribution:
 *   dist-desktop/APEX 4-win32-x64/
 *     ├── APEX 4.exe
 *     ├── resources/
 *     │     ├── app/ (Vite HTML/JS/CSS bundle + Electron desktop shell)
 *     │     └── backend/ (PyInstaller standalone hardware bridge + FastAPI)
 *     └── (Electron runtime binaries & DLLs)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function assembleDesktopApp() {
  const frontendDir = path.resolve(__dirname, '..');
  const rootDir = path.resolve(frontendDir, '..');
  const electronDist = path.join(frontendDir, 'node_modules', 'electron', 'dist');
  const backendDist = path.join(rootDir, 'backend', 'dist', 'apex4-backend');
  const outDir = path.join(frontendDir, 'dist-desktop', 'APEX 4-win32-x64');

  console.log('[PACKAGE] 1. Checking prerequisites...');
  if (!fs.existsSync(electronDist)) {
    console.error('[PACKAGE] Electron distribution not found in node_modules/electron/dist!');
    process.exit(1);
  }

  if (!fs.existsSync(path.join(backendDist, 'apex4-backend.exe'))) {
    console.log('[PACKAGE] Standalone backend binary not found. Compiling with PyInstaller...');
    execSync('python backend/build_backend.py', { cwd: rootDir, stdio: 'inherit' });
  }

  console.log('[PACKAGE] 2. Preparing output directory:', outDir);
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  console.log('[PACKAGE] 3. Copying Electron runtime binaries...');
  copyRecursiveSync(electronDist, outDir);

  // Rename electron.exe -> APEX 4.exe
  const oldExe = path.join(outDir, 'electron.exe');
  const newExe = path.join(outDir, 'APEX 4.exe');
  if (fs.existsSync(oldExe)) {
    fs.renameSync(oldExe, newExe);
    console.log('[PACKAGE] Renamed electron.exe -> APEX 4.exe');
  }

  // Remove default_app.asar so Electron boots resources/app directly
  const defaultAsar = path.join(outDir, 'resources', 'default_app.asar');
  if (fs.existsSync(defaultAsar)) {
    fs.unlinkSync(defaultAsar);
  }

  console.log('[PACKAGE] 4. Packaging application bundle (app)...');
  const appTargetDir = path.join(outDir, 'resources', 'app');
  fs.mkdirSync(appTargetDir, { recursive: true });

  // Copy dist
  copyRecursiveSync(path.join(frontendDir, 'dist'), path.join(appTargetDir, 'dist'));

  // Copy desktop
  copyRecursiveSync(path.join(frontendDir, 'desktop'), path.join(appTargetDir, 'desktop'));

  // Copy package.json
  fs.copyFileSync(path.join(frontendDir, 'package.json'), path.join(appTargetDir, 'package.json'));

  console.log('[PACKAGE] 5. Packaging standalone backend (apex4-backend)...');
  const backendTargetDir = path.join(outDir, 'resources', 'backend', 'apex4-backend');
  fs.mkdirSync(backendTargetDir, { recursive: true });
  copyRecursiveSync(backendDist, backendTargetDir);

  console.log('\n===============================================================');
  console.log(' APEX 4 WINDOWS STANDALONE SOFTWARE ASSEMBLED SUCCESSFULLY! ');
  console.log('===============================================================');
  console.log('Executable Location:');
  console.log(`  ${newExe}`);
  console.log('Directory:');
  console.log(`  ${outDir}`);
  console.log('===============================================================\n');
}

assembleDesktopApp();
