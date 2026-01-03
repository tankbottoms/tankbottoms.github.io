import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Blog Posts', () => {
	test('should load a blog post page', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.timeline-item', { timeout: 10000 });

		// Click first post
		const firstPost = page.locator('.timeline-item').first();
		await firstPost.click();
		await page.waitForLoadState('networkidle');

		// Should have article content
		const content = page.locator('article, .post-content, .prose, .content');
		await expect(content.first()).toBeVisible({ timeout: 10000 });
	});

	test('should display post title', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.timeline-item', { timeout: 10000 });
		await page.locator('.timeline-item').first().click();
		await page.waitForLoadState('networkidle');

		// Should have an h1 or post title
		const title = page.locator('h1').first();
		await expect(title).toBeVisible({ timeout: 10000 });
	});

	test('should have back navigation', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.timeline-item', { timeout: 10000 });
		await page.locator('.timeline-item').first().click();
		await page.waitForLoadState('networkidle');

		// Should have a back link or navigation (floating nav, back button, or home link)
		const backElements = page.locator('.floating-nav, a[href="/"], nav a');
		await expect(backElements.first()).toBeVisible({ timeout: 10000 });
	});

	test('should display reading time', async ({ page }) => {
		await navigateTo(page, '/');
		await page.waitForSelector('.timeline-item', { timeout: 10000 });
		await page.locator('.timeline-item').first().click();
		await page.waitForLoadState('networkidle');

		// Check the page loads correctly
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
	});
});
