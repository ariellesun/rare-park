# 微光珍境 · Glimmer Sanctum

> 一座面向罕见病关怀的 3D 互动公园：用一个会发光的 AI 园丁，把"渐冻症"、"亨廷顿舞蹈症"、"白化病"等被遗忘的疾病，变成可被触摸、可被对话、可被理解的微光林地。

[![Deploy](https://github.com/ariellesun/rare-park/actions/workflows/deploy.yml/badge.svg)](https://github.com/ariellesun/rare-park/actions/workflows/deploy.yml)

🌐 **在线体验**：<https://ariellesun.github.io/rare-park/>

---

## ✨ 项目亮点

- **🌳 3D 沉浸场景**：用 React Three Fiber 搭建多个"微光林地"，每个林地代表一种罕见病，访客以漫游视角进入
- **🤖 AI 园丁对话**：基于腾讯**混元大模型**，访客可以向"AI 园丁"提问任何关于这种疾病的问题——病症、护理、心理、家属常见困惑等，回答温柔、专业、个性化
- **💡 信息分层**：场景中的发光元素（萤火、风铃、漂浮花瓣）对应不同维度的疾病知识，点击即可阅读卡片化的科普内容
- **♿ 无障碍设计**：暖色调、低饱和、字体清晰，避免闪烁强光；全部 UI 中英双语
- **🏥 关怀视角**：不是冷冰冰的科普网站，而是把每位罕见病患者比喻为"林中的一盏微光"——把疾病重新放回人的故事里

## 📺 演示

> （比赛评委：建议在桌面端 Chrome 打开，体验最佳。也可以查看下方截图与视频。）

| 主页 | AI 对话 | 林地场景 |
|:---:|:---:|:---:|
| _截图占位_ | _截图占位_ | _截图占位_ |

## 🛠️ 技术栈

| 类别 | 技术 |
|---|---|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 3D 渲染 | three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing |
| AI 能力 | 腾讯混元大模型（OpenAI 兼容协议接入） |
| 部署 | GitHub Pages + GitHub Actions 自动化 |

## 🚀 本地运行

```bash
# 1. 克隆项目
git clone https://github.com/ariellesun/rare-park.git
cd rare-park

# 2. 安装依赖
npm install

# 3. 配置环境变量（根目录新建 .env.local）
cat > .env.local <<EOF
VITE_HUNYUAN_API_KEY=你的混元 key
VITE_HUNYUAN_BASE_URL=https://tokenhub.tencentmaas.com/v1
VITE_HUNYUAN_MODEL=hy3-preview
EOF

# 4. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173/

# 5. 生产构建
npm run build
# 产物在 ./dist 目录
```

> **注意**：如果未配置 `VITE_HUNYUAN_API_KEY`，AI 园丁会自动回退到 mock 模式（返回固定模板回复），用于本地无 key 调试。

## 📁 目录结构

```
rare-park/
├── src/
│   ├── scenes/        # 各林地的 3D 场景定义
│   ├── components/    # 可复用 React 组件
│   ├── ai/            # 混元 API 客户端 + prompt 模板
│   ├── data/          # 罕见病知识数据
│   ├── ui/            # 顶层 UI（菜单、对话框）
│   ├── state/         # 全局状态
│   ├── admin/         # 管理后台（数据可视化）
│   ├── App.tsx
│   └── main.tsx
├── public/            # 静态资源
├── .github/workflows/ # GitHub Actions 自动部署
├── vite.config.ts
└── package.json
```

## 🎨 设计理念

> "罕见病并不罕见——只是被忽视。"

- 全球已知罕见病超过 7000 种，约 4 亿人患病；其中 95% 没有任何已批准的治疗方案
- 我们想做的不是又一个百度百科——而是让健康人**愿意停留 30 秒**了解这些疾病
- 所以选择了"公园 + 微光 + AI 园丁"的隐喻：每位患者是一盏不会熄灭的灯，AI 园丁是这片林地的导览者

## 🙏 致谢

- 腾讯混元大模型团队提供的 LLM 能力
- React Three Fiber 社区
- 所有罕见病患者与家属，他们的故事是这个项目的源头

## 📜 License

MIT
