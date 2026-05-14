/**
 * AI 抽象层
 * - 统一 chat() 入口；UI 只依赖这里
 * - Provider 可切换：mock / hunyuan / workbuddy
 * - 混元支持两种接入：
 *   a) 直连（从 localStorage 读 apiKey + baseURL，OpenAI 兼容协议 SSE）—— 演示用
 *   b) 后端代理（/api/ai/hunyuan/chat）—— 生产用
 *  其中 a) 可在 admin 顶栏配置；不可用时自动降级到 b) 或 mock
 */

export type ChatRole = 'system' | 'user' | 'assistant'
export interface ChatMessage {
  role: ChatRole
  content: string
}
export interface ChatOptions {
  /** 召回的知识库片段（可选，让 AI 引用） */
  knowledge?: { title: string; content: string }[]
  /** 流式回调；不传则非流式 */
  onDelta?: (delta: string) => void
  signal?: AbortSignal
}

export type ProviderId = 'mock' | 'hunyuan' | 'workbuddy'
export type ProviderHealth = 'online' | 'offline' | 'unknown'

const STORAGE_KEY = 'glimmer.ai.provider.v1'
const HUNYUAN_KEY = 'glimmer.hunyuan.apiKey'
const HUNYUAN_BASE_KEY = 'glimmer.hunyuan.baseUrl'
const HUNYUAN_MODEL_KEY = 'glimmer.hunyuan.model'

// TokenHub 是腾讯混元当前的统一入口（OpenAI 兼容）
// hy3-preview 是该账号当前可用的混元三代预览版对话模型
const DEFAULT_HUNYUAN_BASE = 'https://tokenhub.tencentmaas.com/v1'
const DEFAULT_HUNYUAN_MODEL = 'hy3-preview'

// 从 .env.local 读取（不进 git；仅 VITE_ 前缀变量会暴露给前端）
const ENV_HUNYUAN_KEY = (import.meta.env.VITE_HUNYUAN_API_KEY as string | undefined) ?? ''
const ENV_HUNYUAN_BASE = (import.meta.env.VITE_HUNYUAN_BASE_URL as string | undefined) ?? ''
const ENV_HUNYUAN_MODEL = (import.meta.env.VITE_HUNYUAN_MODEL as string | undefined) ?? ''

// 如果 env 里已配 key，默认就启用 hunyuan；否则保持 mock 离线兜底
const DEFAULT_PROVIDER: ProviderId = ENV_HUNYUAN_KEY ? 'hunyuan' : 'mock'

/**
 * 自愈：如果 localStorage 里残留了旧的混元域名（迁移到 TokenHub 之前的 api.hunyuan.cloud.tencent.com）
 * 或残留了不合法的旧模型名，自动清掉，让 .env.local / 默认值接管。
 * 这避免用户在 UI 里点过一次配置后，env 永远被 localStorage 屏蔽。
 */
function selfHealLegacyHunyuanConfig() {
  try {
    const oldBase = localStorage.getItem(HUNYUAN_BASE_KEY)
    if (oldBase && oldBase.includes('api.hunyuan.cloud.tencent.com')) {
      localStorage.removeItem(HUNYUAN_BASE_KEY)
      console.info('[AI] cleared legacy hunyuan base url from localStorage')
    }
    const oldModel = localStorage.getItem(HUNYUAN_MODEL_KEY)
    if (oldModel && /^hunyuan-(turbos?|pro|standard|lite)/.test(oldModel)) {
      localStorage.removeItem(HUNYUAN_MODEL_KEY)
      console.info('[AI] cleared legacy hunyuan model from localStorage')
    }
  } catch {
    // ignore
  }
}
selfHealLegacyHunyuanConfig()

/* ─────────── Provider 选择 ─────────── */

export function getProvider(): ProviderId {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ProviderId | null
    if (v === 'mock' || v === 'hunyuan' || v === 'workbuddy') return v
  } catch {
    // ignore
  }
  return DEFAULT_PROVIDER
}
export function setProvider(p: ProviderId) {
  try {
    localStorage.setItem(STORAGE_KEY, p)
  } catch {
    // ignore
  }
}

/* ─────────── 混元配置（可在 UI 里配置） ─────────── */

export interface HunyuanConfig {
  apiKey: string
  baseUrl: string
  model: string
}
export function getHunyuanConfig(): HunyuanConfig {
  // 优先级：用户在 UI 里手动填的 (localStorage) > .env.local > 内置默认
  return {
    apiKey: safeRead(HUNYUAN_KEY) ?? ENV_HUNYUAN_KEY,
    baseUrl: safeRead(HUNYUAN_BASE_KEY) || ENV_HUNYUAN_BASE || DEFAULT_HUNYUAN_BASE,
    model: safeRead(HUNYUAN_MODEL_KEY) || ENV_HUNYUAN_MODEL || DEFAULT_HUNYUAN_MODEL,
  }
}
export function setHunyuanConfig(cfg: Partial<HunyuanConfig>) {
  if (cfg.apiKey !== undefined) safeWrite(HUNYUAN_KEY, cfg.apiKey)
  if (cfg.baseUrl !== undefined) safeWrite(HUNYUAN_BASE_KEY, cfg.baseUrl)
  if (cfg.model !== undefined) safeWrite(HUNYUAN_MODEL_KEY, cfg.model)
}

/* ─────────── Provider 健康状态（顶栏状态灯） ─────────── */

let lastHealth: ProviderHealth = 'unknown'
const healthListeners = new Set<(h: ProviderHealth) => void>()
function setHealth(h: ProviderHealth) {
  if (h === lastHealth) return
  lastHealth = h
  healthListeners.forEach((l) => l(h))
}
export function getHealth(): ProviderHealth {
  return lastHealth
}
export function onHealthChange(cb: (h: ProviderHealth) => void) {
  healthListeners.add(cb)
  return () => healthListeners.delete(cb)
}

/* ─────────── 统一 chat 入口 ─────────── */

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  let provider = getProvider()
  // 护栏：如果 .env.local 里配了真混元 key，强制走真混元，避免 localStorage
  // 残留把 provider 锁死在 mock，导致用户在前台问问题永远只能拿到兜底文案。
  if (provider === 'mock' && ENV_HUNYUAN_KEY) {
    provider = 'hunyuan'
    try {
      localStorage.setItem(STORAGE_KEY, 'hunyuan')
    } catch {
      // ignore
    }
  }
  if (provider === 'hunyuan') return chatHunyuan(messages, opts)
  if (provider === 'workbuddy') return chatWorkBuddy(messages, opts)
  setHealth('online') // mock 始终可用
  return chatMock(messages, opts)
}

/* ─────────── Mock Provider ─────────── */

async function chatMock(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
  const userMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const kb = opts.knowledge ?? []

  let intro: string
  if (/费用|多少钱|价格|医保|报销/.test(userMsg)) {
    intro = '关于费用与报销，每个城市政策有差异，建议先按以下信息核对。'
  } else if (/医院|医生|挂号|就诊|哪里看/.test(userMsg)) {
    intro = '建议优先选择具备相应专科能力的三甲医院，以下是参考信息。'
  } else if (/救助|基金|申请/.test(userMsg)) {
    intro = '目前可申请的救助渠道整理如下，请按家庭情况选择最合适的项目。'
  } else if (/照护|护理|日常|生活/.test(userMsg)) {
    intro = '日常照护中以下要点对家属与患者都很关键，请逐条确认。'
  } else if (/确诊|检测|基因|诊断/.test(userMsg)) {
    intro = '确诊路径通常涉及临床表现 + 基因检测两个层面，建议如下。'
  } else {
    intro = '已为您整理初步答复，请核对后再回复家属。'
  }

  let body = ''
  if (kb.length > 0) {
    body =
      '\n\n参考知识库：\n' +
      kb
        .slice(0, 3)
        .map((k, i) => `  [${i + 1}] ${k.title}：${k.content.slice(0, 60)}…`)
        .join('\n')
  }

  const tail =
    '\n\n（由 AI 草拟，建议人工复核后发出。涉及个体诊疗、用药及费用结论请务必由专业人员确认。）'

  const full = intro + body + tail

  if (opts.onDelta) {
    const chunks = full.match(/.{1,3}/g) ?? [full]
    for (const c of chunks) {
      if (opts.signal?.aborted) break
      await sleep(18)
      opts.onDelta(c)
    }
  } else {
    await sleep(400)
  }
  return full
}

/* ─────────── Hunyuan Provider ─────────── */

async function chatHunyuan(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
  const cfg = getHunyuanConfig()

  // 直连（OpenAI 兼容协议 SSE）
  if (cfg.apiKey) {
    try {
      const result = await chatHunyuanDirect(cfg, messages, opts)
      setHealth('online')
      return result
    } catch (e) {
      console.warn('[AI] hunyuan direct failed, fallback to mock:', e)
      setHealth('offline')
      return chatMock(messages, opts)
    }
  }

  // 没配 key → 直接走 mock 兜底
  setHealth('offline')
  return chatMock(messages, opts)
}

/**
 * 走 OpenAI 兼容协议直连混元（演示用，生产应走后端代理）。
 * 协议参考：https://cloud.tencent.com/document/product/1729/111007
 */
async function chatHunyuanDirect(
  cfg: HunyuanConfig,
  messages: ChatMessage[],
  opts: ChatOptions
): Promise<string> {
  const sysExtra = formatKnowledgeAsSystem(opts.knowledge)
  const finalMessages: ChatMessage[] = sysExtra
    ? [{ role: 'system', content: sysExtra }, ...messages]
    : messages

  const url = cfg.baseUrl.replace(/\/$/, '') + '/chat/completions'
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: finalMessages,
      stream: !!opts.onDelta,
    }),
    signal: opts.signal,
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`hunyuan ${resp.status}: ${text.slice(0, 120)}`)
  }

  if (opts.onDelta && resp.body) {
    return readSSE(resp.body, opts.onDelta, opts.signal)
  }
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content ?? ''
  return text
}

/**
 * 解析 OpenAI 兼容 SSE 流，拼接 delta.content。
 */
async function readSSE(
  body: ReadableStream<Uint8Array>,
  onDelta: (d: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buf = ''
  let acc = ''
  while (true) {
    if (signal?.aborted) break
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim()
      buf = buf.slice(idx + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return acc
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[]
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          acc += delta
          onDelta(delta)
        }
      } catch {
        // 忽略心跳/非 JSON 行
      }
    }
  }
  return acc
}

function formatKnowledgeAsSystem(kb?: { title: string; content: string }[]) {
  if (!kb || kb.length === 0) return ''
  return (
    '【知识库参考片段，请基于这些内容回答】\n' +
    kb.map((k, i) => `[${i + 1}] ${k.title}\n${k.content}`).join('\n\n')
  )
}

/* ─────────── WorkBuddy Provider（占位） ─────────── */

async function chatWorkBuddy(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
  try {
    const r = await chatViaProxy('/api/ai/workbuddy/chat', messages, opts, true)
    setHealth('online')
    return r
  } catch (e) {
    console.warn('[AI] workbuddy fallback:', e)
    setHealth('offline')
    return chatMock(messages, opts)
  }
}

async function chatViaProxy(
  url: string,
  messages: ChatMessage[],
  opts: ChatOptions,
  throwOnFail = false
): Promise<string> {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, knowledge: opts.knowledge ?? [] }),
      signal: opts.signal,
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = (await resp.json()) as { reply: string }
    if (opts.onDelta) opts.onDelta(data.reply)
    return data.reply
  } catch (e) {
    if (throwOnFail) throw e
    console.warn('[AI] proxy failed, fallback to mock:', e)
    return chatMock(messages, opts)
  }
}

/* ─────────── utils ─────────── */

function safeRead(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function safeWrite(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v)
    else localStorage.removeItem(k)
  } catch {
    // ignore
  }
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
