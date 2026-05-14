import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * 地面：浅色基底（米白偏黄绿），接近园林俯瞰图/水彩纸的感觉
 * 用 vertexColors 营造"草地有深浅"的有机变化，避免大块单色发腻
 */
export default function Ground() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(140, 140, 100, 100)
    const pos = geo.attributes.position
    const colors: number[] = []

    // 调色板：提高饱和度（更鲜活的春日草地）
    const palette = [
      new THREE.Color('#d8e89c'), // 嫩黄绿
      new THREE.Color('#e8e8b8'), // 暖奶油
      new THREE.Color('#bcd888'), // 春草绿
      new THREE.Color('#f0e8c8'), // 米色高光
    ]

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // 平缓起伏（高度更小，避免破坏俯瞰扁平感）
      const z = Math.sin(x * 0.12) * 0.15 + Math.cos(y * 0.16) * 0.18
      pos.setZ(i, z)

      // 随机选一个调色板基础色，再加点扰动
      const base = palette[Math.floor(Math.random() * palette.length)]
      const noise = 0.95 + Math.random() * 0.1
      colors.push(base.r * noise, base.g * noise, base.b * noise)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      position={[0, 0, 0]}
    >
      <meshStandardMaterial
        vertexColors
        roughness={1}
        metalness={0}
        flatShading
      />
    </mesh>
  )
}
