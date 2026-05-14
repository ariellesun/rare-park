import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GrassClump, GroundCover, Stone } from './Plants'

/**
 * 中央小溪：一条蜿蜒的曲线水流，从西穿到东
 * - 用 CatmullRom 曲线生成 ribbon（带状）几何体
 * - 浅水色，半透明，带轻微动画偏移营造流动感
 * - 河岸两侧密植水生植物（菖蒲、芦苇）+ 散落石头
 */

// 小溪中心曲线控制点（沿 x 轴蜿蜒）
const STREAM_CTRL: [number, number][] = [
  [-30, 1],
  [-22, -1.5],
  [-12, 2],
  [-3, -2],
  [4, 1.5],
  [12, -2.5],
  [22, 1],
  [30, -0.5],
]

const STREAM_WIDTH = 1.4
const STREAM_Y = 0.05 // 略高于地面避免 z-fighting

function buildRibbon(width: number, segments = 200) {
  const curve = new THREE.CatmullRomCurve3(
    STREAM_CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'catmullrom',
    0.4
  )
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = curve.getPoint(t)
    const tan = curve.getTangent(t).normalize()
    // 横向法线（在 XZ 平面）
    const nx = -tan.z
    const nz = tan.x
    const w = width * (0.85 + 0.25 * Math.sin(t * Math.PI * 4)) // 宽度有变化
    positions.push(p.x + nx * w * 0.5, STREAM_Y, p.z + nz * w * 0.5)
    positions.push(p.x - nx * w * 0.5, STREAM_Y, p.z - nz * w * 0.5)
    uvs.push(t * 12, 1, t * 12, 0) // u 拉长以显示流动
    if (i < segments) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return { geo, curve }
}

// 沿曲线生成"岸边点"
function bankPoints(curve: THREE.CatmullRomCurve3, count: number, side: 1 | -1, offset: number, jitter = 0.3) {
  const pts: { x: number; z: number; rot: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const p = curve.getPoint(t)
    const tan = curve.getTangent(t).normalize()
    const nx = -tan.z * side
    const nz = tan.x * side
    const off = offset + (Math.random() - 0.5) * jitter
    pts.push({
      x: p.x + nx * off + (Math.random() - 0.5) * 0.2,
      z: p.z + nz * off + (Math.random() - 0.5) * 0.2,
      rot: Math.random() * Math.PI * 2,
    })
  }
  return pts
}

export default function Stream() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)

  const { geo, leftReeds, rightReeds, leftCover, rightCover, stones, lilies } = useMemo(() => {
    const r = buildRibbon(STREAM_WIDTH)
    return {
      geo: r.geo,
      leftReeds: bankPoints(r.curve, 26, 1, STREAM_WIDTH * 0.55, 0.4),
      rightReeds: bankPoints(r.curve, 26, -1, STREAM_WIDTH * 0.55, 0.4),
      leftCover: bankPoints(r.curve, 30, 1, STREAM_WIDTH * 0.85, 0.6),
      rightCover: bankPoints(r.curve, 30, -1, STREAM_WIDTH * 0.85, 0.6),
      stones: [
        ...bankPoints(r.curve, 8, 1, STREAM_WIDTH * 0.45, 0.2),
        ...bankPoints(r.curve, 8, -1, STREAM_WIDTH * 0.45, 0.2),
      ],
      lilies: Array.from({ length: 12 }, (_, i) => {
        const t = (i + 0.5) / 12
        const p = r.curve.getPoint(t)
        return {
          x: p.x + (Math.random() - 0.5) * STREAM_WIDTH * 0.5,
          z: p.z + (Math.random() - 0.5) * STREAM_WIDTH * 0.5,
        }
      }),
    }
  }, [])

  // 流动动画：偏移 UV，让"水流"动起来
  useFrame((s) => {
    if (matRef.current) {
      const t = s.clock.elapsedTime
      // 颜色用波动制造水的微闪
      const v = 0.5 + Math.sin(t * 0.8) * 0.04
      matRef.current.color.setRGB(0.55 + v * 0.05, 0.78 + v * 0.04, 0.82 + v * 0.04)
    }
  })

  return (
    <group>
      {/* 水面 */}
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial
          ref={matRef}
          color={'#9ed4d8'}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={0.85}
          flatShading
        />
      </mesh>

      {/* 河岸湿地暗带（让水边过渡更自然） */}
      <mesh geometry={geo} position={[0, 0.04, 0]} scale={[1.5, 1, 1.5]} receiveShadow>
        <meshStandardMaterial color={'#c8d6b8'} roughness={1} transparent opacity={0.35} flatShading />
      </mesh>

      {/* 岸边芦苇/菖蒲（高芒草） */}
      {leftReeds.map((p, i) => (
        <GrassClump
          key={`lr${i}`}
          position={[p.x, 0, p.z]}
          rotation={p.rot}
          scale={1.1 + Math.random() * 0.5}
          color={'#7fa86a'}
          accent={'#b8d090'}
        />
      ))}
      {rightReeds.map((p, i) => (
        <GrassClump
          key={`rr${i}`}
          position={[p.x, 0, p.z]}
          rotation={p.rot}
          scale={1.1 + Math.random() * 0.5}
          color={'#7fa86a'}
          accent={'#dce8a8'}
        />
      ))}

      {/* 岸边地被 */}
      {leftCover.map((p, i) => (
        <GroundCover
          key={`lc${i}`}
          position={[p.x, 0, p.z]}
          rotation={p.rot}
          scale={0.9}
          color={'#bcd098'}
          accent={'#e8e4c4'}
        />
      ))}
      {rightCover.map((p, i) => (
        <GroundCover
          key={`rc${i}`}
          position={[p.x, 0, p.z]}
          rotation={p.rot}
          scale={0.9}
          color={'#bcd098'}
          accent={'#f0e8d4'}
        />
      ))}

      {/* 河中石头 */}
      {stones.map((p, i) => (
        <Stone
          key={`st${i}`}
          position={[p.x, 0.05, p.z]}
          rotation={p.rot}
          scale={0.9 + Math.random() * 0.4}
        />
      ))}

      {/* 睡莲（水面扁圆 + 小花） */}
      {lilies.map((p, i) => (
        <group key={`li${i}`} position={[p.x, STREAM_Y + 0.005, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]} receiveShadow>
            <circleGeometry args={[0.28, 6]} />
            <meshStandardMaterial color={'#9bc46a'} roughness={0.9} flatShading />
          </mesh>
          {i % 2 === 0 && (
            <mesh position={[0, 0.06, 0]}>
              <icosahedronGeometry args={[0.07, 0]} />
              <meshStandardMaterial
                color={'#ffd6e8'}
                emissive={'#ffd6e8'}
                emissiveIntensity={0.18}
                flatShading
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// 让 curve 在外部可被引用（用于 Paths 避让）
export { STREAM_CTRL }
