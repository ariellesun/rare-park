import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 飘落的花瓣：用 Points 实现，性能友好
 */
export default function FloatingPetals({ count = 100 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = Math.random() * 18 + 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      speeds[i * 3 + 0] = (Math.random() - 0.5) * 0.05
      speeds[i * 3 + 1] = -0.04 - Math.random() * 0.04
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.03
    }
    return { positions, speeds }
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array as Float32Array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] += speeds[i * 3 + 0] + Math.sin(t + i) * 0.005
      arr[i * 3 + 1] += speeds[i * 3 + 1]
      arr[i * 3 + 2] += speeds[i * 3 + 2]
      // 落到地面就回到上方
      if (arr[i * 3 + 1] < 0.2) {
        arr[i * 3 + 0] = (Math.random() - 0.5) * 60
        arr[i * 3 + 1] = 18 + Math.random() * 4
        arr[i * 3 + 2] = (Math.random() - 0.5) * 40
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        color="#ffd6e0"
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
