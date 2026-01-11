/**
 * IPFS Gateway Utilities
 *
 * Provides fallback gateway support for IPFS content with automatic
 * health checking and cascading fallback.
 *
 * Gateway list sourced from https://ipfs.github.io/public-gateway-checker/
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface GatewayStatus {
	url: string;
	online: boolean;
	latency?: number;
	error?: string;
	lastChecked?: number;
}

export interface GatewayCache {
	gateways: GatewayStatus[];
	lastUpdated: number;
	preferredGateway: string | null;
}

// Public IPFS gateways sorted by priority
// Removed: cloudflare-ipfs.com (DNS), nftstorage.link (deprecated), gateway.pinata.cloud (CORS)
export const PUBLIC_GATEWAYS = [
	'https://ipfs.pantsonfire.xyz/ipfs/',
	'https://dweb.link/ipfs/',
	'https://ipfs.io/ipfs/',
	'https://w3s.link/ipfs/',
	'https://4everland.io/ipfs/',
] as const;

// IPNS gateways
export const IPNS_GATEWAYS = [
	'https://ipfs.io/ipns/',
	'https://dweb.link/ipns/',
	'https://gateway.ipfs.io/ipns/',
] as const;

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Gateway status store
const defaultCache: GatewayCache = {
	gateways: [],
	lastUpdated: 0,
	preferredGateway: null,
};

export const gatewayCache = writable<GatewayCache>(defaultCache);

// Track initialization state
let isInitializing = false;
let initPromise: Promise<void> | null = null;

/**
 * Check if a gateway is online by fetching a known CID
 */
export async function checkGateway(
	gatewayUrl: string,
	testCid: string = 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m',
	timeout: number = 5000
): Promise<GatewayStatus> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	const start = performance.now();

	try {
		const response = await fetch(`${gatewayUrl}${testCid}`, {
			method: 'HEAD',
			signal: controller.signal,
			mode: 'cors',
		});

		clearTimeout(timeoutId);
		const latency = Math.round(performance.now() - start);

		return {
			url: gatewayUrl,
			online: response.ok || response.status === 301 || response.status === 302,
			latency,
			lastChecked: Date.now(),
		};
	} catch (error) {
		clearTimeout(timeoutId);
		return {
			url: gatewayUrl,
			online: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			lastChecked: Date.now(),
		};
	}
}

/**
 * Check all public gateways and update the cache
 */
export async function checkAllGateways(
	gateways: readonly string[] = PUBLIC_GATEWAYS,
	testCid?: string,
	timeout: number = 5000
): Promise<GatewayStatus[]> {
	const results = await Promise.all(
		gateways.map((gw) => checkGateway(gw, testCid, timeout))
	);

	const sorted = results.sort((a, b) => {
		// Online gateways first
		if (a.online && !b.online) return -1;
		if (!a.online && b.online) return 1;
		// Then by latency
		return (a.latency || Infinity) - (b.latency || Infinity);
	});

	// Update the cache
	const preferredGateway = sorted.find((g) => g.online)?.url || null;
	gatewayCache.set({
		gateways: sorted,
		lastUpdated: Date.now(),
		preferredGateway,
	});

	return sorted;
}

/**
 * Initialize gateway checking (call once on app load)
 */
export async function initializeGateways(): Promise<void> {
	if (!browser) return;

	// Prevent multiple simultaneous initializations
	if (isInitializing && initPromise) {
		return initPromise;
	}

	const cache = get(gatewayCache);
	const now = Date.now();

	// Use cached results if still valid
	if (cache.lastUpdated > 0 && now - cache.lastUpdated < CACHE_DURATION) {
		return;
	}

	isInitializing = true;
	initPromise = checkAllGateways().then(() => {
		isInitializing = false;
	});

	return initPromise;
}

/**
 * Get the first operational gateway URL for a CID
 * Uses cached gateway status, falls back to checking if cache is stale
 */
export async function getOperationalGatewayUrl(cid: string): Promise<string> {
	if (!browser) {
		// SSR fallback - use priority gateway
		return `${PUBLIC_GATEWAYS[0]}${cid}`;
	}

	const cache = get(gatewayCache);
	const now = Date.now();

	// If cache is stale or empty, refresh it
	if (cache.lastUpdated === 0 || now - cache.lastUpdated > CACHE_DURATION) {
		await initializeGateways();
	}

	// Get updated cache
	const updatedCache = get(gatewayCache);

	// Return preferred gateway URL
	if (updatedCache.preferredGateway) {
		return `${updatedCache.preferredGateway}${cid}`;
	}

	// Fallback to first gateway in list
	return `${PUBLIC_GATEWAYS[0]}${cid}`;
}

/**
 * Get operational gateway URL synchronously (uses cached value)
 * Returns null if no gateway is available yet
 */
export function getOperationalGatewayUrlSync(cid: string): string {
	if (!browser) {
		return `${PUBLIC_GATEWAYS[0]}${cid}`;
	}

	const cache = get(gatewayCache);

	if (cache.preferredGateway) {
		return `${cache.preferredGateway}${cid}`;
	}

	// Trigger async initialization if not done
	if (cache.lastUpdated === 0) {
		initializeGateways();
	}

	// Return first gateway as fallback
	return `${PUBLIC_GATEWAYS[0]}${cid}`;
}

/**
 * Try a specific CID on gateways with cascading fallback
 * Returns the first working URL
 */
export async function findWorkingGatewayForCid(
	cid: string,
	timeout: number = 8000
): Promise<string | null> {
	for (const gateway of PUBLIC_GATEWAYS) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const url = `${gateway}${cid}`;
			const response = await fetch(url, {
				method: 'HEAD',
				signal: controller.signal,
				mode: 'cors',
			});

			clearTimeout(timeoutId);

			if (response.ok || response.status === 301 || response.status === 302) {
				return url;
			}
		} catch {
			clearTimeout(timeoutId);
			// Continue to next gateway
		}
	}

	return null;
}

/**
 * Build a gateway URL for a CID
 */
export function buildGatewayUrl(
	cid: string,
	gateway: string = PUBLIC_GATEWAYS[0],
	path: string = ''
): string {
	const cleanGateway = gateway.endsWith('/') ? gateway : `${gateway}/`;
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return `${cleanGateway}${cid}${cleanPath ? `/${cleanPath}` : ''}`;
}

/**
 * Build an IPNS URL for a key
 */
export function buildIpnsUrl(
	ipnsKey: string,
	gateway: string = IPNS_GATEWAYS[0],
	path: string = ''
): string {
	const cleanGateway = gateway.endsWith('/') ? gateway : `${gateway}/`;
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return `${cleanGateway}${ipnsKey}${cleanPath ? `/${cleanPath}` : ''}`;
}

/**
 * Try fetching content from multiple gateways with fallback
 */
export async function fetchWithFallback(
	cid: string,
	path: string = '',
	gateways: readonly string[] = PUBLIC_GATEWAYS,
	timeout: number = 10000
): Promise<Response> {
	const errors: Error[] = [];

	for (const gateway of gateways) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const url = buildGatewayUrl(cid, gateway, path);
			const response = await fetch(url, { signal: controller.signal });
			clearTimeout(timeoutId);

			if (response.ok) {
				return response;
			}
			errors.push(new Error(`Gateway ${gateway} returned ${response.status}`));
		} catch (error) {
			clearTimeout(timeoutId);
			errors.push(
				error instanceof Error ? error : new Error(`Gateway ${gateway} failed`)
			);
		}
	}

	throw new AggregateError(errors, 'All gateways failed');
}

/**
 * Parse an IPFS URI (ipfs://, ipns://) to CID/key
 */
export function parseIpfsUri(uri: string): { type: 'ipfs' | 'ipns'; id: string; path: string } | null {
	const ipfsMatch = uri.match(/^ipfs:\/\/([^/]+)(\/.*)?$/);
	if (ipfsMatch) {
		return {
			type: 'ipfs',
			id: ipfsMatch[1],
			path: ipfsMatch[2] || '',
		};
	}

	const ipnsMatch = uri.match(/^ipns:\/\/([^/]+)(\/.*)?$/);
	if (ipnsMatch) {
		return {
			type: 'ipns',
			id: ipnsMatch[1],
			path: ipnsMatch[2] || '',
		};
	}

	return null;
}

/**
 * Extract CID from a gateway URL
 */
export function extractCidFromUrl(url: string): string | null {
	// Match patterns like /ipfs/bafy... or /ipfs/Qm...
	const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
	return match ? match[1] : null;
}

/**
 * Convert an IPFS URI to a gateway URL
 */
export function ipfsUriToGatewayUrl(
	uri: string,
	gateway?: string
): string | null {
	const parsed = parseIpfsUri(uri);
	if (!parsed) return null;

	if (parsed.type === 'ipfs') {
		return buildGatewayUrl(parsed.id, gateway, parsed.path);
	} else {
		return buildIpnsUrl(parsed.id, gateway, parsed.path);
	}
}

/**
 * Get list of online gateways from cache
 */
export function getOnlineGateways(): GatewayStatus[] {
	const cache = get(gatewayCache);
	return cache.gateways.filter((g) => g.online);
}

/**
 * Force refresh gateway status
 */
export async function refreshGateways(): Promise<GatewayStatus[]> {
	return checkAllGateways();
}
