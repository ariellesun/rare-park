import { GROVES } from '../data/groves'

/**
 * 公园家具：长椅、木质拱门、路灯柱
 * 沿主环道的某些位置摆放
 */

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 椅板 */}
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[1.4, 0.07, 0.36]} />
        <meshStandardMaterial color={'#c4a77a'} roughness={0.9} flatShading />
      </mesh>
      {/* 椅背 */}
      <mesh castShadow position={[0, 0.55, -0.16]}>
        <boxGeometry args={[1.4, 0.4, 0.05]} />
        <meshStandardMaterial color={'#b8997a'} roughness={0.9} flatShading />
      </mesh>
      {/* 椅腿 */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.16, 0]}>
          <boxGeometry args={[0.06, 0.32, 0.36]} />
          <meshStandardMaterial color={'#7a6044'} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 2.0, 8]} />
        <meshStandardMaterial color={'#5a4a3a'} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.05, 0]}>
        <icosahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          color={'#fff5d6'}
          emissive={'#fff0c0'}
          emissiveIntensity={0.6}
          flatShading
        />
      </mesh>
    </group>
  )
}

function Arch({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 两根立柱 */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} castShadow position={[x, 1.3, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 2.6, 8]} />
          <meshStandardMaterial color={'#a08260'} roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* 顶横梁（拱形，用半圆 torus） */}
      <mesh castShadow position={[0, 2.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.08, 8, 16, Math.PI]} />
        <meshStandardMaterial color={'#a08260'} roughness={0.95} flatShading />
      </mesh>
      {/* 拱顶上的藤蔓（绿球） */}
      <mesh castShadow position={[-0.6, 2.7, 0]}>
        <icosahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color={'#9bbc88'} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0.6, 2.7, 0]}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={'#a8c898'} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.85, 0]}>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={'#bcd098'} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

export default function Furniture() {
  // 沿主环上几个固定点摆家具
  // 主环是各林地位置 * 0.78，挑几个间隙位置
  const sorted = [...GROVES]
    .map((g) => ({
      x: g.position[0] * 0.78,
      z: g.position[1] * 0.78,
      ang: Math.atan2(g.position[1], g.position[0]),
    }))
    .sort((a, b) => a.ang - b.ang)

  // 在相邻林地的"中间"放长椅/路灯
  const midpoints: { x: number; z: number; rot: number }[] = []
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    const b = sorted[(i + 1) % sorted.length]
    const mx = (a.x + b.x) / 2
    const mz = (a.z + b.z) / 2
    const tan = Math.atan2(b.z - a.z, b.x - a.x)
    midpoints.push({ x: mx, z: mz, rot: tan + Math.PI / 2 })
  }

  return (
    <group>
      {/* 入口拱门：园区南侧（z 大的方向）一个 */}
      <Arch position={[-2, 0, 26]} rotation={0} />
      <Arch position={[3, 0, -26]} rotation={Math.PI} />

      {/* 长椅：每两个林地之间放一把，但只放一半（避免太密） */}
      {midpoints
        .filter((_, i) => i % 2 === 0)
        .map((m, i) => (
          <Bench key={`b${i}`} position={[m.x, 0, m.z]} rotation={m.rot} />
        ))}

      {/* 路灯：每两个林地之间放一个（错开长椅） */}
      {midpoints
        .filter((_, i) => i % 2 === 1)
        .map((m, i) => (
          <LampPost key={`lp${i}`} position={[m.x, 0, m.z]} />
        ))}
    </group>
  )
}
