import { useMemo } from 'react'
import { GROVES } from '../data/groves'
import { GroundCover, GrassClump, BlobBush, FlowerPatch } from './Plants'

/**
 * 林地间的过渡植被基质（matrix planting）：
 * 在主题林地之间的"空地"散落地被、芒草、零星灌木、零星花，
 * 让公园不会有大块光秃秃的地方。
 *
 * 范围：以原点为中心、半径 R_BASE 内、避开林地 minDist 范围内
 */

const R_BASE = 30
const COVER_COUNT = 220
const GRASS_COUNT = 110
const SMALL_BUSH_COUNT = 55
const STRAY_FLOWER_COUNT = 35

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

// 避开中央小溪带（粗略：x 范围全场，z 在 [-3, 3]）
function farFromStream(x: number, z: number) {
  if (Math.abs(x) > 32) return true
  // 粗暴：z 距离中心轴 > 2.5
  return Math.abs(z) > 2.5
}

function diskScatter(
  count: number,
  rMax: number,
  minFromGrove: number,
  seed: number,
  avoidStream = true
) {
  const rand = makeRand(seed)
  const pts: { x: number; z: number; rot: number; scale: number }[] = []
  let tries = 0
  while (pts.length < count && tries < count * 8) {
    tries++
    const r = Math.sqrt(rand()) * rMax
    const a = rand() * Math.PI * 2
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!farFromGroves(x, z, minFromGrove)) continue
    if (avoidStream && !farFromStream(x, z)) continue
    pts.push({
      x,
      z,
      rot: rand() * Math.PI * 2,
      scale: 0.7 + rand() * 0.6,
    })
  }
  return pts
}

const COVER_COLORS: Array<{ c: string; a: string }> = [
  { c: '#cfd8a8', a: '#e8e8c4' },
  { c: '#c8d8b0', a: '#e0e8c8' },
  { c: '#d4d8b0', a: '#ece8c0' },
  { c: '#bcd098', a: '#dde0b8' },
  { c: '#cdc8a0', a: '#ebe5c0' },
]

const GRASS_COLORS: Array<{ c: string; a: string }> = [
  { c: '#a8b87a', a: '#d0d098' },
  { c: '#b8c08a', a: '#dad8a8' },
  { c: '#a0b070', a: '#c8c890' },
  { c: '#b0c088', a: '#d8d8a8' },
]

const STRAY_FLOWER_COLORS = ['#ffd6e8', '#fff0a8', '#f0c4d8', '#fae0a0', '#ffe0c8', '#dccfee']
const SMALL_BUSH_COLORS: Array<{ c: string; a: string }> = [
  { c: '#bcd098', a: '#dce8b8' },
  { c: '#b0c898', a: '#cad8b0' },
  { c: '#aac088', a: '#c8d8a0' },
]

export default function Matrix() {
  const covers = useMemo(() => diskScatter(COVER_COUNT, R_BASE, 5.5, 31), [])
  const grasses = useMemo(() => diskScatter(GRASS_COUNT, R_BASE, 5.5, 53), [])
  const bushes = useMemo(() => diskScatter(SMALL_BUSH_COUNT, R_BASE, 6, 71), [])
  const flowers = useMemo(() => diskScatter(STRAY_FLOWER_COUNT, R_BASE, 5.5, 97), [])

  return (
    <group>
      {covers.map((p, i) => {
        const pal = COVER_COLORS[i % COVER_COLORS.length]
        return (
          <GroundCover
            key={`mc${i}`}
            position={[p.x, 0, p.z]}
            rotation={p.rot}
            scale={p.scale * 0.85}
            color={pal.c}
            accent={pal.a}
          />
        )
      })}
      {grasses.map((p, i) => {
        const pal = GRASS_COLORS[i % GRASS_COLORS.length]
        return (
          <GrassClump
            key={`mg${i}`}
            position={[p.x, 0, p.z]}
            rotation={p.rot}
            scale={p.scale * 0.9}
            color={pal.c}
            accent={pal.a}
          />
        )
      })}
      {bushes.map((p, i) => {
        const pal = SMALL_BUSH_COLORS[i % SMALL_BUSH_COLORS.length]
        return (
          <BlobBush
            key={`mb${i}`}
            position={[p.x, 0, p.z]}
            rotation={p.rot}
            scale={p.scale * 0.7}
            color={pal.c}
            accent={pal.a}
          />
        )
      })}
      {flowers.map((p, i) => (
        <FlowerPatch
          key={`mf${i}`}
          position={[p.x, 0, p.z]}
          rotation={p.rot}
          scale={p.scale * 0.85}
          color={STRAY_FLOWER_COLORS[i % STRAY_FLOWER_COLORS.length]}
          count={3}
        />
      ))}
    </group>
  )
}
