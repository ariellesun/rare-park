import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 飞鸟（V 字剪影），在公园上空缓慢盘旋
 * v2：高度降低、体型加大、颜色更深更显眼
 */

interface BirdsProps {
  count?: number
}

export default function Birds({ count = 8 }: BirdsProps) {
  const ref = useRef<THREE.InstancedMesh>(null)

  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 18 + Math.random() * 14, // 拉近一些（之前 28~40）
        height: 8 + Math.random() * 4, // 降低（之前 14~20）
        speed: 0.08 + Math.random() * 0.06,
        offset: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        flapSpeed: 5 + Math.random() * 3,
        size: 1.4 + Math.random() * 0.6, // 放大（之前 0.6~1.0）
        dir: Math.random() > 0.5 ? 1 : -1, // 顺/逆时针方向
      })),
    [count]
  )

  // V 字几何：以原点为中心、横向展开的双翅
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // 三角形 1（左翼）：中心 → 左外 → 左中
    // 三角形 2（右翼）：中心 → 右中 → 右外
    const v: number[] = [
      // 左翼
      0, 0, 0,
      -0.9, 0.25, 0,
      -0.5, -0.05, 0,
      // 右翼
      0, 0, 0,
      0.5, -0.05, 0,
      0.9, 0.25, 0,
    ]
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    g.computeVertexNormals()
    return g
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime
    birds.forEach((b, i) => {
      const ang = b.offset + t * b.speed * b.dir
      const x = Math.cos(ang) * b.radius
      const z = Math.sin(ang) * b.radius
      // 翅膀拍动用 scale-y 模拟
      const flap = 0.6 + Math.sin(t * b.flapSpeed + i) * 0.5
      dummy.position.set(x, b.height + Math.sin(t * 0.4 + i) * 0.6, z)
      // 让鸟"水平"飞（绕 Y 旋转朝向切线方向）
      dummy.rotation.set(0, -ang * b.dir, 0)
      dummy.scale.set(b.size, b.size * flap, b.size)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <primitive object={geo} attach="geometry" />
      <meshBasicMaterial color={'#2a3a2a'} side={THREE.DoubleSide} transparent opacity={0.85} />
    </instancedMesh>
  )
}
