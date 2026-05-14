import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import DashboardTab from './tabs/DashboardTab'
import TicketsTab from './tabs/TicketsTab'
import KnowledgeTab from './tabs/KnowledgeTab'
import GroveContentTab from './tabs/GroveContentTab'
import {
  getProvider,
  setProvider,
  getHealth,
  onHealthChange,
  getHunyuanConfig,
  setHunyuanConfig,
  type ProviderId,
  type ProviderHealth,
} from '../ai/client'
import { btnStyle, ui } from './uiKit'

type TabId = 'dashboard' | 'tickets' | 'kb' | 'grove'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: '数据看板', icon: '📊' },
  { id: 'tickets', label: '工单工作台', icon: '📨' },
  { id: 'kb', label: '知识库', icon: '📚' },
  { id: 'grove', label: '林地内容', icon: '🌿' },
]

/**
 * B 端工作台 · 萤光 / 微光珍境
 *
 * 四个 tab：数据看板 / 工单工作台 / 知识库 / 林地内容
 * 顶栏右侧提供 AI Provider 切换，便于演示/接真实模型。
 */
export default function Admin() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [provider, setProviderState] = useState<ProviderId>(getProvider())
  const [health, setHealthState] = useState<ProviderHealth>(getHealth())
  const [showHunyuanCfg, setShowHunyuanCfg] = useState(false)
  const [cfg, setCfg] = useState(getHunyuanConfig())

  useEffect(() => {
    const off = onHealthChange(setHealthState)
    return () => {
      off()
    }
  }, [])

  function changeProvider(p: ProviderId) {
    setProvider(p)
    setProviderState(p)
  }

  function saveHunyuan() {
    setHunyuanConfig(cfg)
    // 配了 key 自动切到 hunyuan
    if (cfg.apiKey.trim()) {
      setProvider('hunyuan')
      setProviderState('hunyuan')
    }
    setShowHunyuanCfg(false)
  }

  /**
   * 一键重置：清掉 localStorage 里所有 AI 相关残留，回到 .env.local / 默认值。
   * 用于排障——比如老 base url、老模型名残留导致状态灯异常。
   */
  function resetAiConfig() {
    if (!confirm('将清除浏览器里保存的 AI 配置（API Key / Base URL / Model / Provider 选择），回到内置默认。继续？')) return
    try {
      ;[
        'glimmer.ai.provider.v1',
        'glimmer.hunyuan.apiKey',
        'glimmer.hunyuan.baseUrl',
        'glimmer.hunyuan.model',
      ].forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
    location.reload()
  }

  // 状态灯颜色
  const healthColor =
    provider === 'mock'
      ? '#c98e4a' // 黄：离线演示
      : health === 'online'
        ? '#5a8a4a' // 绿：在线
        : health === 'offline'
          ? '#a14040' // 红：失败
          : '#999' // 灰：未知
  const healthLabel =
    provider === 'mock'
      ? 'mock 离线演示'
      : health === 'online'
        ? '在线'
        : health === 'offline'
          ? '降级 mock'
          : '待首次调用'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: ui.bg,
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        color: ui.text,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ───── 顶栏 ───── */}
      <header
        style={{
          padding: '16px 28px 0 28px',
          background: ui.card,
          borderBottom: `1px solid ${ui.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: 6, opacity: 0.55 }}>
              GLIMMER · WORKBENCH
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                marginTop: 3,
                letterSpacing: 4,
                color: ui.text,
              }}
            >
              萤光 · 罕见病智能客服工作台
            </div>
            <div style={{ fontSize: 12, color: ui.textMuted, marginTop: 4 }}>
              多渠道汇总 · 自动分类 · AI 起草 · 知识库协同
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: ui.cardSoft,
                border: `1px solid ${ui.borderSoft}`,
                borderRadius: 999,
                fontSize: 12,
                color: ui.textMuted,
              }}
              title="AI 服务提供商，可切换"
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: healthColor,
                  boxShadow: `0 0 8px ${healthColor}`,
                  flex: '0 0 auto',
                }}
                title={healthLabel}
              />
              <span>AI</span>
              <select
                value={provider}
                onChange={(e) => changeProvider(e.target.value as ProviderId)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 12,
                  color: ui.text,
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="mock">离线演示（mock）</option>
                <option value="hunyuan">腾讯混元</option>
              </select>
              <span style={{ fontSize: 11, opacity: 0.7 }}>· {healthLabel}</span>
              {provider === 'hunyuan' && (
                <button
                  onClick={() => setShowHunyuanCfg(true)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: ui.accent,
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                    marginLeft: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  ⚙ 配置
                </button>
              )}
            </div>
            <a
              href="#/"
              style={{
                ...btnStyle('#fff', ui.text, ui.text),
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              ← 前台预览
            </a>
          </div>
        </div>

        {/* ───── Tab Bar ───── */}
        <div style={{ display: 'flex', gap: 4, marginTop: 16, marginLeft: -8 }}>
          {TABS.map((t) => {
            const active = t.id === tab
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: active ? ui.text : ui.textMuted,
                  border: 'none',
                  borderBottom: `2px solid ${active ? ui.accent : 'transparent'}`,
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginBottom: -1,
                }}
              >
                <span style={{ marginRight: 6 }}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* ───── 主体 ───── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'tickets' && <TicketsTab />}
        {tab === 'kb' && <KnowledgeTab />}
        {tab === 'grove' && <GroveContentTab />}
      </div>

      {/* ───── 混元配置弹层 ───── */}
      {showHunyuanCfg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(40,40,30,0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowHunyuanCfg(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 480,
              background: ui.card,
              borderRadius: 12,
              border: `1px solid ${ui.border}`,
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 500, color: ui.text, marginBottom: 4 }}>
              腾讯混元 · 接入配置
            </div>
            <div style={{ fontSize: 12, color: ui.textMuted, marginBottom: 18, lineHeight: 1.6 }}>
              填入 API Key 后将走 OpenAI 兼容协议直连。生产环境请在后端做密钥代管，
              避免在前端暴露密钥。
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="API Key">
                <input
                  type="password"
                  value={cfg.apiKey}
                  onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
                  placeholder="sk-..."
                  style={inputCfgStyle}
                />
              </Field>
              <Field label="Base URL">
                <input
                  type="text"
                  value={cfg.baseUrl}
                  onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })}
                  style={inputCfgStyle}
                />
              </Field>
              <Field label="Model">
                <input
                  type="text"
                  value={cfg.model}
                  onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
                  style={inputCfgStyle}
                />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <button
                onClick={resetAiConfig}
                style={btnStyle('#fff', ui.textSoft, ui.borderSoft)}
                title="清掉浏览器里保存的 API Key / Base URL / Model，回到 .env.local 默认"
              >
                ↺ 重置为默认
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowHunyuanCfg(false)}
                  style={btnStyle('#fff', ui.textSoft, ui.borderSoft)}
                >
                  取消
                </button>
                <button onClick={saveHunyuan} style={btnStyle(ui.accent, '#fff')}>
                  保存并启用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: ui.textMuted, letterSpacing: 1 }}>{label}</span>
      {children}
    </label>
  )
}

const inputCfgStyle: CSSProperties = {
  padding: '10px 12px',
  border: `1px solid ${ui.borderSoft}`,
  borderRadius: 8,
  background: ui.cardSoft,
  color: ui.text,
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
}
