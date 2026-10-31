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
| E2E 冒烟 | `CI=true pnpm test:e2e:ci` | ✅ 4 passed |
| Docker 构建 | `docker build -t yyc3-dashboard:test .` | ✅ 成功 |
| Docker 运行 | `docker run -p 18080:80 ...` | ✅ `/` 200、`/rooms/` 200、未知路径 404 |
| YAML 语法 | Ruby YAML 解析 | ✅ 通过 |

## 六、遗留事项

- 旧 E2E 用例仍引用 `/dashboard` 与历史 `data-testid`，当前未纳入 CI；建议后续按现有页面逐条迁移。
- 工作流仍存在 Node.js 20 弃用警告，后续可评估升级到 Node 22。
- 安全扫描中的 TruffleHog 因 base/head 相同会报错，可改为仅在 PR 场景执行。

---

**结论**：E2E 已改为 Ubuntu 24.04 + Chromium 冒烟套件，Docker 已改为 pnpm 10 固定版本 + 静态 Nginx 镜像，二者本地均已验证通过。
