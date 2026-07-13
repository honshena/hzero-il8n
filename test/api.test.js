const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { getConfig, getProjectByFilePath } = require('../scripts/api');

const envPath = path.join(__dirname, '..', '.env.json');
let backup = null;
let existed = false;

before(() => {
  existed = fs.existsSync(envPath);
  if (existed) backup = fs.readFileSync(envPath, 'utf-8');
  fs.writeFileSync(envPath, JSON.stringify({
    projects: {
      'hskp-console': { defaultLanguage: 'zh_CN', environments: { dev: { host: 'http://x', token: 'bearer t', tenantId: 0 } } },
      'hskp-special': { defaultLanguage: 'en_US', environments: { test: { host: 'http://y', token: 'bearer t2', tenantId: 5 } } }
    },
    currentProject: 'hskp-console',
    currentEnvironment: 'dev',
    fileProjectMap: {
      'D:\\proj\\console': { project: 'hskp-console', environment: 'dev' },
      'D:\\proj\\console\\special': { project: 'hskp-special', environment: 'test' }
    }
  }), 'utf-8');
});
after(() => {
  if (existed) fs.writeFileSync(envPath, backup, 'utf-8');
  else if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
});

test('getConfig: 返回当前项目环境配置', () => {
  const c = getConfig();
  assert.strictEqual(c.host, 'http://x');
  assert.strictEqual(c.token, 'bearer t');
  assert.strictEqual(c._project, 'hskp-console');
  assert.strictEqual(c._environment, 'dev');
});

test('getConfig: 指定项目与环境', () => {
  const c = getConfig('hskp-special', 'test');
  assert.strictEqual(c.host, 'http://y');
  assert.strictEqual(c.tenantId, 5);
});

test('getConfig: 项目不存在抛错', () => {
  assert.throws(() => getConfig('nope'), /不存在/);
});

test('getProjectByFilePath: 最长路径匹配', () => {
  assert.deepStrictEqual(
    getProjectByFilePath('D:\\proj\\console\\special\\file.js'),
    { project: 'hskp-special', environment: 'test' }
  );
  assert.deepStrictEqual(
    getProjectByFilePath('D:\\proj\\console\\other\\file.js'),
    { project: 'hskp-console', environment: 'dev' }
  );
});

test('getProjectByFilePath: 无匹配返回 null', () => {
  assert.strictEqual(getProjectByFilePath('D:\\other\\file.js'), null);
});
