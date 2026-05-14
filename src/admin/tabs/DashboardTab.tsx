import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { fetchDashboard, type DashboardStats } from '../mockDashboard'
import { useTickets } from '../../state/ticketStore'
import { card, sectionTitle, ui } from '../uiKit'

/**
 * 数据看板 Tab
 * - 4 张数字卡 + 7 天趋势 + 类型分布 + 渠道分布 + TOP 高频问题
 * - 数据来自 fetchDashboard()，基于 ticketStore 实时计算
 * - 订阅 useTickets() 让 C 端新增工单后看板自动刷新
 */
export default function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const tickets = useTickets()

  useEffect(() => {
    fetchDashboard().then(setStats)
    // tickets 变化时重算
  }, [tickets])

  if (!stats) {
    return <div style={{ padding: 40, opacity: 0.5 }}>加载中…</div>
  }

  const { cards, weekTrend, categoryDist, channelDist, topQuestions } = stats

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* 顶部 4 张数字卡 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        <StatCard
          label="今日咨询量"
          value={cards.todayCount.toString()}
          delta={cards.todayCountDelta}
          deltaUnit="%"
          color={ui.palette[0]}
        />
        <StatCard
          label="AI 自助应答率"
          value={`${Math.round(cards.aiAutoRate * 100)}%`}
          delta={cards.aiAutoRateDelta}
          deltaUnit="pp"
          color={ui.palette[1]}
        />
        <StatCard
          label="待人工处理"
          value={cards.pendingHuman.toString()}
          color={ui.palette[3]}
        />
        <StatCard
          label="平均首响时长"
          value={`${cards.avgFirstReplyMin} min`}
          delta={cards.avgFirstReplyDelta}
          deltaUnit="%"
          deltaPositiveIsGood={false}
          color={ui.palette[2]}
        />
      </div>

      {/* 中部：折线 + 饼图 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>近 7 天咨询量趋势</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weekTrend} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#ebe7d4" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={ui.textMuted} fontSize={12} />
              <YAxis stroke={ui.textMuted} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: ui.card,
                  border: `1px solid ${ui.borderSoft}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="count"
                name="总咨询量"
                stroke={ui.palette[0]}
                strokeWidth={2.2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="aiCount"
                name="AI 应答"
                stroke={ui.palette[1]}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <div style={sectionTitle}>需求类型分布</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryDist}
                dataKey="count"
                nameKey="label"
                innerRadius={50}
                outerRadius={88}
                paddingAngle={2}
                stroke="#fffdf4"
              >
                {categoryDist.map((_, i) => (
                  <Cell key={i} fill={ui.palette[i % ui.palette.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: ui.card,
                  border: `1px solid ${ui.borderSoft}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 底部：渠道柱图 + TOP 列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>渠道来源分布</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={channelDist}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
            >
              <CartesianGrid stroke="#ebe7d4" strokeDasharray="3 3" />
              <XAxis type="number" stroke={ui.textMuted} fontSize={12} />
              <YAxis type="category" dataKey="label" stroke={ui.textMuted} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: ui.card,
                  border: `1px solid ${ui.borderSoft}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name="咨询数" radius={[0, 6, 6, 0]}>
                {channelDist.map((_, i) => (
                  <Cell key={i} fill={ui.palette[(i + 2) % ui.palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <div style={sectionTitle}>TOP 5 高频问题（近 7 日）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {topQuestions.map((q, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: ui.cardSoft,
                  border: `1px solid ${ui.borderSoft}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: ui.palette[i],
                    color: '#fff',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    flex: '0 0 auto',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: ui.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {q.question}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: ui.textMuted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q.count} 次
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.5, textAlign: 'center', marginTop: 8 }}>
        关键数字、渠道分布、类型分布、TOP 问题均基于工单库实时计算 ·
        C 端公园新增对话会立即反哺看板
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  deltaUnit = '%',
  deltaPositiveIsGood = true,
  color,
}: {
  label: string
  value: string
  delta?: number
  deltaUnit?: string
  /** delta 为正是否代表"好"。例如响应时长越短越好，传 false */
  deltaPositiveIsGood?: boolean
  color: string
}) {
  let deltaColor = ui.textMuted
  let arrow = ''
  if (typeof delta === 'number') {
    const isGood = deltaPositiveIsGood ? delta > 0 : delta < 0
    deltaColor = isGood ? '#5a8a4a' : '#a14040'
    arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '·'
  }
  return (
    <div style={{ ...card, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: color,
        }}
      />
      <div style={{ fontSize: 12, color: ui.textMuted, letterSpacing: 2 }}>{label}</div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: ui.text,
          marginTop: 8,
          letterSpacing: 1,
        }}
      >
        {value}
      </div>
      {typeof delta === 'number' && (
        <div style={{ fontSize: 12, color: deltaColor, marginTop: 4 }}>
          {arrow} {Math.abs(delta)}
          {deltaUnit} <span style={{ opacity: 0.6 }}>较昨日</span>
        </div>
      )}
    </div>
  )
}
