# 部署指南 - 获取永久链接

## 方案 1：Vercel 部署（推荐，最简单）

### 步骤：
1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 导入你的 Git 仓库（或上传代码）
5. Vercel 会自动检测 Next.js 项目
6. 点击 "Deploy"
7. 部署完成后会获得一个永久链接：`https://your-project.vercel.app`

### 特点：
- ✅ 永久有效
- ✅ 免费额度充足（个人使用完全够用）
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 每次推送代码自动更新

---

## 方案 2：Netlify 部署

### 步骤：
1. 访问 https://netlify.com
2. 注册/登录
3. 点击 "Add new site" → "Import an existing project"
4. 连接 Git 仓库
5. 构建命令：`pnpm build`
6. 发布目录：`out`
7. 点击 "Deploy"

### 特点：
- ✅ 永久有效
- ✅ 免费额度充足
- ✅ 支持自定义域名

---

## 方案 3：Cloudflare Pages

### 步骤：
1. 访问 https://pages.cloudflare.com
2. 登录 Cloudflare 账号
3. 点击 "Create a project"
4. 连接 Git 仓库
5. 构建命令：`pnpm build`
6. 输出目录：`out`
7. 点击 "Save and Deploy"

### 特点：
- ✅ 永久有效
- ✅ 无限带宽（免费）
- ✅ 全球 CDN

---

## 方案 4：GitHub Pages

### 步骤：
1. 在 GitHub 创建仓库
2. 推送代码到仓库
3. 进入 Settings → Pages
4. Source 选择 "GitHub Actions"
5. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

6. 推送后自动部署，获得链接：`https://your-username.github.io/repo-name`

---

## 本地测试构建

在部署前，可以先本地测试静态构建：

```bash
pnpm install
pnpm build
pnpm serve
```

然后访问 `http://localhost:3000` 测试。

---

## 注意事项

1. **API 配置**：用户需要在设置面板中配置自己的 OpenAI 兼容 API 地址和密钥
2. **数据存储**：所有数据存储在浏览器 localStorage 中
3. **跨域问题**：确保你的 API 服务器允许来自部署域名的 CORS 请求

---

## 推荐方案

**个人使用** → Vercel（最简单，5 分钟完成）
**需要自定义域名** → Netlify 或 Cloudflare Pages
**完全免费无限带宽** → Cloudflare Pages
