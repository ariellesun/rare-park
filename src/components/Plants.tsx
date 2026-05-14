import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * 植物库：受奥道夫花园 / 园林俯瞰图启发，提供多种形态
 * - BlobBush:   圆球灌木（最基础的"绿球球"）
 * - UmbrellaTree: 伞形大树（高大主体）
 * - WeepingTree: 垂枝树（柳树/樱花的下垂感）
 * - GrassClump: 芒草丛（细线条立面）
 * - GroundCover: 地被丛（贴地的低矮花草）
 * - Conifer:    针叶树（锥形）
 *
 * 所有植物都用程序化几何体 + flatShading，保持手绘/低多边形质感
 */

interface BasePlantProps {
  position: [number, number, number]
  scale?: number
  rotation?: number
}

/* ───── 圆球灌木 ───── */
export function BlobBush({
  position,
  scale = 1,
  rotation = 0,
  color,
  accent,
}: BasePlantProps & { color: string; accent?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0.35, 0.7, 0.15]}>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color={accent ?? color} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[-0.3, 0.6, 0.2]}>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

/* ───── 伞形大树 ───── */
export function UmbrellaTree({
  position,
  scale = 1,
  rotation = 0,
  crown,
  trunk,
  accent,
}: BasePlantProps & { crown: string; trunk: string; accent?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* 树干 */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 2.0, 8]} />
        <meshStandardMaterial color={trunk} roughness={0.95} />
      </mesh>
      {/* 主冠 */}
      <mesh castShadow position={[0, 2.4, 0]}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={crown} roughness={0.85} flatShading />
      </mesh>
      {/* 冠侧 */}
      <mesh castShadow position={[0.7, 2.5, 0.3]}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color={accent ?? crown} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[-0.6, 2.6, -0.3]}>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial color={crown} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0.1, 3.1, 0.1]}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color={accent ?? crown} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

/* ───── 垂枝树（樱花/柳树感） ───── */
export function WeepingTree({
  position,
  scale = 1,
  rotation = 0,
  crown,
  trunk,
  accent,
}: BasePlantProps & { crown: string; trunk: string; accent?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 1.6, 8]} />
        <meshStandardMaterial color={trunk} roughness={0.95} />
      </mesh>
      {/* 椭圆扁平的冠（更像下垂） */}
      <mesh castShadow position={[0, 2.0, 0]} scale={[1.4, 0.7, 1.4]}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial color={crown} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0.5, 1.7, 0.3]} scale={[0.9, 0.6, 0.9]}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color={accent ?? crown} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[-0.4, 1.8, -0.2]} scale={[0.8, 0.5, 0.8]}>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial color={crown} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

/* ───── 针叶树（锥形） ───── */
export function Conifer({
  position,
  scale = 1,
  rotation = 0,
  crown,
  trunk,
}: BasePlantProps & { crown: string; trunk: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
        <meshStandardMaterial color={trunk} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <coneGeometry args={[0.7, 1.6, 8]} />
        <meshStandardMaterial color={crown} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.2, 0]}>
        <coneGeometry args={[0.5, 1.1, 8]} />
        <meshStandardMaterial color={crown} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.85, 0]}>
        <coneGeometry args={[0.32, 0.7, 8]} />
        <meshStandardMaterial color={crown} roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

/* ───── 芒草丛（用细高柱体表现立面） ───── */
export function GrassClump({
  position,
  scale = 1,
  rotation = 0,
  color,
  accent,
}: BasePlantProps & { color: string; accent?: string }) {
  const blades = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      x: (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 0.5,
      h: 0.6 + Math.random() * 0.5,
      r: Math.random() * Math.PI,
      tilt: (Math.random() - 0.5) * 0.4,
      isAccent: i % 4 === 0,
    }))
  }, [])
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {blades.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.h / 2, b.z]}
          rotation={[b.tilt, b.r, b.tilt * 0.5]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.025, b.h, 4]} />
          <meshStandardMaterial color={b.isAccent ? (accent ?? color) : color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/* ───── 地被丛（贴地的小花/苔藓 patch） ───── */
export function GroundCover({
  position,
  scale = 1,
  rotation = 0,
  color,
  accent,
}: BasePlantProps & { color: string; accent?: string }) {
  const patches = useMemo(() => {
    return Array.from({ length: 9 }, () => ({
      x: (Math.random() - 0.5) * 1.0,
      z: (Math.random() - 0.5) * 1.0,
      r: 0.12 + Math.random() * 0.15,
      isAccent: Math.random() > 0.7,
    }))
  }, [])
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {patches.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.r * 0.5, p.z]}
          castShadow
        >
          <icosahedronGeometry args={[p.r, 0]} />
          <meshStandardMaterial color={p.isAccent ? (accent ?? color) : color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/* ───── 花朵（高一点的花） ───── */
export function FlowerPatch({
  position,
  scale = 1,
  rotation = 0,
  color,
  count = 6,
}: BasePlantProps & { color: string; count?: number }) {
  const flowers = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.7,
      z: (Math.random() - 0.5) * 0.7,
      h: 0.35 + Math.random() * 0.3,
    }))
  }, [count])
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, f.h / 2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, f.h, 4]} />
            <meshStandardMaterial color={'#7a9b5a'} />
          </mesh>
          <mesh position={[0, f.h, 0]} castShadow>
            <icosahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial
              color={color}
              roughness={0.55}
              emissive={color}
              emissiveIntensity={0.12}
              flatShading
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ───── 蘑菇（彩色趣味元素） ───── */
export function Mushroom({
  position,
  scale = 1,
  rotation = 0,
  cap,
}: BasePlantProps & { cap: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.3, 6]} />
        <meshStandardMaterial color={'#f5ece0'} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cap} roughness={0.6} flatShading />
      </mesh>
    </group>
  )
}

/* ───── 小石头 ───── */
export function Stone({
  position,
  scale = 1,
  rotation = 0,
}: BasePlantProps) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} scale={scale} castShadow>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color={'#bfb8a8'} roughness={1} flatShading />
    </mesh>
  )
}

/* 工具：使用泊松式分散点 */
export function scatter(
  count: number,
  radiusX: number,
  radiusZ: number,
  seed = 1
): { x: number; z: number; rot: number; scale: number }[] {
  // 简单确定性伪随机（可让分布稳定）
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: count }, () => ({
    x: (rand() - 0.5) * radiusX * 2,
    z: (rand() - 0.5) * radiusZ * 2,
    rot: rand() * Math.PI * 2,
    scale: 0.8 + rand() * 0.5,
  }))
}

// 防止 lint 报未使用
void THREE
