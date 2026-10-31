import { test } from '@playwright/test'

/**
 * 视觉回归测试需要维护基线截图，当前仓库尚未提交基线文件。
 * 保留用例结构，待独立视觉回归流水线接入后再启用。
 */
test.describe.skip('视觉回归测试', () => {
  test('首页整体布局截图', async ({ page }) => {
    await page.goto('/')
  })

  test('包厢卡片样式截图', async ({ page }) => {
    await page.goto('/rooms')
  })
})
