import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useAsk,
  closeAsk,
  appendUser,
  streamAi,
  setPending,
  markEscalated,
  clearMessages,
} from '../state/askStore'
import { useGroves } from '../state/grovesStore'
import { chat } from '../ai/client'
import { buildGroveChat, getQuickPrompts } from '../ai/grovePrompt'
import type { KbItem } from '../state/kbStore'

/**
 * 微光絮语 · C 端 AI 对话面板
 *
 * 设计：
 * - 右下角浮起，毛玻璃，不全屏，不破坏 3D 沉浸
 * - 顶部显示当前关联林地（"正在与 SMA 樱花谷低语"）
 * - 4 个预设关怀气泡（点选林地后自动绑定病种）
 * - 流式 AI 回复，下方展示引用的知识库片段（可追溯）
 * - 「转人工」按钮 → 标记 escalated，关闭时该工单写入 status=human
 */
export default function AskPanel() {
  const ask = useAsk()
  const groves = useGroves()
  const grove = useMemo(
    () => (ask.groveId ? groves.find((g) => g.id === ask.groveId) ?? null : null),
    [ask.groveId, groves]
  )
  const [input, setInput] = useState('')
  const [recalled, setRecalled] = useState<KbItem[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const quickPrompts = useMemo(() => getQuickPrompts(grove), [grove])

  // 自动滚到底
  useEffect(() => {
    if (!ask.open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [ask.messages, ask.open])

  // 关闭时取消正在飞的请求
  useEffect(() => {
    if (!ask.open && abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [ask.open])

  if (!ask.open) return null

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || ask.pending) return
    setInput('')

    appendUser(trimmed)
    setPending(true)

    const history = ask.messages.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('ai' as const),
      content: m.content,
    }))
    const { messages, knowledge, recalled: rec } = buildGroveChat(
      grove,
      [...history, { role: 'user' as const, content: trimmed }].slice(0, -1),
      trimmed
    )
    setRecalled(rec)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    // 先 push 一条空 AI 消息占位（streamAi 第一段会写进去）
    streamAi('')

    try {
      await chat(messages, {
        knowledge,
        signal: ctrl.signal,
        onDelta: (d) => streamAi(d),
      })
    } catch {
      // 已被取消或网络错误：忽略
    } finally {
      setPending(false)
      abortRef.current = null
    }
  }

  function onEscalate() {
    markEscalated()
    streamAi(
      '\n\n（已为您标记"希望由真人跟进"，机构工作人员会在工作时间内联系您。）'
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 28,
        bottom: 28,
        width: 380,
        maxWidth: 'calc(100vw - 40px)',
        height: 540,
        maxHeight: 'calc(100vh - 60px)',
        background: 'rgba(255,253,246,0.78)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: '1px solid rgba(70,80,60,0.18)',
        borderRadius: 22,
        boxShadow: '0 30px 60px rgba(40,50,30,0.18), 0 8px 20px rgba(40,50,30,0.08)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#2a3a2a',
      }}
    >
      {/* 顶栏 */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(70,80,60,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: grove?.accentColor ?? '#7fb88a',
            boxShadow: `0 0 12px ${grove?.accentColor ?? '#7fb88a'}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 1 }}>
            {grove ? `正在与 ${grove.subtitle} 低语` : '微光絮语 · AI 园丁向导'}
          </div>
          <div style={{ fontSize: 11, color: '#7a8870', marginTop: 2 }}>
            {grove ? grove.description.slice(0, 26) + '…' : '由 AI + 知识库提供 · 仅供参考'}
          </div>
        </div>
        <button
          onClick={closeAsk}
          aria-label="关闭"
          style={{
            border: 'none',
            background: 'transparent',
            color: '#5a6a4a',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* 消息区 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {ask.messages.length === 0 && (
          <div
            style={{
              fontSize: 12.5,
              color: '#7a8870',
              lineHeight: 1.7,
              padding: '4px 2px 8px',
            }}
          >
            轻声问我吧。
            {grove
              ? `这片${grove.subtitle}里，关于${grove.name}的任何疑惑，我都会陪你一起想想。`
              : '关于罕见病的疑问、就医、救助、照护，我会尽力帮你。'}
          </div>
        )}

        {ask.messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}

        {ask.pending && ask.messages[ask.messages.length - 1]?.role !== 'ai' && (
          <Bubble role="ai" content="…" />
        )}

        {/* 引用的知识库 */}
        {recalled.length > 0 && (
          <div
            style={{
              marginTop: 6,
              padding: '8px 10px',
              background: 'rgba(125,150,110,0.08)',
              border: '1px dashed rgba(70,80,60,0.18)',
              borderRadius: 10,
              fontSize: 11,
              color: '#5a6a4a',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 4, letterSpacing: 1 }}>
              本次回答参考的知识库
            </div>
            {recalled.map((it, i) => (
              <div key={it.id}>
                · [{i + 1}] {it.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 预设气泡（仅当还没问过时展示） */}
      {ask.messages.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: '0 14px 10px',
          }}
        >
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              style={{
                fontSize: 11.5,
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(255,253,246,0.7)',
                border: '1px solid rgba(70,80,60,0.18)',
                color: '#3a4a3a',
                cursor: 'pointer',
                lineHeight: 1.4,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <div
        style={{
          padding: '10px 12px 12px',
          borderTop: '1px solid rgba(70,80,60,0.10)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="低声问一句…（Enter 发送，Shift+Enter 换行）"
            rows={2}
            style={{
              flex: 1,
              resize: 'none',
              border: '1px solid rgba(70,80,60,0.18)',
              borderRadius: 10,
              padding: '8px 10px',
              background: 'rgba(255,255,250,0.9)',
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#2a3a2a',
              outline: 'none',
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || ask.pending}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 10,
              background: input.trim() && !ask.pending ? '#3a5a3a' : 'rgba(70,80,60,0.25)',
              color: '#fffdf4',
              cursor: input.trim() && !ask.pending ? 'pointer' : 'default',
              fontSize: 12.5,
              letterSpacing: 2,
            }}
          >
            发送
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={clearMessages}
            disabled={ask.messages.length === 0}
            style={{
              fontSize: 11,
              color: '#7a8870',
              background: 'transparent',
              border: 'none',
              cursor: ask.messages.length ? 'pointer' : 'default',
              padding: 0,
              letterSpacing: 1,
            }}
          >
            清空
          </button>
          <button
            onClick={onEscalate}
            disabled={ask.escalated}
            style={{
              fontSize: 11,
              color: ask.escalated ? '#a8b098' : '#a85a3a',
              background: 'transparent',
              border: 'none',
              cursor: ask.escalated ? 'default' : 'pointer',
              padding: 0,
              letterSpacing: 1,
            }}
          >
            {ask.escalated ? '已请求真人跟进' : '我想找真人聊聊 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Bubble({ role, content }: { role: 'user' | 'ai' | 'agent'; content: string }) {
  if (role === 'agent') {
    return (
      <div
        style={{
          alignSelf: 'flex-start',
          maxWidth: '86%',
          padding: '4px 0 0',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            color: '#7a5a2a',
            letterSpacing: 1,
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>🌿</span>
          <span>机构工作人员</span>
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '14px 14px 14px 4px',
            background: 'linear-gradient(135deg, #fff5e8, #fbf3df)',
            color: '#3a2e18',
            border: '1px solid #e6c98a',
            fontSize: 13,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content || '…'}
        </div>
      </div>
    )
  }
  const isUser = role === 'user'
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        padding: '8px 12px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'rgba(60,90,60,0.92)' : 'rgba(255,255,250,0.95)',
        color: isUser ? '#fffdf4' : '#2a3a2a',
        border: isUser ? 'none' : '1px solid rgba(70,80,60,0.12)',
        fontSize: 13,
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {content || '…'}
    </div>
  )
}
