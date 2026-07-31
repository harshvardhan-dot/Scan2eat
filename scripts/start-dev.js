const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('🚀 Starting HostelOS Server & Web apps concurrently...\n');

const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'apps', 'server'),
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  process.stdout.write(`[SERVER] ${data.toString()}`);
});

server.stderr.on('data', (data) => {
  process.stderr.write(`[SERVER ERROR] ${data.toString()}`);
});

const web = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'apps', 'web'),
  stdio: 'pipe',
  shell: true
});

web.stdout.on('data', (data) => {
  process.stdout.write(`[WEB] ${data.toString()}`);
});

web.stderr.on('data', (data) => {
  process.stderr.write(`[WEB ERROR] ${data.toString()}`);
});

process.on('SIGINT', () => {
  server.kill();
  web.kill();
  process.exit();
});
