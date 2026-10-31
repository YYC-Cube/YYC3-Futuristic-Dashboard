import { test, expect } from '@playwright/test'
import { expectHeading, loginViaUI, seedAuth } from './helpers'

test.describe('应用基础流程', () => {
  test('登录页显示核心元素', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/YYC3/)
    await expect(page.getByText('YYC3 智慧商家管理系统').first()).toBeVisible()
    await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
    await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })

  test('管理员登录后进入首页', async ({ page }) => {
    await loginViaUI(page)

    await expectHeading(page, 'YYC3 智慧商家管理系统')
    await expect(page.getByText('功能导航')).toBeVisible()
  })

  test('首页展示统计卡片与功能导航', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')

    await expectHeading(page, 'YYC3 智慧商家管理系统')
    await expect(page.getByText('空闲包厢')).toBeVisible()
    await expect(page.getByText('消费中')).toBeVisible()
    await expect(page.getByText('总包厢数')).toBeVisible()
    await expect(page.getByText('今日订单')).toBeVisible()
    await expect(page.getByText('功能导航')).toBeVisible()
  })

  test('功能导航可以进入包厢和订单页面', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')

    await page.getByRole('link', { name: /包厢管理/ }).click()
    await expect(page).toHaveURL(/\/rooms/)
    await expect(page.getByText('包厢状态').first()).toBeVisible()

    await page.goto('/')
    await page.getByRole('link', { name: /订单中心/ }).click()
    await expect(page).toHaveURL(/\/orders/)
    await expectHeading(page, '数据分析中心')
  })
})
