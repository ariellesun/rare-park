import { useState } from 'react'
import {
  useGroves,
  updateGrove,
  resetGrove,
  resetAll,
  hasOverride,
  exportGrovesJson,
  type EditableGroveFields,
} from '../../state/grovesStore'
import { btnStyle, inputStyle, ui } from '../uiKit'

/**
 * 林地内容 Tab
 * - 维护 C 端 3D 公园「微光珍境」的 10 片林地内容
 * - 改动通过 grovesStore 实时同步到前台
 */
export default function GroveContentTab() {
  const groves = useGroves()
  const [activeId, setActiveId] = useState<string>(groves[0]?.id ?? '')
  const [showExport, setShowExport] = useState(false)

  const active = groves.find((g) => g.id === activeId)

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧列表 */}
      <aside
        style={{
          width: 320,
          borderRight: `1px solid ${ui.border}`,
          background: ui.cardSoft,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            fontSize: 12,
            letterSpacing: 2,
            opacity: 0.6,
            borderBottom: `1px solid ${ui.borderSoft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>林地列表（共 {groves.length} 条）</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowExport(true)}
              style={{ ...btnStyle(ui.accent, '#fff'), padding: '4px 10px', fontSize: 11 }}
            >
              导出
            </button>
            <button
              onClick={() => {
                if (window.confirm('确认将所有林地重置为默认数据？')) resetAll()
              }}
              style={{
                ...btnStyle('#fff', ui.danger, ui.danger),
                padding: '4px 10px',
                fontSize: 11,
              }}
            >
              重置
            </button>
          </span>
        </div>
        {groves.map((g) => {
          const edited = hasOverride(g.id)
          const isActive = g.id === activeId
          return (
            <div
              key={g.id}
              onClick={() => setActiveId(g.id)}
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${ui.borderSoft}`,
                background: isActive ? '#f0eedd' : 'transparent',
                cursor: 'pointer',
                borderLeft: `3px solid ${isActive ? g.mainColor : 'transparent'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: g.mainColor,
                    border: `1px solid ${g.accentColor}`,
                    flex: '0 0 auto',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {g.name}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{g.subtitle}</div>
                </div>
                {edited && (
                  <span
                    style={{
                      fontSize: 10,
                      background: ui.warn,
                      color: '#3a2a00',
                      padding: '2px 6px',
                      borderRadius: 4,
                      letterSpacing: 1,
                    }}
                  >
                    已修改
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </aside>

      {/* 右侧编辑区 */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
        {active ? <Editor key={active.id} grove={active} /> : <div style={{ opacity: 0.5 }}>未选择林地</div>}
      </main>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
}

function Editor({ grove }: { grove: ReturnType<typeof useGroves>[number] }) {
  const edited = hasOverride(grove.id)
  const set = <K extends keyof EditableGroveFields>(k: K, v: EditableGroveFields[K]) => {
    updateGrove(grove.id, { [k]: v } as Partial<EditableGroveFields>)
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: grove.mainColor,
            border: `2px solid ${grove.accentColor}`,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: 2 }}>{grove.name}</div>
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2, letterSpacing: 1 }}>
            ID: {grove.id} · {grove.subtitle}
          </div>
        </div>
        {edited && (
          <button
            onClick={() => {
              if (window.confirm('放弃此林地的所有修改？')) resetGrove(grove.id)
            }}
            style={btnStyle('#fff', ui.danger, ui.danger)}
          >
            重置此项
          </button>
        )}
      </div>

      <Section title="文案">
        <Field label="名称">
          <input
            type="text"
            value={grove.name}
            onChange={(e) => set('name', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="副标题">
          <input
            type="text"
            value={grove.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="简介">
          <textarea
            value={grove.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>
        <Field label="珍稀度（发病率）">
          <input
            type="text"
            value={grove.prevalence}
            onChange={(e) => set('prevalence', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Section>

      <Section title="色彩">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="主色">
            <ColorInput value={grove.mainColor} onChange={(v) => set('mainColor', v)} />
          </Field>
          <Field label="强调色">
            <ColorInput value={grove.accentColor} onChange={(v) => set('accentColor', v)} />
          </Field>
        </div>
      </Section>

      <Section title="位置 & 尺寸">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="X 坐标">
            <input
              type="number"
              step={0.5}
              value={grove.position[0]}
              onChange={(e) => set('position', [parseFloat(e.target.value) || 0, grove.position[1]])}
              style={inputStyle}
            />
          </Field>
          <Field label="Z 坐标">
            <input
              type="number"
              step={0.5}
              value={grove.position[1]}
              onChange={(e) => set('position', [grove.position[0], parseFloat(e.target.value) || 0])}
              style={inputStyle}
            />
          </Field>
          <Field label="尺寸（半径）">
            <input
              type="number"
              step={0.5}
              min={3}
              max={12}
              value={grove.size}
              onChange={(e) => set('size', parseFloat(e.target.value) || 7)}
              style={inputStyle}
            />
          </Field>
        </div>
      </Section>

      <div
        style={{
          marginTop: 28,
          padding: 16,
          background: ui.cardSoft,
          border: `1px dashed ${ui.borderInput}`,
          borderRadius: 10,
          fontSize: 12,
          opacity: 0.7,
          lineHeight: 1.7,
        }}
      >
        改动会即时保存到本地并同步到前台 3D 公园「微光珍境」。
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: 4,
          color: ui.textMuted,
          marginBottom: 12,
          paddingBottom: 6,
          borderBottom: `1px solid ${ui.borderSoft}`,
        }}
      >
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 44,
          height: 38,
          padding: 0,
          border: `1px solid ${ui.borderInput}`,
          borderRadius: 6,
          background: 'transparent',
          cursor: 'pointer',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, fontFamily: 'monospace' }}
      />
    </div>
  )
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const [json] = useState(() => exportGrovesJson())
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,28,18,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxHeight: '78vh',
          background: ui.card,
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: 2 }}>导出 JSON</div>
          <button onClick={onClose} style={btnStyle('#fff', ui.text, ui.text)}>
            关闭
          </button>
        </div>
        <textarea
          readOnly
          value={json}
          style={{
            flex: 1,
            minHeight: 360,
            padding: 14,
            border: `1px solid ${ui.borderInput}`,
            borderRadius: 8,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            lineHeight: 1.5,
            background: '#f9f7eb',
            color: ui.text,
            resize: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <button
            onClick={() => navigator.clipboard?.writeText(json)}
            style={btnStyle(ui.accent, '#fff')}
          >
            复制到剪贴板
          </button>
        </div>
      </div>
    </div>
  )
}
