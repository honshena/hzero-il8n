const XLSX = require('xlsx');
const path = require('path');

const COLUMNS = [
  { header: '模板代码', key: 'promptKey', width: 20 },
  { header: '代码', key: 'promptCode', width: 40 },
  { header: '描述(中文)', key: 'zh_CN', width: 30 },
  { header: '描述(English)', key: 'en_US', width: 30 },
  { header: '描述(日本語)', key: 'ja_JP', width: 30 },
  { header: '描述(繁体中文（中国台湾）)', key: 'zh_TW', width: 30 },
  { header: '描述(泰语)', key: 'th_TH', width: 20 },
  { header: '描述(俄罗斯语)', key: 'ru_RU', width: 20 },
  { header: '描述(葡萄牙语)', key: 'pt_BR', width: 20 },
  { header: '描述(蒙古语)', key: 'mn_MN', width: 20 }
];

function promptsToRows(prompts) {
  return prompts.map(p => {
    const configs = p.promptConfigs || {};
    return {
      promptKey: p.promptKey || '',
      promptCode: p.promptCode || '',
      zh_CN: configs.zh_CN || '',
      en_US: configs.en_US || '',
      ja_JP: configs.ja_JP || '',
      zh_TW: configs.zh_TW || '',
      th_TH: configs.th_TH || '',
      ru_RU: configs.ru_RU || '',
      pt_BR: configs.pt_BR || '',
      mn_MN: configs.mn_MN || ''
    };
  });
}

function generateExcel(prompts, outputPath, sheetName = '多语言导出') {
  const rows = promptsToRows(prompts);
  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS.map(c => c.key) });

  ws['!cols'] = COLUMNS.map(c => ({ wch: c.width }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, outputPath);
  return outputPath;
}

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws);

  return data.map(row => ({
    promptKey: row['模板代码'] || '',
    promptCode: row['代码'] || '',
    promptConfigs: {
      zh_CN: row['描述(中文)'] || '',
      en_US: row['描述(English)'] || '',
      ja_JP: row['描述(日本語)'] || '',
      zh_TW: row['描述(繁体中文（中国台湾）)'] || '',
      th_TH: row['描述(泰语)'] || '',
      ru_RU: row['描述(俄罗斯语)'] || '',
      pt_BR: row['描述(葡萄牙语)'] || '',
      mn_MN: row['描述(蒙古语)'] || ''
    }
  }));
}

module.exports = { generateExcel, parseExcel, COLUMNS };
