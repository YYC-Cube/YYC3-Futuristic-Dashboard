import { expect, type Page } from '@playwright/test'

export const TEST_TOKEN = 'e2e-auth-token'
export const TEST_USER = {
  id: 'e2e-user',
  name: 'E2E Admin',
  role: 'admin' as const,
}

export async function seedAuth(page: Page) {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('yyc3_auth_token', token)
      localStorage.setItem('yyc3_auth_user', JSON.stringify(user))
    },
    { token: TEST_TOKEN, user: TEST_USER },
  )
}

export async function loginViaUI(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('123456')
  await page.getByRole('button', { name: '登录系统' }).click()
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 })
}

export async function expectHeading(page: Page, name: string | RegExp) {
  await expect(page.getByRole('heading', { name, exact: false }).first()).toBeVisible({
    timeout: 10000,
  })
}

export async function gotoWithAuth(page: Page, path: string) {
  await seedAuth(page)
  await page.goto(path)
}
