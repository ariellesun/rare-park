import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// base 路径说明：
// - 本地开发（npm run dev）：Vite 会忽略 base，始终走 /，无影响
// - GitHub Pages 部署：仓库名作为子路径，所以 base 必须是 '/rare-park/'
// - 如果之后换了仓库名，记得同步改这里
export default defineConfig({
  plugins: [react()],
  base: '/rare-park/',
})
