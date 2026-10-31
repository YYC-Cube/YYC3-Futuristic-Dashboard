---
file: CI-E2E-DOCKER-FIX-2026-10-31.md
description: 修复 GitHub Actions 中 Playwright E2E 与 Docker 构建失败
author: AI Tutor <TraeCode>
version: v1.0.0
created: 2026-10-31
updated: 2026-10-31
status: active
tags: [ci],[e2e],[docker],[playwright],[pnpm]
category: report
---

# 🛠️ E2E 与 Docker 构建修复记录

## 一、E2E 失败根因

线上工作流 `41218594100` 中，E2E Job 失败于：

```text
Playwright does not support chromium on ubuntu26.04-x64
```

### 1.1 Runner 迁移

`ubuntu-latest` 已迁移到 Ubuntu 26.04，而 Playwright 1.60.0 尚不支持该镜像，`playwright install --with-deps` 直接失败。

### 1.2 浏览器安装范围与测试项目不匹配

工作流只安装 Chromium：

```bash
npx playwright install --with-deps chromium
```

但 `playwright.config.ts` 配置了 Chromium、Firefox、WebKit、Mobile Chrome、Mobile Safari 等项目。即使安装成功，Firefox/WebKit 项目也缺少浏览器。

### 1.3 手工启动 dev server 冗余

工作流手工执行 `pnpm dev &` 并等待 `20307` 端口，但 `pnpm dev` 默认监听 `3000`；同时 Playwright 已配置 `webServer` 自动启动 `20307`。

### 1.4 旧 E2E 用例已与当前 UI 脱节

现有大量用例仍访问 `/dashboard`，并依赖不存在的 `data-testid`，无法在当前应用上稳定运行。

## 二、E2E 修复方案

### 2.1 固定 Runner

`.github/workflows/ci-cd.yml`：

```yaml
e2e-tests:
  runs-on: ubuntu-24.04
```

### 2.2 新增 CI 冒烟用例

新增 `e2e/ci-smoke.spec.ts`，只验证当前应用真实可用路径：

- 登录页核心元素
- 管理员登录后进入首页
- 未登录访问 `/rooms` 跳转 `/login`
- 首页「今日订单」加载且无运行时错误

### 2.3 新增 CI 专用脚本

`package.json`：

```json
"test:e2e:ci": "playwright test --project=chromium e2e/ci-smoke.spec.ts"
```

CI 只安装 Chromium，只跑 Chromium 冒烟用例，避免缺少 Firefox/WebKit 浏览器。

### 2.4 移除手工 dev server

由 Playwright `webServer` 自动启动：

```ts
webServer: {
  command: 'pnpm dev --port 20307',
  url: baseURL,
  ...
}
```

并支持 `PLAYWRIGHT_BASE_URL` 环境变量。

### 2.5 不再掩盖失败

原工作流在部分用例失败时仍 `exit 0`，现改为直接执行 `pnpm test:e2e:ci`，失败即让 Job 失败。

## 三、Docker 失败根因

Docker Job 失败于：

```text
ERR_PNPM_IGNORED_BUILDS
Ignored build scripts: @sentry/cli, esbuild, msw, unrs-resolver
```

### 3.1 pnpm 版本漂移

Dockerfile 中 `corepack enable` 在未固定版本时拉取了 pnpm 12.16.1；pnpm 12 不再读取 `package.json` 的 `pnpm.onlyBuiltDependencies`，导致构建脚本被忽略并报错。

### 3.2 Dockerfile 与静态导出不匹配

Next.js 配置为 `output: "export"`，产物是 `out/`；但旧 Dockerfile 运行阶段复制 `.next/standalone`，即使依赖安装成功，后续 COPY 也会失败。

## 四、Docker 修复方案

### 4.1 固定 pnpm 版本

`package.json`：

```json
"packageManager": "pnpm@10.34.9",
"pnpm": {
  "onlyBuiltDependencies": [
    "@sentry/cli",
    "esbuild",
    "msw",
    "unrs-resolver"
  ]
}
```

工作流同步：

```yaml
PNPM_VERSION: '10.34.9'
```

### 4.2 Dockerfile 改为静态 Nginx 运行

- `deps`：安装依赖
- `builder`：`pnpm build` 生成 `out/`
- `runner`：`nginx:alpine` 托管 `out/`

新增 `docker/nginx.conf`，支持：

- `/` → `index.html`
- `/rooms` → `/rooms/index.html`
- 未知路径 → `404.html`

### 4.3 Compose 端口与健康检查同步

```yaml
ports:
  - "3000:80"
healthcheck:
  test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:80/"]
```

## 五、验证结果

| 检查项 | 命令 | 结果 |
| ---- | ---- | ---- |
| TypeScript | `pnpm exec tsc --noEmit` | ✅ 0 errors |
| 单元测试 | `pnpm test` | ✅ 39 files / 655 tests passed |
| E2E 全量 Chromium | `CI=true pnpm test:e2e:ci` | ✅ 39 passed / 2 skipped |
| Docker 构建 | `docker build -t yyc3-dashboard:test .` | ✅ 成功 |
| Docker 运行 | `docker run -p 18080:80 ...` | ✅ `/` 200、`/rooms/` 200、未知路径 404 |
| YAML 语法 | Ruby YAML 解析 | ✅ 通过 |

## 六、遗留事项

- 安全扫描中的 TruffleHog 因 base/head 相同会报错，可改为仅在 PR 场景执行。

## 七、后续治理（2026-11-01）

### 7.1 历史 E2E 迁移

- 10 个历史 E2E 文件已迁移到当前 `/`、`/rooms`、`/orders`、`/inventory`、`/membership`、`/products`、`/members`、`/settings`、`/employees`、`/pos` 等真实路由。
- 移除对 `/dashboard` 和历史 `data-testid` 的依赖，改用当前页面的标题、Tab、按钮与占位符。
- 新增 `e2e/helpers.ts` 提供会话注入与登录辅助。
- 视觉回归用例因缺少基线截图暂标记为 `skip`，保留结构待独立流水线接入。
- `test:e2e:ci` 现在运行完整 Chromium 套件：39 passed / 2 skipped。

### 7.2 Node.js 22 与 Actions 升级

- 工作流 `NODE_VERSION: '22'`，矩阵 `node-version: [22.x]`。
- Dockerfile 两阶段统一为 `node:22-alpine`。
- 新增 `.nvmrc` 与 `engines.node >= 22`。
- GitHub Actions 升级至 Node 24 运行时版本：
  - `actions/checkout@v7`
  - `actions/setup-node@v7`
  - `actions/cache@v6`
  - `actions/upload-artifact@v7`
  - `pnpm/action-setup@v6`
  - `actions/configure-pages@v6`
  - `actions/upload-pages-artifact@v5`
  - `actions/deploy-pages@v5`
  - `softprops/action-gh-release@v3`

### 7.3 Middleware 与静态导出告警

- 将根目录 `proxy.ts` 移至 `server/proxy.server.ts`，避免 Next.js 将静态导出项目识别为 Middleware。
- 移除 `next.config.mjs` 中空的 `headers` / `rewrites` / `redirects`，消除构建告警。
- 客户端认证继续由 `AuthGuard` 负责。
- Docker 部署的安全响应头改由 `docker/nginx.conf` 提供：
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `X-XSS-Protection`

构建验证：`pnpm build` 已不再出现 `Middleware cannot be used with "output: export"` 告警。

---

**结论**：E2E 已迁移到当前真实路由并全量通过 Chromium 套件；Node.js 已升级至 22；静态导出项目的 Middleware 告警已消除。
