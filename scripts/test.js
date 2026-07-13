const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REQUIRED_MAJOR = 18; // node:test 需要 Node >= 18

function parseVer(v) {
  const m = String(v).match(/v?(\d+)\.(\d+)\.(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
}
function cmpVer(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
function gteMajor(arr, major) { return arr[0] >= major; }

// 在 nvm 安装目录查找 >= minMajor 的 node，不切换默认 node
function findNvmNode(minMajor) {
  const roots = [];
  if (process.env.NVM_HOME) roots.push(process.env.NVM_HOME);
  if (process.env.NVM_SYMLINK) roots.push(path.dirname(process.env.NVM_SYMLINK));
  roots.push(path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'nvm'));
  roots.push(path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'nvm'));
  const seen = new Set();
  const candidates = [];
  for (const root of roots) {
    if (!root || seen.has(root) || !fs.existsSync(root)) continue;
    seen.add(root);
    let entries = [];
    try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (e) { continue; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const ver = parseVer(e.name.replace(/^v/, ''));
      if (ver[0] === 0) continue;
      const exe = path.join(root, e.name, process.platform === 'win32' ? 'node.exe' : 'bin/node');
      if (fs.existsSync(exe) && gteMajor(ver, minMajor)) candidates.push({ exe, ver });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => cmpVer(b.ver, a.ver)); // 最高版本优先
  return candidates[0].exe;
}

function selectNode() {
  const cur = parseVer(process.versions.node);
  if (gteMajor(cur, REQUIRED_MAJOR)) return process.execPath;
  const nvmNode = findNvmNode(REQUIRED_MAJOR);
  if (nvmNode) return nvmNode;
  throw new Error(`未找到 Node >= ${REQUIRED_MAJOR}（当前 ${process.versions.node}）。请用 nvm install ${REQUIRED_MAJOR} 安装后重试，本脚本不会切换默认 node。`);
}

const nodeExe = selectNode();
const testDir = path.join(__dirname, '..', 'test');
const files = fs.existsSync(testDir)
  ? fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js')).map((f) => path.join(testDir, f)).sort()
  : [];
if (!files.length) {
  console.error('未找到测试文件 (scripts/test/*.test.js)');
  process.exit(1);
}
console.log(`使用 Node: ${nodeExe} (默认 node: ${process.versions.node}，未切换)`);
const r = spawnSync(nodeExe, ['--test', ...files], { stdio: 'inherit' });
process.exit(r.status || 0);
