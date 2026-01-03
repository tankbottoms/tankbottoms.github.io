import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Homepage', () => {
	test('should load the homepage', async ({ page }) => {
		await navigateTo(page, '/');
		await expect(page).toHaveTitle(/Mr\. Whiskers Blog/);
	});

	test('should display timeline entries', async ({ page }) => {
		await navigateTo(page, '/');
		// Wait for loader to finish
		await page.waitForSelector('.timeline-item', { timeout: 10000 });
		const entries = await page.locator('.timeline-item').count();
		expect(entries).toBeGreaterThan(0);
	});

	test('should have working navigation links', async ({ page }) => {
		await navigateTo(page, '/');

		// Check navigation exists
		await expect(page.locator('nav')).toBeVisible();

		// Check key links
		await expect(page.locator('a[href*="/about"]').first()).toBeVisible();
		await expect(page.locator('a[href*="/research"]').first()).toBeVisible();
		await expect(page.locator('a[href*="/search"]').first()).toBeVisible();
	});

	test('should have year and month markers', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.year-marker', { timeout: 10000 });

		const yearMarkers = await page.locator('.year-marker').count();
		expect(yearMarkers).toBeGreaterThan(0);
	});

	test('should display nap filter', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.filter-row', { timeout: 10000 });
		await expect(page.locator('.filter-row')).toBeVisible();
	});

	test('should navigate to blog post when clicked', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.timeline-item', { timeout: 10000 });

		// Click the first timeline entry
		const firstEntry = page.locator('.timeline-item').first();
		await firstEntry.click();
		await page.waitForLoadState('networkidle');

		// Should have navigated - check we're on a post page with h1
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
	});
});
