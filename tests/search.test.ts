import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Search', () => {
	test('should load search page', async ({ page }) => {
		await navigateTo(page, '/search');
		await expect(page).toHaveTitle(/Search/i);
	});

	test('should have search input', async ({ page }) => {
		await navigateTo(page, '/search');
		const searchInput = page.locator('input[type="text"], input[type="search"]');
		await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
	});

	test('should display search interface', async ({ page }) => {
		await navigateTo(page, '/search');

		// Verify search page has the expected elements
		await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
	});
});
