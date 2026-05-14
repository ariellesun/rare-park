import { useMemo } from 'react'
import { UmbrellaTree, Conifer, WeepingTree, BlobBush } from './Plants'
import { GROVES } from '../data/groves'

/**
 * 外环背景密林：在公园边缘绕一圈高大乔木 + 灌木，
 * 让远景"满"起来，给人"被植物包围"的氛围。
 *
 * 策略：在 R_INNER ~ R_OUTER 的环形区域内泊松式撒点，
 * 避开 10 个主题林地范围。
 */

const R_INNER = 32
const R_OUTER = 56
const TOTAL_TREES = 110
const TOTAL_BUSHES = 160

// 几种背景树的色彩样本（偏冷绿、远景褪色感）
const TREE_PALETTE = [
  { crown: '#9bbc88', accent: '#c8d8a8', trunk: '#8a7660' },
  { crown: '#b0c898', accent: '#d4dcb8', trunk: '#9a8870' },
  { crown: '#8aae78', accent: '#b8c898', trunk: '#7a6850' },
  { crown: '#a8c0a0', accent: '#cad8c0', trunk: '#8a7860' },
  { crown: '#c0c8a8', accent: '#dde0c4', trunk: '#a09080' },
]

const BUSH_PALETTE = [
  { c: '#b8c898', a: '#dce0b8' },
  { c: '#a8c0a0', a: '#cad8c0' },
  { c: '#9bbc88', a: '#c8d8a8' },
  { c: '#c0d0b0', a: '#e0e8c8' },
]

// 简单确定性随机
function makeRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function farFromGroves(x: number, z: number, minDist: number) {
  for (const g of GROVES) {
    const dx = g.position[0] - x
    const dz = g.position[1] - z
    if (dx * dx + dz * dz < minDist * minDist) return false
  }
  return true
}

function ringScatter(count: number, rIn: number, rOut: number, seed: number, minDistFromGrove: number) {
  const rand = makeRand(seed)
  const pts: { x: number; z: number; rot: number; scale: number }[] = []
  let tries = 0
  while (pts.length < count && tries < count * 10) {
    tries++
    const r = Math.sqrt(rand() * (rOut * rOut - rIn * rIn) + rIn * rIn)
    const a = rand() * Math.PI * 2
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!farFromGroves(x, z, minDistFromGrove)) continue
    pts.push({
      x,
      z,
      rot: rand() * Math.PI * 2,
      scale: 0.9 + rand() * 0.6,
    })
  }
  return pts
}

export default function BackgroundForest() {
  const trees = useMemo(() => ringScatter(TOTAL_TREES, R_INNER, R_OUTER, 7, 6), [])
  const bushes = useMemo(() => ringScatter(TOTAL_BUSHES, R_INNER - 2, R_OUTER, 13, 5), [])

  return (
    <group>
      {trees.map((t, i) => {
        const variant = i % 5
        const pal = TREE_PALETTE[i % TREE_PALETTE.length]
        const pos: [number, number, number] = [t.x, 0, t.z]
        if (variant === 0)
          return (
            <UmbrellaTree
              key={`bt${i}`}
              position={pos}
              scale={t.scale * 1.15}
              rotation={t.rot}
              crown={pal.crown}
              accent={pal.accent}
              trunk={pal.trunk}
            />
          )
        if (variant === 1)
          return (
            <Conifer
              key={`bt${i}`}
              position={pos}
              scale={t.scale * 1.2}
              rotation={t.rot}
              crown={pal.crown}
              trunk={pal.trunk}
            />
          )
        if (variant === 2)
          return (
            <WeepingTree
              key={`bt${i}`}
              position={pos}
              scale={t.scale * 1.1}
              rotation={t.rot}
              crown={pal.crown}
              accent={pal.accent}
              trunk={pal.trunk}
            />
          )
        return (
          <UmbrellaTree
            key={`bt${i}`}
            position={pos}
            scale={t.scale}
            rotation={t.rot}
            crown={pal.crown}
            accent={pal.accent}
            trunk={pal.trunk}
          />
        )
      })}
      {bushes.map((b, i) => {
        const pal = BUSH_PALETTE[i % BUSH_PALETTE.length]
        return (
          <BlobBush
            key={`bb${i}`}
            position={[b.x, 0, b.z]}
            scale={b.scale * 0.95}
            rotation={b.rot}
            color={pal.c}
            accent={pal.a}
          />
        )
      })}
    </group>
  )
}
