# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── layout.tsx      # 根布局（字体：Outfit + Inter）
│   │   ├── page.tsx        # 主页面（AI 试衣工作台）
│   │   └── globals.css     # 全局样式（Tailwind + 自定义变量）
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   ├── image-dropzone.tsx    # 图片拖拽上传区域
│   │   ├── image-group-card.tsx  # 图片分组卡片
│   │   ├── task-card.tsx         # 任务卡片
│   │   ├── task-queue.tsx        # 任务队列面板
│   │   ├── settings-dialog.tsx   # 设置弹窗
│   │   ├── gallery.tsx           # 结果画廊
│   │   └── preview-modal.tsx     # 图片预览弹窗
│   ├── hooks/
│   │   ├── use-settings.ts       # 设置管理（localStorage 持久化）
│   │   ├── use-image-groups.ts   # 图片分组管理
│   │   └── use-task-queue.ts     # 任务队列与并发控制
│   ├── lib/
│   │   ├── types.ts        # 类型定义（Settings, ImageGroup, Task, GalleryItem）
│   │   ├── utils.ts        # 工具函数（cn, generateId, downloadImagesSequentially）
│   │   └── api.ts          # AI API 调用（OpenAI 兼容格式）
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 项目概述

AI 虚拟试衣批量处理工具（BOOM AI Try-on Studio），参考原始 HTML 版本重构为 Next.js 全栈应用。

### 核心功能
- **图片分组管理**：上传服装图和模特图，支持拖拽排序、批量操作
- **调试优化模式**：服装图片限制 1 张，模特图片支持多张，自动生成多张AI结果
- **多种配对模式**：1:1 配对（自动取最小值）、固定模特、固定服装（自动模式优先）
- **生成模式选择**：仅生成头部、仅替换衣服、头部和衣服一起替换、仅换背景
- **批量 AI 处理**：并发调用 OpenAI 兼容 API 生成试穿效果
- **任务队列**：实时进度追踪、状态管理（pending/processing/completed/failed）
- **结果画廊**：本地持久化（localStorage）、批量下载、预览
- **设置面板**：API 配置、并发控制、提示词、自动保存

### 技术要点
- 所有数据存储在浏览器 localStorage，无需后端数据库
- API 调用直接在前端发起（OpenAI 兼容格式）
- 图片以 base64 格式存储和传输
- 支持静态导出，可在本地独立运行

## 本地独立运行

本项目支持导出为纯静态文件，可在本地浏览器中直接打开或通过任意静态服务器运行。

### 构建静态版本

```bash
# 安装依赖
pnpm install

# 构建静态文件
pnpm build
```

构建完成后，静态文件输出到 `out/` 目录，包含 `index.html` 和所有必要的资源文件。

### 运行方式

**方式 1：直接打开 HTML 文件**
```bash
# 直接用浏览器打开
open out/index.html  # macOS
start out/index.html # Windows
xdg-open out/index.html  # Linux
```

**方式 2：使用本地静态服务器**
```bash
# 使用 serve（推荐）
pnpm serve
# 或手动安装
npx serve out -p 3000

# 使用 Python
python3 -m http.server 3000 --directory out

# 使用 Node.js
npx http-server out -p 3000
```

然后在浏览器访问 `http://localhost:3000`

### 本地使用注意事项

1. **API 配置**：在设置面板中配置你的 OpenAI 兼容 API 地址和密钥
2. **数据存储**：所有数据（图片、设置、任务历史）存储在浏览器 localStorage 中
3. **跨域问题**：如果 API 服务器有 CORS 限制，需要确保允许本地访问
4. **图片大小**：localStorage 有容量限制（通常 5-10MB），大量图片建议使用外部存储

### 部署到静态托管

可以将 `out/` 目录部署到以下静态托管服务：
- Vercel / Netlify / Cloudflare Pages
- GitHub Pages
- 任何支持静态文件的 Web 服务器
- 使用 Outfit（标题）+ Inter（正文）字体组合

### 关键入口
- 主页面：`src/app/page.tsx`
- 类型定义：`src/lib/types.ts`（含 `GenerationMode` 和 `GENERATION_MODE_PROMPTS`）
- API 调用：`src/lib/api.ts`（根据 `generationMode` 选择对应提示词）
- 设置管理：`src/hooks/use-settings.ts`
- 任务队列：`src/hooks/use-task-queue.ts`

### 生成模式说明
应用支持 5 种生成模式，在页面顶部快速切换或在设置面板中选择：
| 模式 | 说明 | 对应提示词 |
|------|------|------------|
| `headOnly` | 仅生成头部 | 仅替换模特的头部/面部，保持服装和背景不变。注意光影匹配 |
| `topOnly` | 仅替换上衣 | 仅替换上衣/上装，保持下装、头部和背景不变 |
| `bottomOnly` | 仅替换下装 | 仅替换下装/裤子/裙子，保持上衣、头部和背景不变 |
| `both` | 头部和衣服一起替换 | 用图1的服装替换图2模特身上的服装，同时优化模特的头部/面部 |
| `backgroundOnly` | 仅换背景 | 保持模特和服装不变，仅替换背景环境，光影根据新背景调整 |

### 光影优化
所有生成模式的提示词都包含光影匹配要求：
- 光照方向、阴影强度、色温必须与模特一致
- 服装褶皱和材质质感要真实
- 元素边缘自然融合，无生硬边界
- 环境光反射要匹配光源方向

### 调试优化模式
为便于调试，应用采用以下工作流：
- **服装图片**：限制上传 1 张（`maxImages={1}`）
- **模特图片**：支持上传多张
- **自动生成**：1 张服装图 × N 张模特图 = N 张AI结果
- **任务预览**：实时显示将生成的任务数量

当检测到 1 张服装图 + 多张模特图时，自动使用"固定服装"配对模式。
