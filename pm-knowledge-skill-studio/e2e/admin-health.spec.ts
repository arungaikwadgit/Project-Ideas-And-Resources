import { test, expect } from '@playwright/test'

test.describe('Admin Health Page', () => {
  test('admin health page loads', async ({ page }) => {
    await page.goto('/admin-health')
    await expect(page.locator('text=Admin')).toBeVisible({ timeout: 10000 })
  })

  test('shows password form initially', async ({ page }) => {
    await page.goto('/admin-health')
    // Should see a password input
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/admin-health')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Incorrect')).toBeVisible({ timeout: 5000 })
  })

  test('correct password shows health dashboard', async ({ page }) => {
    await page.goto('/admin-health')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Health')).toBeVisible({ timeout: 5000 })
  })
})
