const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getConfig, getProjectByFilePath, getUserSelf, insertPrompt, updatePrompt, getPromptByLang } = require('../scripts/api');

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

test('request: 平台错误码 error.db.duplicateKey 提取为 API_ERROR', async () => {
  const dup = http.createServer((req, res) => {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ code: 'error.db.duplicateKey', message: 'error.db.duplicateKey' }));
  });
  await new Promise((r) => dup.listen(0, '127.0.0.1', r));
  const dupUrl = `http://127.0.0.1:${dup.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = dupUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    await assert.rejects(
      () => insertPrompt({ promptKey: 'hsop.common', promptCode: 'test', promptConfigs: { zh_CN: '测试' } }),
      /API_ERROR\[error\.db\.duplicateKey\]/
    );
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => dup.close(r));
  }
});

test('request: error.permission.accessTokenExpire 抛 TOKEN_EXPIRED', async () => {
  const expired = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ code: 'error.permission.accessTokenExpire', failed: true, message: 'token expired' }));
  });
  await new Promise((r) => expired.listen(0, '127.0.0.1', r));
  const expiredUrl = `http://127.0.0.1:${expired.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = expiredUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    await assert.rejects(() => getUserSelf(), /TOKEN_EXPIRED/);
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => expired.close(r));
  }
});

test('request: 响应 failed:true 视为错误', async () => {
  const failedSrv = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ failed: true, code: 'error.something', message: 'something failed' }));
  });
  await new Promise((r) => failedSrv.listen(0, '127.0.0.1', r));
  const failedUrl = `http://127.0.0.1:${failedSrv.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = failedUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    await assert.rejects(() => getUserSelf(), /API_ERROR\[error\.something\]/);
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => failedSrv.close(r));
  }
});

test('updatePrompt: 缺失必填字段抛错', async () => {
  await assert.rejects(
    () => updatePrompt({
      promptId: 'pid',
      objectVersionNumber: 1,
      _token: 'tk',
      promptKey: 'hskp.test',
      promptCode: 'hello',
      promptConfigs: { zh_CN: '你好', en_US: 'Hello' },
      // lang/langDescription/tenantId 缺失
    }),
    /缺失必填字段.*lang/
  );
});

test('updatePrompt: 完整参数正确透传', async () => {
  let receivedBody = null;
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      receivedBody = JSON.parse(body);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(receivedBody));
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const srvUrl = `http://127.0.0.1:${srv.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = srvUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    await updatePrompt({
      promptId: 'pid',
      objectVersionNumber: 1,
      _token: 'tk',
      promptKey: 'hskp.test',
      promptCode: 'hello',
      lang: 'zh_CN',
      langDescription: '中文(简体)',
      tenantId: 0,
      promptConfigs: { zh_CN: '你好', en_US: 'Hello' },
    });
    assert.strictEqual(receivedBody.lang, 'zh_CN');
    assert.strictEqual(receivedBody.langDescription, '中文(简体)');
    assert.strictEqual(receivedBody.tenantId, 0);
    assert.deepStrictEqual(receivedBody.promptConfigs, { zh_CN: '你好', en_US: 'Hello' });
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => srv.close(r));
  }
});

test('getPromptByLang: 路径含 tenantId 和 lang，promptKey 作为查询参数', async () => {
  let receivedUrl = null;
  const srv = http.createServer((req, res) => {
    receivedUrl = req.url;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ 'hskp.test.hello': '你好' }));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const srvUrl = `http://127.0.0.1:${srv.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = srvUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    const result = await getPromptByLang({ promptKey: 'hskp.test', lang: 'zh_CN' });
    // 路径格式: /hpfm/v1/{tenantId}/prompt/{lang}?promptKey=...
    assert.ok(receivedUrl.startsWith('/hpfm/v1/0/prompt/zh_CN?promptKey='));
    assert.ok(receivedUrl.includes('promptKey=hskp.test'));
    assert.deepStrictEqual(result, { 'hskp.test.hello': '你好' });
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => srv.close(r));
  }
});

test('getPromptByLang: 数组形式 promptKey 拼接为逗号分隔', async () => {
  let receivedUrl = null;
  const srv = http.createServer((req, res) => {
    receivedUrl = req.url;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({}));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const srvUrl = `http://127.0.0.1:${srv.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = srvUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    await getPromptByLang({ promptKey: ['hskp.test', 'hskp.common'], lang: 'en_US' });
    assert.ok(receivedUrl.includes('promptKey=hskp.test%2Chskp.common'));
    assert.ok(receivedUrl.startsWith('/hpfm/v1/0/prompt/en_US?'));
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => srv.close(r));
  }
});
