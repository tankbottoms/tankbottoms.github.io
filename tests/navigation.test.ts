import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Navigation', () => {
	test('should navigate to About page', async ({ page }) => {
		await navigateTo(page, '/');
		const aboutLink = page.locator('a[href*="/about"]').first();
		await expect(aboutLink).toBeVisible();
		await aboutLink.click();
		await page.waitForURL('**/about');
		await expect(page).toHaveTitle(/About/i);
	});

	test('should navigate to Research page', async ({ page }) => {
		await navigateTo(page, '/');
		const researchLink = page.locator('a[href*="/research"]').first();
		await expect(researchLink).toBeVisible();
		await researchLink.click();
		await page.waitForURL('**/research');
		await expect(page).toHaveTitle(/Research/i);
	});

	test('should navigate to Search page', async ({ page }) => {
		await navigateTo(page, '/');
		const searchLink = page.locator('a[href*="/search"]').first();
		await expect(searchLink).toBeVisible();
		await searchLink.click();
		await page.waitForURL('**/search');
		await expect(page).toHaveTitle(/Search/i);
	});

	test('should toggle dark mode', async ({ page }) => {
		await navigateTo(page, '/');

		// Find and click theme toggle
		const themeToggle = page.locator('#theme-toggle');
		if (await themeToggle.isVisible()) {
			const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
			await themeToggle.click();
			await page.waitForTimeout(300);
			const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
			expect(newTheme).not.toBe(initialTheme);
		}
	});
});
