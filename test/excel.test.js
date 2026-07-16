const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateExcel, parseExcel } = require('../scripts/excel');

function tmpFile(name) {
  return path.join(os.tmpdir(), `hzero-front-i18n-${name}-${process.pid}.xlsx`);
}

test('generateExcel + parseExcel 往返还原字段', () => {
  const prompts = [
    { promptKey: 'hsop.common', promptCode: 'name', promptConfigs: { zh_CN: '名称', en_US: 'Name', ja_JP: '名前' } },
    { promptKey: 'hsop.openplatform', promptCode: 'operate', promptConfigs: { zh_CN: '操作', en_US: 'Operate' } },
  ];
  const file = tmpFile('roundtrip');
  try {
    generateExcel(prompts, file);
    const parsed = parseExcel(file);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].promptKey, 'hsop.common');
    assert.strictEqual(parsed[0].promptCode, 'name');
    assert.strictEqual(parsed[0].promptConfigs.zh_CN, '名称');
    assert.strictEqual(parsed[0].promptConfigs.en_US, 'Name');
    assert.strictEqual(parsed[0].promptConfigs.ja_JP, '名前');
    assert.strictEqual(parsed[1].promptKey, 'hsop.openplatform');
    assert.strictEqual(parsed[1].promptCode, 'operate');
    assert.strictEqual(parsed[1].promptConfigs.zh_CN, '操作');
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});
