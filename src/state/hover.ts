import { useSyncExternalStore } from 'react'

/**
 * 极简全局 hover 状态：当前悬停的 grove id
 * 不依赖外部库，避免引入额外依赖
 */

let currentHoverId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function setHoverGrove(id: string | null) {
  if (currentHoverId === id) return
  currentHoverId = id
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return currentHoverId
}

function getServerSnapshot() {
  return null as string | null
}

export function useHoverGrove(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
