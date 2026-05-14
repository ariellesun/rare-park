/**
 * Admin 共享样式与小工具
 */
import type { CSSProperties } from 'react'

export const ui = {
  bg: '#f6f5ec',
  card: '#fffdf4',
  cardSoft: '#fdfcf3',
  border: '#e3e0cc',
  borderSoft: '#ebe7d4',
  borderInput: '#d6d2bc',
  text: '#2a3a2a',
  textSoft: '#5a6a4a',
  textMuted: '#7a8870',
  accent: '#2a3a2a',
  danger: '#a14040',
  warn: '#e8b830',
  // 与林地呼应的色板（用于图表）
  palette: ['#7c9a4a', '#c98e4a', '#6e8aa8', '#b06a8a', '#9b8a4a', '#5a8a7a', '#a86a5a', '#7a7aa6', '#8a7a4a', '#6a8a4a'],
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${ui.borderInput}`,
  borderRadius: 8,
  background: ui.card,
  color: ui.text,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export function btnStyle(bg: string, color: string, border?: string): CSSProperties {
  return {
    padding: '8px 16px',
    background: bg,
    color,
    border: `1px solid ${border ?? bg}`,
    borderRadius: 8,
    fontSize: 13,
    letterSpacing: 1,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

export const card: CSSProperties = {
  background: ui.card,
  border: `1px solid ${ui.borderSoft}`,
  borderRadius: 12,
  padding: 18,
}

export const sectionTitle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 4,
  color: ui.textMuted,
  marginBottom: 12,
}
