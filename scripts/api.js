const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ENV_PATH = path.join(__dirname, '..', '.env.json');

function loadEnv() {
  return JSON.parse(fs.readFileSync(ENV_PATH, 'utf-8'));
}

function saveEnv(env) {
  fs.writeFileSync(ENV_PATH, JSON.stringify(env, null, 2), 'utf-8');
}

function getConfig(projectName, environmentName) {
  const env = loadEnv();
  const proj = projectName || env.currentProject;
  const envName = environmentName || env.currentEnvironment;
  if (!proj || !envName) {
    throw new Error('请先配置项目和环境。运行 skill 首次使用引导。');
  }
  const project = env.projects[proj];
  if (!project) {
    throw new Error(`项目 "${proj}" 不存在`);
  }
  const config = project.environments[envName];
  if (!config) {
    throw new Error(`环境 "${envName}" 不存在于项目 "${proj}" 中`);
  }
  return { ...config, _project: proj, _environment: envName };
}

function getProjectByFilePath(filePath) {
  const env = loadEnv();
  if (!env.fileProjectMap) return null;
  // 优先匹配最长路径
  let bestMatch = null;
  let bestLen = 0;
  for (const [dirPath, info] of Object.entries(env.fileProjectMap)) {
    if (filePath.startsWith(dirPath) && dirPath.length > bestLen) {
      bestMatch = info;
      bestLen = dirPath.length;
    }
  }
  return bestMatch;
}

async function request(method, urlPath, body = null, projectName = null, environmentName = null) {
  const config = getConfig(projectName, environmentName);
  const url = `${config.host}${urlPath}`;
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'authorization': config.token,
    'h-menu-id': '-1',
    'content-type': 'application/json;charset=UTF-8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  };

  const reqConfig = { method, url, headers };
  if (body && method !== 'GET') {
    reqConfig.data = body;
  }

  let response;
  try {
    response = await axios(reqConfig);
  } catch (e) {
    if (e.response) {
      if (e.response.status === 401) {
        throw new Error('TOKEN_EXPIRED: Token 已过期，请提供新的 token');
      }
      const data = e.response.data;
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      // 提取平台错误码，便于上层按码处理（见 doc/api.md 错误码表）
      if (data && typeof data === 'object') {
        const code = data.code || data.message || null;
        if (code === 'error.permission.accessTokenExpire') {
          throw new Error('TOKEN_EXPIRED: Token 已过期，请提供新的 token');
        }
        if (code && typeof code === 'string' && code.startsWith('error.')) {
          throw new Error(`API_ERROR[${code}]: ${text}`);
        }
      }
      throw new Error(`API 请求失败 (${e.response.status}): ${text}`);
    }
    throw e;
  }
  // 响应体 failed: true 也表示错误（HTTP 200 但业务失败）
  if (response.data && typeof response.data === 'object' && response.data.failed === true) {
    const code = response.data.code || response.data.message || null;
    if (code === 'error.permission.accessTokenExpire') {
      throw new Error('TOKEN_EXPIRED: Token 已过期，请提供新的 token');
    }
    if (code && typeof code === 'string' && code.startsWith('error.')) {
      throw new Error(`API_ERROR[${code}]: ${JSON.stringify(response.data)}`);
    }
    throw new Error(`API 请求失败 (failed: true): ${JSON.stringify(response.data)}`);
  }
  if (response.status === 204) {
    return { success: true };
  }
  return response.data;
}

async function getPromptList(params = {}) {
  const projectName = params.project || null;
  const environmentName = params.environment || null;
  const config = getConfig(projectName, environmentName);
  const tenantId = params.tenantId || config.tenantId || 0;
  const page = params.page || 0;
  const size = params.size !== undefined ? params.size : 10;
  const promptKey = params.promptKey || '';
  const promptCode = params.promptCode || '';
  const description = params.description || '';
  const keyword = params.keyword || '';

  let query = `?page=${page}&size=${size}&tenantId=${tenantId}`;
  if (promptKey) query += `&promptKey=${encodeURIComponent(promptKey)}`;
  if (promptCode) query += `&promptCode=${encodeURIComponent(promptCode)}`;
  if (description) query += `&description=${encodeURIComponent(description)}`;
  if (keyword) query += `&keyword=${encodeURIComponent(keyword)}`;

  return request('GET', `/hpfm/v1/prompts/page-list${query}`, null, projectName, environmentName);
}

async function getPromptDetail(promptKey, promptCode, lang = 'zh_CN', projectName = null, environmentName = null) {
  const config = getConfig(projectName, environmentName);
  const tenantId = config.tenantId || 0;
  const query = `?lang=${lang}&promptCode=${encodeURIComponent(promptCode)}&promptKey=${encodeURIComponent(promptKey)}&tenantId=${tenantId}`;
  return request('GET', `/hpfm/v1/prompts/detail${query}`, null, projectName, environmentName);
}

async function updatePrompt(data, projectName = null, environmentName = null) {
  return request('PUT', '/hpfm/v1/prompts/update', data, projectName, environmentName);
}

async function insertPrompt(data, projectName = null, environmentName = null) {
  return request('POST', '/hpfm/v1/prompts/insert', data, projectName, environmentName);
}

async function deletePrompt(data, projectName = null, environmentName = null) {
  return request('DELETE', '/hpfm/v1/prompts/remove', data, projectName, environmentName);
}

async function refreshCache(data = [], projectName = null, environmentName = null) {
  return request('POST', '/hpfm/v1/prompts/refresh/cache', data, projectName, environmentName);
}

async function getUserSelf(projectName = null, environmentName = null) {
  return request('GET', '/iam/hzero/v1/users/self', null, projectName, environmentName);
}

async function exportPrompts(params = {}) {
  const projectName = params.project || null;
  const environmentName = params.environment || null;
  const config = getConfig(projectName, environmentName);
  const tenantId = params.tenantId || config.tenantId || 0;
  let query = `?tenantId=${tenantId}`;
  if (params.promptKey) query += `&promptKey=${encodeURIComponent(params.promptKey)}`;
  return request('GET', `/hpfm/v1/prompts/prompt-export${query}`, null, projectName, environmentName);
}

module.exports = {
  loadEnv,
  saveEnv,
  getConfig,
  getProjectByFilePath,
  getPromptList,
  getPromptDetail,
  updatePrompt,
  insertPrompt,
  deletePrompt,
  refreshCache,
  getUserSelf,
  exportPrompts
};
