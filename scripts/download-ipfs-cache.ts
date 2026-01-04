#!/usr/bin/env bun
/**
 * Download IPFS CIDs to local cache
 *
 * Usage:
 *   bun run download-ipfs-cache          # Download all CIDs
 *   bun run download-ipfs-cache 10       # Download first 10 CIDs
 *   bun run download-ipfs-cache --check  # Check which CIDs are cached
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = 'static/pdf/cache';
const CID_FILE = 'docs/IPFS-CID_CACHE.txt';

// Multiple IPFS gateways to try (in order of preference)
const GATEWAYS = [
	'https://ipfs.pantsonfire.xyz/ipfs',
	'https://ipfs1.shh-shush.xyz/ipfs',
	'https://dweb.link/ipfs',
	'https://ipfs.io/ipfs',
	'https://cloudflare-ipfs.com/ipfs',
	'https://gateway.pinata.cloud/ipfs'
];

interface DownloadResult {
	cid: string;
	success: boolean;
	size?: number;
	gateway?: string;
	error?: string;
}

async function fetchFromGateway(cid: string, gateway: string, timeout = 120000): Promise<Response | null> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(`${gateway}/${cid}`, {
			signal: controller.signal,
			headers: {
				'Accept': 'application/pdf,*/*'
			}
		});
		clearTimeout(timeoutId);

		if (response.ok) {
			return response;
		}
		return null;
	} catch {
		clearTimeout(timeoutId);
		return null;
	}
}

async function downloadCid(cid: string): Promise<DownloadResult> {
	const cachePath = join(CACHE_DIR, `${cid}.pdf`);

	// Skip if already cached
	if (existsSync(cachePath)) {
		const stats = Bun.file(cachePath).size;
		return { cid, success: true, size: stats, gateway: 'cached' };
	}

	// Try each gateway
	for (const gateway of GATEWAYS) {
		console.log(`  Trying ${gateway}...`);
		const response = await fetchFromGateway(cid, gateway);

		if (response) {
			try {
				const buffer = await response.arrayBuffer();
				writeFileSync(cachePath, Buffer.from(buffer));
				const size = buffer.byteLength;
				console.log(`  Downloaded ${(size / 1024).toFixed(1)} KB from ${gateway}`);
				return { cid, success: true, size, gateway };
			} catch (error) {
				console.log(`  Failed to save from ${gateway}: ${error}`);
			}
		}
	}

	return { cid, success: false, error: 'All gateways failed' };
}

async function main() {
	const args = process.argv.slice(2);
	const checkOnly = args.includes('--check');
	const limit = args.find(a => !a.startsWith('--') && !isNaN(Number(a)));
	const maxDownloads = limit ? parseInt(limit, 10) : Infinity;

	// Ensure cache directory exists
	if (!existsSync(CACHE_DIR)) {
		mkdirSync(CACHE_DIR, { recursive: true });
	}

	// Read CID list
	if (!existsSync(CID_FILE)) {
		console.error(`CID file not found: ${CID_FILE}`);
		console.error('Run: grep -E "^bafybei" docs/IPFS-CID_CACHE.md > docs/IPFS-CID_CACHE.txt');
		process.exit(1);
	}

	const cids = readFileSync(CID_FILE, 'utf-8')
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.startsWith('bafybei'));

	console.log(`Found ${cids.length} CIDs in ${CID_FILE}`);

	if (checkOnly) {
		// Just check cache status
		let cached = 0;
		let missing = 0;
		let totalSize = 0;

		for (const cid of cids) {
			const cachePath = join(CACHE_DIR, `${cid}.pdf`);
			if (existsSync(cachePath)) {
				const size = Bun.file(cachePath).size;
				totalSize += size;
				cached++;
			} else {
				missing++;
			}
		}

		console.log(`\nCache Status:`);
		console.log(`  Cached: ${cached}/${cids.length} (${((cached/cids.length)*100).toFixed(1)}%)`);
		console.log(`  Missing: ${missing}`);
		console.log(`  Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
		return;
	}

	// Download CIDs
	const toDownload = cids.slice(0, maxDownloads);
	console.log(`Downloading ${toDownload.length} CIDs...\n`);

	const results: DownloadResult[] = [];
	let downloaded = 0;
	let failed = 0;
	let skipped = 0;

	for (let i = 0; i < toDownload.length; i++) {
		const cid = toDownload[i];
		console.log(`[${i + 1}/${toDownload.length}] ${cid}`);

		const result = await downloadCid(cid);
		results.push(result);

		if (result.gateway === 'cached') {
			skipped++;
			console.log(`  Already cached (${(result.size! / 1024).toFixed(1)} KB)\n`);
		} else if (result.success) {
			downloaded++;
			console.log(`  Success\n`);
		} else {
			failed++;
			console.log(`  Failed: ${result.error}\n`);
		}
	}

	// Summary
	console.log('\n=== Summary ===');
	console.log(`Downloaded: ${downloaded}`);
	console.log(`Skipped (cached): ${skipped}`);
	console.log(`Failed: ${failed}`);

	const totalSize = results
		.filter(r => r.success && r.size)
		.reduce((sum, r) => sum + (r.size || 0), 0);
	console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

	if (failed > 0) {
		console.log('\nFailed CIDs:');
		results.filter(r => !r.success).forEach(r => {
			console.log(`  ${r.cid}: ${r.error}`);
		});
	}
}

main().catch(console.error);
