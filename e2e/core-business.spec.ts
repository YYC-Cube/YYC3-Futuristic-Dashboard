import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth } from './helpers'

test.describe('核心业务页面', () => {
  test('包厢卡片可以打开详情', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/rooms')

    const roomCard = page.locator('div.cursor-pointer').filter({ hasText: '111' }).first()
    await expect(roomCard).toBeVisible()
    await roomCard.click()

    await expect(page.getByText(/包厢 111/)).toBeVisible()
    await expect(page.getByRole('tab', { name: '状态' })).toBeVisible()
  })

  test('订单分析页展示核心指标和标签页', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/orders')

    await expectHeading(page, '数据分析中心')
    await expect(page.getByText('今日营业额')).toBeVisible()
    await expect(page.getByText('今日订单')).toBeVisible()
    await expect(page.getByText('今日客流')).toBeVisible()
    await expect(page.getByText('客单价')).toBeVisible()

    await page.getByRole('tab', { name: '销售分析' }).click()
    await expect(page.getByRole('tab', { name: '销售分析' })).toHaveAttribute('aria-selected', 'true')
  })

  test('收银台页面可以加载', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/pos')

    await expectHeading(page, '点单收银')
    await expect(page.getByRole('heading', { name: '购物车' })).toBeVisible()
  })

  test('员工管理标签页可以切换', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/employees')

    await expectHeading(page, '员工档案管理')

    await page.getByRole('tab', { name: '权限管理' }).click()
    await expectHeading(page, '权限设置')

    await page.getByRole('tab', { name: '组别管理' }).click()
    await expectHeading(page, '员工组别管理')
  })
})
