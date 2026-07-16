const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getConfig, getProjectByFilePath, getUserSelf, insertPrompt, updatePrompt, getPromptByLang, getPromptExact } = require('../scripts/api');

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

test('getConfig: 指定项目与环境返回配置', () => {
  const c = getConfig('mock', 'dev');
  assert.strictEqual(c.host, mockUrl);
  assert.strictEqual(c.token, 'bearer t');
  assert.strictEqual(c._project, 'mock');
  assert.strictEqual(c._environment, 'dev');
});

test('getConfig: 未指定项目/环境抛错（多项目共存，由 AI 按文件路径或询问用户决定）', () => {
  assert.throws(() => getConfig(), /未指定项目\/环境/);
  assert.throws(() => getConfig('mock'), /未指定项目\/环境/);
});

test('getConfig: 指定项目与环境', () => {
  const c = getConfig('hskp-special', 'test');
  assert.strictEqual(c.host, 'http://y');
  assert.strictEqual(c.tenantId, 5);
});

test('getConfig: 项目不存在抛错', () => {
  assert.throws(() => getConfig('nope', 'dev'), /不存在/);
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
  const user = await getUserSelf('mock', 'dev');
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
    await assert.rejects(() => getUserSelf('mock', 'dev'), /TOKEN_EXPIRED/);
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
      () => insertPrompt({ promptKey: 'hsop.common', promptCode: 'test', promptConfigs: { zh_CN: '测试' } }, 'mock', 'dev'),
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
    await assert.rejects(() => getUserSelf('mock', 'dev'), /TOKEN_EXPIRED/);
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
    await assert.rejects(() => getUserSelf('mock', 'dev'), /API_ERROR\[error\.something\]/);
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
    }, 'mock', 'dev');
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
    const result = await getPromptByLang({ promptKey: 'hskp.test', lang: 'zh_CN', project: 'mock', environment: 'dev' });
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
    await getPromptByLang({ promptKey: ['hskp.test', 'hskp.common'], lang: 'en_US', project: 'mock', environment: 'dev' });
    assert.ok(receivedUrl.includes('promptKey=hskp.test%2Chskp.common'));
    assert.ok(receivedUrl.startsWith('/hpfm/v1/0/prompt/en_US?'));
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => srv.close(r));
  }
});

test('getPromptByLang: 无 token 配置时不发送 authorization 头且正常返回', async () => {
  let receivedAuth = '__SENTINEL__';
  const srv = http.createServer((req, res) => {
    receivedAuth = req.headers['authorization'] || null;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ 'hskp.test.hello': '你好' }));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const srvUrl = `http://127.0.0.1:${srv.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  const oldToken = env.projects.mock.environments.dev.token;
  env.projects.mock.environments.dev.host = srvUrl;
  delete env.projects.mock.environments.dev.token;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    const result = await getPromptByLang({ promptKey: 'hskp.test', lang: 'zh_CN', project: 'mock', environment: 'dev' });
    assert.strictEqual(receivedAuth, null, '不应发送 authorization 头');
    assert.deepStrictEqual(result, { 'hskp.test.hello': '你好' });
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    env.projects.mock.environments.dev.token = oldToken;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => srv.close(r));
  }
});

// getPromptExact: 精确过滤模糊查询结果，update/delete 取记录的安全保证
function mockPageListServer(content) {
  return http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ content, totalElements: content.length }));
  });
}

async function withMockHost(fn, content) {
  const srv = mockPageListServer(content);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const srvUrl = `http://127.0.0.1:${srv.address().port}`;
  const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
  env.projects.mock.environments.dev.host = srvUrl;
  fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
  try {
    return await fn();
  } finally {
    env.projects.mock.environments.dev.host = mockUrl;
    fs.writeFileSync(envPath, JSON.stringify(env), 'utf-8');
    await new Promise((r) => srv.close(r));
  }
}

test('getPromptExact: 从模糊结果中精确过滤出唯一记录', async () => {
  // 模拟 page-list 模糊查询 promptKey=1 命中 1/10/11
  const content = [
    { promptId: 'id10', promptKey: 'hskp.10', promptCode: 'hello', objectVersionNumber: 1, _token: 't10' },
    { promptId: 'id1', promptKey: 'hskp.1', promptCode: 'hello', objectVersionNumber: 2, _token: 't1' },
    { promptId: 'id11', promptKey: 'hskp.11', promptCode: 'hello', objectVersionNumber: 3, _token: 't11' },
  ];
  await withMockHost(async () => {
    const r = await getPromptExact({ promptKey: 'hskp.1', promptCode: 'hello', project: 'mock', environment: 'dev' });
    assert.strictEqual(r.promptId, 'id1', '应精确匹配 hskp.1 而非首个 hskp.10');
    assert.strictEqual(r.objectVersionNumber, 2);
  }, content);
});

test('getPromptExact: 同 promptKey 下按 promptCode 精确过滤', async () => {
  const content = [
    { promptId: 'idA', promptKey: 'hskp.test', promptCode: 'hello', objectVersionNumber: 1, _token: 'tA' },
    { promptId: 'idB', promptKey: 'hskp.test', promptCode: 'hello1', objectVersionNumber: 2, _token: 'tB' },
    { promptId: 'idC', promptKey: 'hskp.test', promptCode: 'hello11', objectVersionNumber: 3, _token: 'tC' },
  ];
  await withMockHost(async () => {
    const r = await getPromptExact({ promptKey: 'hskp.test', promptCode: 'hello1', project: 'mock', environment: 'dev' });
    assert.strictEqual(r.promptId, 'idB', '应精确匹配 hello1 而非 hello/hello11');
  }, content);
});

test('getPromptExact: 无精确匹配抛错', async () => {
  const content = [
    { promptId: 'id10', promptKey: 'hskp.10', promptCode: 'hello', objectVersionNumber: 1, _token: 't' },
  ];
  await withMockHost(async () => {
    await assert.rejects(
      () => getPromptExact({ promptKey: 'hskp.1', promptCode: 'hello', project: 'mock', environment: 'dev' }),
      /未找到精确匹配/
    );
  }, content);
});

test('getPromptExact: 多条精确匹配抛错（脏数据保护）', async () => {
  const content = [
    { promptId: 'id1', promptKey: 'hskp.1', promptCode: 'hello', objectVersionNumber: 1, _token: 't1' },
    { promptId: 'id2', promptKey: 'hskp.1', promptCode: 'hello', objectVersionNumber: 2, _token: 't2' },
  ];
  await withMockHost(async () => {
    await assert.rejects(
      () => getPromptExact({ promptKey: 'hskp.1', promptCode: 'hello', project: 'mock', environment: 'dev' }),
      /找到 2 条精确匹配记录/
    );
  }, content);
});

test('getPromptExact: 缺少 promptKey 或 promptCode 抛错', async () => {
  await assert.rejects(() => getPromptExact({ promptCode: 'hello' }), /必须同时传/);
  await assert.rejects(() => getPromptExact({ promptKey: 'hskp.1' }), /必须同时传/);
});
