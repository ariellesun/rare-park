/**
 * 数据看板 · 实时统计
 *
 * 全部基于 ticketStore 真实计算，不再使用任何写死常量：
 * - 卡片数字：今日 vs 昨日 真算 Δ
 * - 7 天趋势：按 ticket.createdAt 真实分桶
 * - 首响时长：用每张工单的首条 agent/ai 消息时间 - createdAt 真实平均
 * - 类型分布 / 渠道分布 / TOP 高频问题：基于全量工单聚合
 *
 * （文件名沿用 mockDashboard 仅为兼容已有 import；不再有 mock 成分。）
 */
import {
  CATEGORY_LABEL,
  CHANNEL_LABEL,
  getTickets,
  type Ticket,
  type TicketCategory,
  type TicketChannel,
} from '../state/ticketStore'

export interface DashboardStats {
  cards: {
    todayCount: number
    todayCountDelta: number
    aiAutoRate: number
    aiAutoRateDelta: number
    pendingHuman: number
    avgFirstReplyMin: number
    avgFirstReplyDelta: number
  }
  weekTrend: { date: string; count: number; aiCount: number }[]
  categoryDist: { category: TicketCategory; label: string; count: number }[]
  channelDist: { channel: TicketChannel; label: string; count: number }[]
  topQuestions: { question: string; count: number; category: TicketCategory }[]
}

/* ───── 时间工具 ───── */

function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function dayKeyOf(ts: number): number {
  return startOfDay(new Date(ts))
}

function formatMd(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/* ───── 业务工具 ───── */

/** 是否被 AI 自助处理（已起草 / 已完成 都视为 AI 接住了） */
function isAiHandled(t: Ticket): boolean {
  return t.status === 'ai_drafted' || t.status === 'closed'
}

/**
 * 工单首响时长（分钟）。
 * 找首条非 user 消息（agent / ai）作为"首响"，与 createdAt 之差。
 * 没有任何回复就返回 null（不计入平均）。
 */
function firstReplyMinutes(t: Ticket): number | null {
  const reply = t.messages.find((m) => m.role !== 'user')
  if (!reply) return null
  const diffMs = reply.at - t.createdAt
  if (diffMs <= 0) return null
  return diffMs / 60000
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function aiRateOf(group: Ticket[]): number {
  if (group.length === 0) return 0
  return group.filter(isAiHandled).length / group.length
}

/* ───── 主聚合 ───── */

function buildStats(): DashboardStats {
  const tickets = getTickets()

  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = todayStart - 86400000

  const todayTickets = tickets.filter((t) => t.createdAt >= todayStart)
  const yesterdayTickets = tickets.filter(
    (t) => t.createdAt >= yesterdayStart && t.createdAt < todayStart
  )

  /* ── 今日数 / 昨日 Δ% ── */
  const todayCount = todayTickets.length
  const yesterdayCount = yesterdayTickets.length
  const todayCountDelta =
    yesterdayCount > 0
      ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
      : todayCount > 0
        ? 100
        : 0

  /* ── AI 自助率 / Δpp ── */
  const aiAutoRate = aiRateOf(todayTickets)
  const aiAutoRateYesterday = aiRateOf(yesterdayTickets)
  const aiAutoRateDelta = Math.round((aiAutoRate - aiAutoRateYesterday) * 100)

  /* ── 待人工（全量） ── */
  const pendingHuman = tickets.filter((t) => t.status === 'human').length

  /* ── 首响时长（今日均值） / Δ% ── */
  const todayFirstReplies = todayTickets
    .map(firstReplyMinutes)
    .filter((v): v is number => v !== null)
  const yesterdayFirstReplies = yesterdayTickets
    .map(firstReplyMinutes)
    .filter((v): v is number => v !== null)
  const avgFirstReplyMinRaw = avg(todayFirstReplies)
  const avgFirstReplyMin = Math.round(avgFirstReplyMinRaw * 10) / 10
  const avgFirstReplyMinYesterday = avg(yesterdayFirstReplies)
  const avgFirstReplyDelta =
    avgFirstReplyMinYesterday > 0
      ? Math.round(
          ((avgFirstReplyMinRaw - avgFirstReplyMinYesterday) /
            avgFirstReplyMinYesterday) *
            100
        )
      : 0

  /* ── 类型分布（全量） ── */
  const categoryMap = new Map<TicketCategory, number>()
  for (const t of tickets) {
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + 1)
  }
  const categoryDist: DashboardStats['categoryDist'] = (
    ['medical', 'fund', 'care', 'policy', 'psych', 'other'] as TicketCategory[]
  ).map((c) => ({
    category: c,
    label: CATEGORY_LABEL[c],
    count: categoryMap.get(c) ?? 0,
  }))

  /* ── 渠道分布（全量） ── */
  const channelMap = new Map<TicketChannel, number>()
  for (const t of tickets) {
    channelMap.set(t.channel, (channelMap.get(t.channel) ?? 0) + 1)
  }
  const channelDist: DashboardStats['channelDist'] = (
    ['wecom', 'hotline', 'miniprogram', 'email'] as TicketChannel[]
  ).map((c) => ({
    channel: c,
    label: CHANNEL_LABEL[c],
    count: channelMap.get(c) ?? 0,
  }))

  /* ── TOP 高频问题（基于摘要+消息文本聚类） ── */
  const topQuestions = computeTopQuestions(tickets)

  /* ── 7 天趋势：按 createdAt 真实分桶 ── */
  const weekTrend: DashboardStats['weekTrend'] = []
  // 预备 7 个桶（i=6 是 6 天前，i=0 是今天）
  const buckets: { date: string; dayStart: number; count: number; aiCount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStart = startOfDay(d)
    buckets.push({ date: formatMd(d), dayStart, count: 0, aiCount: 0 })
  }
  // 把 7 天内的工单分到对应桶
  const earliest = buckets[0].dayStart
  for (const t of tickets) {
    if (t.createdAt < earliest) continue
    const k = dayKeyOf(t.createdAt)
    const b = buckets.find((bb) => bb.dayStart === k)
    if (!b) continue
    b.count += 1
    if (isAiHandled(t)) b.aiCount += 1
  }
  for (const b of buckets) {
    weekTrend.push({ date: b.date, count: b.count, aiCount: b.aiCount })
  }

  return {
    cards: {
      todayCount,
      todayCountDelta,
      aiAutoRate,
      aiAutoRateDelta,
      pendingHuman,
      avgFirstReplyMin,
      avgFirstReplyDelta,
    },
    weekTrend,
    categoryDist,
    channelDist,
    topQuestions,
  }
}

/**
 * 把所有工单 summary + 消息文本简单聚成 5 类高频问题。
 * 关键词匹配，演示足够，比写死有说服力。
 */
function computeTopQuestions(tickets: Ticket[]) {
  const buckets: { key: string; question: string; category: TicketCategory; match: RegExp }[] = [
    {
      key: 'medical-where',
      question: '怀疑罕见病去哪家医院？',
      category: 'medical',
      match: /医院|挂号|哪里看|就诊|专家|科室/,
    },
    {
      key: 'medical-gene',
      question: '基因检测多少钱？能报销吗？',
      category: 'medical',
      match: /基因|检测|筛查|确诊/,
    },
    {
      key: 'fund-low',
      question: '低保家庭如何申请罕见病救助？',
      category: 'fund',
      match: /低保|救助|基金|申请|援助/,
    },
    {
      key: 'policy-med',
      question: 'SMA / 高价药能不能进医保？',
      category: 'policy',
      match: /医保|报销|惠民保|备案|双通道/,
    },
    {
      key: 'policy-school',
      question: '罕见病孩子上学怎么办？',
      category: 'policy',
      match: /上学|学校|陪读|教育/,
    },
    {
      key: 'care-daily',
      question: '日常照护与康复要点？',
      category: 'care',
      match: /照护|护理|康复|日常|训练|轮椅/,
    },
    {
      key: 'psych',
      question: '家属心理支持 / 志愿者对接',
      category: 'psych',
      match: /心理|抑郁|崩溃|睡不着|志愿者|陪伴/,
    },
  ]
  const counts = new Map<string, number>()
  for (const t of tickets) {
    const text = `${t.summary} ${t.messages.map((m) => m.content).join(' ')}`
    for (const b of buckets) {
      if (b.match.test(text)) {
        counts.set(b.key, (counts.get(b.key) ?? 0) + 1)
      }
    }
  }
  return buckets
    .map((b) => ({
      question: b.question,
      category: b.category,
      count: counts.get(b.key) ?? 0,
    }))
    .filter((q) => q.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

/**
 * 获取看板数据。基于本地 ticketStore 实时聚合，无任何写死值。
 * （命名为 fetch* 以保持外部 import 不动；如未来真接后端，替换实现即可。）
 */
export async function fetchDashboard(): Promise<DashboardStats> {
  return buildStats()
}
