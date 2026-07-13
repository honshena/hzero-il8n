const { writeDataTaskDir } = require('../../scripts/utils');

const taskDir = __dirname;
const data = {
  action: 'check',
  files: [
    'D:\\Mine\\Projects\\Work\\hskp-front-console\\packages\\hskp-front-console-platform\\src\\pages\\DomainManagement\\index.tsx',
    'D:\\Mine\\Projects\\Work\\hskp-front-console\\packages\\hskp-front-console-platform\\src\\pages\\DomainManagement\\stores.ts'
  ],
  platformCheck: {
    status: 'failed',
    reason: '无法连接到平台服务器 (http://172.23.16.195:8080)，无法验证 key 是否已注册'
  },
  issues: [
    {
      id: 1,
      file: 'index.tsx',
      line: 251,
      type: 'hardcoded_chinese',
      severity: 'error',
      description: 'Tab 标题使用了硬编码中文字符串，未使用 intl.get() 进行国际化',
      current: "tab={'系统域名'}",
      suggestion: "tab={intl.get('hskp.platform.domainManagement.view.title.systemDomain').d('System Domain Name')}",
      note: '需要在平台上新增对应的多语言 key'
    },
    {
      id: 2,
      file: 'stores.ts',
      line: 105,
      type: 'hardcoded_english',
      severity: 'error',
      description: 'queryFields 中 enterpriseCode 的 label 使用了硬编码英文字符串，未使用 intl.get()',
      current: "label: 'Enterprise Code'",
      suggestion: "label: intl.get('hskp.common.enterpriseCode').d('Enterprise Code')"
    },
    {
      id: 3,
      file: 'index.tsx',
      line: 240,
      type: 'commented_key',
      severity: 'info',
      description: '注释代码中引用了 hskp.domainManagement.model.title.productDomain，该 key 在活跃代码中未使用',
      current: "intl.get('hskp.domainManagement.model.title.productDomain').d('产品域名')",
      suggestion: '如果该功能不再使用，建议清理注释代码'
    }
  ],
  keysUsed: [
    'hskp.common.copySuccess',
    'hskp.common.detail',
    'hskp.common.systemEnvName',
    'hskp.common.systemEnvCode',
    'hskp.platform.domainManagement.model.title.systemDomain',
    'hskp.common.productName',
    'hskp.common.sysEnvDomain.status',
    'hskp.common.systemCustomDomain',
    'hskp.common.customSysDomain.status',
    'hskp.common.enterpriseName',
    'hskp.common.tabs.enterpriseDomain',
    'hskp.common.companyDomain.enable',
    'hskp.common.enterpriseCustomDomain',
    'hskp.common.companyCustomDomain.enable',
    'hskp.common.enterpriseEnvDomain',
    'hskp.common.companyEnvDomain.enable',
    'hskp.common.enterpriseCode',
    'hskp.common.status'
  ],
  summary: {
    totalKeys: 19,
    activeKeys: 18,
    commentedKeys: 1,
    hardcodedStrings: 2,
    errors: 2,
    warnings: 0,
    info: 1
  }
};

writeDataTaskDir(taskDir, 'data.json', data);
console.log('data.json created successfully');
