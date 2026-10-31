import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth } from './helpers'

test.describe('订单分析中心', () => {
  test('展示营业指标与头部操作', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/orders')

    await expectHeading(page, '数据分析中心')
    await expect(page.getByText('今日营业额')).toBeVisible()
    await expect(page.getByText('今日订单')).toBeVisible()
    await expect(page.getByText('今日客流')).toBeVisible()
    await expect(page.getByText('客单价')).toBeVisible()
    await expect(page.getByRole('button', { name: /刷新数据/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /导出报表/ })).toBeVisible()
  })

  test('分析标签页可以逐项切换', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/orders')

    for (const tab of ['总览', '销售分析', '商品分析', '包厢分析', '客户分析']) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('刷新数据后页面保持可用', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/orders')

    await page.getByRole('button', { name: /刷新数据/ }).click()
    await expectHeading(page, '数据分析中心')
    await expect(page.getByText('今日营业额')).toBeVisible()
  })
})
