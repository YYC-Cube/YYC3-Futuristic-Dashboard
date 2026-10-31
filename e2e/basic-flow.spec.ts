import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth } from './helpers'

test.describe('登录与基础布局', () => {
  test('登录页标题和表单可见', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/YYC3/)
    await expect(page.getByText('YYC3 智慧商家管理系统').first()).toBeVisible()
    await expect(page.getByText('请登录以继续操作')).toBeVisible()
    await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
    await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
  })

  test('首页展示核心统计与功能入口', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')

    await expectHeading(page, 'YYC3 智慧商家管理系统')
    await expect(page.getByText('空闲包厢')).toBeVisible()
    await expect(page.getByText('消费中')).toBeVisible()
    await expect(page.getByText('总包厢数')).toBeVisible()
    await expect(page.getByText('今日订单')).toBeVisible()
    await expect(page.getByText('功能导航')).toBeVisible()
  })

  test('包厢面板展示工具栏和包厢卡片', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/rooms')

    await expect(page.getByText('包厢状态').first()).toBeVisible()
    await expect(page.getByPlaceholder('请输入包厢号')).toBeVisible()
    await expect(page.getByRole('button', { name: '大视图' })).toBeVisible()
    await expect(page.getByRole('button', { name: '中视图' })).toBeVisible()
    await expect(page.getByRole('button', { name: '小视图' })).toBeVisible()
    await expect(page.getByText('111').first()).toBeVisible()
  })

  test('移动端登录页保持可用', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')

    await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
    await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录系统' })).toBeVisible()
  })
})
