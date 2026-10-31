import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth } from './helpers'

test.describe('库存智能看板', () => {
  test('展示库存概览和商品数据', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/inventory')

    await expectHeading(page, '库存智能看板')
    await expect(page.getByText('SKU总数')).toBeVisible()
    await expect(page.getByText('库存总值')).toBeVisible()
    await expect(page.getByPlaceholder('搜索商品名称/SKU/条码...')).toBeVisible()
    await expect(page.getByText('百威啤酒').first()).toBeVisible()
  })

  test('库存标签页可以逐项切换', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/inventory')

    for (const tab of [/商品库存/, /预警中心/, /变动记录/, '需求预测']) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('搜索可以过滤库存商品', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/inventory')

    await page.getByPlaceholder('搜索商品名称/SKU/条码...').fill('百威')
    await expect(page.getByText('百威啤酒').first()).toBeVisible()
    await expect(page.getByText('薯片(大包)')).toHaveCount(0)
  })

  test('添加商品弹窗可以打开', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/inventory')

    await page.getByRole('button', { name: /添加商品/ }).click()
    await expectHeading(page, '添加新商品')
    await expect(page.getByText('录入商品信息以加入库存管理系统')).toBeVisible()
  })
})
