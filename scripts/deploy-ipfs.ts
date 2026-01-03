#!/usr/bin/env bun
/**
 * IPFS/IPNS Deployment Script for Cane Timeline Blog
 *
 * ============================================================================
 * ARCHITECTURE OVERVIEW
 * ============================================================================
 *
 * This script deploys the site to IPFS with IPNS naming for persistent URLs.
 * It maintains SEPARATE directories to avoid conflicts with Vercel deployment:
 *
 *   - build/         -> Vercel output (DO NOT TOUCH)
 *   - .ipfs-build/   -> IPFS static site output
 *   - .ipfs-redirect/-> Simple redirect page for ENS domains
 *
 * ============================================================================
 * IPFS PATH CONVERSION
 * ============================================================================
 *
 * SvelteKit generates absolute paths (/_app/...) that break on IPFS because:
 *   - Gateways serve content at /ipfs/{CID}/ not root /
 *   - Absolute paths resolve to gateway root, not CID subdirectory
 *
 * Solution: Post-process all HTML and JS files to convert:
 *   href="/"         -> href="./"
 *   src="/images/"   -> src="./images/"
 *   import("/_app/") -> import("./_app/")
 *
 * ============================================================================
 * IPNS KEYS
 * ============================================================================
 *
 * Two separate IPNS keys are used (hosted on spark-2):
 *   - cane-timeline:          Full site deployment
 *   - cane-timeline-redirect: Redirect page for ENS domains
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   bun run ipfs              - Build and deploy full site
 *   bun run ipfs redirect     - Deploy redirect page only
 *   bun run ipfs both         - Deploy both (recommended)
 *   bun run ipfs test         - Test IPFS server connectivity
 *   bun run ipfs verify       - Verify deployed content
 *
 * ============================================================================
 * TESTING STRATEGY
 * ============================================================================
 *
 * Primary test endpoints (fast, reliable):
 *   1. spark-2.local:5001 API - Direct node access
 *   2. ipfs.kyleen-cane.xyz  - Self-hosted gateway
 *
 * Public gateways (propagation delay expected):
 *   - ipfs.io, dweb.link
 *
 * ============================================================================
 */

import { $ } from 'bun';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = join(import.meta.dir, '..');

// IMPORTANT: Separate directories to avoid Vercel conflicts
const IPFS_BUILD_DIR = join(PROJECT_ROOT, '.ipfs-build');  // Static site for IPFS
const REDIRECT_DIR = join(PROJECT_ROOT, '.ipfs-redirect'); // Redirect page
const VERCEL_BUILD_DIR = join(PROJECT_ROOT, 'build');      // Vercel output (DO NOT USE)

const IPFS_CID_FILE = join(PROJECT_ROOT, 'IPFS-CID.md');
const LAYOUT_FILE = join(PROJECT_ROOT, 'src/routes/+layout.svelte');

// IPFS node configuration
const IPFS_NODES = [
	{ name: 'spark-2', hostname: 'spark-2.local', ip: '192.168.1.63', apiPort: 5001, gatewayPort: 8080, hasIpnsKeys: true },
	{ name: 'spark-1', hostname: 'spark-1.local', ip: '192.168.1.62', apiPort: 5001, gatewayPort: 8080, hasIpnsKeys: false },
	{ name: 'local', hostname: 'localhost', ip: '127.0.0.1', apiPort: 5001, gatewayPort: 8080, hasIpnsKeys: false },
] as const;

// Primary gateways for testing (fast, reliable)
const PRIMARY_TEST_GATEWAYS = [
	'https://ipfs.kyleen-cane.xyz',  // Self-hosted, fastest
];

// Public gateways (propagation may take time)
const PUBLIC_GATEWAYS = [
	'https://ipfs.io',
	'https://dweb.link',
];

// IPNS key names (hosted on spark-2)
const IPNS_KEY_SITE = 'cane-timeline';
const IPNS_KEY_REDIRECT = 'cane-timeline-redirect';

// Redirect target
const REDIRECT_TARGET = 'https://kyleen-cane.xyz';

// ENS domains
const ENS_DOMAINS = {
	site: ['kyleen-cane.eth'],
	redirect: ['redirect.kyleen-cane.eth', 'about.kyleen-cane.eth'],
};

// ============================================================================
// TYPES
// ============================================================================

interface ServerInfo {
	endpoint: string;
	gatewayUrl: string;
	hostname: string;
	hasIpnsKeys: boolean;
}

interface DeployResult {
	cid: string;
	ipnsKey: string;
	ipnsName: string;
	type: 'full' | 'redirect';
	server: string;
	urls: {
		ipfs: string[];
		ipns: string[];
	};
}

// ============================================================================
// ACTIVE SERVER STATE
// ============================================================================

let activeServer: ServerInfo | null = null;

// ============================================================================
// IPFS API FUNCTIONS
// ============================================================================

/**
 * Check if an IPFS API endpoint is accessible
 */
async function checkIpfsApi(apiEndpoint: string): Promise<{ ok: boolean; peerId?: string; error?: string }> {
	try {
		const response = await fetch(`${apiEndpoint}/api/v0/id`, {
			method: 'POST',
			signal: AbortSignal.timeout(5000)
		});
		if (response.ok) {
			const data = await response.json();
			return { ok: true, peerId: data.ID };
		}
		return { ok: false, error: `HTTP ${response.status}` };
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		return { ok: false, error: msg.includes('abort') ? 'Timeout' : msg };
	}
}

/**
 * Find an available IPFS server, preferring nodes with IPNS keys
 */
async function findAvailableIpfsServer(): Promise<ServerInfo | null> {
	console.log('Checking IPFS server availability...');

	for (const node of IPFS_NODES) {
		// Try hostname first
		const hostnameEndpoint = `http://${node.hostname}:${node.apiPort}`;
		let check = await checkIpfsApi(hostnameEndpoint);

		if (check.ok) {
			console.log(`  [OK] ${node.name} (${hostnameEndpoint}) - PeerID: ${check.peerId?.slice(0, 16)}...`);
			return {
				endpoint: hostnameEndpoint,
				gatewayUrl: `http://${node.hostname}:${node.gatewayPort}`,
				hostname: node.hostname,
				hasIpnsKeys: node.hasIpnsKeys
			};
		}

		// Try IP fallback
		const ipEndpoint = `http://${node.ip}:${node.apiPort}`;
		check = await checkIpfsApi(ipEndpoint);

		if (check.ok) {
			console.log(`  [OK] ${node.name} via IP (${ipEndpoint}) - PeerID: ${check.peerId?.slice(0, 16)}...`);
			return {
				endpoint: ipEndpoint,
				gatewayUrl: `http://${node.ip}:${node.gatewayPort}`,
				hostname: node.ip,
				hasIpnsKeys: node.hasIpnsKeys
			};
		}

		console.log(`  [--] ${node.name}: unavailable`);
	}

	return null;
}

/**
 * Ensure we have an IPFS connection
 */
async function ensureIpfsConnection(): Promise<boolean> {
	activeServer = await findAvailableIpfsServer();

	if (!activeServer) {
		console.error('\n[ERROR] No IPFS server available\n');
		console.error('Options:');
		console.error('  1. Start spark-2: ssh spark-2 "docker start ipfs"');
		console.error('  2. Start local:   ipfs daemon');
		return false;
	}

	if (!activeServer.hasIpnsKeys) {
		console.warn('\n[WARN] Connected node does not have IPNS keys');
		console.warn('       IPNS publishing will create new keys on this node');
	}

	return true;
}

// ============================================================================
// BUILD FUNCTIONS
// ============================================================================

/**
 * Build the site with static adapter for IPFS
 * Outputs to .ipfs-build/ to avoid conflicting with Vercel's build/
 */
async function buildSite(): Promise<void> {
	console.log('\n[BUILD] Building site with static adapter...');
	console.log(`        Output: ${IPFS_BUILD_DIR}`);

	const configPath = join(PROJECT_ROOT, 'svelte.config.js');
	const staticConfigPath = join(PROJECT_ROOT, 'svelte.config.static.js');

	if (!existsSync(staticConfigPath)) {
		throw new Error('svelte.config.static.js not found');
	}

	// Read configs
	const originalConfig = readFileSync(configPath, 'utf-8');
	let staticConfig = readFileSync(staticConfigPath, 'utf-8');

	// Ensure static config outputs to .ipfs-build
	if (!staticConfig.includes('.ipfs-build')) {
		staticConfig = staticConfig.replace(
			/pages:\s*['"][^'"]+['"]/,
			"pages: '.ipfs-build'"
		).replace(
			/assets:\s*['"][^'"]+['"]/,
			"assets: '.ipfs-build'"
		);
	}

	// Enable prerendering for all routes
	// These files have `export const prerender = false;` that needs to be changed to true
	// Enable prerendering for most routes
	// Note: search is excluded because it uses url.searchParams which can't be prerendered
	const prerenderFiles = [
		'src/routes/+layout.ts',
		'src/routes/[slug]/+page.ts',
		'src/routes/schemes/+page.ts',
		// 'src/routes/schemes/[slug]/+page.ts', // Excluded - not crawled, no scheme pages
		// 'src/routes/search/+page.ts', // Excluded - uses url.searchParams
	];

	const originalContents: Map<string, string> = new Map();

	try {
		// Swap config
		writeFileSync(configPath, staticConfig);

		// Enable prerendering in all route files
		for (const file of prerenderFiles) {
			const filePath = join(PROJECT_ROOT, file);
			if (existsSync(filePath)) {
				const original = readFileSync(filePath, 'utf-8');
				originalContents.set(filePath, original);
				const modified = original.replace(
					'export const prerender = false;',
					'export const prerender = true;'
				);
				writeFileSync(filePath, modified);
			}
		}

		// Clean previous build
		await $`rm -rf ${IPFS_BUILD_DIR}`.quiet();

		// Build with IPFS environment flag (disables AuthGate)
		await $`PUBLIC_IPFS_BUILD=true bun run build`;

		console.log('        Build complete');
	} finally {
		// Always restore original config and all route files
		writeFileSync(configPath, originalConfig);
		for (const [filePath, content] of originalContents) {
			writeFileSync(filePath, content);
		}
	}

	// Post-process paths for IPFS compatibility
	await makePathsRelative();
}

/**
 * Convert all absolute paths to relative for IPFS compatibility
 *
 * IPFS gateways serve content at /ipfs/{CID}/ not root /
 * So href="/_app/..." needs to become href="./_app/..."
 */
async function makePathsRelative(): Promise<void> {
	console.log('\n[PATHS] Converting absolute paths to relative...');

	let htmlFixed = 0;
	let jsFixed = 0;

	// Fix HTML files
	const htmlFiles = await findFiles(IPFS_BUILD_DIR, '.html');
	for (const htmlFile of htmlFiles) {
		let content = readFileSync(htmlFile, 'utf-8');
		const original = content;

		// Fix href, src, and import paths
		content = content.replace(/href="\//g, 'href="./');
		content = content.replace(/src="\//g, 'src="./');
		content = content.replace(/import\("\//g, 'import("./');

		if (content !== original) {
			writeFileSync(htmlFile, content);
			htmlFixed++;
		}
	}

	// Fix JS files (contain pre-rendered HTML with embedded paths)
	const jsFiles = await findFiles(join(IPFS_BUILD_DIR, '_app'), '.js');
	for (const jsFile of jsFiles) {
		let content = readFileSync(jsFile, 'utf-8');
		const original = content;

		// Fix dynamic imports
		content = content.replace(/import\("\/_app\//g, 'import("./_app/');
		content = content.replace(/"\/_app\//g, '"./_app/');

		// Fix embedded asset paths (from pre-rendered markdown content)
		content = content.replace(/src="\/images\//g, 'src="./images/');
		content = content.replace(/src="\/pdfs\//g, 'src="./pdfs/');
		content = content.replace(/src="\/audio\//g, 'src="./audio/');
		content = content.replace(/src="\/video\//g, 'src="./video/');
		content = content.replace(/href="\/images\//g, 'href="./images/');

		// Fix JSON and font paths
		content = content.replace(/"\/json\//g, '"./json/');
		content = content.replace(/"\/fontawesome\//g, '"./fontawesome/');

		// Fix data paths
		content = content.replace(/"\/(__data\.json)"/g, '"./$1"');

		if (content !== original) {
			writeFileSync(jsFile, content);
			jsFixed++;
		}
	}

	console.log(`        Fixed ${htmlFixed} HTML files, ${jsFixed} JS files`);
}

/**
 * Recursively find files with given extension
 */
async function findFiles(dir: string, ext: string): Promise<string[]> {
	const results: string[] = [];

	if (!existsSync(dir)) return results;

	const entries = readdirSync(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			results.push(...await findFiles(fullPath, ext));
		} else if (entry.endsWith(ext)) {
			results.push(fullPath);
		}
	}

	return results;
}

// ============================================================================
// IPFS ADD/PIN FUNCTIONS
// ============================================================================

/**
 * Add a directory to IPFS recursively
 */
async function addToIpfs(directory: string): Promise<string> {
	if (!activeServer) throw new Error('No IPFS connection');

	console.log(`\n[IPFS] Adding directory to IPFS...`);
	console.log(`       Source: ${directory}`);
	console.log(`       Server: ${activeServer.endpoint}`);

	const dirName = directory.split('/').pop() || 'upload';

	// Find all files
	const files = await findFiles(directory, '');
	const allFiles = readdirSync(directory, { recursive: true })
		.map(f => join(directory, f.toString()))
		.filter(f => statSync(f).isFile());

	console.log(`       Files: ${allFiles.length}`);

	// Build form arguments for curl
	const formArgs: string[] = [];
	for (const filePath of allFiles) {
		const relativePath = relative(directory, filePath);
		formArgs.push('-F', `file=@${filePath};filename=${dirName}/${relativePath}`);
	}

	// Add to IPFS via API
	const curlArgs = [
		'-s', '-X', 'POST',
		`${activeServer.endpoint}/api/v0/add?recursive=true&cid-version=1&wrap-with-directory=false&pin=true`,
		...formArgs
	];

	const result = await $`curl ${curlArgs}`.text();
	const lines = result.trim().split('\n').filter(Boolean);

	// Find root CID (last entry with directory name)
	let rootCid = '';
	for (const line of lines.reverse()) {
		try {
			const parsed = JSON.parse(line);
			if (parsed.Name === dirName) {
				rootCid = parsed.Hash;
				break;
			}
		} catch {
			continue;
		}
	}

	if (!rootCid) {
		throw new Error('Failed to get CID from IPFS add');
	}

	console.log(`       CID: ${rootCid}`);
	return rootCid;
}

/**
 * Pin content to ensure persistence
 */
async function pinContent(cid: string): Promise<void> {
	if (!activeServer) return;

	console.log(`\n[PIN]  Pinning content...`);

	try {
		const response = await fetch(
			`${activeServer.endpoint}/api/v0/pin/add?arg=${cid}`,
			{ method: 'POST', signal: AbortSignal.timeout(30000) }
		);

		if (response.ok) {
			console.log(`       Pinned on ${activeServer.hostname}`);
		} else {
			console.log(`       Pin failed: HTTP ${response.status}`);
		}
	} catch (e: any) {
		console.log(`       Pin failed: ${e.message}`);
	}

	// Also try to pin on other nodes
	for (const node of IPFS_NODES) {
		if (node.hostname === activeServer.hostname) continue;

		const endpoint = `http://${node.hostname}:${node.apiPort}`;
		try {
			const check = await checkIpfsApi(endpoint);
			if (check.ok) {
				const response = await fetch(
					`${endpoint}/api/v0/pin/add?arg=${cid}`,
					{ method: 'POST', signal: AbortSignal.timeout(30000) }
				);
				if (response.ok) {
					console.log(`       Pinned on ${node.name}`);
				}
			}
		} catch {
			// Ignore errors for secondary pins
		}
	}
}

// ============================================================================
// IPNS PUBLISH FUNCTIONS
// ============================================================================

/**
 * Publish CID to IPNS
 */
async function publishToIpns(cid: string, keyName: string): Promise<{ key: string; name: string }> {
	if (!activeServer) throw new Error('No IPFS connection');

	console.log(`\n[IPNS] Publishing to IPNS...`);
	console.log(`       Key: ${keyName}`);

	// Check if key exists
	try {
		const keyListRes = await fetch(`${activeServer.endpoint}/api/v0/key/list`, { method: 'POST' });
		const keyListData = await keyListRes.json();
		const keys = keyListData.Keys || [];
		const hasKey = keys.some((k: { Name: string }) => k.Name === keyName);

		if (!hasKey) {
			console.log(`       Creating new key: ${keyName}`);
			await fetch(
				`${activeServer.endpoint}/api/v0/key/gen?arg=${keyName}&type=ed25519`,
				{ method: 'POST' }
			);
		}
	} catch {
		// Try to create key anyway
		await fetch(
			`${activeServer.endpoint}/api/v0/key/gen?arg=${keyName}&type=ed25519`,
			{ method: 'POST' }
		).catch(() => {});
	}

	// Publish to IPNS (with offline mode for speed)
	const publishRes = await fetch(
		`${activeServer.endpoint}/api/v0/name/publish?arg=/ipfs/${cid}&key=${keyName}&allow-offline=true`,
		{ method: 'POST', signal: AbortSignal.timeout(60000) }
	);

	if (!publishRes.ok) {
		throw new Error(`IPNS publish failed: HTTP ${publishRes.status}`);
	}

	const publishData = await publishRes.json();
	const name = publishData.Name || keyName;

	console.log(`       IPNS: ${name}`);
	return { key: keyName, name };
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify content is accessible via API and gateways
 */
async function verifyDeployment(cid: string, type: 'full' | 'redirect'): Promise<boolean> {
	console.log(`\n[VERIFY] Testing ${type} site accessibility...`);

	let anySuccess = false;
	const file = type === 'full' ? 'index.html' : 'index.html';

	// Test 1: API verification (most reliable)
	if (activeServer) {
		process.stdout.write(`         API (${activeServer.hostname}): `);
		try {
			const response = await fetch(
				`${activeServer.endpoint}/api/v0/cat?arg=${cid}/${file}`,
				{ method: 'POST', signal: AbortSignal.timeout(10000) }
			);
			if (response.ok) {
				const content = await response.text();
				if (content.includes('<!doctype html>') || content.includes('<!DOCTYPE html>')) {
					console.log('[OK] HTML verified');
					anySuccess = true;
				} else {
					console.log('[WARN] Not HTML');
				}
			} else {
				console.log(`[FAIL] HTTP ${response.status}`);
			}
		} catch (e: any) {
			console.log(`[FAIL] ${e.message.slice(0, 30)}`);
		}
	}

	// Test 2: Self-hosted gateway (primary)
	for (const gateway of PRIMARY_TEST_GATEWAYS) {
		const hostname = new URL(gateway).hostname;
		process.stdout.write(`         ${hostname}: `);
		try {
			const response = await fetch(
				`${gateway}/ipfs/${cid}/`,
				{ method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) }
			);
			if (response.ok) {
				const content = await response.text();
				if (content.includes('<!doctype html>') || content.includes('<!DOCTYPE html>')) {
					console.log('[OK] Gateway verified');
					anySuccess = true;
				} else {
					console.log('[WARN] Not HTML');
				}
			} else {
				console.log(`[FAIL] HTTP ${response.status}`);
			}
		} catch (e: any) {
			console.log(`[FAIL] ${e.message.slice(0, 30)}`);
		}
	}

	// Test 3: Public gateways (background, expect delays)
	console.log('         Public gateways (propagation may take time):');
	for (const gateway of PUBLIC_GATEWAYS) {
		const hostname = new URL(gateway).hostname;
		process.stdout.write(`           ${hostname}: `);
		try {
			const response = await fetch(
				`${gateway}/ipfs/${cid}/`,
				{ method: 'HEAD', signal: AbortSignal.timeout(10000) }
			);
			console.log(response.ok ? '[OK]' : `[${response.status}]`);
		} catch {
			console.log('[PENDING]');
		}
	}

	return anySuccess;
}

// ============================================================================
// REDIRECT PAGE
// ============================================================================

/**
 * Create redirect page for ENS domains
 */
function createRedirectPage(): void {
	console.log('\n[REDIRECT] Creating redirect page...');
	console.log(`           Target: ${REDIRECT_TARGET}`);
	console.log(`           Output: ${REDIRECT_DIR}`);

	if (!existsSync(REDIRECT_DIR)) {
		mkdirSync(REDIRECT_DIR, { recursive: true });
	}

	// Get cane SVG for spinner
	const caneSvgPath = join(PROJECT_ROOT, 'static/images/cane-color.svg');
	let caneImg = '<div style="font-size:80px">Loading...</div>';

	if (existsSync(caneSvgPath)) {
		const svgContent = readFileSync(caneSvgPath);
		const base64 = svgContent.toString('base64');
		caneImg = `<img src="data:image/svg+xml;base64,${base64}" alt="Loading..." class="spin" width="100" height="100"/>`;
	}

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="2; url=${REDIRECT_TARGET}">
    <meta name="robots" content="noindex">
    <title>Redirecting to The Cane Files...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Georgia, serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #fafafa;
            color: #333;
        }
        .container { text-align: center; }
        .spin {
            animation: spin 2s ease-in-out infinite;
            margin-bottom: 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        p { margin-top: 1rem; font-size: 0.9rem; color: #666; }
        a { color: #8B4513; }
    </style>
</head>
<body>
    <div class="container">
        ${caneImg}
        <p>Redirecting to <a href="${REDIRECT_TARGET}">The Cane Files</a>...</p>
        <noscript>
            <p><a href="${REDIRECT_TARGET}">Click here</a> if not redirected.</p>
        </noscript>
    </div>
    <script>
        setTimeout(function() {
            window.location.replace('${REDIRECT_TARGET}');
        }, 2000);
    </script>
</body>
</html>`;

	writeFileSync(join(REDIRECT_DIR, 'index.html'), html);
	console.log('           Created index.html');
}

// ============================================================================
// OUTPUT FUNCTIONS
// ============================================================================

/**
 * Generate full access URLs for a deployment
 */
function generateUrls(cid: string, ipnsName: string): { ipfs: string[]; ipns: string[] } {
	const ipfs = [
		// Self-hosted
		`https://ipfs.kyleen-cane.xyz/ipfs/${cid}/`,
		// Public
		`https://ipfs.io/ipfs/${cid}/`,
		`https://dweb.link/ipfs/${cid}/`,
	];

	const ipns = [
		`https://ipfs.kyleen-cane.xyz/ipns/${ipnsName}/`,
		`https://ipfs.io/ipns/${ipnsName}/`,
		`https://dweb.link/ipns/${ipnsName}/`,
	];

	return { ipfs, ipns };
}

/**
 * Log deployment URLs to console
 */
function logDeploymentUrls(result: DeployResult): void {
	console.log('');
	console.log('======================================================================');
	console.log(`  ${result.type.toUpperCase()} SITE DEPLOYED`);
	console.log('======================================================================');
	console.log('');
	console.log(`  CID:  ${result.cid}`);
	console.log(`  IPNS: ${result.ipnsName}`);
	console.log(`  Key:  ${result.ipnsKey}`);
	console.log('');
	console.log('  IPFS URLs (immutable):');
	for (const url of result.urls.ipfs) {
		console.log(`    ${url}`);
	}
	console.log('');
	console.log('  IPNS URLs (always latest):');
	for (const url of result.urls.ipns) {
		console.log(`    ${url}`);
	}
	console.log('');
}

/**
 * Update IPFS-CID.md with deployment info
 */
function updateCidFile(siteResult?: DeployResult, redirectResult?: DeployResult): void {
	const timestamp = new Date().toISOString().split('T')[0];

	const content = `# IPFS Deployment

Last updated: ${timestamp}

## Current Deployments

### Full Site
| Field | Value |
|-------|-------|
| CID | \`${siteResult?.cid || 'N/A'}\` |
| IPNS Key | \`${siteResult?.ipnsKey || 'N/A'}\` |
| IPNS Name | \`${siteResult?.ipnsName || 'N/A'}\` |
| Server | ${siteResult?.server || 'N/A'} |

### Redirect Page
| Field | Value |
|-------|-------|
| CID | \`${redirectResult?.cid || 'N/A'}\` |
| IPNS Key | \`${redirectResult?.ipnsKey || 'N/A'}\` |
| IPNS Name | \`${redirectResult?.ipnsName || 'N/A'}\` |
| Server | ${redirectResult?.server || 'N/A'} |

## Access URLs

### Full Site
${siteResult ? siteResult.urls.ipfs.map(u => `- ${u}`).join('\n') : '- N/A'}

### Full Site IPNS (always latest)
${siteResult ? siteResult.urls.ipns.map(u => `- ${u}`).join('\n') : '- N/A'}

### Redirect Page
${redirectResult ? redirectResult.urls.ipfs.map(u => `- ${u}`).join('\n') : '- N/A'}

### Redirect IPNS
${redirectResult ? redirectResult.urls.ipns.map(u => `- ${u}`).join('\n') : '- N/A'}

## ENS Configuration

### Full Site
Set content field to: \`ipns://${siteResult?.ipnsName || 'IPNS_NAME'}\`
${ENS_DOMAINS.site.map(d => `- ${d}`).join('\n')}

### Redirect
Set content field to: \`ipns://${redirectResult?.ipnsName || 'IPNS_NAME'}\`
${ENS_DOMAINS.redirect.map(d => `- ${d}`).join('\n')}
`;

	writeFileSync(IPFS_CID_FILE, content);
	console.log(`\n[FILE] Updated ${IPFS_CID_FILE}`);
}

/**
 * Update layout file with new CID
 */
function updateLayoutCid(cid: string): void {
	if (!existsSync(LAYOUT_FILE)) {
		console.warn('[WARN] Layout file not found');
		return;
	}

	let content = readFileSync(LAYOUT_FILE, 'utf-8');
	const cidPattern = /const FULL_CID = '[^']+'/;

	if (cidPattern.test(content)) {
		content = content.replace(cidPattern, `const FULL_CID = '${cid}'`);
		writeFileSync(LAYOUT_FILE, content);
		console.log(`[FILE] Updated layout CID: ${cid.slice(0, 20)}...`);
	}
}

// ============================================================================
// DEPLOYMENT COMMANDS
// ============================================================================

/**
 * Deploy full site to IPFS
 */
async function deployFull(): Promise<DeployResult> {
	console.log('\n' + '='.repeat(70));
	console.log('  DEPLOYING FULL SITE TO IPFS');
	console.log('='.repeat(70));

	await buildSite();
	const cid = await addToIpfs(IPFS_BUILD_DIR);
	await pinContent(cid);
	const ipns = await publishToIpns(cid, IPNS_KEY_SITE);
	const verified = await verifyDeployment(cid, 'full');

	if (!verified) {
		console.warn('\n[WARN] Verification failed - content may still be propagating');
	}

	const urls = generateUrls(cid, ipns.name);

	return {
		cid,
		ipnsKey: ipns.key,
		ipnsName: ipns.name,
		type: 'full',
		server: activeServer?.endpoint || 'unknown',
		urls
	};
}

/**
 * Deploy redirect page to IPFS
 */
async function deployRedirect(): Promise<DeployResult> {
	console.log('\n' + '='.repeat(70));
	console.log('  DEPLOYING REDIRECT PAGE TO IPFS');
	console.log('='.repeat(70));

	createRedirectPage();
	const cid = await addToIpfs(REDIRECT_DIR);
	await pinContent(cid);
	const ipns = await publishToIpns(cid, IPNS_KEY_REDIRECT);
	await verifyDeployment(cid, 'redirect');

	const urls = generateUrls(cid, ipns.name);

	return {
		cid,
		ipnsKey: ipns.key,
		ipnsName: ipns.name,
		type: 'redirect',
		server: activeServer?.endpoint || 'unknown',
		urls
	};
}

/**
 * Run full site deployment
 */
async function runDeployFull(): Promise<void> {
	const connected = await ensureIpfsConnection();
	if (!connected) process.exit(1);

	const result = await deployFull();
	logDeploymentUrls(result);
	updateCidFile(result, undefined);
	updateLayoutCid(result.cid);
}

/**
 * Run redirect deployment
 */
async function runDeployRedirect(): Promise<void> {
	const connected = await ensureIpfsConnection();
	if (!connected) process.exit(1);

	const result = await deployRedirect();
	logDeploymentUrls(result);
	updateCidFile(undefined, result);
}

/**
 * Run both deployments
 */
async function runDeployBoth(): Promise<void> {
	const connected = await ensureIpfsConnection();
	if (!connected) process.exit(1);

	const siteResult = await deployFull();
	logDeploymentUrls(siteResult);

	const redirectResult = await deployRedirect();
	logDeploymentUrls(redirectResult);

	updateCidFile(siteResult, redirectResult);
	updateLayoutCid(siteResult.cid);

	console.log('\n' + '='.repeat(70));
	console.log('  ALL DEPLOYMENTS COMPLETE');
	console.log('='.repeat(70));
	console.log(`\n  Full Site CID:     ${siteResult.cid}`);
	console.log(`  Full Site IPNS:    ${siteResult.ipnsName}`);
	console.log(`  Redirect CID:      ${redirectResult.cid}`);
	console.log(`  Redirect IPNS:     ${redirectResult.ipnsName}`);
	console.log('');
}

/**
 * Test IPFS connectivity
 */
async function runTest(): Promise<void> {
	console.log('\n' + '='.repeat(70));
	console.log('  IPFS CONNECTIVITY TEST');
	console.log('='.repeat(70) + '\n');

	for (const node of IPFS_NODES) {
		console.log(`${node.name}:`);

		const endpoint = `http://${node.hostname}:${node.apiPort}`;
		const check = await checkIpfsApi(endpoint);

		if (check.ok) {
			console.log(`  API: ${endpoint} [OK]`);
			console.log(`  PeerID: ${check.peerId}`);

			// Check IPNS keys
			try {
				const keysRes = await fetch(`${endpoint}/api/v0/key/list`, { method: 'POST' });
				if (keysRes.ok) {
					const data = await keysRes.json();
					const keys = data.Keys || [];
					const siteKey = keys.find((k: any) => k.Name === IPNS_KEY_SITE);
					const redirectKey = keys.find((k: any) => k.Name === IPNS_KEY_REDIRECT);
					console.log(`  IPNS Keys:`);
					console.log(`    ${IPNS_KEY_SITE}: ${siteKey ? siteKey.Id.slice(0, 20) + '...' : 'not found'}`);
					console.log(`    ${IPNS_KEY_REDIRECT}: ${redirectKey ? redirectKey.Id.slice(0, 20) + '...' : 'not found'}`);
				}
			} catch {
				console.log(`  IPNS Keys: could not query`);
			}
		} else {
			console.log(`  API: OFFLINE (${check.error})`);
		}
		console.log('');
	}

	// Test gateways
	console.log('Gateways:');
	for (const gateway of [...PRIMARY_TEST_GATEWAYS, ...PUBLIC_GATEWAYS]) {
		const hostname = new URL(gateway).hostname;
		process.stdout.write(`  ${hostname}: `);
		try {
			const response = await fetch(`${gateway}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
				method: 'HEAD',
				signal: AbortSignal.timeout(10000)
			});
			console.log(response.ok ? '[OK]' : `[${response.status}]`);
		} catch {
			console.log('[TIMEOUT]');
		}
	}

	console.log('\n' + '='.repeat(70) + '\n');

	const available = await findAvailableIpfsServer();
	if (available) {
		console.log(`Ready to deploy using: ${available.endpoint}`);
	} else {
		console.log('No IPFS servers available');
		process.exit(1);
	}
}

/**
 * Verify existing deployment
 */
async function runVerify(): Promise<void> {
	console.log('\n' + '='.repeat(70));
	console.log('  VERIFY EXISTING DEPLOYMENT');
	console.log('='.repeat(70) + '\n');

	if (!existsSync(IPFS_CID_FILE)) {
		console.error('No IPFS-CID.md found. Run a deployment first.');
		process.exit(1);
	}

	const content = readFileSync(IPFS_CID_FILE, 'utf-8');
	const siteCidMatch = content.match(/### Full Site[\s\S]*?\| CID \| `([^`]+)`/);
	const siteCid = siteCidMatch?.[1];

	if (!siteCid || siteCid === 'N/A') {
		console.log('No site CID found');
		return;
	}

	console.log(`Site CID: ${siteCid}\n`);

	await ensureIpfsConnection();
	await verifyDeployment(siteCid, 'full');
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
const command = args[0] || 'full';

switch (command) {
	case 'test':
		runTest().catch(console.error);
		break;
	case 'verify':
		runVerify().catch(console.error);
		break;
	case 'redirect':
		runDeployRedirect().catch(console.error);
		break;
	case 'both':
		runDeployBoth().catch(console.error);
		break;
	case 'full':
	default:
		runDeployFull().catch(console.error);
		break;
}
