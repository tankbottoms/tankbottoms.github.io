import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('About Page', () => {
	test('should load about page', async ({ page }) => {
		await navigateTo(page, '/about');
		await expect(page).toHaveTitle(/About.*Mr\. Whiskers/i);
	});

	test('should display Mr. Whiskers name', async ({ page }) => {
		await navigateTo(page, '/about');
		const name = page.locator('text=/Mr\\.? Whiskers/i');
		await expect(name.first()).toBeVisible({ timeout: 10000 });
	});

	test('should have contact section', async ({ page }) => {
		await navigateTo(page, '/about');
		const contactSection = page.locator('text=/contact/i');
		await expect(contactSection.first()).toBeVisible({ timeout: 10000 });
	});
});
