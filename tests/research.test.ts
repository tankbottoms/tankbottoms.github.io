import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Research Categories', () => {
	test('should load research categories page', async ({ page }) => {
		await navigateTo(page, '/research');
		await expect(page).toHaveTitle(/Research/i);
	});

	test('should display category cards', async ({ page }) => {
		await navigateTo(page, '/research');
		await page.waitForSelector('.category-card', { timeout: 10000 });

		const categories = await page.locator('.category-card').count();
		expect(categories).toBeGreaterThan(0);
	});

	test('should have clickable category cards', async ({ page }) => {
		await navigateTo(page, '/research');
		await page.waitForSelector('.category-card', { timeout: 10000 });

		// Verify the first card has an href that points to a category page
		const firstCard = page.locator('.category-card').first();
		const href = await firstCard.getAttribute('href');
		expect(href).toContain('/research/');
	});
});
