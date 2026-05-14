import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useEffect, useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Ground from '../components/Ground'
import Grove from '../components/Grove'
import Butterfly from '../components/Butterfly'
import FloatingPetals from '../components/FloatingPetals'
import Stream from '../components/Stream'
import Paths from '../components/Paths'
import BackgroundForest from '../components/BackgroundForest'
import Matrix from '../components/Matrix'
import Furniture from '../components/Furniture'
import Birds from '../components/Birds'
import { useGroves } from '../state/grovesStore'

/**
 * 拾珍园 · 主场景
 * 三层结构：外环背景林 → 中环 10 个主题林地 → 内核小溪
 * 视觉基调：明亮、清新、奥道夫花园式自然主义
 */
export default function Park() {
  const groves = useGroves()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const lastInteractionRef = useRef<number>(0)
  const idleResumedRef = useRef<boolean>(true)

  // 用户交互后暂停自动旋转，6 秒无操作恢复
  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return
    const onStart = () => {
      lastInteractionRef.current = performance.now()
      idleResumedRef.current = false
      ctrl.autoRotate = false
    }
    ctrl.addEventListener('start', onStart)
    const id = window.setInterval(() => {
      if (idleResumedRef.current) return
      if (performance.now() - lastInteractionRef.current > 6000) {
        ctrl.autoRotate = true
        idleResumedRef.current = true
      }
    }, 500)
    return () => {
      ctrl.removeEventListener('start', onStart)
      window.clearInterval(id)
    }
  }, [])

  return (
    <>
      {/* 浅色背景：温暖的奶油绿 */}
      <color attach="background" args={['#f4f3d8']} />
      <fog attach="fog" args={['#f4f3d8', 50, 140]} />

      {/* 主光：清晨柔光 */}
      <directionalLight
        position={[18, 24, 12]}
        intensity={1.7}
        color={'#fff5e0'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <ambientLight intensity={0.7} color={'#ffffff'} />
      <directionalLight position={[-10, 10, -8]} intensity={0.4} color={'#dde6f0'} />
      <hemisphereLight args={['#fffce8', '#cfe0a8', 0.5]} />

      {/* 地面 */}
      <Ground />

      {/* 蜿蜒主路 + 支路 */}
      <Paths />

      {/* 中央小溪 */}
      <Stream />

      {/* 林地间过渡植被基质（散落地被+芒草） */}
      <Matrix />

      {/* 10 个生态群落 */}
      {groves.map((g) => (
        <Grove key={g.id} grove={g} />
      ))}

      {/* 外环背景密林 */}
      <BackgroundForest />

      {/* 公园家具：长椅、拱门、路灯 */}
      <Furniture />

      {/* 飞鸟（远处 V 字剪影） */}
      <Birds count={18} />

      {/* 飘浮花瓣 */}
      <FloatingPetals count={70} />

      {/* AI 蝴蝶 */}
      <Butterfly />

      {/* 镜头控制：可拖拽、缩放、平移 */}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableRotate
        enableZoom
        autoRotate
        autoRotateSpeed={0.25}
        minDistance={10}
        maxDistance={75}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1, 0]}
      />

      {/* 后处理 */}
      <EffectComposer>
        <Bloom intensity={0.45} luminanceThreshold={0.85} luminanceSmoothing={0.5} mipmapBlur />
      </EffectComposer>
    </>
  )
}
