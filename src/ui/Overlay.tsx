import { useHoverGrove } from '../state/hover'
import { useGroves } from '../state/grovesStore'
import { useAsk, openAsk } from '../state/askStore'
import { useTickets } from '../state/ticketStore'

/**
 * UI 浮层：标题 + 提示 + 悬停信息卡 + 絮语入口 + 实时陪伴气泡
 * 不在 Canvas 内部，避免和 R3F 冲突
 */
export default function Overlay() {
  const hoverId = useHoverGrove()
  const groves = useGroves()
  const grove = hoverId ? groves.find((g) => g.id === hoverId) : null
  const ask = useAsk()
  const tickets = useTickets()

  // 今日通过 C 端公园（miniprogram + 絮语来源）产生的会话数
  const today = new Date()
  const companionCount = tickets.filter((t) => {
    const d = new Date(t.createdAt)
    return (
      t.channel === 'miniprogram' &&
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  }).length

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      {/* 右上：陪伴气泡 + 管理后台入口 */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 40,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {companionCount > 0 && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(255,253,246,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(70,80,60,0.18)',
              borderRadius: 999,
              color: '#3a4a30',
              fontSize: 12,
              letterSpacing: 1.5,
              boxShadow: '0 4px 14px rgba(70,80,60,0.10)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#7c9a4a',
                boxShadow: '0 0 8px #b8d488',
              }}
            />
            今日已陪伴 <strong>{companionCount}</strong> 位家属
          </div>
        )}
        <a
          href="#/admin"
          style={{
            padding: '8px 14px',
            background: 'rgba(255,253,246,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(70,80,60,0.18)',
            borderRadius: 999,
            color: '#2a3a2a',
            fontSize: 12,
            letterSpacing: 3,
            textDecoration: 'none',
            pointerEvents: 'auto',
            boxShadow: '0 4px 14px rgba(70,80,60,0.10)',
          }}
        >
          ⚙ 管理后台
        </a>
      </div>

      {/* 左上：品牌 */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 40,
          color: '#2a3a2a',
          textShadow: '0 1px 8px rgba(255,255,255,0.7)',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 7, opacity: 0.65 }}>
          GLIMMER · SANCTUM
        </div>
        <div style={{ fontSize: 38, fontWeight: 300, marginTop: 6, letterSpacing: 8 }}>
          微光珍境
        </div>
        <div style={{ fontSize: 13, marginTop: 8, opacity: 0.7, fontStyle: 'italic', letterSpacing: 1 }}>
          每一束微光，都值得被看见
        </div>
        {/* 赛题对应说明：让评委 3 秒内知道我们在解什么题 */}
        <div
          style={{
            marginTop: 14,
            padding: '6px 12px',
            background: 'rgba(255,253,246,0.7)',
            border: '1px solid rgba(70,80,60,0.14)',
            borderRadius: 999,
            fontSize: 11.5,
            letterSpacing: 1.5,
            color: '#3a4a30',
            display: 'inline-block',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          面向罕见病的 AI 智能客服 · 多渠道汇聚 · 知识可追溯 · 人机协同
        </div>
      </div>

      {/* 右上方：操作提示（让位给右下的"问问 AI"按钮） */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          right: 40,
          color: '#2a3a2a',
          textShadow: '0 1px 6px rgba(255,255,255,0.7)',
          fontSize: 11.5,
          letterSpacing: 2,
          opacity: 0.55,
          textAlign: 'right',
          lineHeight: 1.7,
          pointerEvents: 'none',
        }}
      >
        <div>左键拖动 · 旋转视角</div>
        <div>滚轮 · 缩放</div>
        <div style={{ marginTop: 6, opacity: 0.95 }}>悬停林地查看 · 点击对话</div>
      </div>

      {/* 左下：悬停信息卡 */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 40,
          width: 360,
          padding: '20px 24px',
          background: 'rgba(255, 253, 246, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 14,
          border: `1px solid ${grove ? grove.mainColor : 'rgba(0,0,0,0.06)'}`,
          boxShadow: '0 8px 28px rgba(70, 80, 60, 0.12)',
          color: '#2a3a2a',
          opacity: grove ? 1 : 0,
          transform: grove ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease, border-color 0.35s ease',
          pointerEvents: 'none',
        }}
      >
        {grove && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: grove.mainColor,
                  boxShadow: `0 0 12px ${grove.accentColor}`,
                }}
              />
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: 2 }}>
                {grove.name}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                marginTop: 6,
                marginLeft: 20,
                opacity: 0.6,
                letterSpacing: 1.5,
              }}
            >
              {grove.subtitle}
            </div>
            <div
              style={{
                fontSize: 13.5,
                marginTop: 14,
                lineHeight: 1.75,
                opacity: 0.85,
              }}
            >
              {grove.description}
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px dashed rgba(70,80,60,0.18)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                letterSpacing: 1,
                opacity: 0.6,
              }}
            >
              <span>珍稀度</span>
              <span style={{ color: grove.mainColor, fontWeight: 500 }}>
                {grove.prevalence}
              </span>
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 11.5,
                letterSpacing: 1.5,
                color: grove.mainColor,
                opacity: 0.85,
              }}
            >
              点击林地 · 与 AI 园丁低语 →
            </div>
          </>
        )}
      </div>

      {/* 右下：常驻"问问 AI"浮动按钮（絮语已打开时隐藏） */}
      {!ask.open && (
        <button
          onClick={() => openAsk(null)}
          style={{
            position: 'absolute',
            right: 28,
            bottom: 28,
            padding: '12px 18px',
            borderRadius: 999,
            border: '1px solid rgba(70,80,60,0.18)',
            background: 'rgba(255,253,246,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#2a3a2a',
            fontSize: 12.5,
            letterSpacing: 2,
            cursor: 'pointer',
            pointerEvents: 'auto',
            boxShadow: '0 8px 22px rgba(70,80,60,0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'inherit',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ff9ec4',
              boxShadow: '0 0 10px #ff9ec4',
            }}
          />
          问问 AI 园丁
        </button>
      )}
    </div>
  )
}
