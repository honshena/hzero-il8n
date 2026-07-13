const https = require('https');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const cachePath = path.join(__dirname, '..', 'cache.json');

function parseRepo(url) {
  const m = String(url || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'hzero-il8n-update-check' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function compareSemver(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

// 强制检查：始终联网，不读不写 cache。手动 /hzero-il8n-update 命令用。
async function checkUpdate(branch = 'master') {
  const repoUrl = pkg.repository && (pkg.repository.url || pkg.repository);
  const repo = parseRepo(repoUrl);
  if (!repo) throw new Error('package.json 缺少 repository 字段或格式无法解析');
  const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}/package.json`;
  const remote = await fetchJson(url);
  const current = pkg.version;
  const latest = remote.version;
  return { current, latest, hasUpdate: compareSemver(current, latest) < 0, remoteUrl: url, branch };
}

// 强制检查：不读 cache（始终联网，不判断今天是否已检查过），但写入 lastCheckDate 标记今日已检查。手动命令用。
async function checkForceUpdate(branch = 'master') {
  const cache = readCache();
  cache.updateCheck = cache.updateCheck || {};
  cache.updateCheck.lastCheckDate = todayStr();
  writeCache(cache);
  return await checkUpdate(branch);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  } catch (e) {
    return { updateCheck: { lastCheckDate: null, skippedVersion: null } };
  }
}

function writeCache(cache) {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
}

// 每日自动检查：cache-first，读写 cache，判断今天是否已检查。仅此函数管理 cache。
async function checkDailyUpdate(branch = 'master') {
  const cache = readCache();
  cache.updateCheck = cache.updateCheck || {};
  const today = todayStr();
  if (cache.updateCheck.lastCheckDate === today) {
    return { action: 'skip-already-checked', reason: '今日已检查过更新' };
  }
  cache.updateCheck.lastCheckDate = today;
  writeCache(cache);
  let result;
  try {
    result = await checkUpdate(branch);
  } catch (e) {
    return { action: 'check-failed', reason: e.message };
  }
  if (result.hasUpdate && result.latest === cache.updateCheck.skippedVersion) {
    return { action: 'skip-skipped-version', ...result, reason: `已跳过版本 ${result.latest}` };
  }
  if (result.hasUpdate) {
    return { action: 'update-available', ...result, reason: `发现新版本 ${result.latest}` };
  }
  return { action: 'up-to-date', ...result, reason: '已是最新版本' };
}

function skipVersion(version) {
  const cache = readCache();
  cache.updateCheck = cache.updateCheck || {};
  cache.updateCheck.skippedVersion = version;
  writeCache(cache);
  return { skipped: version };
}

module.exports = { checkUpdate, checkForceUpdate, checkDailyUpdate, skipVersion, compareSemver, parseRepo, readCache, writeCache };

if (require.main === module) {
  const args = process.argv.slice(2);
  const ok = (r) => { console.log(JSON.stringify(r, null, 2)); process.exit(0); };
  const fail = (e) => { console.error(JSON.stringify({ error: e.message }, null, 2)); process.exit(1); };
  if (args[0] === '--skip') {
    if (!args[1]) fail(new Error('缺少版本号: --skip <version>'));
    ok(skipVersion(args[1]));
  } else if (args[0] === '--daily') {
    // cache-first，每日自动检查用
    checkDailyUpdate(args[1] || 'master').then(ok).catch(fail);
  } else {
    // 默认：强制检查（不读 cache，始终联网，写入 lastCheckDate），手动命令用
    checkForceUpdate(args[0] || 'master').then(ok).catch(fail);
  }
}
