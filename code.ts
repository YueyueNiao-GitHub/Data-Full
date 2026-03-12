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

interface CustomDataPayload {
  customFields: any[];
  customFolders: any[];
}

interface AISettings {
  provider: 'deepseek';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  endpoint: string;
}

interface AIFieldConfig {
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'deepseek';
  method?: string;
}

interface LicenseState {
  key: string;
  status: 'valid' | 'invalid' | 'unknown';
  plan?: string;
  expiresAt?: string;
  lastValidatedAt?: string;
}

interface UsageState {
  freeFillLimit: number;
  fillCount: number;
}

interface PackedImageAsset {
  name: string;
  mimeType: string;
  base64: string;
}

interface PackedImageAssetMap {
  avatarReal: PackedImageAsset[];
  avatarCartoon: PackedImageAsset[];
  banner16x9: PackedImageAsset[];
  banner4x3: PackedImageAsset[];
}

interface BuiltInImageFieldSpec {
  fieldId: 'image_avatar_real' | 'image_avatar_cartoon' | 'image_banner_16_9' | 'image_banner_4_3';
  assetKey: keyof PackedImageAssetMap;
  label: string;
  targetKind: 'avatar' | 'banner16x9' | 'banner4x3';
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
let imageHashCache: { [key: string]: string } = {};
let aiPreviewCache: { [key: string]: { content: string; expiresAt: number } } = {};

type ImageFillTargetNode = SceneNode & MinimalFillsMixin;

const BUILT_IN_IMAGE_LIBRARY_SOURCE = 'built-in';
const AI_SETTINGS_STORAGE_KEY = 'ai_settings';
const LICENSE_STORAGE_KEY = 'license_state';
const USAGE_STORAGE_KEY = 'usage_state';
const FREE_FILL_LIMIT = 20;
const FORCE_DEFAULT_ACCESS_STATE = true;
const AI_PROXY_ENDPOINT = 'https://data-fill-ai-proxy.yueyueniao-xuyp.workers.dev/api/ai/generate';
const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'deepseek',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.8,
  maxTokens: 256,
  endpoint: AI_PROXY_ENDPOINT
};
let aiSettingsCache: AISettings = DEFAULT_AI_SETTINGS;
let licenseStateCache: LicenseState = {
  key: '',
  status: 'unknown',
  plan: '',
  expiresAt: '',
  lastValidatedAt: ''
};
let usageStateCache: UsageState = {
  freeFillLimit: FREE_FILL_LIMIT,
  fillCount: 0
};
let usageStateLoaded = false;
const BUILT_IN_IMAGE_FIELD_SPECS: BuiltInImageFieldSpec[] = [
  {
    fieldId: 'image_avatar_real',
    assetKey: 'avatarReal',
    label: '真人头像',
    targetKind: 'avatar'
  },
  {
    fieldId: 'image_avatar_cartoon',
    assetKey: 'avatarCartoon',
    label: '卡通头像',
    targetKind: 'avatar'
  },
  {
    fieldId: 'image_banner_16_9',
    assetKey: 'banner16x9',
    label: '16:9 封面',
    targetKind: 'banner16x9'
  },
  {
    fieldId: 'image_banner_4_3',
    assetKey: 'banner4x3',
    label: '4:3 封面',
    targetKind: 'banner4x3'
  }
];

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

function isImageField(fieldId: string): boolean {
  return BUILT_IN_IMAGE_FIELD_SPECS.some(spec => spec.fieldId === fieldId);
}

function isImageFillTarget(node: SceneNode): node is ImageFillTargetNode {
  if (node.type === 'TEXT') {
    return false;
  }

  if (!('fills' in node) || node.fills === figma.mixed) {
    return false;
  }

  return Array.isArray(node.fills) && node.fills.some(fill => fill.type === 'IMAGE');
}

function randomAsset(assets: PackedImageAsset[]): PackedImageAsset {
  return assets[Math.floor(Math.random() * assets.length)];
}

function getBuiltInImageFieldSpec(fieldId: string): BuiltInImageFieldSpec | null {
  return BUILT_IN_IMAGE_FIELD_SPECS.find(spec => spec.fieldId === fieldId) || null;
}

function getPackedAsset(fieldId: string): PackedImageAsset | null {
  const fieldSpec = getBuiltInImageFieldSpec(fieldId);
  if (!fieldSpec) {
    return null;
  }

  const assets = PACKED_IMAGE_ASSETS[fieldSpec.assetKey];
  if (!assets || assets.length === 0) {
    return null;
  }

  return randomAsset(assets);
}

function normalizeAISettings(raw: Partial<AISettings> | null | undefined): AISettings {
  const temperature = Number(raw?.temperature);
  const maxTokens = Number(raw?.maxTokens);

  return {
    provider: 'deepseek',
    apiKey: typeof raw?.apiKey === 'string' ? raw.apiKey.trim() : '',
    model: typeof raw?.model === 'string' && raw.model.trim() ? raw.model.trim() : DEFAULT_AI_SETTINGS.model,
    temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 2) : DEFAULT_AI_SETTINGS.temperature,
    maxTokens: Number.isFinite(maxTokens) ? Math.max(1, Math.floor(maxTokens)) : DEFAULT_AI_SETTINGS.maxTokens,
    endpoint: typeof raw?.endpoint === 'string' && raw.endpoint.trim() ? raw.endpoint.trim() : DEFAULT_AI_SETTINGS.endpoint
  };
}

function buildAIFieldPrompt(userPrompt: string, count: number): string {
  const safeCount = Math.max(1, count);
  const candidateCount = Math.min(Math.max(safeCount * 3, 12), 40);
  return [
    '你正在为 Figma 插件 Data Fill 生成字段值。',
    `请返回 ${candidateCount} 条候选结果，每条独立占一行。`,
    '尽量保证内容多样，不要连续重复。',
    '不要输出编号、标题、解释、代码块、前后缀标记。',
    '用户提示词如下：',
    userPrompt
  ].join('\n');
}

function buildAIPreviewPrompt(userPrompt: string): string {
  return [
    '你正在为 Figma 插件做预览。',
    '请快速返回 6 条示例结果，每条独立占一行。',
    '只输出结果，不要解释，不要编号。',
    userPrompt
  ].join('\n');
}

function normalizeLicenseState(raw: Partial<LicenseState> | null | undefined): LicenseState {
  return {
    key: typeof raw?.key === 'string' ? raw.key.trim() : '',
    status: raw?.status === 'valid' || raw?.status === 'invalid' ? raw.status : 'unknown',
    plan: typeof raw?.plan === 'string' ? raw.plan : '',
    expiresAt: typeof raw?.expiresAt === 'string' ? raw.expiresAt : '',
    lastValidatedAt: typeof raw?.lastValidatedAt === 'string' ? raw.lastValidatedAt : ''
  };
}

function normalizeUsageState(raw: Partial<UsageState> | null | undefined): UsageState {
  const freeFillLimit = Number(raw?.freeFillLimit);
  const fillCount = Number(raw?.fillCount);

  return {
    freeFillLimit: Number.isFinite(freeFillLimit) ? Math.max(0, Math.floor(freeFillLimit)) : FREE_FILL_LIMIT,
    fillCount: Number.isFinite(fillCount) ? Math.max(0, Math.floor(fillCount)) : 0
  };
}

function isLicenseActivated(license: LicenseState = licenseStateCache): boolean {
  return license.status === 'valid';
}

function getRemainingFreeFillCount(usage: UsageState = usageStateCache): number {
  return Math.max(usage.freeFillLimit - usage.fillCount, 0);
}

function buildUsageStatePayload(usage: UsageState = usageStateCache) {
  const remainingFillCount = getRemainingFreeFillCount(usage);
  const isPaid = isLicenseActivated();
  return {
    ...usage,
    remainingFillCount,
    isPaid,
    isBlocked: !isPaid && remainingFillCount <= 0
  };
}

function postUsageState(type: 'usage-state-loaded' | 'usage-state-saved') {
  figma.ui.postMessage({
    type,
    usage: buildUsageStatePayload()
  });
}

function createPaywallMessage(actionLabel: string): string {
  return `${actionLabel}免费额度已用完。未付费用户最多可填充 20 次，AI 能力包含在内；继续使用请先付费激活。`;
}

function shuffleArray(values: string[]): string[] {
  const next = values.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

function pickRandomAIValues(lines: string[], count: number): string[] {
  const uniquePool = Array.from(new Set(lines.filter(Boolean)));
  const pool = uniquePool.length > 0 ? uniquePool : lines.filter(Boolean);

  if (pool.length === 0) {
    return [];
  }

  const shuffled = shuffleArray(pool);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    results.push(shuffled[i % shuffled.length]);
  }

  return shuffleArray(results);
}

async function warmUpAIService(settings: AISettings) {
  if (!settings.endpoint || settings.endpoint.includes('YOUR_WORKER_SUBDOMAIN')) {
    return;
  }

  try {
    const origin = settings.endpoint.replace(/\/api\/ai\/generate$/, '');
    await fetch(`${origin}/health`, { method: 'GET' });
  } catch (error) {
    console.warn('AI 服务预热失败:', error);
  }
}

async function loadAISettings(): Promise<AISettings> {
  try {
    const settings = await figma.clientStorage.getAsync(AI_SETTINGS_STORAGE_KEY);
    const normalized = normalizeAISettings(settings);
    aiSettingsCache = normalized;
    void warmUpAIService(normalized);
    figma.ui.postMessage({
      type: 'ai-settings-loaded',
      settings: {
        ...normalized,
        apiKey: normalized.apiKey
      }
    });
    return normalized;
  } catch (error) {
    console.error('加载 AI 设置失败:', error);
    const fallback = normalizeAISettings(null);
    aiSettingsCache = fallback;
    void warmUpAIService(fallback);
    figma.ui.postMessage({
      type: 'ai-settings-loaded',
      settings: fallback
    });
    return fallback;
  }
}

async function saveAISettings(settings: Partial<AISettings>) {
  const normalized = normalizeAISettings(settings);
  aiSettingsCache = normalized;
  await figma.clientStorage.setAsync(AI_SETTINGS_STORAGE_KEY, normalized);
  figma.ui.postMessage({
    type: 'ai-settings-saved',
    settings: normalized
  });
  return normalized;
}

async function loadLicenseState(): Promise<LicenseState> {
  if (FORCE_DEFAULT_ACCESS_STATE) {
    const fallback = normalizeLicenseState(null);
    licenseStateCache = fallback;
    await figma.clientStorage.setAsync(LICENSE_STORAGE_KEY, fallback);
    figma.ui.postMessage({
      type: 'license-state-loaded',
      license: fallback
    });
    return fallback;
  }

  try {
    const license = await figma.clientStorage.getAsync(LICENSE_STORAGE_KEY);
    const normalized = normalizeLicenseState(license);
    licenseStateCache = normalized;
    figma.ui.postMessage({
      type: 'license-state-loaded',
      license: normalized
    });
    return normalized;
  } catch (error) {
    console.error('加载授权失败:', error);
    const fallback = normalizeLicenseState(null);
    licenseStateCache = fallback;
    figma.ui.postMessage({
      type: 'license-state-loaded',
      license: fallback
    });
    return fallback;
  }
}

async function saveLicenseState(license: Partial<LicenseState>) {
  const normalized = normalizeLicenseState(license);
  licenseStateCache = normalized;
  await figma.clientStorage.setAsync(LICENSE_STORAGE_KEY, normalized);
  figma.ui.postMessage({
    type: 'license-state-saved',
    license: normalized
  });
  return normalized;
}

async function loadUsageState(): Promise<UsageState> {
  if (FORCE_DEFAULT_ACCESS_STATE) {
    const fallback = normalizeUsageState(null);
    usageStateCache = fallback;
    usageStateLoaded = true;
    await figma.clientStorage.setAsync(USAGE_STORAGE_KEY, fallback);
    postUsageState('usage-state-loaded');
    return fallback;
  }

  try {
    const usage = await figma.clientStorage.getAsync(USAGE_STORAGE_KEY);
    const normalized = normalizeUsageState(usage);
    usageStateCache = normalized;
    usageStateLoaded = true;
    postUsageState('usage-state-loaded');
    return normalized;
  } catch (error) {
    console.error('加载使用额度失败:', error);
    const fallback = normalizeUsageState(null);
    usageStateCache = fallback;
    usageStateLoaded = true;
    postUsageState('usage-state-loaded');
    return fallback;
  }
}

async function saveUsageState(usage: Partial<UsageState>) {
  const normalized = normalizeUsageState({
    ...usageStateCache,
    ...usage
  });
  usageStateCache = normalized;
  usageStateLoaded = true;
  await figma.clientStorage.setAsync(USAGE_STORAGE_KEY, normalized);
  postUsageState('usage-state-saved');
  return normalized;
}

async function incrementFillUsage() {
  if (isLicenseActivated()) {
    return usageStateCache;
  }

  const usage = usageStateLoaded ? usageStateCache : await loadUsageState();
  return saveUsageState({
    ...usage,
    fillCount: usage.fillCount + 1
  });
}

async function assertCanUseFeature(actionLabel: string) {
  const license = licenseStateCache.key || licenseStateCache.status !== 'unknown'
    ? licenseStateCache
    : await loadLicenseState();
  if (isLicenseActivated(license)) {
    return;
  }

  const usage = usageStateLoaded ? usageStateCache : await loadUsageState();
  if (getRemainingFreeFillCount(usage) > 0) {
    return;
  }

  const message = createPaywallMessage(actionLabel);
  figma.ui.postMessage({
    type: 'paywall-required',
    message
  });
  throw new Error(message);
}

async function requestLicenseValidation(settings: AISettings, licenseKey: string): Promise<LicenseState> {
  if (!settings.endpoint || settings.endpoint.includes('YOUR_WORKER_SUBDOMAIN')) {
    throw new Error('AI 服务未配置');
  }

  const origin = settings.endpoint.replace(/\/api\/ai\/generate$/, '');
  const response = await fetch(`${origin}/api/license/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey.trim()
    }
  });

  const data = await response.json() as {
    valid?: boolean;
    plan?: string;
    expiresAt?: string;
    error?: string;
  };

  if (!response.ok || !data.valid) {
    throw new Error(data.error || '授权校验失败');
  }

  return normalizeLicenseState({
    key: licenseKey,
    status: 'valid',
    plan: data.plan,
    expiresAt: data.expiresAt,
    lastValidatedAt: new Date().toISOString()
  });
}

async function validateAndPersistLicense(licenseKey: string): Promise<LicenseState> {
  const settings = aiSettingsCache.endpoint ? aiSettingsCache : await loadAISettings();
  const validated = await requestLicenseValidation(settings, licenseKey);
  return saveLicenseState(validated);
}

async function requestAIProxyContent(settings: AISettings, prompt: string, count: number, preview: boolean, licenseKey: string, forceRefresh = false): Promise<string> {
  if (!settings.endpoint || settings.endpoint.includes('YOUR_WORKER_SUBDOMAIN')) {
    throw new Error('AI 服务未配置。发布版不要在插件里直连 DeepSeek，请改为调用你自己的服务端代理。');
  }

  const trimmedLicenseKey = licenseKey.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (trimmedLicenseKey) {
    headers['X-License-Key'] = trimmedLicenseKey;
  }

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider: settings.provider,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      prompt,
      count,
      preview,
      noCache: forceRefresh
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI 服务请求失败（${response.status}）: ${errorText || response.statusText}`);
  }

  const data = await response.json() as {
    content?: string;
    error?: string;
  };
  const content = data.content?.trim();

  if (!content) {
    throw new Error(data.error || 'AI 服务未返回可用内容');
  }

  return content;
}

function parseAIResponseToLines(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)、])\s*/, '').trim())
    .filter(Boolean);
}

async function generateAIFieldValues(config: AIFieldConfig, count: number): Promise<string[]> {
  const prompt = config.prompt?.trim();
  if (!prompt) {
    throw new Error('AI 字段缺少提示词');
  }

  await assertCanUseFeature('字段填充');

  const storedSettings = aiSettingsCache.endpoint ? aiSettingsCache : await loadAISettings();
  const mergedSettings = normalizeAISettings({
    ...storedSettings,
    provider: 'deepseek',
    model: config.model || storedSettings.model,
    temperature: config.temperature ?? storedSettings.temperature,
    maxTokens: config.maxTokens ?? storedSettings.maxTokens
  });

  const license = licenseStateCache.key || licenseStateCache.status !== 'unknown'
    ? licenseStateCache
    : await loadLicenseState();
  const content = await requestAIProxyContent(mergedSettings, buildAIFieldPrompt(prompt, count), count, false, license.key);
  const lines = parseAIResponseToLines(content);

  if (lines.length === 0) {
    throw new Error('AI 未生成有效内容');
  }

  const values = pickRandomAIValues(lines, count);
  if (values.length === 0) {
    throw new Error('AI 未生成足够的候选内容');
  }

  return values;
}

async function handleAIPreview(field: { prompt?: string; aiConfig?: Partial<AISettings>; forceRefresh?: boolean }) {
  try {
    const prompt = field.prompt?.trim();
    if (!prompt) {
      throw new Error('请输入 AI 提示词');
    }

    await assertCanUseFeature('AI 功能');

    const settings = normalizeAISettings(field.aiConfig);
    const license = licenseStateCache.key || licenseStateCache.status !== 'unknown'
      ? licenseStateCache
      : await loadLicenseState();
    const previewCacheKey = JSON.stringify({
      prompt,
      model: settings.model,
      temperature: settings.temperature
    });
    const shouldForceRefresh = field.forceRefresh === true;
    const cachedPreview = aiPreviewCache[previewCacheKey];
    if (!shouldForceRefresh && cachedPreview && cachedPreview.expiresAt > Date.now()) {
      figma.ui.postMessage({
        type: 'ai-preview-result',
        preview: cachedPreview.content
      });
      return;
    }

    const previewSettings = normalizeAISettings({
      ...settings,
      temperature: Math.min(settings.temperature, 0.6),
      maxTokens: Math.min(settings.maxTokens, 96)
    });
    const content = await requestAIProxyContent(previewSettings, buildAIPreviewPrompt(prompt), 6, true, license.key, shouldForceRefresh);
    aiPreviewCache[previewCacheKey] = {
      content,
      expiresAt: Date.now() + 2 * 60 * 1000
    };
    figma.ui.postMessage({
      type: 'ai-preview-result',
      preview: content
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'ai-preview-error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

function getImageHashForAsset(asset: PackedImageAsset): string {
  const cacheKey = `${asset.name}:${asset.base64.length}`;

  if (!imageHashCache[cacheKey]) {
    const bytes = figma.base64Decode(asset.base64);
    imageHashCache[cacheKey] = figma.createImage(bytes).hash;
  }

  return imageHashCache[cacheKey];
}

function matchesImageFieldTarget(node: SceneNode, fieldId: string): boolean {
  const fieldSpec = getBuiltInImageFieldSpec(fieldId);
  if (!fieldSpec || !('width' in node) || !('height' in node)) {
    return false;
  }

  const width = node.width;
  const height = node.height;
  if (!width || !height) {
    return false;
  }

  const ratio = width / height;

  if (fieldSpec.targetKind === 'avatar') {
    return ratio >= 0.75 && ratio <= 1.25;
  }

  if (fieldSpec.targetKind === 'banner16x9') {
    return Math.abs(ratio - 16 / 9) <= 0.35;
  }

  if (fieldSpec.targetKind === 'banner4x3') {
    return Math.abs(ratio - 4 / 3) <= 0.22;
  }

  return false;
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

async function loadCustomData() {
  try {
    const customData = await figma.clientStorage.getAsync('custom_data');
    figma.ui.postMessage({
      type: 'custom-data-loaded',
      data: customData || { customFields: [], customFolders: [] }
    });
  } catch (e) {
    console.error('加载自定义数据失败:', e);
    figma.ui.postMessage({
      type: 'custom-data-loaded',
      data: { customFields: [], customFolders: [] }
    });
  }
}

async function saveCustomData(data: CustomDataPayload) {
  try {
    await figma.clientStorage.setAsync('custom_data', data);
    figma.ui.postMessage({
      type: 'custom-data-saved'
    });
  } catch (e) {
    console.error('保存自定义数据失败:', e);
    figma.ui.postMessage({
      type: 'fill-error',
      message: '保存字段数据失败'
    });
  }
}

// 监听来自 UI 的消息
figma.ui.onmessage = (msg: PluginMessage) => {
  console.log('收到消息:', msg);

  switch (msg.type) {
    case 'fill-text':
      void handleFill(msg.fieldId, msg.configType, msg.dynamicConfig);
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

    case 'load-custom-data':
      void loadCustomData();
      break;

    case 'save-custom-data':
      void saveCustomData(msg.data);
      break;

    case 'load-ai-settings':
      void loadAISettings();
      break;

    case 'save-ai-settings':
      void saveAISettings(msg.settings);
      break;

    case 'load-license-state':
      void loadLicenseState();
      break;

    case 'load-usage-state':
      void loadUsageState();
      break;

    case 'activate-license':
      void validateAndPersistLicense(msg.licenseKey)
        .then((license) => {
          figma.ui.postMessage({
            type: 'license-activated',
            license
          });
        })
        .catch((error) => {
          figma.ui.postMessage({
            type: 'license-error',
            message: error instanceof Error ? error.message : String(error)
          });
        });
      break;

    case 'preview-ai-field':
      void handleAIPreview(msg.field || {});
      break;

    case 'close':
      figma.closePlugin();
      break;

    default:
      console.log('未知消息类型:', msg.type);
  }
};

// 处理字段填充
async function handleFill(fieldId: string, configType?: string, dynamicConfig: any = {}) {
  const selection = figma.currentPage.selection;
  const fillingImages = isImageField(fieldId);
  const fillingAI = dynamicConfig?.method === 'ai';

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
  const imageNodes: ImageFillTargetNode[] = [];

  // 递归遍历选中的图层及其子图层
  function collectNodes(node: SceneNode) {
    if (node.type === 'TEXT') {
      textNodes.push(node as TextNode);
    } else if (isImageFillTarget(node)) {
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

  try {
    await assertCanUseFeature('字段填充');
  } catch {
    return;
  }

  let message = '';

  if (fillingImages) {
    const matchedImageNodes = imageNodes.filter(node => matchesImageFieldTarget(node, fieldId));

    if (matchedImageNodes.length === 0) {
      const fieldSpec = getBuiltInImageFieldSpec(fieldId);
      const targetLabel = fieldSpec ? fieldSpec.label : '图片';
      figma.ui.postMessage({
        type: 'fill-error',
        message: `未找到可填充的${targetLabel}图层，请先选中已有图片填充且比例匹配的图层`
      });
      return;
    }

    for (let i = 0; i < matchedImageNodes.length; i++) {
      try {
        await fillImageNode(matchedImageNodes[i], fieldId);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`图片填充失败: ${error}`);
      }
    }

    if (textNodes.length > 0) {
      result.failed += textNodes.length;
      result.errors.push(`跳过${textNodes.length}个文本图层：当前字段仅支持图片填充`);
    }

    const unmatchedImageCount = imageNodes.length - matchedImageNodes.length;
    if (unmatchedImageCount > 0) {
      result.failed += unmatchedImageCount;
      result.errors.push(`跳过${unmatchedImageCount}个图片图层：尺寸比例与当前图片分类不匹配`);
    }

    message = `已填充${result.success}个图片图层`;
  } else {
    if (textNodes.length === 0) {
      figma.ui.postMessage({
        type: 'fill-error',
        message: '未找到可填充的文本图层'
      });
      return;
    }

    // 批量生成数据（用于排序或 AI 多条生成）
    const config = fieldConfigs[fieldId] || {};
    let dataList: string[] = [];

    if (fillingAI) {
      try {
        dataList = await generateAIFieldValues({
          ...config,
          ...dynamicConfig
        }, textNodes.length);
      } catch (error) {
        figma.ui.postMessage({
          type: 'fill-error',
          message: error instanceof Error ? error.message : String(error)
        });
        return;
      }
    } else {
      for (let i = 0; i < textNodes.length; i++) {
        dataList.push(generateFieldData(fieldId, configType, dynamicConfig));
      }
    }

    const effectiveType = configType || fieldId;
    if (effectiveType === 'date_time' && config.order && config.order !== 'random') {
      if (config.order === 'asc') {
        dataList.sort((a, b) => a.localeCompare(b));
      } else if (config.order === 'desc') {
        dataList.sort((a, b) => b.localeCompare(a));
      }
    }

    for (let i = 0; i < textNodes.length; i++) {
      try {
        await fillTextNode(textNodes[i], dataList[i]);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`文本填充失败: ${error}`);
      }
    }

    if (imageNodes.length > 0) {
      result.failed += imageNodes.length;
      result.errors.push(`跳过${imageNodes.length}个图片图层：当前字段仅支持文本填充`);
    }

    message = `已填充${result.success}个文本图层`;
  }

  if (result.failed > 0) {
    message += `，跳过或失败${result.failed}个图层`;
  }

  if (result.success > 0) {
    await incrementFillUsage();
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

async function fillImageNode(node: ImageFillTargetNode, fieldId: string) {
  const fieldSpec = getBuiltInImageFieldSpec(fieldId);
  const asset = getPackedAsset(fieldId);

  if (!fieldSpec || !asset) {
    throw new Error('未找到可用的内置图片素材');
  }

  const imageHash = getImageHashForAsset(asset);
  const imagePaint: ImagePaint = {
    type: 'IMAGE',
    imageHash: imageHash,
    scaleMode: 'FILL'
  };

  node.fills = [imagePaint];
  console.log(`已使用${BUILT_IN_IMAGE_LIBRARY_SOURCE}素材库填充${fieldSpec.label}:`, asset.name);
}
