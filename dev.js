/**
 * EduQueue Dev Server Runner
 * Runs PHP backend and Vite frontend concurrently with a single command: npm run dev
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const isWindows = process.platform === 'win32';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

function log(prefix, color, message) {
  const lines = message.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`${color}${prefix}${colors.reset} ${line}`);
    }
  });
}

// Find PHP executable
function findPhp() {
  // 1. Try PATH
  try {
    execSync('php -v', { stdio: 'ignore' });
    return 'php';
  } catch (e) {
    // PATH check failed
  }

  // 2. Windows Laragon paths
  if (isWindows) {
    const laragonPhpDir = 'C:\\laragon\\bin\\php';
    if (fs.existsSync(laragonPhpDir)) {
      const versions = fs.readdirSync(laragonPhpDir);
      for (const ver of versions) {
        const candidate = path.join(laragonPhpDir, ver, 'php.exe');
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }

    // 3. Windows XAMPP path
    const xamppPhp = 'C:\\xampp\\php\\php.exe';
    if (fs.existsSync(xamppPhp)) {
      return xamppPhp;
    }
  }

  return 'php'; // Fallback
}

const phpExe = findPhp();
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log(`${colors.bright}${colors.magenta}==============================================================${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}  EduQueue - Web-Based Student Service & Queue Management System  ${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}==============================================================${colors.reset}`);
console.log(`${colors.gray}* PHP Executable : ${phpExe}${colors.reset}`);
console.log(`${colors.gray}* Backend URL    : http://localhost:8000${colors.reset}`);
console.log(`${colors.gray}* Frontend URL   : http://localhost:5173${colors.reset}`);
console.log(`${colors.bright}${colors.green}* Quick Login (Admin)   : admin@srcb.edu.ph   / password123${colors.reset}`);
console.log(`${colors.bright}${colors.green}* Quick Login (Staff)   : staff@srcb.edu.ph   / password123${colors.reset}`);
console.log(`${colors.bright}${colors.green}* Quick Login (Student) : student1@srcb.edu.ph / password123${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}==============================================================${colors.reset}\n`);

// Start Backend Process
const backendProcess = spawn(
  phpExe,
  ['-S', '0.0.0.0:8000', '-t', 'backend/public', 'backend/public/index.php'],
  { cwd: rootDir, env: process.env }
);

backendProcess.stdout.on('data', (data) => log('[Backend]', colors.cyan, data));
backendProcess.stderr.on('data', (data) => log('[Backend]', colors.cyan, data));
backendProcess.on('error', (err) => {
  log('[Backend ERROR]', colors.red, err.message);
});

// Start Frontend Process
const frontendProcess = isWindows
  ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev'], { cwd: frontendDir, env: process.env })
  : spawn('npm', ['run', 'dev'], { cwd: frontendDir, env: process.env });

frontendProcess.stdout.on('data', (data) => log('[Frontend]', colors.green, data));
frontendProcess.stderr.on('data', (data) => log('[Frontend]', colors.green, data));
frontendProcess.on('error', (err) => {
  log('[Frontend ERROR]', colors.red, err.message);
});

// Handle graceful shutdown
function cleanup() {
  console.log(`\n${colors.yellow}Shutting down EduQueue servers...${colors.reset}`);
  if (backendProcess) {
    try { backendProcess.kill(); } catch (e) {}
  }
  if (frontendProcess) {
    try { frontendProcess.kill(); } catch (e) {}
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
