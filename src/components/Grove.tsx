import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GroveData, PlantRecipe } from '../data/groves'
import {
  BlobBush,
  UmbrellaTree,
  WeepingTree,
  Conifer,
  GrassClump,
  GroundCover,
  FlowerPatch,
  Mushroom,
  Stone,
  scatter,
} from './Plants'
import { setHoverGrove } from '../state/hover'
import { openAsk } from '../state/askStore'

/**
 * 一个林地（生态群落）：根据 recipe 装配多种植物
 * 灵感来自奥道夫花园的"高/中/低层"分层 + 留白
 *
 * v3：支持鼠标悬停 → 全局 hover 状态 + 高亮光柱放大
 */
export default function Grove({ grove }: { grove: GroveData }) {
  const [cx, cz] = grove.position
  const group = useRef<THREE.Group>(null)
  const beaconRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // 把每个 recipe 项展开成具体植物实例（位置、缩放、旋转）
  const plants = useMemo(() => {
    const all: Array<{
      key: string
      kind: PlantRecipe['kind']
      x: number
      z: number
      rot: number
      scale: number
      color: string
      color2: string
    }> = []

    grove.recipe.forEach((r, ri) => {
      const points = scatter(r.count, r.rx, r.rz, ri * 100 + grove.id.charCodeAt(0))
      points.forEach((p, pi) => {
        const resolveColor = (c?: string) => {
          if (!c) return grove.mainColor
          if (c === 'main') return grove.mainColor
          if (c === 'accent') return grove.accentColor
          if (c === 'trunk') return grove.trunk
          return c
        }
        all.push({
          key: `r${ri}_p${pi}`,
          kind: r.kind,
          x: p.x,
          z: p.z,
          rot: p.rot,
          scale: p.scale * (r.scale ?? 1),
          color: resolveColor(r.color),
          color2: resolveColor(r.color2),
        })
      })
    })
    return all
  }, [grove])

  // 林地呼吸动画 + 光柱脉冲
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.y = Math.sin(t * 0.15) * 0.005
    }
    if (beaconRef.current) {
      const t = state.clock.elapsedTime
      const targetScale = hovered ? 2.4 : 1
      const m = beaconRef.current
      const s = m.scale.x
      const next = s + (targetScale - s) * 0.15
      m.scale.set(next, next, next)
      // 上下浮动
      m.position.y = 5.0 + Math.sin(t * 1.2 + grove.id.charCodeAt(0)) * 0.2
    }
    if (haloRef.current) {
      const t = state.clock.elapsedTime
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = hovered ? 0.45 + Math.sin(t * 3) * 0.15 : 0
    }
  })

  // 用一个不可见的大圆作为 hover 检测区（覆盖整个林地）
  const handleOver = () => {
    setHovered(true)
    setHoverGrove(grove.id)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = () => {
    setHovered(false)
    setHoverGrove(null)
    document.body.style.cursor = 'auto'
  }
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    openAsk(grove.id)
  }

  return (
    <group position={[cx, 0, cz]} ref={group}>
      {/* 不可见 hover 检测圆盘（贴地） */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
        visible={false}
      >
        <circleGeometry args={[grove.size + 0.5, 24]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* 悬停时贴地的彩色光环（呼吸） */}
      <mesh
        ref={haloRef}
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[grove.size - 0.4, grove.size + 0.6, 48]} />
        <meshBasicMaterial
          color={grove.accentColor}
          transparent
          opacity={0}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {plants.map((p) => {
        const pos: [number, number, number] = [p.x, 0, p.z]
        switch (p.kind) {
          case 'umbrella':
            return (
              <UmbrellaTree
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                crown={p.color}
                trunk={grove.trunk}
                accent={p.color2}
              />
            )
          case 'weeping':
            return (
              <WeepingTree
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                crown={p.color}
                trunk={grove.trunk}
                accent={p.color2}
              />
            )
          case 'conifer':
            return (
              <Conifer
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                crown={p.color}
                trunk={grove.trunk}
              />
            )
          case 'bush':
            return (
              <BlobBush
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                color={p.color}
                accent={p.color2}
              />
            )
          case 'grass':
            return (
              <GrassClump
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                color={p.color}
                accent={p.color2}
              />
            )
          case 'cover':
            return (
              <GroundCover
                key={p.key}
                position={pos}
                scale={p.scale * 0.8}
                rotation={p.rot}
                color={p.color}
                accent={p.color2}
              />
            )
          case 'flower':
            return (
              <FlowerPatch
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                color={p.color}
              />
            )
          case 'mushroom':
            return (
              <Mushroom
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
                cap={p.color}
              />
            )
          case 'stone':
            return (
              <Stone
                key={p.key}
                position={pos}
                scale={p.scale}
                rotation={p.rot}
              />
            )
          default:
            return null
        }
      })}

      {/* 林地铭牌：浮空小光柱（hover 时放大） */}
      <mesh ref={beaconRef} position={[0, 5.0, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color={grove.accentColor} toneMapped={false} />
      </mesh>
    </group>
  )
}
