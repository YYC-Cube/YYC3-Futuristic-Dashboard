# ARCHIVED · YYC³ Futuristic-Dashboard

> **状态**：`REFERENCE ONLY / FROZEN`
> **冻结日期**：2026-11-01
> **替代项目**：[YYC³ Club Ops](https://github.com/YYC-Cube/YYC3-Club-Ops)
> **冻结记录**：[17-参考项目冻结说明](https://github.com/YYC-Cube/YYC3-Club-Ops/blob/main/docs/YYC3-Club-Ops-TraeCode-20261031/17-%E5%8F%82%E8%80%83%E9%A1%B9%E7%9B%AE%E5%86%BB%E7%BB%93%E8%AF%B4%E6%98%8E-Futuristic-Dashboard.md)

---

## 1. 这是什么

本项目曾是「YYC³ 智慧商家管理系统」的 v0 系实现，包含房态看板、POS 收银、经营看板、多店面板等 UI。

**自 2026-11-01 起不再前行**，仅作为 **设计参考**：

- 允许：阅读源码、参考交互与视觉、提取设计思路。
- 禁止：新增功能、重构、升级依赖、重新部署、作为生产系统使用。

## 2. 为什么冻结

1. **技术栈分叉**：Next 16 + Tailwind 3 + shadcn default，与 Club-Ops（Next 15 + Tailwind 4 + shadcn new-york）不兼容。
2. **数据层不可用**：`lib/api/client.ts` 为全 Mock，无真实服务端/多租户/RLS。
3. **产品主线确定**：B 端 App 以 Club-Ops 为底座；Dashboard 只保留面板参考价值。
4. **避免误上线**：README 曾声明 `Production_Ready`，但实现为静态导出 + Mock，存在商务与合规风险。
5. **降低维护成本**：三仓库长期重复维护房态/POS/报表/会员/库存。

## 3. 设计已吸收到哪里

| 资产 | 吸收内容 | 落点 |
|---|---|---|
| `components/room/room-status-dashboard.tsx` | 左侧状态统计、色块房卡、筛选、视图切换、一键清扫/开房 | Club-Ops B 端 App 的 `RoomBoard`（重写，不复制代码） |
| `components/room/enhanced-room-dashboard.tsx` | 房卡信息密度 | 同上 |
| `components/room/seasonal-room-dashboard.tsx` | 主题化思路 | 仅保留设计思路 |
| `components/pos/pos-system.tsx` | 商品超市/购物车/支付方式/小票版式 | 参考 Club-Ops 现有真实 POS |
| `app/multi-store/page.tsx` | 多店卡片/满包率/翻台率 | 多店看板参考 |
| `components/reports/analytics-dashboard.tsx` | KPI + 包厢利用率 + 商品销售图表 | 经营看板参考 |
| `components/navigation/navigation-system.tsx` | 分组导航/权限菜单 | 仅 IA 参考 |

**不吸收**：Mock 数据、假登录、假门店 CRUD、假会员/库存、AI/5G/IoT 演示页、1,450 行导航整页实现。

## 4. 冻结基线

- 冻结标签：`archive-2026-11-01`
- 冻结提交：见 `git log`（提交信息含 `freeze`）
- 工作区基线：冻结提交前存在 README 品牌图路径调整、`public/yyc3-family.png` 新增、`docs/Family-AI-001.png` 删除、README 表格格式整理；这些改动已随冻结提交一并归档。
- CI：部署类 job 已禁用；仓库归档后不再接受新 Issue/PR。

## 5. 例外

仅允许两类变更，且需负责人审批：

1. **安全补丁**：高危 CVE / 凭据泄漏，最小修复，不新增功能。
2. **设计参考补充**：只读记录，不改代码。

## 6. 替代与联系

- 新功能/交易/房态/POS 请提交到 [YYC³ Club Ops](https://github.com/YYC-Cube/YYC3-Club-Ops)。
- 设计参考问题请在 Club-Ops 仓库发起讨论，不在本仓库开新 Issue。

---

**Freeze owner**：YYC³ 项目负责人 · **执行日期**：2026-11-01
