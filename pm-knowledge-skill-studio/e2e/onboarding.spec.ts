import { test, expect } from '@playwright/test'

test.describe('Onboarding', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/PM Knowledge/)
  })

  test('dashboard shows app name', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=PM Knowledge')).toBeVisible({ timeout: 10000 })
  })

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
  })

  test('domain builder link is accessible', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('a[href*="domain-builder"]').first()
    await expect(link).toBeVisible()
  })

  test('navigates to domain builder', async ({ page }) => {
    await page.goto('/domain-builder')
    await expect(page.url()).toContain('domain-builder')
  })

  test('unknown route redirects to dashboard', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await expect(page.url()).not.toContain('nonexistent-page')
  })
})
