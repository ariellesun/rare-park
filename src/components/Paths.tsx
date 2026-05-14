import { useMemo } from 'react'
import * as THREE from 'three'
import { GROVES } from '../data/groves'

/**
 * 公园小径系统：
 *  - 主环道：S 形大环路串联所有 10 个林地（米白碎石）
 *  - 支路：从主环到每个林地中心
 * 用 ribbon 几何体（同 Stream 思路）渲染
 */

const PATH_WIDTH = 0.9

function buildRibbon(controlPoints: THREE.Vector3[], width: number, segments = 160, closed = false) {
  const curve = new THREE.CatmullRomCurve3(controlPoints, closed, 'catmullrom', 0.4)
  const positions: number[] = []
  const indices: number[] = []
  const uvs: number[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = curve.getPoint(t)
    const tan = curve.getTangent(t).normalize()
    const nx = -tan.z
    const nz = tan.x
    const w = width * (0.92 + 0.18 * Math.sin(t * Math.PI * 6))
    positions.push(p.x + nx * w * 0.5, 0.02, p.z + nz * w * 0.5)
    positions.push(p.x - nx * w * 0.5, 0.02, p.z - nz * w * 0.5)
    uvs.push(t * 20, 1, t * 20, 0)
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
  return geo
}

export default function Paths() {
  // 主环：取 10 个林地的位置 + 调整成"绕中心"的环
  const mainGeo = useMemo(() => {
    // 按角度排序，让环路按顺时针走
    const sorted = [...GROVES]
      .map((g) => ({
        x: g.position[0],
        z: g.position[1],
        ang: Math.atan2(g.position[1], g.position[0]),
      }))
      .sort((a, b) => a.ang - b.ang)
    // 把每个点向"中心"拉近一点，让路径绕开林地内部
    const pts = sorted.map((p) => {
      const k = 0.78 // 拉近因子
      return new THREE.Vector3(p.x * k, 0, p.z * k)
    })
    return buildRibbon(pts, PATH_WIDTH, 240, true)
  }, [])

  // 支路：每个林地中心 → 主环上最近点
  const spurs = useMemo(() => {
    const sorted = [...GROVES]
      .map((g) => ({
        x: g.position[0],
        z: g.position[1],
        ang: Math.atan2(g.position[1], g.position[0]),
      }))
      .sort((a, b) => a.ang - b.ang)
    const ringPts = sorted.map((p) => ({ x: p.x * 0.78, z: p.z * 0.78 }))
    return GROVES.map((g) => {
      // 找最近的环点
      let best = 0
      let bestD = Infinity
      ringPts.forEach((rp, j) => {
        const d = (rp.x - g.position[0]) ** 2 + (rp.z - g.position[1]) ** 2
        if (d < bestD) {
          bestD = d
          best = j
        }
      })
      const target = ringPts[best]
      // 加一个中点弯一下，避免太直
      const midx = (g.position[0] + target.x) / 2 + (Math.random() - 0.5) * 0.5
      const midz = (g.position[1] + target.z) / 2 + (Math.random() - 0.5) * 0.5
      return {
        key: g.id,
        geo: buildRibbon(
          [
            new THREE.Vector3(g.position[0], 0, g.position[1]),
            new THREE.Vector3(midx, 0, midz),
            new THREE.Vector3(target.x, 0, target.z),
          ],
          PATH_WIDTH * 0.7,
          80
        ),
      }
    })
  }, [])

  return (
    <group>
      {/* 主环 */}
      <mesh geometry={mainGeo} receiveShadow position={[0, 0.001, 0]}>
        <meshStandardMaterial color={'#e8dec8'} roughness={1} flatShading />
      </mesh>
      {/* 主环外侧深色描边（用 scale 略大、稍低一点） */}
      <mesh geometry={mainGeo} receiveShadow position={[0, 0, 0]} scale={[1.06, 1, 1.06]}>
        <meshStandardMaterial color={'#cdc0a4'} roughness={1} flatShading transparent opacity={0.5} />
      </mesh>

      {/* 支路 */}
      {spurs.map((s) => (
        <group key={s.key}>
          <mesh geometry={s.geo} receiveShadow position={[0, 0.001, 0]}>
            <meshStandardMaterial color={'#ecdec8'} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
