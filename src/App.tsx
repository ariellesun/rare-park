import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Park from './scenes/Park'
import Overlay from './ui/Overlay'
import AskPanel from './ui/AskPanel'
import ErrorBoundary from './ui/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 8, 22], fov: 45, near: 0.1, far: 200 }}
      >
        <Suspense fallback={null}>
          <Park />
        </Suspense>
      </Canvas>
      <Overlay />
      <AskPanel />
    </ErrorBoundary>
  )
}
