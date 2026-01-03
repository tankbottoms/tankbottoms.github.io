/**
 * IPFS Iframe Upgrader
 *
 * Automatically upgrades iframes with IPFS gateway URLs to use
 * cascading fallback when the primary gateway fails.
 *
 * Usage: Call upgradeIpfsIframes() after page content loads
 */

import { PUBLIC_GATEWAYS, initializeGateways, gatewayCache } from './ipfs-gateways';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

interface IframeState {
	element: HTMLIFrameElement;
	originalSrc: string;
	cid: string;
	gatewayIndex: number;
	retryCount: number;
}

const iframeStates = new Map<HTMLIFrameElement, IframeState>();
const MAX_RETRIES = PUBLIC_GATEWAYS.length;

/**
 * Extract CID from an IPFS gateway URL
 */
function extractCidFromUrl(url: string): string | null {
	const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
	return match ? match[1] : null;
}

/**
 * Check if URL is an IPFS gateway URL
 */
function isIpfsUrl(url: string): boolean {
	return url.includes('/ipfs/') || url.includes('/ipns/');
}

/**
 * Get ordered list of gateways based on cache
 */
function getOrderedGateways(): string[] {
	const cache = get(gatewayCache);

	if (cache.gateways.length > 0) {
		const online = cache.gateways
			.filter(g => g.online)
			.map(g => g.url);
		const offline = cache.gateways
			.filter(g => !g.online)
			.map(g => g.url);

		const cached = new Set([...online, ...offline]);
		const uncached = PUBLIC_GATEWAYS.filter(g => !cached.has(g));

		return [...online, ...uncached, ...offline];
	}

	return [...PUBLIC_GATEWAYS];
}

/**
 * Build URL for a CID using specified gateway
 */
function buildGatewayUrl(cid: string, gateway: string): string {
	const cleanGateway = gateway.endsWith('/') ? gateway : `${gateway}/`;
	return `${cleanGateway}${cid}`;
}

/**
 * Try loading iframe with next gateway
 */
async function tryNextGateway(state: IframeState): Promise<boolean> {
	const gateways = getOrderedGateways();

	if (state.gatewayIndex >= gateways.length) {
		console.warn(`[IPFS] All gateways failed for CID: ${state.cid}`);
		showErrorState(state.element, state.cid);
		return false;
	}

	const gateway = gateways[state.gatewayIndex];
	const newUrl = buildGatewayUrl(state.cid, gateway);

	console.log(`[IPFS] Trying gateway ${state.gatewayIndex + 1}/${gateways.length}: ${gateway}`);

	// Test the gateway first with a HEAD request
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const response = await fetch(newUrl, {
			method: 'HEAD',
			signal: controller.signal,
			mode: 'cors'
		});

		clearTimeout(timeoutId);

		if (response.ok || response.status === 301 || response.status === 302) {
			state.element.src = newUrl;
			state.retryCount++;
			console.log(`[IPFS] Successfully loaded from: ${gateway}`);
			return true;
		}
	} catch (error) {
		// Gateway failed
	}

	// Try next gateway
	state.gatewayIndex++;
	return tryNextGateway(state);
}

/**
 * Show error state in place of iframe
 */
function showErrorState(iframe: HTMLIFrameElement, cid: string): void {
	const container = iframe.parentElement;
	if (!container) return;

	const errorDiv = document.createElement('div');
	errorDiv.className = 'ipfs-error';
	errorDiv.innerHTML = `
		<div style="
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: ${iframe.height || '400px'};
			background: var(--color-bg-secondary, #f5f5f5);
			border: 1px solid var(--color-error, #cc0000);
			border-radius: 4px;
			color: var(--color-text-muted, #666);
			padding: 2rem;
			text-align: center;
		">
			<p style="font-size: 2rem; margin-bottom: 0.5rem;">⚠</p>
			<p style="color: var(--color-error, #cc0000); margin-bottom: 0.5rem;">
				Unable to load PDF from any IPFS gateway
			</p>
			<p style="font-family: monospace; font-size: 0.75rem; opacity: 0.7;">
				CID: ${cid}
			</p>
			<button onclick="window.location.reload()" style="
				margin-top: 1rem;
				padding: 0.5rem 1rem;
				background: var(--color-link, #0066cc);
				color: white;
				border: none;
				border-radius: 4px;
				cursor: pointer;
			">Retry</button>
		</div>
	`;

	iframe.style.display = 'none';
	container.appendChild(errorDiv);
}

/**
 * Handle iframe load event
 */
function handleIframeLoad(event: Event): void {
	const iframe = event.target as HTMLIFrameElement;
	const state = iframeStates.get(iframe);

	if (state) {
		// Check if the iframe actually loaded content
		// Some gateways return 200 but with error pages
		try {
			// If we can access contentDocument, check if it's a valid PDF
			const doc = iframe.contentDocument;
			if (doc && doc.body.textContent?.includes('404')) {
				handleIframeError(event);
			}
		} catch {
			// Cross-origin - can't check, assume success
		}
	}
}

/**
 * Handle iframe error event
 */
function handleIframeError(event: Event): void {
	const iframe = event.target as HTMLIFrameElement;
	const state = iframeStates.get(iframe);

	if (state && state.retryCount < MAX_RETRIES) {
		state.gatewayIndex++;
		tryNextGateway(state);
	}
}

/**
 * Check if a URL is accessible via HEAD request
 */
async function isUrlAccessible(url: string, timeout = 5000): Promise<boolean> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			method: 'HEAD',
			signal: controller.signal,
			mode: 'cors'
		});
		clearTimeout(timeoutId);
		return response.ok || response.status === 301 || response.status === 302;
	} catch {
		clearTimeout(timeoutId);
		return false;
	}
}

/**
 * Check for local PDF copy first
 */
async function checkLocalPdf(cid: string): Promise<string | null> {
	const localPath = `/pdfs/${cid}.pdf`;
	try {
		const response = await fetch(localPath, { method: 'HEAD' });
		if (response.ok) {
			return localPath;
		}
	} catch {
		// Not found locally
	}
	return null;
}

/**
 * Upgrade a single iframe to use gateway fallback
 */
async function upgradeIframe(iframe: HTMLIFrameElement): Promise<void> {
	const src = iframe.src;

	if (!isIpfsUrl(src)) return;

	const cid = extractCidFromUrl(src);
	if (!cid) return;

	// Check if already upgraded
	if (iframeStates.has(iframe)) return;

	const state: IframeState = {
		element: iframe,
		originalSrc: src,
		cid,
		gatewayIndex: 0,
		retryCount: 0
	};

	iframeStates.set(iframe, state);

	// Add event listeners for fallback on load failures
	iframe.addEventListener('load', handleIframeLoad);
	iframe.addEventListener('error', handleIframeError);

	// Add loading indicator
	iframe.style.opacity = '0.6';

	// First, check if we have a local copy
	const localPath = await checkLocalPdf(cid);
	if (localPath) {
		console.log(`[IPFS] Using local copy for CID: ${cid}`);
		iframe.src = localPath;
		iframe.style.opacity = '1';
		return;
	}

	// Proactively test current URL
	const currentWorks = await isUrlAccessible(src);

	if (currentWorks) {
		console.log(`[IPFS] Current gateway working for CID: ${cid}`);
		iframe.style.opacity = '1';
		return;
	}

	// Current URL doesn't work, find a working gateway
	console.log(`[IPFS] Primary gateway failed, trying alternatives for CID: ${cid}`);

	const gateways = getOrderedGateways();

	for (let i = 0; i < gateways.length; i++) {
		const gateway = gateways[i];
		const url = buildGatewayUrl(cid, gateway);

		// Skip if this is the same as the original (already failed)
		if (url === src) continue;

		if (await isUrlAccessible(url)) {
			console.log(`[IPFS] Found working gateway: ${gateway}`);
			iframe.src = url;
			iframe.style.opacity = '1';
			state.gatewayIndex = i;
			return;
		}
	}

	// All gateways failed
	iframe.style.opacity = '1';
	showErrorState(iframe, cid);
}

/**
 * Find and upgrade all IPFS iframes on the page
 */
export async function upgradeIpfsIframes(): Promise<void> {
	if (!browser) return;

	const iframes = document.querySelectorAll('iframe[src*="/ipfs/"]');

	console.log(`[IPFS] Found ${iframes.length} iframe(s) to upgrade`);

	// Process all iframes in parallel
	await Promise.all(
		Array.from(iframes).map(async (iframe) => {
			if (iframe instanceof HTMLIFrameElement) {
				await upgradeIframe(iframe);
			}
		})
	);

	console.log(`[IPFS] Finished upgrading ${iframes.length} iframe(s)`);
}

/**
 * Initialize upgrader with gateway checking
 */
export async function initIpfsIframeUpgrader(): Promise<void> {
	if (!browser) return;

	// Initialize gateway cache
	await initializeGateways();

	// Upgrade existing iframes
	upgradeIpfsIframes();

	// Watch for new iframes (for SPA navigation)
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node instanceof HTMLIFrameElement && isIpfsUrl(node.src)) {
					upgradeIframe(node);
				}
				if (node instanceof HTMLElement) {
					const iframes = node.querySelectorAll('iframe[src*="/ipfs/"]');
					iframes.forEach((iframe) => {
						if (iframe instanceof HTMLIFrameElement) {
							upgradeIframe(iframe);
						}
					});
				}
			});
		});
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}

/**
 * Cleanup function to remove observers and listeners
 */
export function cleanupIpfsIframeUpgrader(): void {
	iframeStates.forEach((state, iframe) => {
		iframe.removeEventListener('load', handleIframeLoad);
		iframe.removeEventListener('error', handleIframeError);
	});
	iframeStates.clear();
}
