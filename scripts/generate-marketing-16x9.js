const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const outDir = path.join(process.cwd(), 'marketing_4k_promo');
const pngDir = path.join(outDir, 'png');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(pngDir, { recursive: true });

const theme = {
  bg: '#FBFCFF',
  panel: '#FFFFFF',
  panelBlue: '#F1F6FF',
  line: '#D6E2F4',
  lineStrong: '#1E5EFF',
  title: '#10264A',
  body: '#445879',
  muted: '#A7B3C8',
  blue: '#1E5EFF',
  blueSoft: '#EAF1FF',
  grid: '#EAF0F8',
  headerFont: '腾讯体, PingFang SC, Microsoft YaHei, sans-serif',
  bodyFont: 'PingFang SC, Microsoft YaHei, sans-serif',
};

function dataUri(relPath) {
  const abs = path.join(process.cwd(), relPath);
  const ext = path.extname(relPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

const assets = {
  logo: dataUri('已有资料/Logo-128.png'),
  home: dataUri('已有资料/界面截图/初始化状态.png'),
  imageFill: dataUri('已有资料/界面截图/图片填充.png'),
  aiField: dataUri('已有资料/界面截图/新建 AI 字段 - 已输入提示词.png'),
  search: dataUri('已有资料/界面截图/搜索关键词且有结果.png'),
  editName: dataUri('已有资料/界面截图/编辑 - 人员姓名.png'),
  addAI: dataUri('已有资料/界面截图/新建 AI 字段 - 点击确认.png'),
};

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lines(x, y, items, opts = {}) {
  const {
    size = 34,
    color = theme.body,
    weight = 500,
    family = theme.bodyFont,
    lineHeight = 1.45,
    italic = false,
  } = opts;
  const dy = Math.round(size * lineHeight);
  const tspans = items
    .map((item, i) => `<tspan x="${x}" y="${y + i * dy}">${esc(item)}</tspan>`)
    .join('');
  return `<text fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" font-style="${italic ? 'italic' : 'normal'}">${tspans}</text>`;
}

function header(cn, en) {
  return `
    <text x="120" y="152" fill="${theme.title}" font-family="${theme.headerFont}" font-size="86" font-weight="700">${esc(cn)}.</text>
    <line x1="820" y1="74" x2="820" y2="164" stroke="${theme.line}" stroke-width="6"/>
    <text x="862" y="152" fill="${theme.muted}" font-family="${theme.headerFont}" font-size="74" font-style="italic" font-weight="600">${esc(en)}</text>
    <rect x="96" y="238" width="3648" height="16" fill="${theme.lineStrong}"/>
  `;
}

function base(content) {
  return `
  <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1.1" fill="${theme.grid}"/>
      </pattern>
      <filter id="soft-shadow" x="0" y="0" width="3840" height="2160" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0"/>
        <feGaussianBlur in="SourceAlpha" stdDeviation="18"/>
        <feOffset dy="8"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.12 0 0 0 0 0.25 0 0 0 0.08 0"/>
        <feBlend in2="SourceGraphic" mode="normal"/>
      </filter>
    </defs>
    <rect width="3840" height="2160" fill="${theme.bg}"/>
    <rect width="3840" height="2160" fill="url(#dot-grid)"/>
    ${content}
  </svg>`;
}

function panel(x, y, w, h, body) {
  return `
    <g filter="url(#soft-shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.panel}" stroke="${theme.line}" stroke-width="2"/>
      ${body}
    </g>
  `;
}

function quote(x, y, w, h, text) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${theme.panelBlue}" stroke="${theme.line}" stroke-width="2"/>
    ${lines(x + 48, y + 78, [text], {
      size: 48,
      color: theme.blue,
      weight: 700,
      family: theme.headerFont,
      lineHeight: 1.25,
      italic: true,
    })}
  `;
}

function shotCard(x, y, w, h, title, imageHref) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${theme.panel}" stroke="${theme.line}" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="${w}" height="14" fill="${theme.lineStrong}"/>
    <text x="${x + 34}" y="${y + 74}" fill="${theme.title}" font-family="${theme.headerFont}" font-size="42" font-weight="700">${esc(title)}</text>
    <rect x="${x + 28}" y="${y + 104}" width="${w - 56}" height="${h - 136}" rx="24" fill="${theme.panelBlue}" stroke="${theme.line}" stroke-width="2"/>
    <image x="${x + 52}" y="${y + 128}" width="${w - 104}" height="${h - 184}" preserveAspectRatio="xMidYMid meet" href="${imageHref}"/>
  `;
}

function featureCard(x, y, w, h, title, body) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="18" fill="${theme.lineStrong}"/>
    <rect x="${x}" y="${y + 18}" width="${w}" height="${h - 18}" fill="${theme.panel}" stroke="${theme.line}" stroke-width="2"/>
    <text x="${x + 42}" y="${y + 116}" fill="${theme.blue}" font-family="${theme.headerFont}" font-size="54" font-weight="700">${esc(title)}</text>
    ${lines(x + 42, y + 198, body, {
      size: 40,
      color: theme.title,
      weight: 600,
      family: theme.bodyFont,
      lineHeight: 1.48,
    })}
  `;
}

function arrow(x, y) {
  return `
    <path d="M${x} ${y}h60" stroke="${theme.body}" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x + 38} ${y - 24}l30 24-30 24" fill="none" stroke="${theme.body}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

const slides = {
  '01-cover.svg': base(`
    ${header('Data Fill 插件价值', 'Plugin Value')}
    ${panel(96, 280, 3648, 1740, `
      <image x="164" y="382" width="82" height="82" href="${assets.logo}"/>
      <text x="276" y="438" fill="${theme.title}" font-family="${theme.headerFont}" font-size="54" font-weight="700">Data Fill</text>
      <text x="276" y="510" fill="${theme.blue}" font-family="${theme.bodyFont}" font-size="40" font-weight="600">Figma 字段化数据填充插件</text>
      ${lines(164, 720, ['把 Figma 里的补数据时间', '压缩到一次点击'], {
        size: 124,
        color: theme.title,
        weight: 700,
        family: theme.headerFont,
        lineHeight: 1.14,
      })}
      ${quote(164, 930, 1620, 118, '“ 文本、图片、AI 填充统一到一个插件里，常用字段还能长期复用 ”')}
      ${lines(164, 1184, ['适合经常做原型、列表、表单、卡片、详情页的设计师', '不再反复找数据，也不用在多个流程间来回切换'], {
        size: 50,
        color: theme.body,
        weight: 500,
        family: theme.bodyFont,
        lineHeight: 1.55,
      })}
      <rect x="164" y="1450" width="280" height="84" rx="16" fill="${theme.lineStrong}"/>
      <text x="230" y="1508" fill="#FFFFFF" font-family="${theme.headerFont}" font-size="42" font-weight="700">点击即填充</text>
      <rect x="474" y="1450" width="320" height="84" rx="16" fill="${theme.panelBlue}" stroke="${theme.lineStrong}" stroke-width="2"/>
      <text x="548" y="1508" fill="${theme.blue}" font-family="${theme.headerFont}" font-size="42" font-weight="700">字段可复用</text>
      <rect x="824" y="1450" width="300" height="84" rx="16" fill="${theme.panelBlue}" stroke="${theme.lineStrong}" stroke-width="2"/>
      <text x="906" y="1508" fill="${theme.blue}" font-family="${theme.headerFont}" font-size="42" font-weight="700">AI 一体化</text>
      ${shotCard(2180, 360, 1280, 1450, '插件主界面', assets.home)}
    `)}
  `),

  '02-pain.svg': base(`
    ${header('用户痛点', 'Pain Points')}
    ${panel(96, 280, 3648, 1740, `
      ${quote(164, 356, 3512, 112, '“ 你浪费的往往不是设计时间，而是补数据时间 ”')}
      ${featureCard(164, 618, 820, 620, '痛点一：重复补数据', ['做列表页时，要反复补', '姓名、手机号、邮箱、状态'])}
      ${featureCard(1088, 618, 820, 620, '痛点二：视觉内容也要补', ['做卡片和详情页时，要补', '头像、封面图、标题、金额'])}
      ${featureCard(2012, 618, 820, 620, '痛点三：流程分散', ['文本、图片、AI 填充', '各走一套流程，来回切换很烦'])}
      ${featureCard(2936, 618, 740, 620, '痛点四：临门返工', ['汇报前临时补数据', '最容易重复、出错、返工'])}
      <text x="164" y="1396" fill="${theme.title}" font-family="${theme.headerFont}" font-size="64" font-weight="700">这些问题本质上都不是“不会做”，而是“做得太重复”</text>
      ${lines(164, 1494, ['如果补数据这件事仍然靠手工、靠随机、靠临时拼凑，设计稿越真实，重复劳动就越多。'], {
        size: 44,
        color: theme.body,
        weight: 500,
        family: theme.bodyFont,
        lineHeight: 1.5,
      })}
      ${shotCard(2500, 1360, 1176, 500, '典型插件界面场景', assets.search)}
    `)}
  `),

  '03-solution.svg': base(`
    ${header('解决方案', 'Solution')}
    ${panel(96, 280, 3648, 1740, `
      <text x="164" y="470" fill="${theme.title}" font-family="${theme.headerFont}" font-size="110" font-weight="700">Data Fill 不是随机工具，</text>
      <text x="164" y="600" fill="${theme.title}" font-family="${theme.headerFont}" font-size="110" font-weight="700">而是一套字段系统</text>
      ${quote(164, 694, 1700, 112, '“ 把原本分散的数据填充动作，统一成可保存、可复用、可管理的字段工作流 ”')}
      ${featureCard(164, 920, 860, 540, '字段是什么', ['字段不是一次结果，而是一条可复用规则', '它可以定义内容类型、生成方式、显示逻辑'])}
      ${arrow(1088, 1186)}
      ${featureCard(1210, 920, 860, 540, '它怎么工作', ['选中图层后点击字段，立即执行填充', '常用字段可以搜索、排序、编辑、持续沉淀'])}
      ${arrow(2134, 1186)}
      ${featureCard(2256, 920, 1420, 540, '它解决了什么', ['文本、图片、AI 都进入同一套使用方式', '你不用每次重找数据，也不用来回切工具', '越用越顺手，越用越像自己的工作流资产'])}
      ${shotCard(2556, 320, 1120, 500, '统一字段列表', assets.editName)}
    `)}
  `),

  '04-features.svg': base(`
    ${header('核心能力', 'Key Features')}
    ${panel(96, 280, 3648, 1740, `
      ${quote(164, 356, 3512, 112, '“ 真正值得安装的，不是功能很多，而是把数据填充这件事做完整了 ”')}
      ${featureCard(164, 618, 1640, 430, '文本字段', ['批量填充姓名、日期、数值、标题', '随机、顺序、自增、格式配置都能纳入规则'])}
      ${featureCard(1876, 618, 1800, 430, '图片字段', ['直接替换头像、Banner、背景图', '适合卡片、封面、个人资料等真实化场景'])}
      ${featureCard(164, 1124, 1640, 430, 'AI 字段', ['把提示词保存成字段，后续继续复用', '适合说明文案、内容占位、高频生成场景'])}
      ${featureCard(1876, 1124, 1800, 430, '字段管理', ['支持搜索、排序、编辑、文件夹组织', '字段可以长期沉淀，适合个人与团队积累'])}
      ${shotCard(2440, 1466, 1236, 430, 'AI 字段创建示意', assets.addAI)}
    `)}
  `),

  '05-workflow.svg': base(`
    ${header('使用方式', 'Workflow')}
    ${panel(96, 280, 3648, 1740, `
      ${quote(164, 356, 3512, 112, '“ 没有复杂学习成本：先选图层，再点字段，填充动作立即完成 ”')}
      ${shotCard(164, 610, 980, 980, '第 1 步：选中要填充的图层', assets.home)}
      ${arrow(1196, 1100)}
      ${shotCard(1310, 610, 980, 980, '第 2 步：点击字段立即执行', assets.imageFill)}
      ${arrow(2342, 1100)}
      ${shotCard(2456, 610, 1220, 980, '第 3 步：继续搜索、编辑和复用字段', assets.aiField)}
      ${quote(164, 1662, 3512, 110, '“ 选区确认后，字段即可批量填充；常用字段还能继续搜索、编辑和复用 ”')}
    `)}
  `),

  '06-cta.svg': base(`
    ${header('适合谁', 'Who It Is For')}
    ${panel(96, 280, 3648, 1740, `
      <text x="164" y="486" fill="${theme.title}" font-family="${theme.headerFont}" font-size="106" font-weight="700">如果你也总在 Figma 里补假数据，</text>
      <text x="164" y="608" fill="${theme.title}" font-family="${theme.headerFont}" font-size="106" font-weight="700">这个插件会很适合你</text>
      ${quote(164, 714, 3512, 112, '“ 尤其适合高频做原型、B 端页面、Demo、汇报稿的人 ”')}
      ${featureCard(164, 930, 1640, 620, '适合这些场景', ['原型设计阶段快速补列表、表单、卡片内容', '验证信息密度、排版节奏和页面真实感', '把常用填充方式沉淀成长期可复用资产'])}
      ${featureCard(1876, 930, 1800, 620, '一句话总结', ['Data Fill 的价值不在于“随机生成”', '而在于把填数据这件事', '从重复劳动变成稳定工作流'])}
      <rect x="164" y="1700" width="420" height="100" rx="18" fill="${theme.lineStrong}"/>
      <text x="288" y="1768" fill="#FFFFFF" font-family="${theme.headerFont}" font-size="48" font-weight="700">立即体验</text>
      <rect x="632" y="1700" width="560" height="100" rx="18" fill="${theme.panelBlue}" stroke="${theme.lineStrong}" stroke-width="3"/>
      <text x="786" y="1768" fill="${theme.blue}" font-family="${theme.headerFont}" font-size="48" font-weight="700">开始使用 Data Fill</text>
    `)}
  `),
};

for (const [name, svg] of Object.entries(slides)) {
  fs.writeFileSync(path.join(outDir, name), svg, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 3840 },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'PingFang SC',
    },
  });
  fs.writeFileSync(path.join(pngDir, name.replace('.svg', '.png')), resvg.render().asPng());
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Data Fill 4K Promo</title>
  <style>
    body { margin: 0; padding: 28px; background: #f6f8fc; font-family: ${theme.bodyFont}; color: ${theme.title}; }
    h1 { margin: 0 0 10px; font-size: 30px; }
    p { margin: 0 0 18px; color: ${theme.body}; }
    .card { background: #fff; border: 1px solid ${theme.line}; border-radius: 14px; padding: 16px; margin-bottom: 24px; }
    .label { margin-bottom: 10px; font-weight: 700; color: ${theme.blue}; }
    img { width: 100%; display: block; border: 1px solid ${theme.line}; }
  </style>
</head>
<body>
  <h1>Data Fill 4K 宣传图</h1>
  <p>浅色企业展示风，4K 导出，围绕结果、痛点、方案、能力、使用、转化六页展开。</p>
  ${Object.keys(slides).map((name) => `
    <div class="card">
      <div class="label">${name}</div>
      <img src="./png/${name.replace('.svg', '.png')}" alt="${name}" />
    </div>
  `).join('')}
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
console.log(`Generated ${Object.keys(slides).length} slides in ${outDir}`);
