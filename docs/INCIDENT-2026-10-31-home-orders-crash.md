---
file: INCIDENT-2026-10-31-home-orders-crash.md
description: futuristic.yyc3.top 首页 TypeError 分析与修复记录
author: AI Tutor <TraeCode>
version: v1.0.0
created: 2026-10-31
updated: 2026-10-31
status: active
tags: [incident],[runtime],[deployment],[github-pages]
category: report
---

# 🚨 首页 TypeError 分析与修复记录

## 一、故障现象

线上地址 <https://futuristic.yyc3.top/> 控制台报错：

```text
0yzdw_jgwqgtc.js:1 TypeError: Cannot read properties of undefined (reading 'length')
    at 0qqx6d9uc54jp.js:1:25070
    ...
```

错误发生在 React 渲染阶段，最终定位到首页「今日订单」卡片。

## 二、证据链

### 2.1 线上实际运行的产物

线上 HTML 引用了旧构建 chunk：

```text
/_next/static/chunks/0qqx6d9uc54jp.js
```

在该 chunk 的 `25070` 字符附近：

```js
children: u.length   // u = orders
```

即首页直接读取 `orders.length`，没有空值保护。

### 2.2 旧版订单 Store

同一旧 chunk 中：

```js
e({ orders: t.orders, loading: !1, lastFetched: o })
```

`t` 为 `orderService.getOrders()` 的返回值。

### 2.3 旧版 mock API

旧版 `handleMockRequest` 没有 `/orders` 分支，最终落到默认分支：

```js
return this.mockRequest({ success: !0 })
```

因此 `t.orders === undefined`，Store 把 `orders` 写成了 `undefined`；下一次渲染执行 `u.length` 时抛出 TypeError。

### 2.4 为什么当前源码是安全的

当前源码已做两层保护：

- `app/page.tsx`：`getOrderCount?.() ?? orders?.length ?? 0`
- `lib/stores/useOrderStore.ts`：`orders: data?.orders ?? EMPTY_ORDERS`

并已通过本次构建验证。

## 三、根因判定

本次故障有两层根因，二者叠加：

| 层级 | 根因 | 说明 |
| ---- | ---- | ---- |
| 运行时 | 旧版首页/Store 未对 `orders` 做空值保护 | API 返回结构不符时，`orders` 变为 `undefined`，渲染读取 `.length` 崩溃 |
| 发布链路 | GitHub Pages 配置为 `build_type=workflow`，但工作流使用 `peaceiris/actions-gh-pages` 推送 `gh-pages` 分支 | Pages 不消费该分支，线上长期停留在旧部署产物 |

关键证据：

```text
GitHub Pages API:
"build_type": "workflow"
"source": { "branch": "main", "path": "/" }

线上 HTML: last-modified 2026-05-22
线上 chunk: 0qqx6d9uc54jp.js（不存在于最新 gh-pages 分支）
最新 gh-pages: 0f654f5 (deploy 1ed61c5)，其首页 chunk 已使用安全写法
```

因此，`gh-pages` 分支上的新构建并未真正发布到 Pages；线上仍是旧缓存/旧部署产物。

## 四、已实施修复

### 4.1 部署链路

`.github/workflows/ci-cd.yml` 的 `deploy-github-pages`：

- 移除 `peaceiris/actions-gh-pages`
- 改为官方 Pages 流程：
  - `actions/configure-pages@v5`
  - `actions/upload-pages-artifact@v3`（`path: ./out`）
  - `actions/deploy-pages@v4`
- Job 权限改为：
  - `contents: read`
  - `pages: write`
  - `id-token: write`

### 4.2 API 契约

`lib/api/client.ts` 为 mock 模式的 `GET /orders` 增加明确返回结构：

```ts
{ orders: [], total: 0 }
```

避免再次出现「调用方期望 `orders` 数组、实际拿到 `{ success: true }`」的契约错位。

## 五、验证结果

| 检查项 | 命令 | 结果 |
| ---- | ---- | ---- |
| 工作流 YAML | `ruby -e "require 'yaml'; YAML.load_file(...)"` | ✅ 通过 |
| 类型检查 | `pnpm exec tsc --noEmit` | ✅ 0 errors |
| 生产构建 | `pnpm build` | ✅ 成功，生成 `out/` |
| 浏览器冒烟 | Playwright 打开本地生产构建首页 | ✅ 标题正常、今日订单 0、无 pageerror / console.error |

冒烟结果：

```json
{
  "title": "YYC3 智慧商家管理系统",
  "orderCard": "今日订单0",
  "pageErrors": [],
  "consoleErrors": [],
  "crashed": false
}
```

## 六、上线步骤（待执行）

1. 提交并推送本次修改到 `main`。
2. 触发 `YYC3 Dashboard - CI/CD Pipeline (Fixed)`（push 或 `workflow_dispatch`）。
3. 确认 `deploy-github-pages` 使用 `actions/deploy-pages` 并成功。
4. 验证线上：
   - `curl -sI https://futuristic.yyc3.top/` 的 `last-modified` 应更新；
   - HTML 中 chunk 名称应为最新构建产物；
   - 浏览器强刷后控制台无 `Cannot read properties of undefined (reading 'length')`。
5. 如需兼容旧部署配置，可将 Pages Source 调整为 `gh-pages` 分支；但推荐保持 `GitHub Actions` 并使用本工作流。

## 七、经验沉淀

- 静态导出站点必须保证发布链路与 Pages `build_type` 匹配。
- 前端对接口返回值应默认按「可能缺字段」处理，尤其是列表类字段。
- mock 数据也要遵守真实接口契约，避免掩盖问题。
- 部署成功 ≠ 线上生效；需要校验线上 HTML 的构建指纹（chunk 名 / last-modified）。

---

**结论**：故障已定位并修复到源码与发布流水线；线上生效需推送并触发一次新的 Pages 部署。
