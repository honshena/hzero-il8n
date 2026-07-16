const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateCsv, parseCsv, CSV_HEADERS } = require('../scripts/csv');

function tmpFile(name) {
  return path.join(os.tmpdir(), `hzero-i18n-${name}-${process.pid}.csv`);
}

test('generateCsv + parseCsv 往返还原（含逗号/引号）', () => {
  const prompts = [
    { promptKey: 'hsop.common', promptCode: 'name', promptConfigs: { zh_CN: '名称', en_US: 'Name' } },
    { promptKey: 'hsop.openplatform', promptCode: 'view.docker', promptConfigs: { zh_CN: '查看docker,命令', en_US: 'View "docker" cmd' } },
  ];
  const file = tmpFile('roundtrip');
  try {
    generateCsv(prompts, file);
    const parsed = parseCsv(file);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].promptKey, 'hsop.common');
    assert.strictEqual(parsed[0].promptCode, 'name');
    assert.strictEqual(parsed[0].promptConfigs.zh_CN, '名称');
    assert.strictEqual(parsed[0].promptConfigs.en_US, 'Name');
    assert.strictEqual(parsed[1].promptConfigs.zh_CN, '查看docker,命令');
    assert.strictEqual(parsed[1].promptConfigs.en_US, 'View "docker" cmd');
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

test('parseCsv: 仅表头返回空数组', () => {
  const file = tmpFile('empty');
  try {
    fs.writeFileSync(file, '\uFEFF' + CSV_HEADERS.join(','), 'utf-8');
    assert.deepStrictEqual(parseCsv(file), []);
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});
