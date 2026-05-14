import { useMemo, useState } from 'react'
import {
  useKb,
  addKb,
  updateKb,
  deleteKb,
  resetKb,
  KB_CATEGORY_LABEL,
  type KbCategory,
  type KbItem,
} from '../../state/kbStore'
import { btnStyle, card, inputStyle, sectionTitle, ui } from '../uiKit'

/**
 * 知识库管理 Tab
 * - 分类筛选 + 关键字搜索
 * - 列表 + 编辑弹窗（新增 / 编辑）
 * - 删除 / 重置
 */
export default function KnowledgeTab() {
  const items = useKb()
  const [filter, setFilter] = useState<KbCategory | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<KbItem | 'new' | null>(null)

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter !== 'all' && it.category !== filter) return false
      if (keyword.trim()) {
        const k = keyword.toLowerCase()
        const hay = (it.title + it.summary + it.keywords.join(' ')).toLowerCase()
        if (!hay.includes(k)) return false
      }
      return true
    })
  }, [items, filter, keyword])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <CategoryChip
          label={`全部 ${items.length}`}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        {(Object.keys(KB_CATEGORY_LABEL) as KbCategory[]).map((c) => {
          const count = items.filter((i) => i.category === c).length
          return (
            <CategoryChip
              key={c}
              label={`${KB_CATEGORY_LABEL[c]} ${count}`}
              active={filter === c}
              onClick={() => setFilter(c)}
            />
          )
        })}
        <input
          type="text"
          placeholder="搜索标题/关键词"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ ...inputStyle, width: 240, marginLeft: 'auto' }}
        />
        <button onClick={() => setEditing('new')} style={btnStyle(ui.accent, '#fff')}>
          + 新增
        </button>
        <button
          onClick={() => {
            if (window.confirm('确认重置知识库为默认数据？所有自定义条目将丢失。')) {
              resetKb()
            }
          }}
          style={btnStyle('#fff', ui.danger, ui.danger)}
        >
          重置
        </button>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: ui.cardSoft }}>
              <Th width={88}>分类</Th>
              <Th>标题 / 摘要</Th>
              <Th width={180}>关键词</Th>
              <Th width={120}>更新时间</Th>
              <Th width={130}>操作</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: ui.textMuted }}>
                  暂无条目
                </td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id} style={{ borderTop: `1px solid ${ui.borderSoft}` }}>
                  <Td>
                    <Tag>{KB_CATEGORY_LABEL[it.category]}</Tag>
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 500, color: ui.text }}>{it.title}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: ui.textMuted,
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {it.summary}
                    </div>
                  </Td>
                  <Td>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                      }}
                    >
                      {it.keywords.slice(0, 4).map((k) => (
                        <span
                          key={k}
                          style={{
                            fontSize: 11,
                            padding: '1px 6px',
                            background: '#ebe7d4',
                            borderRadius: 4,
                          }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ color: ui.textMuted }}>{formatDate(it.updatedAt)}</span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => setEditing(it)}
                      style={{ ...btnStyle('#fff', ui.text, ui.borderInput), padding: '4px 10px' }}
                    >
                      编辑
                    </button>{' '}
                    <button
                      onClick={() => {
                        if (window.confirm(`删除"${it.title}"？`)) deleteKb(it.id)
                      }}
                      style={{
                        ...btnStyle('#fff', ui.danger, ui.borderInput),
                        padding: '4px 10px',
                      }}
                    >
                      删除
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ ...sectionTitle, textAlign: 'center', marginTop: 4 }}>
        所有条目存储在本地（localStorage）；接入机构知识库后可一键同步至云端。
      </div>

      {editing && (
        <KbEditor
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

/* ───── 编辑弹窗 ───── */

function KbEditor({ item, onClose }: { item: KbItem | null; onClose: () => void }) {
  const [category, setCategory] = useState<KbCategory>(item?.category ?? 'faq')
  const [title, setTitle] = useState(item?.title ?? '')
  const [summary, setSummary] = useState(item?.summary ?? '')
  const [content, setContent] = useState(item?.content ?? '')
  const [keywords, setKeywords] = useState((item?.keywords ?? []).join(', '))

  function save() {
    if (!title.trim()) {
      alert('标题不能为空')
      return
    }
    const kws = keywords
      .split(/[,，;；\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (item) {
      updateKb(item.id, { category, title, summary, content, keywords: kws })
    } else {
      addKb({ category, title, summary, content, keywords: kws })
    }
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,28,18,0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxHeight: '88vh',
          background: ui.card,
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: 2 }}>
          {item ? '编辑知识条目' : '新增知识条目'}
        </div>

        <Field label="分类">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as KbCategory)}
            style={inputStyle}
          >
            {(Object.keys(KB_CATEGORY_LABEL) as KbCategory[]).map((c) => (
              <option key={c} value={c}>
                {KB_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="标题">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            placeholder="如：SMA 患者可申请的主要救助基金"
          />
        </Field>
        <Field label="摘要（AI 召回时优先展示）">
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="完整内容">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={7}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          />
        </Field>
        <Field label="关键词（逗号或空格分隔）">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            style={inputStyle}
            placeholder="如：SMA, 基金, 救助"
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={btnStyle('#fff', ui.text, ui.borderInput)}>
            取消
          </button>
          <button onClick={save} style={btnStyle(ui.accent, '#fff')}>
            保存
          </button>
        </div>
      </div>
    </div>
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

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        background: active ? ui.accent : '#fff',
        color: active ? '#fff' : ui.text,
        border: `1px solid ${active ? ui.accent : ui.borderInput}`,
        borderRadius: 999,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function Th({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <th
      style={{
        padding: '10px 14px',
        textAlign: 'left',
        fontSize: 12,
        letterSpacing: 2,
        color: ui.textMuted,
        fontWeight: 500,
        width,
      }}
    >
      {children}
    </th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '12px 14px', verticalAlign: 'top', color: ui.text }}>{children}</td>
  )
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 8px',
        background: '#ebe7d4',
        borderRadius: 4,
        color: ui.text,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
function formatDate(ts: number) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
