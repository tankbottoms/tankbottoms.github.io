import type { Page } from '@playwright/test';

/**
 * Dismiss the cookie consent modal if it's visible
 */
export async function dismissCookieConsent(page: Page): Promise<void> {
	const acceptButton = page.locator('button:has-text("I Understand")');
	if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
		await acceptButton.click();
		await page.waitForTimeout(300);
	}
}

/**
 * Navigate to a page and dismiss the cookie consent modal
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
	await page.goto(path);
	await page.waitForLoadState('networkidle');
	await dismissCookieConsent(page);
}
