import { test, expect } from '@playwright/test'

test.describe('Domain Builder', () => {
  test('domain builder page loads', async ({ page }) => {
    await page.goto('/domain-builder')
    await expect(page.url()).toContain('domain-builder')
  })

  test('shows search input', async ({ page }) => {
    await page.goto('/domain-builder')
    // Search input should be present
    await expect(page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="domain" i]').first()).toBeVisible({ timeout: 10000 })
  })
})
