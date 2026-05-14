import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * AI 蝴蝶 ：
 * - 平时在场景中央做"8 字"飞舞
 * - 鼠标移动时缓慢被吸引过去（有阻尼，不死板跟手）
 * - 翅膀会扇动
 */
export default function Butterfly() {
  const group = useRef<THREE.Group>(null)
  const wingL = useRef<THREE.Mesh>(null)
  const wingR = useRef<THREE.Mesh>(null)
  const target = useRef(new THREE.Vector3(0, 4, 0))
  const { mouse, camera } = useThree()

  useFrame((state, delta) => {
    if (!group.current) return
    const t = state.clock.elapsedTime

    // 鼠标在世界空间的目标点（投到 y=3 的平面）
    const ndc = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera)
    const dir = ndc.sub(camera.position).normalize()
    const distance = (3 - camera.position.y) / dir.y
    const worldPoint = camera.position.clone().add(dir.multiplyScalar(distance))

    // 8 字基础轨迹
    const baseX = Math.sin(t * 0.6) * 4
    const baseZ = Math.sin(t * 1.2) * 3
    const baseY = 3 + Math.sin(t * 1.5) * 0.4

    // 鼠标吸引（柔和混合）
    target.current.lerp(
      new THREE.Vector3(
        baseX + worldPoint.x * 0.3,
        baseY,
        baseZ + worldPoint.z * 0.3
      ),
      Math.min(1, delta * 1.2)
    )
    group.current.position.lerp(target.current, Math.min(1, delta * 2))

    // 朝向运动方向
    group.current.lookAt(
      group.current.position.x + Math.cos(t * 0.6),
      group.current.position.y,
      group.current.position.z + Math.sin(t * 0.6)
    )

    // 翅膀扇动
    const flap = Math.sin(t * 18) * 0.9
    if (wingL.current) wingL.current.rotation.y = -flap
    if (wingR.current) wingR.current.rotation.y = flap
  })

  return (
    <group ref={group}>
      {/* 身体 */}
      <mesh>
        <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
        <meshStandardMaterial color="#4a3520" />
      </mesh>

      {/* 左翅 */}
      <mesh ref={wingL} position={[0, 0, 0]}>
        <planeGeometry args={[0.6, 0.5]} />
        <meshStandardMaterial
          color="#ff9ec4"
          emissive="#ff7aae"
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
          toneMapped={false}
        />
      </mesh>

      {/* 右翅 */}
      <mesh ref={wingR} position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.6, 0.5]} />
        <meshStandardMaterial
          color="#ffb8d4"
          emissive="#ff7aae"
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
          toneMapped={false}
        />
      </mesh>

      {/* 一点点光晕 */}
      <pointLight color="#ffafd0" intensity={0.6} distance={4} decay={2} />
    </group>
  )
}
