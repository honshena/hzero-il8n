const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { compareSemver, parseRepo, checkDailyUpdate, skipVersion, readCache, writeCache } = require('../scripts/update');

const cachePath = path.join(__dirname, '..', 'cache.json');
let backup = null;
let existed = false;

before(() => {
  existed = fs.existsSync(cachePath);
  if (existed) backup = fs.readFileSync(cachePath, 'utf-8');
});
after(() => {
  if (existed) fs.writeFileSync(cachePath, backup, 'utf-8');
  else if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
});

test('compareSemver: 比较器返回 负/零/正', () => {
  assert.strictEqual(compareSemver('1.0.0', '1.0.0'), 0);
  assert.ok(compareSemver('1.0.0', '1.2.0') < 0);
  assert.ok(compareSemver('2.0.0', '1.9.9') > 0);
  assert.ok(compareSemver('1.0.0', '1.0.1') < 0);
  assert.ok(compareSemver('1.10.0', '1.9.0') > 0);
});

test('parseRepo: 解析 GitHub URL', () => {
  assert.deepStrictEqual(parseRepo('https://github.com/honshena/hzero-i18n.git'), { owner: 'honshena', repo: 'hzero-i18n' });
  assert.deepStrictEqual(parseRepo('git@github.com:owner/repo.git'), { owner: 'owner', repo: 'repo' });
  assert.strictEqual(parseRepo('https://gitlab.com/x/y'), null);
  assert.strictEqual(parseRepo(null), null);
});

test('checkDailyUpdate: 今日已检查 -> skip-already-checked（不联网）', async () => {
  const today = new Date().toISOString().slice(0, 10);
  writeCache({ updateCheck: { lastCheckDate: today, skippedVersion: null } });
  const r = await checkDailyUpdate();
  assert.strictEqual(r.action, 'skip-already-checked');
});

test('skipVersion: 记录跳过版本', () => {
  writeCache({ updateCheck: { lastCheckDate: null, skippedVersion: null } });
  const r = skipVersion('1.2.0');
  assert.strictEqual(r.skipped, '1.2.0');
  assert.strictEqual(readCache().updateCheck.skippedVersion, '1.2.0');
});
