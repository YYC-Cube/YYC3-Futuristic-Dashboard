import { test, expect, type Page } from '@playwright/test'

const USERNAME = 'admin'
const PASSWORD = '123456'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill(USERNAME)
  await page.getByPlaceholder('请输入密码').fill(PASSWORD)
  await page.getByRole('button', { name: '登录系统' }).click()
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 })
}

test.describe('CI 冒烟测试', () => {
  test('登录页核心元素可见', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/YYC3/)
    await expect(page.getByText('YYC3 智慧商家管理系统').first()).toBeVisible()
    await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
    await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })

  test('管理员登录后进入首页', async ({ page }) => {
    await login(page)

    await expect(page.getByRole('heading', { name: 'YYC3 智慧商家管理系统' })).toBeVisible()
    await expect(page.getByText('功能导航')).toBeVisible()
  })

  test('未登录访问受保护路由会跳转登录页', async ({ page }) => {
    await page.goto('/rooms')

    await page.waitForURL(
      (url) => url.pathname.replace(/\/$/, '') === '/login',
      { timeout: 15000 },
    )
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })

  test('首页订单卡片加载且无运行时错误', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await login(page)
    await expect(page.getByText('今日订单')).toBeVisible()
    await page.waitForTimeout(1500)

    expect(pageErrors).toEqual([])
    await expect(page.locator('body')).not.toContainText('Application error')
  })
})
