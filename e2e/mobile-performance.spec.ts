import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth } from './helpers'

test.describe('移动端与性能', () => {
  test('移动端登录页布局可用', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')

    await expect(page.getByText('YYC3 智慧商家管理系统').first()).toBeVisible()
    await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })

  test('移动端首页展示功能导航', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAuth(page)
    await page.goto('/')

    await expectHeading(page, 'YYC3 智慧商家管理系统')
    await expect(page.getByText('功能导航')).toBeVisible()
    await expect(page.getByText('包厢管理').first()).toBeVisible()
  })

  test('登录页加载时间在合理范围内', async ({ page }) => {
    const start = Date.now()
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(10000)
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })

  test('页面切换响应时间在合理范围内', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')

    const start = Date.now()
    await page.getByRole('link', { name: /包厢管理/ }).click()
    await expect(page.getByText('包厢状态').first()).toBeVisible({ timeout: 10000 })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(5000)
  })
})
