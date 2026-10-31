import { test, expect } from '@playwright/test'
import { expectHeading, loginViaUI, seedAuth, TEST_TOKEN } from './helpers'

test.describe('认证与会话', () => {
  test('未登录访问受保护页面会跳转登录页', async ({ page }) => {
    await page.goto('/rooms')

    await page.waitForURL(
      (url) => url.pathname.replace(/\/$/, '') === '/login',
      { timeout: 15000 },
    )
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })

  test('登录成功后写入本地会话', async ({ page }) => {
    await loginViaUI(page)

    const token = await page.evaluate(() => localStorage.getItem('yyc3_auth_token'))
    const user = await page.evaluate(() => localStorage.getItem('yyc3_auth_user'))

    expect(token).toBeTruthy()
    expect(user).toContain('admin')
  })

  test('刷新页面后会话保持', async ({ page }) => {
    await loginViaUI(page)
    await page.reload()

    await expectHeading(page, 'YYC3 智慧商家管理系统')
    const token = await page.evaluate(() => localStorage.getItem('yyc3_auth_token'))
    expect(token).toBeTruthy()
  })

  test('幽灵模式可以快速进入首页', async ({ page }) => {
    await page.goto('/login')

    const ghostButton = page.getByRole('button', { name: /幽灵模式/i })
    await expect(ghostButton).toBeVisible()
    await ghostButton.click()

    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 })
    await expectHeading(page, 'YYC3 智慧商家管理系统')

    const token = await page.evaluate(() => localStorage.getItem('yyc3_auth_token'))
    expect(token).toMatch(/ghost_token_/)
  })

  test('预置会话可以直接访问业务页面', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/orders')

    await expectHeading(page, '数据分析中心')
    expect(await page.evaluate(() => localStorage.getItem('yyc3_auth_token'))).toBe(TEST_TOKEN)
  })
})
