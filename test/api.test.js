const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getConfig, getProjectByFilePath, getUserSelf } = require('../scripts/api');

const envPath = path.join(__dirname, '..', '.env.json');
let backup = null;
let existed = false;
let server = null;
let mockUrl = '';

before(async () => {
  existed = fs.existsSync(envPath);
  if (existed) backup = fs.readFileSync(envPath, 'utf-8');
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 1, name: 'mock-user' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  mockUrl = `http://127.0.0.1:${server.address().port}`;
  fs.writeFileSync(envPath, JSON.stringify({
    projects: {
      mock: { defaultLanguage: 'zh_CN', environments: { dev: { host: mockUrl, token: 'bearer t', tenantId: 0 } } },
      'hskp-special': { defaultLanguage: 'en_US', environments: { test: { host: 'http://y', token: 'bearer t2', tenantId: 5 } } }
    },
    currentProject: 'mock',
    currentEnvironment: 'dev',
    fileProjectMap: {
      'D:\\proj\\console': { project: 'mock', environment: 'dev' },
      'D:\\proj\\console\\special': { project: 'hskp-special', environment: 'test' }
    }
  }), 'utf-8');
});

after(async () => {
  if (existed) fs.writeFileSync(envPath, backup, 'utf-8');
  else if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('getConfig: 返回当前项目环境配置', () => {
  const c = getConfig();
  assert.strictEqual(c.host, mockUrl);
  assert.strictEqual(c.token, 'bearer t');
  assert.strictEqual(c._project, 'mock');
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
    { project: 'mock', environment: 'dev' }
  );
});

test('getProjectByFilePath: 无匹配返回 null', () => {
  assert.strictEqual(getProjectByFilePath('D:\\other\\file.js'), null);
});

test('request 通过 axios 请求并返回数据', async () => {
  const user = await getUserSelf();
  assert.strictEqual(user.id, 1);
  assert.strictEqual(user.name, 'mock-user');
});

test('request: 401 抛 TOKEN_EXPIRED', async () => {
  // 换一个返回 401 的 mock server
  const deny = http.createServer((req, res) => {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'unauthorized' }));
  });
  await new Promise((r) => deny.listen(0, '127.0.0.1', r));
  const denyUrl = `http://127.0.0.1:${deny.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = denyUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    await assert.rejects(() => getUserSelf(), /TOKEN_EXPIRED/);
  } finally {
    // 还原 host
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => deny.close(r));
  }
});
