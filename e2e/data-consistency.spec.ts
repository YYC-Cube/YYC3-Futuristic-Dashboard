import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth, TEST_TOKEN } from './helpers'

test.describe('跨页面数据与会话一致性', () => {
  test('登录态在页面切换和刷新后保持', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')

    for (const path of ['/rooms', '/orders', '/inventory', '/membership', '/settings']) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(path))
      const token = await page.evaluate(() => localStorage.getItem('yyc3_auth_token'))
      expect(token).toBe(TEST_TOKEN)
    }

    await page.reload()
    expect(await page.evaluate(() => localStorage.getItem('yyc3_auth_token'))).toBe(TEST_TOKEN)
  })

  test('主要业务路由均可访问', async ({ page }) => {
    await seedAuth(page)

    const routes: Array<[string, string | RegExp]> = [
      ['/', 'YYC3 智慧商家管理系统'],
      ['/orders', '数据分析中心'],
      ['/inventory', '库存智能看板'],
      ['/membership', '会员中心'],
      ['/products', '商品管理系统'],
      ['/members', '会员营销系统'],
      ['/settings', '系统设置'],
      ['/employees', '员工档案管理'],
    ]

    for (const [path, heading] of routes) {
      await page.goto(path)
      await expectHeading(page, heading)
    }
  })

  test('未登录状态不会残留业务页面访问权限', async ({ page }) => {
    await page.goto('/inventory')

    await page.waitForURL(
      (url) => url.pathname.replace(/\/$/, '') === '/login',
      { timeout: 15000 },
    )
    expect(page.url()).toContain('/login')
  })
})
