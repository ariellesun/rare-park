/**
 * 工单 Store
 * - mock 50 条贴近真实的咨询数据
 * - 字段映射赛题：多渠道（企微/400/小程序/邮件）+ 自动分类
 * - localStorage 持久化（用户改动会保留）
 */
import { useSyncExternalStore } from 'react'

export type TicketChannel = 'wecom' | 'hotline' | 'miniprogram' | 'email'
export type TicketCategory =
  | 'medical' // 就医咨询
  | 'fund' // 救助申请
  | 'care' // 日常照护
  | 'policy' // 政策查询
  | 'psych' // 心理支持
  | 'other'
export type TicketPriority = 'high' | 'mid' | 'low'
export type TicketStatus = 'pending' | 'ai_drafted' | 'human' | 'closed'

export interface TicketMessage {
  role: 'user' | 'agent' | 'ai'
  content: string
  at: number
}

export interface Ticket {
  id: string
  channel: TicketChannel
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  /** 显示用的咨询人称呼，已脱敏 */
  fromName: string
  diseaseId?: string
  /** 病种或主题标签，用于 UI 展示 */
  diseaseLabel?: string
  /** 摘要（首句） */
  summary: string
  messages: TicketMessage[]
  createdAt: number
  /** AI 起草的回复草稿（可选） */
  aiDraft?: string
  /**
   * C 端絮语对话稳定 ID。同一段对话的多次 upsert 共用同一条工单，
   * 避免对话进行中刷出多条工单。
   */
  conversationId?: string
  /**
   * "对话进行中"标识：true 表示用户当前正在絮语面板里聊，
   * 关闭面板 / 切换林地 / 一段时间无新消息后会被置为 false。
   * 看板上用呼吸点 + "进行中"标签提示运营。
   */
  live?: boolean
  /** 最近一次更新时间（用于排序 / 判断空闲） */
  updatedAt?: number
}

export const CHANNEL_LABEL: Record<TicketChannel, string> = {
  wecom: '企微客服群',
  hotline: '400 热线',
  miniprogram: '小程序',
  email: '邮件',
}
export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  medical: '就医咨询',
  fund: '救助申请',
  care: '日常照护',
  policy: '政策查询',
  psych: '心理支持',
  other: '其他',
}
export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  high: '高',
  mid: '中',
  low: '低',
}
export const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: '待处理',
  ai_drafted: 'AI 已起草',
  human: '转人工',
  closed: '已完成',
}

const STORAGE_KEY = 'glimmer.tickets.v3'

/* ─────── mock 数据生成 ─────── */

const SAMPLE: Array<Omit<Ticket, 'id' | 'createdAt' | 'messages'> & { firstMsg: string }> = [
  {
    channel: 'wecom',
    category: 'medical',
    priority: 'high',
    status: 'pending',
    fromName: '王女士',
    diseaseId: 'sma',
    diseaseLabel: 'SMA',
    summary: '孩子 8 个月，肌张力低，怀疑 SMA，去哪家医院最好？',
    firstMsg:
      '老师好，我家宝宝 8 个多月了，最近发现他抬头不稳、四肢比较软，社区医生建议去查 SMA。我们在杭州，请问应该挂哪家医院的什么科？基因检测要多少钱，能报销吗？',
  },
  {
    channel: 'hotline',
    category: 'fund',
    priority: 'high',
    status: 'pending',
    fromName: '李先生',
    diseaseId: 'sma',
    diseaseLabel: 'SMA',
    summary: '已确诊 SMA 2 型，能申请哪些基金？医保已经备案了。',
    firstMsg:
      '我儿子 3 岁，已确诊 SMA 2 型，医保也备案了诺西那生钠。家里收入有限，还有哪些社会基金可以申请？需要准备什么材料？',
  },
  {
    channel: 'miniprogram',
    category: 'care',
    priority: 'mid',
    status: 'pending',
    fromName: '匿名用户',
    diseaseId: 'hemophilia',
    diseaseLabel: '血友病',
    summary: '血友病孩子最近频繁关节出血，日常该怎么调整？',
    firstMsg:
      '孩子 6 岁，血友病 A 型，最近膝关节反复肿胀疼痛。请问日常活动量、运动选择、饮食上应该怎么注意，能不能上小学体育课？',
  },
  {
    channel: 'wecom',
    category: 'policy',
    priority: 'mid',
    status: 'pending',
    fromName: '张女士',
    summary: '惠民保对罕见病高价药有覆盖吗？',
    firstMsg:
      '我们家有戈谢病患者，听说沪惠保对罕见病有专项额度，请问具体是怎么报销的？需要先走基本医保吗？',
  },
  {
    channel: 'email',
    category: 'psych',
    priority: 'high',
    status: 'pending',
    fromName: '孩子妈妈',
    summary: '孩子刚确诊我整夜睡不着，能找你们聊聊吗？',
    firstMsg:
      '老师，孩子上周刚确诊，我现在脑子一片空白，整夜睡不着，老公也很沉默。我不知道接下来怎么办，能不能先帮我联系一下心理志愿者？',
  },
  {
    channel: 'miniprogram',
    category: 'medical',
    priority: 'mid',
    status: 'pending',
    fromName: '匿名用户',
    diseaseId: 'gaucher',
    diseaseLabel: '戈谢病',
    summary: '戈谢病在哪里能做酶活性检测？',
    firstMsg: '听说戈谢病要做酶活性检测，全国哪些医院能做？大概多少钱？',
  },
  {
    channel: 'hotline',
    category: 'fund',
    priority: 'mid',
    status: 'pending',
    fromName: '陈先生',
    summary: '低保家庭，孩子 ALD，社会救助有哪些渠道？',
    firstMsg:
      '我们是低保家庭，孩子诊断 ALD（肾上腺脑白质营养不良），治疗费太贵，社会救助渠道还有哪些？',
  },
  {
    channel: 'wecom',
    category: 'care',
    priority: 'low',
    status: 'pending',
    fromName: '匿名用户',
    summary: '冬天 SMA 孩子容易感冒，怎么预防？',
    firstMsg: '冬天孩子特别容易感冒，一感冒就喘得厉害，请问怎么科学预防？要不要打肺炎疫苗？',
  },
  {
    channel: 'miniprogram',
    category: 'policy',
    priority: 'low',
    status: 'pending',
    fromName: '匿名用户',
    summary: '罕见病儿童上学需要办什么手续？',
    firstMsg: '想给孩子在家附近上小学，但他需要陪读，学校说要走流程，请问要怎么办？',
  },
  {
    channel: 'email',
    category: 'medical',
    priority: 'mid',
    status: 'pending',
    fromName: '王医生',
    summary: '基层医生咨询：怎么识别早期 SMA 患儿？',
    firstMsg:
      '我是县医院儿科医生，最近接诊几个肌张力低的小宝宝，想了解早期 SMA 的识别要点，方便我们做转诊指引。',
  },
  // 以下几条预先标为 已起草 / 转人工 / 已完成，让看板更真实
  {
    channel: 'wecom',
    category: 'medical',
    priority: 'mid',
    status: 'ai_drafted',
    fromName: '刘女士',
    diseaseId: 'als',
    diseaseLabel: 'ALS',
    summary: '父亲怀疑 ALS，国内有相对集中的诊疗中心吗？',
    firstMsg:
      '我父亲 56 岁，最近半年手部精细动作明显下降，言语也有些含糊，当地医院怀疑 ALS，建议进一步确诊。国内有相对集中的 ALS 专家或诊疗中心吗？',
  },
  {
    channel: 'hotline',
    category: 'fund',
    priority: 'low',
    status: 'closed',
    fromName: '吴先生',
    summary: '美儿基金的申请材料清单确认。',
    firstMsg: '请问美儿 SMA 关爱中心申请援助需要哪些材料？我整理一下。',
  },
  {
    channel: 'miniprogram',
    category: 'psych',
    priority: 'mid',
    status: 'human',
    fromName: '匿名用户',
    summary: '青少年患者抑郁明显，希望对接心理志愿者。',
    firstMsg: '孩子 14 岁，最近情绪很低，不愿意出门，想找一位有罕见病背景的心理志愿者聊聊。',
  },
  {
    channel: 'wecom',
    category: 'other',
    priority: 'low',
    status: 'pending',
    fromName: '志愿者小杨',
    summary: '志愿者怎么报名？',
    firstMsg: '我想成为机构的科普志愿者，需要提交什么资料？',
  },
  {
    channel: 'email',
    category: 'policy',
    priority: 'mid',
    status: 'pending',
    fromName: '林女士',
    summary: '异地就医备案怎么办？',
    firstMsg: '老家是江西的，要带孩子来上海长期看病，异地就医备案具体怎么操作？',
  },
]

/**
 * 构造初始工单。
 *
 * 关键：让 createdAt 在过去 7 天里铺开，且每天都有几条 ——
 * 这样数据看板的"7 天趋势 / 今日 vs 昨日 Δ% / 首响时长"在没有真实流量时
 * 也能算出非零、合理的数字。
 *
 * 同时：为每条已被处理过的工单（ai_drafted / closed / human）补一条"首响"消息，
 * 这样首响时长才算得出来。
 */
function buildInitial(): Ticket[] {
  const now = Date.now()
  const DAY = 86400000

  // 7 天的"权重"分布，越靠近今天越多；总和会被均分到 SAMPLE 上
  const dayWeights = [1, 1, 2, 2, 3, 3, 4] // 6 天前 → 今天
  const totalWeight = dayWeights.reduce((a, b) => a + b, 0)
  // 每条工单在第几天（0=今天，6=六天前）
  const dayPlan: number[] = []
  let cursor = 0
  for (let d = 6; d >= 0; d--) {
    const slots = Math.round((SAMPLE.length * dayWeights[6 - d]) / totalWeight)
    for (let s = 0; s < slots && cursor < SAMPLE.length; s++) {
      dayPlan.push(d)
      cursor++
    }
  }
  // 兜底补足
  while (dayPlan.length < SAMPLE.length) dayPlan.push(0)

  return SAMPLE.map((s, i) => {
    const dayAgo = dayPlan[i]
    // 当天内随机 8:00 ~ 22:00 的某个分钟
    const dayBase = new Date(now - dayAgo * DAY)
    dayBase.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0)
    const createdAt = dayBase.getTime()

    const messages: TicketMessage[] = [
      {
        role: 'user',
        content: s.firstMsg,
        at: createdAt,
      },
    ]
    // 已被处理过的工单 → 补一条首响消息（用于首响时长统计）
    if (s.status !== 'pending') {
      const replyDelayMin = 1 + Math.floor(Math.random() * 6) // 1~6 分钟首响
      messages.push({
        role: s.status === 'human' ? 'agent' : 'ai',
        content:
          s.status === 'human'
            ? '已为您转接人工，请稍候，工作人员将尽快回复。'
            : '已收到您的咨询，AI 已生成初步回复供工作人员审核。',
        at: createdAt + replyDelayMin * 60_000,
      })
    }

    return {
      ...s,
      id: `tk-${1000 + i}`,
      createdAt,
      messages,
    } satisfies Ticket
  })
}

let state: { tickets: Ticket[] } = load()
const listeners = new Set<() => void>()

function load(): { tickets: Ticket[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { tickets: Ticket[] }
      if (Array.isArray(parsed.tickets)) return parsed
    }
  } catch {
    // ignore
  }
  return { tickets: buildInitial() }
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}
function emit() {
  listeners.forEach((l) => l())
}

export function useTickets(): Ticket[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state.tickets,
    () => state.tickets
  )
}
export function getTickets(): Ticket[] {
  return state.tickets
}

export function updateTicket(id: string, patch: Partial<Ticket>) {
  state = {
    tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }
  persist()
  emit()
}

export function appendMessage(id: string, msg: TicketMessage) {
  state = {
    tickets: state.tickets.map((t) =>
      t.id === id ? { ...t, messages: [...t.messages, msg] } : t
    ),
  }
  persist()
  emit()
}

export function resetTickets() {
  state = { tickets: buildInitial() }
  persist()
  emit()
}

/**
 * 由 C 端"絮语"对话沉淀生成 / 更新工单（upsert）。
 *
 * 关键作用：把 C 端用户的提问真实接入到 B 端工单流，证明"小程序渠道"打通；
 * 同时支持"对话进行中"实时呈现 —— 运营在工单台上能看到正在发生的求助。
 *
 * upsert 规则：
 *   - 若 `conversationId` 在已有工单中命中 → 更新 messages / status / summary / live
 *   - 否则 → 新建一条工单（置顶到列表最前）
 */
export function addTicketFromConversation(input: {
  channel: TicketChannel
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  fromName: string
  diseaseId?: string
  diseaseLabel?: string
  summary: string
  messages: TicketMessage[]
  /** 同一段絮语会话的稳定 ID；缺省则每次都新建（兼容旧调用） */
  conversationId?: string
  /** 是否仍在进行中（用户还没关面板）；默认 true */
  live?: boolean
}): Ticket {
  const now = Date.now()
  const live = input.live ?? true

  // upsert 命中
  if (input.conversationId) {
    const idx = state.tickets.findIndex(
      (t) => t.conversationId === input.conversationId
    )
    if (idx >= 0) {
      const existing = state.tickets[idx]
      const updated: Ticket = {
        ...existing,
        // 这些字段允许随对话演进
        category: input.category,
        priority: input.priority,
        status: input.status,
        summary: input.summary,
        messages: input.messages,
        live,
        updatedAt: now,
      }
      const next = [...state.tickets]
      next.splice(idx, 1)
      // 有更新就提到最前，方便运营看到最新动态
      state = { tickets: [updated, ...next] }
      persist()
      emit()
      return updated
    }
  }

  const ticket: Ticket = {
    id: `tk-${now.toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: now,
    updatedAt: now,
    live,
    ...input,
  }
  state = { tickets: [ticket, ...state.tickets] }
  persist()
  emit()
  return ticket
}

/**
 * 把某条对话工单标记为"已结束"（live=false）。
 * 在 askStore 关闭面板 / 切换林地 / 长时间无新消息时调用。
 */
export function markConversationEnded(conversationId: string) {
  const idx = state.tickets.findIndex((t) => t.conversationId === conversationId)
  if (idx < 0) return
  const t = state.tickets[idx]
  if (!t.live) return
  const next = [...state.tickets]
  next[idx] = { ...t, live: false, updatedAt: Date.now() }
  state = { tickets: next }
  persist()
  emit()
}
