const fs = require('fs');

const CSV_HEADERS = [
  '模板代码',
  '代码',
  '描述(中文)',
  '描述(English)',
  '描述(日本語)',
  '描述(繁体中文（中国台湾）)',
  '描述(泰语)',
  '描述(俄罗斯语)',
  '描述(葡萄牙语)',
  '描述(蒙古语)'
];

const CONFIG_KEYS = ['zh_CN', 'en_US', 'ja_JP', 'zh_TW', 'th_TH', 'ru_RU', 'pt_BR', 'mn_MN'];

function escapeCsvField(value) {
  const str = String(value || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function promptsToCsvRows(prompts) {
  return prompts.map(p => {
    const configs = p.promptConfigs || {};
    return [
      p.promptKey || '',
      p.promptCode || '',
      ...CONFIG_KEYS.map(k => configs[k] || '')
    ];
  });
}

function generateCsv(prompts, outputPath) {
  const BOM = '\uFEFF';
  const rows = promptsToCsvRows(prompts);
  const lines = [CSV_HEADERS.join(',')];

  rows.forEach(row => {
    lines.push(row.map(escapeCsvField).join(','));
  });

  fs.writeFileSync(outputPath, BOM + lines.join('\n'), 'utf-8');
  return outputPath;
}

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length < 2) return [];

  return lines.slice(1).map(line => {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    fields.push(current);

    return {
      promptKey: fields[0] || '',
      promptCode: fields[1] || '',
      promptConfigs: {
        zh_CN: fields[2] || '',
        en_US: fields[3] || '',
        ja_JP: fields[4] || '',
        zh_TW: fields[5] || '',
        th_TH: fields[6] || '',
        ru_RU: fields[7] || '',
        pt_BR: fields[8] || '',
        mn_MN: fields[9] || ''
      }
    };
  });
}

module.exports = { generateCsv, parseCsv, CSV_HEADERS };
