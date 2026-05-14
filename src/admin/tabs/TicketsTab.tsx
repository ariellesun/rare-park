import { useMemo, useState } from 'react'
import {
  useTickets,
  updateTicket,
  appendMessage,
  CHANNEL_LABEL,
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Ticket,
  type TicketChannel,
  type TicketCategory,
  type TicketStatus,
} from '../../state/ticketStore'
import { recallKb } from '../../state/kbStore'
import { appendAgentReply } from '../../state/askStore'
import { chat, type ChatMessage } from '../../ai/client'
import { btnStyle, inputStyle, ui } from '../uiKit'

/**
 * 工单工作台 Tab
 * - 左：多渠道统一收件箱 + 状态/渠道/类型筛选
 * - 中：对话历史
 * - 右：AI 草稿区（一键起草 / 编辑 / 发送 / 转人工）
 */
export default function TicketsTab() {
  const tickets = useTickets()
  const [activeId, setActiveId] = useState<string>(tickets[0]?.id ?? '')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all')
  const [filterChannel, setFilterChannel] = useState<TicketChannel | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<TicketCategory | 'all'>('all')
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const base = tickets.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterChannel !== 'all' && t.channel !== filterChannel) return false
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (keyword.trim()) {
        const k = keyword.toLowerCase()
        if (
          !t.summary.toLowerCase().includes(k) &&
          !t.fromName.toLowerCase().includes(k) &&
          !(t.diseaseLabel ?? '').toLowerCase().includes(k)
        ) {
          return false
        }
      }
      return true
    })
    // 进行中的对话永远顶置；其余按更新/创建时间倒序
    return [...base].sort((a, b) => {
      if (!!a.live !== !!b.live) return a.live ? -1 : 1
      return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
    })
  }, [tickets, filterStatus, filterChannel, filterCategory, keyword])

  const active = filtered.find((t) => t.id === activeId) ?? filtered[0]

  const counts = useMemo(() => {
    const c: Record<TicketStatus | 'all', number> = {
      all: tickets.length,
      pending: 0,
      ai_drafted: 0,
      human: 0,
      closed: 0,
    }
    for (const t of tickets) c[t.status]++
    return c
  }, [tickets])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* live 呼吸点动画 */}
      <style>{`
        @keyframes rare-park-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.7); }
        }
      `}</style>
      {/* ───── 左：工单列表 ───── */}
      <aside
        style={{
          width: 360,
          borderRight: `1px solid ${ui.border}`,
          background: ui.cardSoft,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${ui.borderSoft}` }}>
          <input
            type="text"
            placeholder="搜索咨询人/摘要/病种"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ ...inputStyle, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <StatusChip
              label={`全部 ${counts.all}`}
              active={filterStatus === 'all'}
              onClick={() => setFilterStatus('all')}
            />
            <StatusChip
              label={`待处理 ${counts.pending}`}
              active={filterStatus === 'pending'}
              onClick={() => setFilterStatus('pending')}
              color="#a14040"
            />
            <StatusChip
              label={`已起草 ${counts.ai_drafted}`}
              active={filterStatus === 'ai_drafted'}
              onClick={() => setFilterStatus('ai_drafted')}
              color="#c98e4a"
            />
            <StatusChip
              label={`转人工 ${counts.human}`}
              active={filterStatus === 'human'}
              onClick={() => setFilterStatus('human')}
              color="#6e8aa8"
            />
            <StatusChip
              label={`已完成 ${counts.closed}`}
              active={filterStatus === 'closed'}
              onClick={() => setFilterStatus('closed')}
              color="#7c9a4a"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value as TicketChannel | 'all')}
              style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }}
            >
              <option value="all">所有渠道</option>
              {(Object.keys(CHANNEL_LABEL) as TicketChannel[]).map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as TicketCategory | 'all')}
              style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }}
            >
              <option value="all">所有类型</option>
              {(Object.keys(CATEGORY_LABEL) as TicketCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, opacity: 0.5, fontSize: 13, textAlign: 'center' }}>
              当前筛选下没有工单
            </div>
          ) : (
            filtered.map((t) => (
              <TicketRow
                key={t.id}
                ticket={t}
                active={t.id === active?.id}
                onClick={() => setActiveId(t.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ───── 右：对话详情 ───── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {active ? (
          <TicketDetail key={active.id} ticket={active} />
        ) : (
          <div style={{ padding: 40, opacity: 0.5 }}>未选择工单</div>
        )}
      </main>
    </div>
  )
}

/* ─────────── 工单卡片 ─────────── */

function TicketRow({
  ticket,
  active,
  onClick,
}: {
  ticket: Ticket
  active: boolean
  onClick: () => void
}) {
  const channelEmoji: Record<TicketChannel, string> = {
    wecom: '💬',
    hotline: '📞',
    miniprogram: '📱',
    email: '✉️',
  }
  const priorityColor: Record<string, string> = {
    high: '#a14040',
    mid: '#c98e4a',
    low: '#7c9a4a',
  }
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${ui.borderSoft}`,
        background: active ? '#f0eedd' : ticket.live ? '#fbf7e8' : 'transparent',
        cursor: 'pointer',
        borderLeft: `3px solid ${
          ticket.live
            ? '#3a8a4a'
            : active
            ? priorityColor[ticket.priority]
            : 'transparent'
        }`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        {ticket.live && (
          <span
            title="访客正在絮语面板里实时对话"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              fontWeight: 500,
              color: '#3a8a4a',
              padding: '1px 6px 1px 4px',
              background: 'rgba(58,138,74,0.10)',
              border: '1px solid rgba(58,138,74,0.25)',
              borderRadius: 999,
              letterSpacing: 0.5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#3a8a4a',
                animation: 'rare-park-pulse 1.4s ease-in-out infinite',
                boxShadow: '0 0 6px #3a8a4a',
              }}
            />
            进行中
          </span>
        )}
        <span>{channelEmoji[ticket.channel]}</span>
        <span style={{ color: ui.textMuted }}>{CHANNEL_LABEL[ticket.channel]}</span>
        <span
          style={{
            fontSize: 11,
            padding: '1px 6px',
            background: '#ebe7d4',
            borderRadius: 4,
            color: ui.text,
          }}
        >
          {CATEGORY_LABEL[ticket.category]}
        </span>
        {ticket.diseaseLabel && (
          <span
            style={{
              fontSize: 11,
              padding: '1px 6px',
              background: '#e6efd9',
              borderRadius: 4,
              color: '#3a4a30',
            }}
          >
            {ticket.diseaseLabel}
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: priorityColor[ticket.priority],
          }}
        >
          ● {PRIORITY_LABEL[ticket.priority]}
        </span>
      </div>
      <div
        style={{
          fontSize: 14,
          color: ui.text,
          marginTop: 6,
          lineHeight: 1.45,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {ticket.summary}
      </div>
      <div
        style={{
          fontSize: 11,
          color: ui.textMuted,
          marginTop: 6,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{ticket.fromName}</span>
        <span>{formatTime(ticket.createdAt)} · {STATUS_LABEL[ticket.status]}</span>
      </div>
    </div>
  )
}

/* ─────────── 详情区 ─────────── */

function TicketDetail({ ticket }: { ticket: Ticket }) {
  const [draft, setDraft] = useState(ticket.aiDraft ?? '')
  const [drafting, setDrafting] = useState(false)
  const [recalled, setRecalled] = useState<{ title: string; summary: string }[]>([])

  async function generateDraft() {
    setDrafting(true)
    setDraft('')
    const lastUser = [...ticket.messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    const knowledge = recallKb(lastUser, 3, ticket.diseaseId)
    setRecalled(knowledge.map((k) => ({ title: k.title, summary: k.summary })))

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是罕见病公益机构的智能客服助理「萤光」，回复语气温柔、克制、专业。回答需基于知识库片段，避免医学结论；涉及个体诊疗、用药、费用必须建议人工复核。',
      },
      ...ticket.messages.map((m) => ({
        role: m.role === 'user' ? 'user' : ('assistant' as const),
        content: m.content,
      })) as ChatMessage[],
    ]

    let acc = ''
    await chat(messages, {
      knowledge: knowledge.map((k) => ({ title: k.title, content: k.summary })),
      onDelta: (d) => {
        acc += d
        setDraft(acc)
      },
    })
    setDrafting(false)
    updateTicket(ticket.id, { aiDraft: acc, status: 'ai_drafted' })
  }

  function send() {
    const text = draft.trim()
    if (!text) return
    // 1) 写入工单消息历史（B 端可见）
    appendMessage(ticket.id, { role: 'agent', content: text, at: Date.now() })
    // 2) 如果这条工单是 C 端絮语对话产生的，把消息推回 C 端面板
    //    （仅当用户面板还开着且仍在同一段会话才会注入；否则只留在工单里）
    let pushed = false
    if (ticket.conversationId) {
      pushed = appendAgentReply(ticket.conversationId, text)
    }
    // 3) 状态：若用户实时收到（pushed=true）→ 视为人工接入完成；
    //    否则按原逻辑流转为 closed（异步渠道客服已发出回复）
    updateTicket(ticket.id, {
      status: pushed ? 'human' : 'closed',
      aiDraft: undefined,
      live: pushed ? ticket.live : false,
      updatedAt: Date.now(),
    })
    setDraft('')
    setRecalled([])
  }

  function escalate() {
    updateTicket(ticket.id, { status: 'human' })
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* 中间：对话流 */}
      <div
        style={{
          flex: 1.4,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          borderRight: `1px solid ${ui.border}`,
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${ui.borderSoft}`,
            background: ui.card,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: ui.text }}>
            {ticket.fromName} · {ticket.diseaseLabel ?? CATEGORY_LABEL[ticket.category]}
          </div>
          <div style={{ fontSize: 12, color: ui.textMuted, marginTop: 4 }}>
            来自 {CHANNEL_LABEL[ticket.channel]} · 工单 {ticket.id} · 优先级{' '}
            {PRIORITY_LABEL[ticket.priority]}
          </div>
          {ticket.fromName.includes('絮语') && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'linear-gradient(90deg, #fff5e8, #f5f0e0)',
                border: '1px dashed #d6a96a',
                borderRadius: 8,
                fontSize: 12,
                color: '#7a5a2a',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontSize: 14 }}>🦋</span>
              <span>
                <strong>来自 C 端公园「絮语」</strong>
                {ticket.diseaseLabel ? ` · 用户在 ${ticket.diseaseLabel} 林地驻足` : ''}
                ：用户在小程序公园中与 AI 园丁对话沉淀生成
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {ticket.messages.map((m, i) => (
            <Bubble key={i} message={m} />
          ))}
        </div>
      </div>

      {/* 右：AI 草稿区 */}
      <div
        style={{
          flex: 1,
          minWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          background: ui.cardSoft,
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${ui.borderSoft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: 2, color: ui.textMuted }}>
            🤖 AI 起草助手
          </div>
          <button
            onClick={generateDraft}
            disabled={drafting}
            style={{
              ...btnStyle(ui.accent, '#fff'),
              opacity: drafting ? 0.6 : 1,
              cursor: drafting ? 'wait' : 'pointer',
            }}
          >
            {drafting ? '生成中…' : '一键生成草稿'}
          </button>
        </div>

        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {recalled.length > 0 && (
            <div
              style={{
                padding: 12,
                background: '#fffdf4',
                border: `1px dashed ${ui.borderInput}`,
                borderRadius: 8,
                fontSize: 12,
                color: ui.textSoft,
              }}
            >
              <div style={{ fontSize: 11, color: ui.textMuted, marginBottom: 6, letterSpacing: 1 }}>
                召回的知识片段（{recalled.length}）
              </div>
              {recalled.map((r, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  · <strong>{r.title}</strong>：{r.summary}
                </div>
              ))}
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="点上方「一键生成草稿」，AI 会基于对话上下文 + 知识库给出回复建议。你也可以直接在此处手写。"
            style={{
              flex: 1,
              minHeight: 240,
              padding: 12,
              border: `1px solid ${ui.borderInput}`,
              borderRadius: 8,
              background: ui.card,
              color: ui.text,
              fontFamily: 'inherit',
              fontSize: 14,
              resize: 'none',
              lineHeight: 1.7,
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={escalate} style={btnStyle('#fff', ui.textSoft, ui.borderInput)}>
              转人工 ↗
            </button>
            <button
              onClick={send}
              disabled={!draft.trim()}
              style={{
                ...btnStyle(ui.accent, '#fff'),
                opacity: draft.trim() ? 1 : 0.5,
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              发送回复
            </button>
          </div>

          <div style={{ fontSize: 11, color: ui.textMuted, lineHeight: 1.6 }}>
            协作规则：标准化问题由 AI 起草，人工 1 秒内确认即可发送；
            涉及费用、用药、重大决定等敏感内容请走「转人工」。
          </div>
        </div>
      </div>
    </div>
  )
}

function Bubble({ message }: { message: { role: string; content: string; at: number } }) {
  const isUser = message.role === 'user'
  const isAI = message.role === 'ai'
  const align = isUser ? 'flex-start' : 'flex-end'
  const bg = isUser ? ui.card : isAI ? '#fff7e3' : '#e6efd9'
  const border = isUser ? ui.borderSoft : isAI ? '#e8c98a' : '#bcd29a'
  const label = isUser ? '咨询人' : isAI ? 'AI' : '客服'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, maxWidth: '78%', alignSelf: align }}>
      <div style={{ fontSize: 11, color: ui.textMuted, marginBottom: 4 }}>
        {label} · {formatTime(message.at)}
      </div>
      <div
        style={{
          padding: '10px 14px',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          fontSize: 14,
          color: ui.text,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}

function StatusChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? ui.accent : '#fff',
        color: active ? '#fff' : color ?? ui.text,
        border: `1px solid ${active ? ui.accent : ui.borderInput}`,
        borderRadius: 999,
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${hh}:${mm}`
}
