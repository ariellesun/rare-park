import { useSyncExternalStore } from 'react'
import { GROVES as DEFAULT_GROVES, type GroveData } from '../data/groves'

/**
 * Grove 数据 store
 * - 默认值：data/groves.ts 中的 GROVES
 * - 持久化：localStorage（key: glimmer.groves.v1）
 * - 仅持久化"可编辑字段"（name/subtitle/description/prevalence/mainColor/accentColor/position/size），
 *   recipe / trunk 等保持默认（避免存太多/不必要冗余）
 */

const KEY = 'glimmer.groves.v1'

export interface EditableGroveFields {
  name: string
  subtitle: string
  description: string
  prevalence: string
  mainColor: string
  accentColor: string
  position: [number, number]
  size: number
}

type Overrides = Record<string, Partial<EditableGroveFields>>

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Overrides
  } catch {
    return {}
  }
}

let overrides: Overrides = loadOverrides()
const listeners = new Set<() => void>()

function emit() {
  // 写盘
  try {
    localStorage.setItem(KEY, JSON.stringify(overrides))
  } catch {
    // ignore quota
  }
  listeners.forEach((l) => l())
}

function buildMerged(): GroveData[] {
  return DEFAULT_GROVES.map((g) => {
    const o = overrides[g.id]
    if (!o) return g
    return { ...g, ...o }
  })
}

let mergedCache = buildMerged()

function refreshCache() {
  mergedCache = buildMerged()
}

export function getGroves(): GroveData[] {
  return mergedCache
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useGroves(): GroveData[] {
  return useSyncExternalStore(subscribe, getGroves, getGroves)
}

export function updateGrove(id: string, patch: Partial<EditableGroveFields>) {
  const prev = overrides[id] ?? {}
  overrides = { ...overrides, [id]: { ...prev, ...patch } }
  refreshCache()
  emit()
}

export function resetGrove(id: string) {
  if (!overrides[id]) return
  const next = { ...overrides }
  delete next[id]
  overrides = next
  refreshCache()
  emit()
}

export function resetAll() {
  overrides = {}
  refreshCache()
  emit()
}

export function exportGrovesJson(): string {
  return JSON.stringify(getGroves(), null, 2)
}

export function hasOverride(id: string): boolean {
  return Boolean(overrides[id])
}
