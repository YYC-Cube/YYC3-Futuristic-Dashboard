import { test, expect } from '@playwright/test'
import { seedAuth } from './helpers'

test.describe('视觉回归测试', () => {
  test('登录页布局截图', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    })
  })

  test('404 页面布局截图', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/does-not-exist')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('页面未找到')).toBeVisible()

    await expect(page).toHaveScreenshot('not-found-page.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    })
  })
})
