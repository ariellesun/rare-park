import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Admin from './admin/Admin'

/**
 * 极简 hash 路由：
 *   /            → 前台 3D 公园（C 端）
 *   /#/admin     → 内容管理后台（B 端）
 */

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function Root() {
  const hash = useHashRoute()
  if (hash.startsWith('#/admin')) return <Admin />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
