const fs = require('fs');
const path = require('path');
const api = require('./api');

function generateTaskId(name) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `task-${name}-${y}-${m}-${d}-${h}-${min}-${s}`;
}

function createTaskDir(taskId) {
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const taskDir = path.join(logsDir, taskId);
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }
  return taskDir;
}

function writeDataTaskDir(taskDir, filename, data) {
  const filePath = path.join(taskDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

function readDataTaskDir(taskDir, filename) {
  const filePath = path.join(taskDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function validateToken() {
  try {
    const user = await api.getUserSelf();
    return { valid: true, user };
  } catch (e) {
    if (e.message && e.message.includes('TOKEN_EXPIRED')) {
      return { valid: false, reason: 'token 已过期' };
    }
    return { valid: false, reason: e.message };
  }
}

function generatePromptCode(viewName, featureName, action, extras = []) {
  const toCamelCase = (str) => {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
              .replace(/^[A-Z]/, c => c.toLowerCase());
  };

  const segments = [];
  if (viewName) segments.push(toCamelCase(viewName));
  if (featureName) segments.push(featureName);
  if (action) segments.push(action);
  extras.forEach(e => segments.push(e));

  const code = segments.join('.');
  if (segments.length > 5) {
    console.warn(`promptCode 段数超过5段: ${code}`);
  }
  return code;
}

function parseIntlGetCalls(content) {
  const regex = /intl\.get\(['"`]([^'"`]+)['"`]\)/g;
  const keys = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function parseFullIntlCode(key) {
  const parts = key.split('.');
  if (parts.length < 2) {
    return { promptKey: null, promptCode: null };
  }
  const promptKey = parts.slice(0, 2).join('.');
  const promptCode = parts.slice(2).join('.');
  return { promptKey, promptCode };
}

function formatDisplay(data) {
  return JSON.stringify(data, null, 2);
}

module.exports = {
  generateTaskId,
  createTaskDir,
  writeDataTaskDir,
  readDataTaskDir,
  validateToken,
  generatePromptCode,
  parseIntlGetCalls,
  parseFullIntlCode,
  formatDisplay
};
