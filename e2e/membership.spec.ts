import { test, expect } from '@playwright/test'
import { expectHeading, seedAuth } from './helpers'

test.describe('会员中心', () => {
  test('展示会员概览和会员列表', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/membership')

    await expectHeading(page, '会员中心')
    await expect(page.getByText('总会员数')).toBeVisible()
    await expect(page.getByText('总积分池')).toBeVisible()
    await expect(page.getByPlaceholder('搜索姓名或手机号...')).toBeVisible()
    await expect(page.getByText('张三').first()).toBeVisible()
  })

  test('会员标签页可以逐项切换', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/membership')

    for (const tab of [/会员列表/, /积分流水/, /兑换商城/, /排行榜/]) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('搜索可以过滤会员', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/membership')

    await page.getByPlaceholder('搜索姓名或手机号...').fill('张三')
    await expect(page.getByText('张三').first()).toBeVisible()
    await expect(page.getByText('李四')).toHaveCount(0)
  })

  test('添加会员弹窗可以打开', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/membership')

    await page.getByRole('button', { name: /添加会员/ }).first().click()
    await expectHeading(page, '添加新会员')
    await expect(page.getByText('录入会员基本信息以开启会员服务')).toBeVisible()
  })
})
