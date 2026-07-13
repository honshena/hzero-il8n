const test = require('node:test');
const assert = require('node:assert');
const { generatePromptCode, parseIntlGetCalls, parseFullIntlCode, generateTaskId, formatDisplay } = require('../scripts/utils');

test('generatePromptCode: camelCase + 点分拼接', () => {
  assert.strictEqual(generatePromptCode('DataManage', 'button', 'create'), 'dataManage.button.create');
  assert.strictEqual(generatePromptCode('data-manage', 'button', 'create'), 'dataManage.button.create');
  assert.strictEqual(generatePromptCode('DataManage'), 'dataManage');
  assert.strictEqual(generatePromptCode('DataManage', 'modal', 'import', ['title']), 'dataManage.modal.import.title');
});

test('generatePromptCode: 空参返回空串', () => {
  assert.strictEqual(generatePromptCode(), '');
});

test('parseIntlGetCalls: 提取 key', () => {
  const code = "intl.get('hsop.common.name').d('名称');\nintl.get(\"hsop.common.operate\").d('操作');";
  assert.deepStrictEqual(parseIntlGetCalls(code), ['hsop.common.name', 'hsop.common.operate']);
  assert.deepStrictEqual(parseIntlGetCalls(''), []);
});

test('parseFullIntlCode: 拆分 promptKey/promptCode', () => {
  assert.deepStrictEqual(parseFullIntlCode('hsop.common.name'), { promptKey: 'hsop.common', promptCode: 'name' });
  assert.deepStrictEqual(parseFullIntlCode('hsop.openplatform.dashboard.pick.title'), { promptKey: 'hsop.openplatform', promptCode: 'dashboard.pick.title' });
  assert.deepStrictEqual(parseFullIntlCode('onlyone'), { promptKey: null, promptCode: null });
});

test('generateTaskId: 格式 task-{name}-{YYYY-MM-DD-HH-MM-SS}', () => {
  assert.match(generateTaskId('check-domain'), /^task-check-domain-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);
});

test('formatDisplay: 美化 JSON', () => {
  assert.strictEqual(formatDisplay({ a: 1 }), '{\n  "a": 1\n}');
});
