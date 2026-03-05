// Data Fill - Figma 字段化数据填充插件
// 主代码文件：处理 Figma 文档操作和与 UI 的通信

// 显示插件 UI 窗口
figma.showUI(__html__, {
  width: 360,
  height: 760,
  title: 'Data Fill'
});

// 启动时加载配置
loadConfigs();

// 消息类型定义
interface PluginMessage {
  type: string;
  [key: string]: any;
}

// 填充结果
interface FillResult {
  success: number;
  failed: number;
  errors: string[];
}

// ==================== 数据生成器 ====================
const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
const GIVEN_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];
const MALE_SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
const MALE_GIVEN_NAMES = ['伟', '强', '磊', '军', '涛', '明', '刚', '建国', '志强'];
const FEMALE_SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
const FEMALE_GIVEN_NAMES = ['芳', '娜', '秀英', '敏', '静', '丽', '洁', '婷', '玉'];
const ENGLISH_FIRST_NAMES_MALE = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph'];
const ENGLISH_FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica'];
const ENGLISH_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const DEPARTMENTS = ['技术部', '产品部', '设计部', '市场部', '销售部', '运营部'];
const POSITIONS = ['产品经理', '设计师', '工程师', '运营专员', '销售经理', '客服专员'];
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉'];

// 新增：省市区数据
const PROVINCES = ['广东省', '浙江省', '北京市', '上海市', '四川省', '湖北省'];
const CITIES_BY_PROVINCE: { [key: string]: string[] } = {
  '广东省': ['广州市', '深圳市', '佛山市', '东莞市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '绍兴市'],
  '北京市': ['北京市'],
  '上海市': ['上海市'],
  '四川省': ['成都市', '绵阳市', '德阳市'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市']
};
const DISTRICTS = ['天河区', '海珠区', '越秀区', '黄埔区', '白云区', '荔湾区'];
const STREETS = ['中山路', '建国路', '人民路', '解放路', '幸福路', '平安大道'];

// 新增：部门层级数据
const DEPT_LEVEL_1 = ['企业应用部', '技术研发部', '产品运营部', '市场销售部'];
const DEPT_LEVEL_2 = ['创新应用中心', '核心技术组', '用户体验部', '渠道拓展组'];
const DEPT_LEVEL_3 = ['综合服务部门', '项目支持小组', '数据分析团队'];
const DEPT_LEVEL_4 = ['综合支持事业部', '业务协同中心', '质量保障部'];

// 新增：邮箱域名
const EMAIL_DOMAINS_CHINA = ['qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', 'aliyun.com'];
const EMAIL_DOMAINS_OVERSEAS = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];

let sequenceCounters: { [key: string]: number } = {};
let fieldConfigs: { [key: string]: any } = {};

function padStart(str: string, targetLength: number, padString: string): string {
  while (str.length < targetLength) {
    str = padString + str;
  }
  return str;
}

function randomChoice(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextSequence(fieldId: string): number {
  if (!sequenceCounters[fieldId]) {
    sequenceCounters[fieldId] = 0;
  }
  return ++sequenceCounters[fieldId];
}

// 生成字段数据
function generateFieldData(fieldId: string, configType?: string, dynamicConfig: any = {}): string {
  // 合并本地保存的配置和从 UI 传来的动态配置 (options, min, max 等)
  // dynamicConfig 可能包含 options 数组，这对 enum 类型至关重要
  const savedConfig = fieldConfigs[fieldId] || {};
  const config = { ...savedConfig, ...dynamicConfig };

  // 确定用于 switch 的类型
  // 特殊字段如 ai_new_title 需要保留 ID 匹配
  // 其他字段一律优先使用 configType
  const specialIds = ['ai_new_title', 'ai_short_desc'];
  const effectiveType = specialIds.indexOf(fieldId) !== -1 ? fieldId : (configType || fieldId);

  switch (effectiveType) {
    case 'text':
      // 生成更真实的备注文案
      const remarks = [
        '客户要求尽快发货，备注地址为公司地址，工作日配送',
        '礼品包装，附赠贺卡，写上生日快乐祝福语',
        '请务必在下午3点前送达，客户着急使用',
        '发票抬头：XX科技有限公司，税号：91110000XXXXXXXXXX',
        '配送时请提前电话联系，客户不在时可放置前台',
        '商品有轻微瑕疵已与客户沟通，同意发货并给予部分退款',
        '客户指定使用顺丰快递，运费到付',
        '订单包含多件商品，请仔细核对清单后再发货',
        '赠品已缺货，客户同意更换为等价值其他商品',
        '老客户复购，可适当赠送小礼品增加粘性',
        '客户要求开具增值税专用发票，已提供开票信息',
        '收货地址为偏远地区，需要额外确认物流时效',
        '订单备注：不要发韵达，客户反馈该快递服务差',
        '客户申请延迟发货，暂存仓库等待通知',
        '商品需要额外质检，确保无质量问题后再发货'
      ];
      return randomChoice(remarks);

    case 'enum':
      const options = config.options || [];
      if (options.length > 0) {
        return randomChoice(options);
      }
      // 如果没有选项，返回默认值而不是空字符串
      return '选项' + randomInt(1, 5);

    case 'person_name':
      // 性别配置
      const genderConfig = config.gender || 'random';
      const languageConfig = config.language || 'chinese';

      let gender = genderConfig;
      if (genderConfig === 'random') {
        gender = Math.random() > 0.5 ? 'male' : 'female';
      }

      if (languageConfig === 'english' || (languageConfig === 'random' && Math.random() > 0.5)) {
        // 英文名
        const firstName = gender === 'male'
          ? randomChoice(ENGLISH_FIRST_NAMES_MALE)
          : randomChoice(ENGLISH_FIRST_NAMES_FEMALE);
        const lastName = randomChoice(ENGLISH_LAST_NAMES);
        return `${firstName} ${lastName}`;
      } else {
        // 中文名
        const surname = gender === 'male'
          ? randomChoice(MALE_SURNAMES)
          : randomChoice(FEMALE_SURNAMES);
        const givenName = gender === 'male'
          ? randomChoice(MALE_GIVEN_NAMES)
          : randomChoice(FEMALE_GIVEN_NAMES);
        return surname + givenName;
      }

    case 'date_time':
      const year = randomInt(2020, 2026);
      const month = padStart(String(randomInt(1, 12)), 2, '0');
      const day = padStart(String(randomInt(1, 28)), 2, '0');
      const hour = padStart(String(randomInt(0, 23)), 2, '0');
      const minute = padStart(String(randomInt(0, 59)), 2, '0');
      const second = padStart(String(randomInt(0, 59)), 2, '0');

      const timeType = config.timeType || 'datetime';
      const format = config.format || 'YYYY-MM-DD';
      const includeSeconds = config.includeSeconds || 'no';

      let dateStr = '';
      let timeStr = '';

      // 生成日期部分
      if (timeType !== 'time') {
        if (format === 'YYYY/MM/DD') {
          dateStr = `${year}/${month}/${day}`;
        } else if (format === 'YYYY年MM月DD日') {
          dateStr = `${year}年${parseInt(month)}月${parseInt(day)}日`;
        } else {
          dateStr = `${year}-${month}-${day}`;
        }
      }

      // 生成时间部分
      if (timeType !== 'date') {
        timeStr = includeSeconds === 'yes'
          ? `${hour}:${minute}:${second}`
          : `${hour}:${minute}`;
      }

      if (timeType === 'datetime') {
        return `${dateStr} ${timeStr}`;
      } else if (timeType === 'date') {
        return dateStr;
      } else {
        return timeStr;
      }

    case 'number_value':
      const min = config.min || 100;
      const max = config.max || 10000;

      // 小数位
      const decimals = parseInt(config.decimals || '0');
      let num: number;

      if (decimals > 0) {
        // 生成带随机小数的数字
        const intPart = randomInt(min, max);
        const decimalPart = Math.random(); // 0-1 之间的随机小数
        num = intPart + decimalPart;
      } else {
        num = randomInt(min, max);
      }

      let numStr = decimals > 0 ? num.toFixed(decimals) : String(num);

      // 千位分隔符
      if (config.thousandsSeparator === 'yes') {
        const parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        numStr = parts.join('.');
      }

      // 百分比
      if (config.percentage === 'yes') {
        numStr += '%';
      }

      return numStr;

    case 'serial_number': {
      const start = config.start || 1;
      const order = config.order || 'asc';
      const padding = parseInt(config.padding || '0');
      const prefix = config.prefix || '';
      const suffix = config.suffix || '';

      if (!sequenceCounters[fieldId]) {
        sequenceCounters[fieldId] = start - 1;
      }

      let serialNum: number;
      if (order === 'desc') {
        serialNum = start - (++sequenceCounters[fieldId] - start);
      } else if (order === 'random') {
        serialNum = randomInt(1, 9999);
      } else {
        serialNum = ++sequenceCounters[fieldId];
      }

      // 前置补零
      let resultStr = String(serialNum);
      if (padding > 0) {
        resultStr = padStart(resultStr, padding, '0');
      }
      return prefix + resultStr + suffix;
    }

    case 'phone_number':
      const prefix = randomChoice(['138', '139', '158', '159', '188', '189']);
      const suffix = String(randomInt(10000000, 99999999));
      return prefix + suffix;

    case 'email_address':
      const username = 'user' + randomInt(1000, 9999);
      const domain = randomChoice(['qq.com', '163.com', '126.com', 'gmail.com']);
      return `${username}@${domain}`;

    case 'department':
      return randomChoice(DEPARTMENTS);

    case 'address':
      const simpleCity = randomChoice(CITIES);
      const simpleStreet = randomChoice(['中山路', '建国路', '人民路', '解放路']);
      const simpleNumber = randomInt(1, 999);
      return `${simpleCity}市${simpleStreet}${simpleNumber}号`;



    case 'finance_amount':
      const amountMin = config.min || 100;
      const amountMax = config.max || 50000;
      return '¥' + randomInt(amountMin, amountMax).toFixed(2);



    case 'ai_new_title':
      return '这是一条由 AI 生成的新闻标题示例';

    case 'ai_short_desc':
      return '这是一段由 AI 生成的简短描述示例文本';

    case 'contact_phone':
      const phoneFormat = config.format || 'full';
      const phoneSeparator = config.separator || 'none';

      const phonePrefix = randomChoice(['138', '139', '158', '159', '188', '189', '198']);
      const phoneMiddle = String(randomInt(1000, 9999));
      const phoneSuffix = String(randomInt(1000, 9999));

      let phone = phonePrefix + phoneMiddle + phoneSuffix;

      // 隐藏中间四位
      if (phoneFormat === 'masked') {
        phone = phonePrefix + '****' + phoneSuffix;
      }

      // 添加分隔符
      if (phoneSeparator === 'dash') {
        return `${phonePrefix}-${phoneFormat === 'masked' ? '****' : phoneMiddle}-${phoneSuffix}`;
      } else if (phoneSeparator === 'space') {
        return `${phonePrefix} ${phoneFormat === 'masked' ? '****' : phoneMiddle} ${phoneSuffix}`;
      }

      return phone;

    case 'location_address':
      const addressLevel = config.level || 'full';

      const province = randomChoice(PROVINCES);
      const cityList = CITIES_BY_PROVINCE[province] || ['广州市'];
      const city = randomChoice(cityList);
      const district = randomChoice(DISTRICTS);
      const street = randomChoice(STREETS);
      const houseNumber = randomInt(1, 999);

      if (addressLevel === 'province') {
        return province;
      } else if (addressLevel === 'city') {
        return `${province}${city}`;
      } else if (addressLevel === 'district') {
        return `${province}${city}${district}`;
      } else {
        return `${province}${city}${district}${street}${houseNumber}号`;
      }

    case 'account_email':
      const emailType = config.type || 'random';
      const emailUsername = 'user' + randomInt(1000, 9999);

      let domainList: string[];
      if (emailType === 'overseas') {
        domainList = EMAIL_DOMAINS_OVERSEAS;
      } else if (emailType === 'china') {
        domainList = EMAIL_DOMAINS_CHINA;
      } else {
        domainList = [...EMAIL_DOMAINS_CHINA, ...EMAIL_DOMAINS_OVERSEAS];
      }

      const emailDomain = randomChoice(domainList);
      return `${emailUsername}@${emailDomain}`;

    case 'company_department':
      const deptFormat = config.format || 'single';

      const dept1 = randomChoice(DEPT_LEVEL_1);
      const dept2 = randomChoice(DEPT_LEVEL_2);
      const dept3 = randomChoice(DEPT_LEVEL_3);
      const dept4 = randomChoice(DEPT_LEVEL_4);

      if (deptFormat === 'single') {
        return dept1;
      } else if (deptFormat === 'full') {
        return `${dept1}/${dept2}/${dept3}/${dept4}`;
      } else {
        return `${dept1}/.../${dept4}`;
      }

    default:
      return '未知字段';
  }
}

// 加载配置
async function loadConfigs() {
  try {
    const configs = await figma.clientStorage.getAsync('field_configs');
    if (configs) {
      fieldConfigs = configs;
      // 发送配置给 UI
      figma.ui.postMessage({
        type: 'configs-loaded',
        configs: configs
      });
      console.log('配置已加载:', configs);
    }
  } catch (e) {
    console.error('加载配置失败:', e);
  }
}

// 保存配置
async function saveConfig(fieldId: string, config: any) {
  try {
    fieldConfigs[fieldId] = config;
    await figma.clientStorage.setAsync('field_configs', fieldConfigs);
    console.log('配置已保存:', fieldId, config);
    return true;
  } catch (e) {
    console.error('保存配置失败:', e);
    return false;
  }
}

// 监听来自 UI 的消息
figma.ui.onmessage = (msg: PluginMessage) => {
  console.log('收到消息:', msg);

  switch (msg.type) {
    case 'fill-text':
      handleTextFill(msg.fieldId, msg.configType, msg.dynamicConfig);
      break;

    case 'update-config':
      // 更新字段配置（仅内存）
      fieldConfigs[msg.fieldId] = msg.config;
      console.log('配置已更新:', msg.fieldId, msg.config);
      break;

    case 'save-config':
      // 保存配置到 clientStorage
      saveConfig(msg.fieldId, msg.config);
      break;

    case 'close':
      figma.closePlugin();
      break;

    default:
      console.log('未知消息类型:', msg.type);
  }
};

// 处理文本填充
function handleTextFill(fieldId: string, configType?: string, dynamicConfig: any = {}) {
  const selection = figma.currentPage.selection;

  // 检查是否有选中的图层
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'fill-error',
      message: '请先选中图层'
    });
    return;
  }

  const result: FillResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // 收集所有文本图层和图片图层
  const textNodes: TextNode[] = [];
  const imageNodes: SceneNode[] = [];

  // 递归遍历选中的图层及其子图层
  function collectNodes(node: SceneNode) {
    if (node.type === 'TEXT') {
      textNodes.push(node as TextNode);
    } else if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE') {
      // 可以填充图片的图层类型
      imageNodes.push(node);
    }

    // 递归遍历子图层
    if ('children' in node) {
      for (const child of node.children) {
        collectNodes(child);
      }
    }
  }

  // 遍历所有选中的图层
  for (const node of selection) {
    collectNodes(node);
  }

  // 判断是否找到可填充的图层
  if (textNodes.length === 0 && imageNodes.length === 0) {
    figma.ui.postMessage({
      type: 'fill-error',
      message: '未找到可填充的文本或图片图层'
    });
    return;
  }

  // 批量生成数据（用于排序）
  const config = fieldConfigs[fieldId] || {};
  const dataList: string[] = [];

  // 为文本图层生成数据
  for (let i = 0; i < textNodes.length; i++) {
    dataList.push(generateFieldData(fieldId, configType, dynamicConfig));
  }

  // 如果是日期时间字段且配置了排序，则进行排序
  const effectiveType = configType || fieldId;
  if (effectiveType === 'date_time' && config.order && config.order !== 'random') {
    if (config.order === 'asc') {
      // 升序排序
      dataList.sort((a, b) => a.localeCompare(b));
    } else if (config.order === 'desc') {
      // 降序排序
      dataList.sort((a, b) => b.localeCompare(a));
    }
  }

  // 填充文本图层
  for (let i = 0; i < textNodes.length; i++) {
    try {
      fillTextNode(textNodes[i], dataList[i]);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`填充失败: ${error}`);
    }
  }

  // 如果有图片图层，提示暂不支持
  if (imageNodes.length > 0) {
    result.errors.push(`识别到${imageNodes.length}个图片图层，图片填充功能暂未实现`);
  }

  // 构建提示消息
  let message = '';
  if (textNodes.length > 0) {
    message = `识别到${textNodes.length}个文本图层并填充成功`;
  }
  if (imageNodes.length > 0) {
    if (message) {
      message += `，${imageNodes.length}个图片图层暂不支持`;
    } else {
      message = `识别到${imageNodes.length}个图片图层，暂不支持填充`;
    }
  }

  // 发送结果给 UI
  figma.ui.postMessage({
    type: 'fill-result',
    result: result,
    message: message
  });
}

// 填充文本节点
async function fillTextNode(node: TextNode, text: string) {
  // 加载字体
  await figma.loadFontAsync(node.fontName as FontName);

  // 填充文本
  node.characters = text;
}
