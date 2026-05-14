/**
 * C 端"絮语"会话状态：
 *  - 控制 AskPanel 是否打开
 *  - 当前关注的林地（grove id）—— 决定 AI 的 system prompt 与 KB 召回域
 *  - 本次会话历史（用户/AI 消息）
 *  - 每次消息变化都"实时 upsert"为一条 miniprogram 工单（live=true），
 *    让运营在工单台能看到正在进行的对话；关闭/切换林地时标记 live=false
 */
import { useSyncExternalStore } from 'react'
import type { TicketCategory, TicketMessage, TicketPriority } from './ticketStore'
import {
  addTicketFromConversation,
  getTickets,
  markConversationEnded,
  updateTicket,
} from './ticketStore'
import { getGroves } from './grovesStore'
import { chat } from '../ai/client'

export interface AskMessage {
  role: 'user' | 'ai' | 'agent'
  content: string
  at: number
}

export interface AskState {
  open: boolean
  /** 当前焦点林地 id；null = 通用问答（蝴蝶常驻入口） */
  groveId: string | null
  /** 本次会话历史 */
  messages: AskMessage[]
  /** 是否正在等待 AI（流式中） */
  pending: boolean
  /** 用户是否点击过"想找真人"（决定沉淀工单时的 status） */
  escalated: boolean
  /**
   * 当前对话的稳定 ID。打开面板 / 切换林地时刷新。
   * 与工单的 `conversationId` 对齐，保证 upsert 不会刷出多条工单。
   */
  conversationId: string | null
}

const initial: AskState = {
  open: false,
  groveId: null,
  messages: [],
  pending: false,
  escalated: false,
  conversationId: null,
}

let state: AskState = initial
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useAsk(): AskState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state
  )
}

function newConversationId(): string {
  return `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * 打开絮语面板，可指定关联的林地。
 * 切换林地时，会把上一段对话标记为已结束。
 */
export function openAsk(groveId: string | null) {
  // 切换林地时，先把上一段标记结束
  if (state.open && state.groveId !== groveId && state.conversationId) {
    markConversationEnded(state.conversationId)
  }

  const sameGrove = state.groveId === groveId && state.conversationId !== null
  state = {
    open: true,
    groveId,
    messages: sameGrove ? state.messages : [],
    pending: false,
    escalated: false,
    conversationId: sameGrove ? state.conversationId : newConversationId(),
  }
  emit()
}

export function closeAsk() {
  if (!state.open) return
  // 关闭前先把当前最新内容 flush 一次（同步），再标记结束
  flushToTicketImmediate()
  if (state.conversationId) {
    markConversationEnded(state.conversationId)
  }
  state = { ...initial }
  emit()
}

export function setPending(pending: boolean) {
  state = { ...state, pending }
  emit()
}

export function appendUser(content: string) {
  state = {
    ...state,
    messages: [...state.messages, { role: 'user', content, at: Date.now() }],
  }
  emit()
  // 用户发言是关键节点 → 立刻 upsert 一次，让工单台秒级看到
  flushToTicketImmediate()
}

export function appendAi(content: string) {
  state = {
    ...state,
    messages: [...state.messages, { role: 'ai', content, at: Date.now() }],
  }
  emit()
  scheduleFlush()
}

/** 流式追加：往最后一条 AI 消息上拼 delta；若末尾不是 AI 则新建一条 */
export function streamAi(delta: string) {
  const msgs = state.messages
  const last = msgs[msgs.length - 1]
  if (last && last.role === 'ai') {
    state = {
      ...state,
      messages: [...msgs.slice(0, -1), { ...last, content: last.content + delta }],
    }
  } else {
    state = {
      ...state,
      messages: [...msgs, { role: 'ai', content: delta, at: Date.now() }],
    }
  }
  emit()
  scheduleFlush()
}

export function markEscalated() {
  state = { ...state, escalated: true }
  emit()
  flushToTicketImmediate()
}

/**
 * B 端工作台发送的客服回复 → 注入到 C 端絮语对话流。
 * 仅当当前 askStore 的会话与目标工单是同一段对话时才注入；
 * 否则视为对话已不在用户视野中，忽略（工单内的消息记录由调用方自行写入）。
 *
 * 返回是否成功注入。
 */
export function appendAgentReply(conversationId: string, content: string): boolean {
  if (!state.conversationId || state.conversationId !== conversationId) {
    return false
  }
  state = {
    ...state,
    messages: [...state.messages, { role: 'agent', content, at: Date.now() }],
  }
  emit()
  // 客服回复也要 flush 到工单（保持工单 messages 与 ask 对齐）
  flushToTicketImmediate()
  return true
}

export function clearMessages() {
  // 用户清空对话 → 把上一段标记结束，开启全新会话
  if (state.conversationId) {
    markConversationEnded(state.conversationId)
  }
  state = {
    ...state,
    messages: [],
    escalated: false,
    conversationId: newConversationId(),
  }
  emit()
}

/* ─────── 工单 upsert（防抖） ─────── */

let flushTimer: ReturnType<typeof setTimeout> | null = null

/** 防抖：流式追加期间不要每个 delta 都写工单，800ms 静默后再 flush 一次 */
function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushToTicketImmediate()
  }, 800)
}

/**
 * 立即把当前对话 upsert 为一条 live=true 的 miniprogram 工单。
 * 至少需要一条用户消息才会生成。
 */
function flushToTicketImmediate() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  if (state.messages.length === 0) return
  if (!state.conversationId) return
  const firstUser = state.messages.find((m) => m.role === 'user')
  if (!firstUser) return

  const tmsgs: TicketMessage[] = state.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : m.role === 'agent' ? 'agent' : 'ai',
    content: m.content,
    at: m.at,
  }))

  // 只要有 AI 回复，就视为 ai_drafted；用户主动转人工 → human
  const hasAi = state.messages.some((m) => m.role === 'ai')
  const status = state.escalated ? 'human' : hasAi ? 'ai_drafted' : 'pending'

  const { category, priority } = inferCategoryAndPriority(firstUser.content)
  const grove = state.groveId
    ? getGroves().find((g) => g.id === state.groveId)
    : undefined

  addTicketFromConversation({
    channel: 'miniprogram',
    category,
    priority,
    status,
    fromName: '公园访客 · 絮语',
    diseaseId: state.groveId ?? undefined,
    diseaseLabel: grove?.name,
    summary: firstUser.content.slice(0, 40),
    messages: tmsgs,
    conversationId: state.conversationId,
    live: state.open, // 面板还开着 = 进行中
  })

  // 异步用 LLM 校正分类/优先级（每段会话只校正一次）
  void requestLlmClassification(state.conversationId, firstUser.content, grove?.name)
}

/** 简易分类（基于关键词，作为 LLM 异步校正前的即时降级） */
function inferCategoryAndPriority(text: string): {
  category: TicketCategory
  priority: TicketPriority
} {
  const t = text.toLowerCase()
  if (/医院|医生|挂号|就诊|哪里看|确诊|检测|基因|诊断/.test(text)) {
    return { category: 'medical', priority: 'mid' }
  }
  if (/救助|基金|申请|援助|低保/.test(text)) {
    return { category: 'fund', priority: 'mid' }
  }
  if (/照护|护理|日常|饮食|运动|生活/.test(text)) {
    return { category: 'care', priority: 'low' }
  }
  if (/医保|惠民保|报销|政策|备案|入学|上学/.test(text)) {
    return { category: 'policy', priority: 'mid' }
  }
  if (/睡不着|崩溃|情绪|心理|想哭|想不开|抑郁/.test(text)) {
    return { category: 'psych', priority: 'high' }
  }
  if (t) return { category: 'other', priority: 'low' }
  return { category: 'other', priority: 'low' }
}

/* ─────── LLM 智能分类（带 conversationId 缓存） ─────── */

/** 已经向 LLM 发起过分类请求的 conversationId 集合（避免重复调用） */
const llmClassifyDispatched = new Set<string>()

const VALID_CATEGORIES: TicketCategory[] = [
  'medical',
  'fund',
  'care',
  'policy',
  'psych',
  'other',
]
const VALID_PRIORITIES: TicketPriority[] = ['high', 'mid', 'low']

async function requestLlmClassification(
  conversationId: string,
  firstUserText: string,
  diseaseName?: string
): Promise<void> {
  if (llmClassifyDispatched.has(conversationId)) return
  llmClassifyDispatched.add(conversationId)

  const sys = `你是罕见病关爱平台的工单智能分诊助手。请根据用户的首条咨询，判断：
- category（一项）：medical=就医咨询；fund=救助/基金申请；care=日常照护与康复；policy=政策/医保/入学等；psych=心理与情绪支持；other=其他
- priority（一项）：high=紧急（涉及自伤念头/急救/呼吸困难/心理崩溃等）；mid=明确需要帮助但不紧迫；low=一般咨询

只输出一行紧凑 JSON：{"category":"...","priority":"..."}，不要任何其他字符。`

  const userMsg = diseaseName
    ? `[病种：${diseaseName}] ${firstUserText}`
    : firstUserText

  try {
    const reply = await chat(
      [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg },
      ],
      {}
    )
    // 尝试解析；reply 可能含 markdown / 多余文本，保护性提取首段 {...}
    const m = reply.match(/\{[^}]*\}/)
    if (!m) return
    const parsed = JSON.parse(m[0]) as {
      category?: string
      priority?: string
    }
    const cat = VALID_CATEGORIES.includes(parsed.category as TicketCategory)
      ? (parsed.category as TicketCategory)
      : null
    const pri = VALID_PRIORITIES.includes(parsed.priority as TicketPriority)
      ? (parsed.priority as TicketPriority)
      : null
    if (!cat && !pri) return

    // 找到对应工单并更新
    const tk = getTickets().find((t) => t.conversationId === conversationId)
    if (!tk) return
    const patch: { category?: TicketCategory; priority?: TicketPriority } = {}
    if (cat) patch.category = cat
    if (pri) patch.priority = pri
    if (Object.keys(patch).length > 0) {
      updateTicket(tk.id, patch)
    }
  } catch (e) {
    // LLM 不可用 / 解析失败 → 保留正则分类即可
    console.warn('[ticket] llm classify failed:', e)
  }
}
