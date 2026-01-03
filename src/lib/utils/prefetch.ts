/**
 * Prefetch Utility
 *
 * Handles background pre-caching of pages and resources after initial paint.
 * Implements progressive loading based on scroll depth and visibility.
 */

import { browser } from '$app/environment';
import { PUBLIC_GATEWAYS, initializeGateways, findWorkingGatewayForCid } from './ipfs-gateways';

// Top-level pages to pre-cache after initial paint
const TOP_LEVEL_PAGES = ['/research', '/about', '/search', '/icons'];

// Track what has been pre-cached
const prefetchedPages = new Set<string>();
const prefetchedPdfs = new Set<string>();

// Prefetch state
let isInitialized = false;
let prefetchQueue: string[] = [];
let pdfPrefetchQueue: string[] = [];
let isPrefetching = false;

/**
 * Initialize prefetching after initial paint
 * Call this from the layout after the page has rendered
 */
export async function initializePrefetch(): Promise<void> {
	if (!browser || isInitialized) return;
	isInitialized = true;

	// Wait for idle time before starting prefetch
	if ('requestIdleCallback' in window) {
		(window as any).requestIdleCallback(() => startPrefetchSequence(), { timeout: 2000 });
	} else {
		// Fallback for Safari
		setTimeout(() => startPrefetchSequence(), 1000);
	}
}

/**
 * Start the prefetch sequence
 */
async function startPrefetchSequence(): Promise<void> {
	// First, prefetch top-level pages
	await prefetchTopLevelPages();

	// Initialize IPFS gateways in background
	initializeGateways();
}

/**
 * Prefetch top-level navigation pages
 */
async function prefetchTopLevelPages(): Promise<void> {
	for (const page of TOP_LEVEL_PAGES) {
		if (prefetchedPages.has(page)) continue;

		try {
			// Use link prefetch for navigation pages
			prefetchPage(page);
			prefetchedPages.add(page);

			// Small delay between prefetches to avoid overwhelming the browser
			await delay(100);
		} catch (error) {
			console.debug(`Prefetch failed for ${page}:`, error);
		}
	}
}

/**
 * Prefetch a page using link preload
 */
function prefetchPage(url: string): void {
	if (!browser) return;

	// Check if already prefetched
	const existing = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
	if (existing) return;

	const link = document.createElement('link');
	link.rel = 'prefetch';
	link.href = url;
	link.as = 'document';
	document.head.appendChild(link);
}

/**
 * Add timeline entry pages to prefetch queue
 * Call this with visible entry paths
 */
export function queueTimelineEntryPrefetch(paths: string[]): void {
	if (!browser) return;

	for (const path of paths) {
		const fullPath = path.startsWith('/') ? path : `/${path}`;
		if (!prefetchedPages.has(fullPath) && !prefetchQueue.includes(fullPath)) {
			prefetchQueue.push(fullPath);
		}
	}

	// Start processing queue if not already running
	if (!isPrefetching) {
		processPrefetchQueue();
	}
}

/**
 * Process the prefetch queue in background
 */
async function processPrefetchQueue(): Promise<void> {
	if (isPrefetching || prefetchQueue.length === 0) return;
	isPrefetching = true;

	while (prefetchQueue.length > 0) {
		const path = prefetchQueue.shift();
		if (!path || prefetchedPages.has(path)) continue;

		try {
			prefetchPage(path);
			prefetchedPages.add(path);
			await delay(150); // Throttle prefetches
		} catch (error) {
			console.debug(`Prefetch failed for ${path}:`, error);
		}
	}

	isPrefetching = false;
}

/**
 * Queue PDFs for background prefetch
 * @param cids Array of IPFS CIDs to prefetch
 */
export function queuePdfPrefetch(cids: string[]): void {
	if (!browser) return;

	for (const cid of cids) {
		if (!prefetchedPdfs.has(cid) && !pdfPrefetchQueue.includes(cid)) {
			pdfPrefetchQueue.push(cid);
		}
	}

	// Process PDF queue with low priority
	if ('requestIdleCallback' in window) {
		(window as any).requestIdleCallback(() => processPdfPrefetchQueue(), { timeout: 5000 });
	} else {
		setTimeout(() => processPdfPrefetchQueue(), 2000);
	}
}

/**
 * Process PDF prefetch queue
 */
async function processPdfPrefetchQueue(): Promise<void> {
	// Process up to 3 PDFs at a time
	const batch = pdfPrefetchQueue.splice(0, 3);

	for (const cid of batch) {
		if (prefetchedPdfs.has(cid)) continue;

		try {
			// Find a working gateway and prefetch the PDF
			const url = await findWorkingGatewayForCid(cid);
			if (url) {
				prefetchResource(url, 'document');
				prefetchedPdfs.add(cid);
			}
			await delay(500); // Longer delay for PDFs
		} catch (error) {
			console.debug(`PDF prefetch failed for ${cid}:`, error);
		}
	}

	// Continue processing if more in queue
	if (pdfPrefetchQueue.length > 0) {
		if ('requestIdleCallback' in window) {
			(window as any).requestIdleCallback(() => processPdfPrefetchQueue(), { timeout: 10000 });
		} else {
			setTimeout(() => processPdfPrefetchQueue(), 5000);
		}
	}
}

/**
 * Prefetch a resource using link preload
 */
function prefetchResource(url: string, as: string = 'fetch'): void {
	if (!browser) return;

	const link = document.createElement('link');
	link.rel = 'prefetch';
	link.href = url;
	link.as = as;
	document.head.appendChild(link);
}

/**
 * Create an intersection observer to prefetch visible timeline entries
 * @param scrollDepthMultiplier How many viewport heights ahead to prefetch (default 2)
 */
export function createVisibilityPrefetcher(
	scrollDepthMultiplier: number = 2
): IntersectionObserver | null {
	if (!browser) return null;

	const rootMargin = `${scrollDepthMultiplier * 100}% 0px`;

	return new IntersectionObserver(
		(entries) => {
			const visiblePaths: string[] = [];

			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const path = (entry.target as HTMLElement).dataset.prefetchPath;
					if (path) {
						visiblePaths.push(path);
					}
				}
			});

			if (visiblePaths.length > 0) {
				queueTimelineEntryPrefetch(visiblePaths);
			}
		},
		{
			rootMargin,
			threshold: 0
		}
	);
}

/**
 * Extract IPFS CIDs from page content for prefetching
 * @param content HTML content to scan for CIDs
 */
export function extractCidsFromContent(content: string): string[] {
	const cidPattern = /bafy[a-zA-Z0-9]{50,}/g;
	const matches = content.match(cidPattern);
	return matches ? [...new Set(matches)] : [];
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get prefetch statistics
 */
export function getPrefetchStats(): { pages: number; pdfs: number } {
	return {
		pages: prefetchedPages.size,
		pdfs: prefetchedPdfs.size
	};
}
