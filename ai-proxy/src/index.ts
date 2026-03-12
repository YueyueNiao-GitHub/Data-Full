interface Env {
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_MODEL?: string;
  ENABLE_LICENSE_CHECK?: string;
  LICENSE_API_URL?: string;
  LICENSE_API_TOKEN?: string;
  LICENSES?: {
    get(key: string): Promise<string | null>;
  };
}

interface GenerateRequestBody {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  prompt?: string;
  count?: number;
  preview?: boolean;
  noCache?: boolean;
}

const LICENSE_CACHE_TTL_MS = 10 * 60 * 1000;
const AI_CACHE_TTL_MS = 3 * 60 * 1000;
const licenseCache = new Map<string, { expiresAt: number; value: { valid: boolean; error?: string; plan?: string; expiresAt?: string } }>();
const aiResponseCache = new Map<string, { expiresAt: number; value: string }>();

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-License-Key'
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

function getCachedValue<T>(store: Map<string, { expiresAt: number; value: T }>, key: string): T | null {
  const hit = store.get(key);
  if (!hit) {
    return null;
  }

  if (hit.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }

  return hit.value;
}

function setCachedValue<T>(store: Map<string, { expiresAt: number; value: T }>, key: string, value: T, ttlMs: number) {
  store.set(key, {
    expiresAt: Date.now() + ttlMs,
    value
  });
}

async function validateLicense(request: Request, env: Env): Promise<boolean> {
  if (env.ENABLE_LICENSE_CHECK !== 'true') {
    return true;
  }

  const licenseKey = request.headers.get('X-License-Key');
  if (!licenseKey || !env.LICENSE_API_URL || !env.LICENSE_API_TOKEN) {
    return false;
  }

  const response = await fetch(env.LICENSE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LICENSE_API_TOKEN}`
    },
    body: JSON.stringify({ licenseKey })
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json() as { valid?: boolean };
  return data.valid === true;
}

async function getLicenseRecord(request: Request, env: Env): Promise<{
  valid: boolean;
  error?: string;
  plan?: string;
  expiresAt?: string;
}> {
  if (env.ENABLE_LICENSE_CHECK !== 'true') {
    return { valid: true, plan: 'dev' };
  }

  const licenseKey = request.headers.get('X-License-Key')?.trim();
  if (!licenseKey) {
    return { valid: false, error: 'Missing license key' };
  }

  const cached = getCachedValue(licenseCache, licenseKey);
  if (cached) {
    return cached;
  }

  if (env.LICENSES) {
    const raw = await env.LICENSES.get(licenseKey);
    if (!raw) {
      return { valid: false, error: 'License not found' };
    }

    const data = JSON.parse(raw) as {
      status?: string;
      plan?: string;
      expiresAt?: string;
    };

    if (data.status !== 'active') {
      return { valid: false, error: 'License inactive' };
    }

    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'License expired' };
    }

    const result = {
      valid: true,
      plan: data.plan || 'pro',
      expiresAt: data.expiresAt || ''
    };
    setCachedValue(licenseCache, licenseKey, result, LICENSE_CACHE_TTL_MS);
    return result;
  }

  const valid = await validateLicense(request, env);
  if (!valid) {
    return { valid: false, error: 'License validation failed' };
  }

  const result = { valid: true, plan: 'pro' };
  setCachedValue(licenseCache, licenseKey, result, LICENSE_CACHE_TTL_MS);
  return result;
}

async function callDeepSeek(env: Env, body: GenerateRequestBody): Promise<string> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('Missing DEEPSEEK_API_KEY secret');
  }

  const prompt = (body.prompt || '').trim();
  if (!prompt) {
    throw new Error('Missing prompt');
  }

  const cacheKey = JSON.stringify({
    model: body.model || env.DEEPSEEK_MODEL || 'deepseek-chat',
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
    maxTokens: typeof body.maxTokens === 'number' ? body.maxTokens : 256,
    prompt,
    count: body.count || 1,
    preview: body.preview === true
  });
  const shouldBypassCache = body.noCache === true;
  const cached = getCachedValue(aiResponseCache, cacheKey);
  if (!shouldBypassCache && cached) {
    return cached;
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: body.model || env.DEEPSEEK_MODEL || 'deepseek-chat',
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
      max_tokens: typeof body.maxTokens === 'number' ? body.maxTokens : 256,
      messages: [
        {
          role: 'system',
          content: '你是一个严谨的数据生成助手，只输出用户要求的数据内容。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek error ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty DeepSeek response');
  }

  if (!shouldBypassCache) {
    setCachedValue(aiResponseCache, cacheKey, content, AI_CACHE_TTL_MS);
  }
  return content;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/license/validate') {
      const result = await getLicenseRecord(request, env);
      if (!result.valid) {
        return json(result, 401);
      }
      return json(result);
    }

    if (request.method !== 'POST' || url.pathname !== '/api/ai/generate') {
      return json({ error: 'Not found' }, 404);
    }

    const license = await getLicenseRecord(request, env);
    if (!license.valid) {
      return json({ error: license.error || 'License validation failed' }, 401);
    }

    try {
      const body = await request.json() as GenerateRequestBody;
      const content = await callDeepSeek(env, body);
      return json({ content });
    } catch (error) {
      return json({
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
};
