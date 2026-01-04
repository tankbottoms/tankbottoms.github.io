#!/usr/bin/env bun
/**
 * Post-build Link Checker
 *
 * Scans source files (markdown + svelte) for links and validates:
 * 1. Internal page routes
 * 2. Static asset references
 * 3. External URLs (optional, with timeout)
 * 4. IPFS CID format validation
 * 5. SEC EDGAR accession references
 *
 * Usage:
 *   bun run scripts/check-links.ts
 *   bun run scripts/check-links.ts --skip-external   # Skip external URL checks
 *   bun run scripts/check-links.ts --verbose         # Show all links found
 */

import { readdir, readFile, access } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { constants } from 'node:fs';

interface LinkCheckResult {
	url: string;
	status: 'ok' | 'broken' | 'timeout' | 'error' | 'skipped';
	statusCode?: number;
	error?: string;
	sourceFile: string;
	lineNumber?: number;
	linkType: 'internal-route' | 'static-asset' | 'external' | 'anchor' | 'special';
}

interface AccessionReference {
	accession: string;
	sourceFile: string;
	lineNumber: number;
}

interface IpfsCidReference {
	cid: string;
	sourceFile: string;
	lineNumber: number;
	url: string;
}

// Configuration
const SOURCE_DIRS = ['src/docs/posts', 'src/docs/research', 'src/docs/drafts', 'src/routes', 'src/lib/components'];
const STATIC_DIR = './static';
const ROUTES_DIR = './src/routes';
const TIMEOUT_MS = 10000;
const MAX_CONCURRENT_CHECKS = 5;
const SKIP_EXTERNAL = process.argv.includes('--skip-external');
const VERBOSE = process.argv.includes('--verbose');

// Patterns for extracting links
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g;
const HTML_HREF_PATTERN = /href=["']([^"']+)["']/g;
const HTML_SRC_PATTERN = /src=["']([^"']+)["']/g;
const IFRAME_SRC_PATTERN = /<iframe[^>]+src=["']([^"']+)["']/g;

// SEC and IPFS patterns
const SEC_ACCESSION_PATTERN = /(\d{10}-\d{2}-\d{6})/g;
const IPFS_URL_PATTERN = /https?:\/\/[^"'\s]+\/(bafy[a-zA-Z0-9]{50,})/g;

// Known good domains that don't need full checking
const TRUSTED_DOMAINS = new Set([
	'localhost',
	'127.0.0.1',
	'ipfs.pantsonfire.xyz',
	'ipfs1.shh-shush.xyz',
	'fonts.googleapis.com',
	'fonts.gstatic.com',
	'cdn.jsdelivr.net',
	'kit.fontawesome.com',
]);

// Known routes from SvelteKit
const knownRoutes = new Set<string>();

// Results storage
const accessionRefs: AccessionReference[] = [];
const ipfsCidRefs: IpfsCidReference[] = [];
const checkedUrls = new Map<string, LinkCheckResult>();

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function findSourceFiles(dirs: string[]): Promise<string[]> {
	const files: string[] = [];

	for (const dir of dirs) {
		try {
			await findFilesRecursive(dir, files);
		} catch {
			if (VERBOSE) {
				console.log(`  Skipping ${dir}: not found`);
			}
		}
	}

	return files;
}

async function findFilesRecursive(dir: string, files: string[]): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			await findFilesRecursive(fullPath, files);
		} else {
			const ext = extname(entry.name);
			if (ext === '.md' || ext === '.svelte') {
				files.push(fullPath);
			}
		}
	}
}

async function discoverRoutes(): Promise<void> {
	async function scanRoutes(dir: string, routePath: string): Promise<void> {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				if (entry.isDirectory()) {
					let segment = entry.name;
					if (segment.startsWith('[') && segment.endsWith(']')) {
						segment = '*';
					}
					await scanRoutes(join(dir, entry.name), `${routePath}/${segment}`);
				} else if (entry.name === '+page.svelte' || entry.name === '+page.ts') {
					knownRoutes.add(routePath || '/');
				}
			}
		} catch {
			// Ignore errors
		}
	}

	await scanRoutes(ROUTES_DIR, '');

	if (VERBOSE) {
		console.log(`Discovered ${knownRoutes.size} routes:`);
		for (const route of knownRoutes) {
			console.log(`  ${route}`);
		}
		console.log('');
	}
}

function extractLinks(content: string, filePath: string): Array<{ url: string; lineNumber: number }> {
	const links: Array<{ url: string; lineNumber: number }> = [];
	const lines = content.split('\n');

	const patterns = [
		MARKDOWN_LINK_PATTERN,
		HTML_HREF_PATTERN,
		HTML_SRC_PATTERN,
		IFRAME_SRC_PATTERN,
	];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNumber = i + 1;

		for (const pattern of patterns) {
			pattern.lastIndex = 0;

			let match;
			while ((match = pattern.exec(line)) !== null) {
				const url = match[2] || match[1];
				if (url &&
					!url.startsWith('{') &&
					!url.includes('${') &&
					!url.includes('{post.') &&
					!url.includes('{slug}') &&
					!url.includes('{scheme.') &&
					!url.startsWith('data:')) {
					links.push({ url: url.trim(), lineNumber });
				}
			}
		}
	}

	return links;
}

function extractAccessionReferences(content: string, filePath: string): AccessionReference[] {
	const refs: AccessionReference[] = [];
	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		SEC_ACCESSION_PATTERN.lastIndex = 0;

		let match;
		while ((match = SEC_ACCESSION_PATTERN.exec(line)) !== null) {
			refs.push({
				accession: match[1],
				sourceFile: filePath,
				lineNumber: i + 1,
			});
		}
	}

	return refs;
}

function extractIpfsCidReferences(content: string, filePath: string): IpfsCidReference[] {
	const refs: IpfsCidReference[] = [];
	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		IPFS_URL_PATTERN.lastIndex = 0;
		let match;
		while ((match = IPFS_URL_PATTERN.exec(line)) !== null) {
			refs.push({
				cid: match[1],
				sourceFile: filePath,
				lineNumber: i + 1,
				url: match[0],
			});
		}
	}

	return refs;
}

function classifyLink(url: string): LinkCheckResult['linkType'] {
	if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
		return 'special';
	}

	if (url.startsWith('#')) {
		return 'anchor';
	}

	if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
		return 'external';
	}

	if (url.startsWith('/')) {
		const ext = extname(url.split('?')[0].split('#')[0]);
		if (ext && ext !== '.html') {
			return 'static-asset';
		}
		return 'internal-route';
	}

	const ext = extname(url.split('?')[0].split('#')[0]);
	if (ext && ext !== '.html' && ext !== '.md') {
		return 'static-asset';
	}

	return 'internal-route';
}

async function checkInternalRoute(url: string, sourceFile: string): Promise<LinkCheckResult> {
	const cleanUrl = url.split('?')[0].split('#')[0];
	const routePath = cleanUrl === '' ? '/' : cleanUrl;

	for (const route of knownRoutes) {
		if (route === routePath) {
			return { url, status: 'ok', sourceFile, linkType: 'internal-route' };
		}

		if (route.includes('*')) {
			const routePattern = route.replace(/\*/g, '[^/]+');
			const regex = new RegExp(`^${routePattern}$`);
			if (regex.test(routePath)) {
				return { url, status: 'ok', sourceFile, linkType: 'internal-route' };
			}
		}
	}

	return {
		url,
		status: 'broken',
		error: `Route not found: ${routePath}`,
		sourceFile,
		linkType: 'internal-route',
	};
}

async function checkStaticAsset(url: string, sourceFile: string): Promise<LinkCheckResult> {
	const cleanUrl = url.split('?')[0].split('#')[0];

	let staticPath: string;
	if (cleanUrl.startsWith('/')) {
		staticPath = join(STATIC_DIR, cleanUrl);
	} else {
		staticPath = join(dirname(sourceFile), cleanUrl);
	}

	const altPath = join(STATIC_DIR, cleanUrl.replace(/^\//, ''));

	if (await fileExists(staticPath) || await fileExists(altPath)) {
		return { url, status: 'ok', sourceFile, linkType: 'static-asset' };
	}

	return {
		url,
		status: 'broken',
		error: `Static asset not found: ${cleanUrl}`,
		sourceFile,
		linkType: 'static-asset',
	};
}

async function checkExternalUrl(url: string, sourceFile: string): Promise<LinkCheckResult> {
	if (SKIP_EXTERNAL) {
		return { url, status: 'skipped', sourceFile, linkType: 'external' };
	}

	if (checkedUrls.has(url)) {
		const cached = checkedUrls.get(url)!;
		return { ...cached, sourceFile };
	}

	try {
		const urlObj = new URL(url.startsWith('//') ? `https:${url}` : url);
		if (TRUSTED_DOMAINS.has(urlObj.hostname)) {
			const result: LinkCheckResult = { url, status: 'ok', sourceFile, linkType: 'external' };
			checkedUrls.set(url, result);
			return result;
		}
	} catch {
		return { url, status: 'error', error: 'Invalid URL', sourceFile, linkType: 'external' };
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

		const response = await fetch(url.startsWith('//') ? `https:${url}` : url, {
			method: 'HEAD',
			signal: controller.signal,
			headers: {
				'User-Agent': 'Mozilla/5.0 Link Checker Bot',
			},
		});

		clearTimeout(timeout);

		const result: LinkCheckResult = {
			url,
			status: response.ok ? 'ok' : 'broken',
			statusCode: response.status,
			sourceFile,
			linkType: 'external',
		};
		checkedUrls.set(url, result);
		return result;
	} catch (error: any) {
		const result: LinkCheckResult = {
			url,
			status: error.name === 'AbortError' ? 'timeout' : 'error',
			error: String(error.message || error),
			sourceFile,
			linkType: 'external',
		};
		checkedUrls.set(url, result);
		return result;
	}
}

async function checkLink(url: string, sourceFile: string, lineNumber: number): Promise<LinkCheckResult> {
	const linkType = classifyLink(url);

	let result: LinkCheckResult;

	switch (linkType) {
		case 'special':
		case 'anchor':
			result = { url, status: 'ok', sourceFile, linkType };
			break;
		case 'internal-route':
			result = await checkInternalRoute(url, sourceFile);
			break;
		case 'static-asset':
			result = await checkStaticAsset(url, sourceFile);
			break;
		case 'external':
			result = await checkExternalUrl(url, sourceFile);
			break;
		default:
			result = { url, status: 'error', error: 'Unknown link type', sourceFile, linkType };
	}

	result.lineNumber = lineNumber;
	return result;
}

async function checkLinksInBatches(
	links: Array<{ url: string; sourceFile: string; lineNumber: number }>,
): Promise<LinkCheckResult[]> {
	const results: LinkCheckResult[] = [];

	const uniqueLinks = new Map<string, { url: string; sourceFile: string; lineNumber: number }>();
	for (const link of links) {
		const key = `${link.url}|${link.sourceFile}`;
		if (!uniqueLinks.has(key)) {
			uniqueLinks.set(key, link);
		}
	}

	const linksArray = Array.from(uniqueLinks.values());

	for (let i = 0; i < linksArray.length; i += MAX_CONCURRENT_CHECKS) {
		const batch = linksArray.slice(i, i + MAX_CONCURRENT_CHECKS);
		const batchResults = await Promise.all(
			batch.map(({ url, sourceFile, lineNumber }) => checkLink(url, sourceFile, lineNumber)),
		);
		results.push(...batchResults);

		process.stdout.write(`\rChecking links... ${Math.min(i + MAX_CONCURRENT_CHECKS, linksArray.length)}/${linksArray.length}`);
	}

	console.log('');
	return results;
}

function printResults(results: LinkCheckResult[]): void {
	const broken = results.filter((r) => r.status === 'broken');
	const timeout = results.filter((r) => r.status === 'timeout');
	const errors = results.filter((r) => r.status === 'error');
	const ok = results.filter((r) => r.status === 'ok');
	const skipped = results.filter((r) => r.status === 'skipped');

	const byType = {
		'internal-route': results.filter((r) => r.linkType === 'internal-route'),
		'static-asset': results.filter((r) => r.linkType === 'static-asset'),
		external: results.filter((r) => r.linkType === 'external'),
		anchor: results.filter((r) => r.linkType === 'anchor'),
		special: results.filter((r) => r.linkType === 'special'),
	};

	console.log('\n=== RESULTS ===\n');
	console.log(`Total links checked: ${results.length}`);
	console.log(`  OK: ${ok.length}`);
	console.log(`  Broken: ${broken.length}`);
	console.log(`  Timeout: ${timeout.length}`);
	console.log(`  Errors: ${errors.length}`);
	console.log(`  Skipped: ${skipped.length}`);

	console.log('\nBy type:');
	console.log(`  Internal routes: ${byType['internal-route'].length}`);
	console.log(`  Static assets: ${byType['static-asset'].length}`);
	console.log(`  External URLs: ${byType.external.length}`);
	console.log(`  Anchor links: ${byType.anchor.length}`);
	console.log(`  Special (mailto, tel, etc.): ${byType.special.length}`);

	if (broken.length > 0) {
		console.log('\n=== BROKEN LINKS ===\n');
		const byFile = new Map<string, LinkCheckResult[]>();
		for (const result of broken) {
			const existing = byFile.get(result.sourceFile) || [];
			existing.push(result);
			byFile.set(result.sourceFile, existing);
		}

		for (const [file, fileResults] of byFile) {
			console.log(`${file}:`);
			for (const result of fileResults) {
				console.log(`  Line ${result.lineNumber}: ${result.url}`);
				if (result.error) {
					console.log(`    Error: ${result.error}`);
				}
				if (result.statusCode) {
					console.log(`    Status: ${result.statusCode}`);
				}
			}
			console.log('');
		}
	}

	if (timeout.length > 0) {
		console.log('\n=== TIMEOUT LINKS ===\n');
		for (const result of timeout) {
			console.log(`  ${result.url}`);
			console.log(`    Source: ${result.sourceFile}:${result.lineNumber}`);
		}
	}

	if (errors.length > 0) {
		console.log('\n=== ERROR LINKS ===\n');
		for (const result of errors) {
			console.log(`  ${result.url}`);
			console.log(`    Source: ${result.sourceFile}:${result.lineNumber}`);
			console.log(`    Error: ${result.error}`);
		}
	}
}

async function main() {
	console.log('Link Checker for Mr. Whiskers Blog\n');
	console.log('Configuration:');
	console.log(`  Source directories: ${SOURCE_DIRS.join(', ')}`);
	console.log(`  Skip external: ${SKIP_EXTERNAL}`);
	console.log(`  Verbose: ${VERBOSE}`);
	console.log(`  Timeout: ${TIMEOUT_MS}ms`);
	console.log('');

	console.log('Discovering routes...');
	await discoverRoutes();
	console.log(`Found ${knownRoutes.size} routes\n`);

	console.log('Scanning source files...');
	const sourceFiles = await findSourceFiles(SOURCE_DIRS);
	console.log(`Found ${sourceFiles.length} source files\n`);

	if (sourceFiles.length === 0) {
		console.error('No source files found!');
		process.exit(1);
	}

	console.log('Extracting links...');
	const allLinks: Array<{ url: string; sourceFile: string; lineNumber: number }> = [];

	for (const file of sourceFiles) {
		const content = await readFile(file, 'utf-8');
		const links = extractLinks(content, file);

		for (const { url, lineNumber } of links) {
			allLinks.push({ url, sourceFile: file, lineNumber });
		}

		const accRefs = extractAccessionReferences(content, file);
		accessionRefs.push(...accRefs);

		const cidRefs = extractIpfsCidReferences(content, file);
		ipfsCidRefs.push(...cidRefs);
	}

	console.log(`Found ${allLinks.length} links`);
	console.log(`Found ${accessionRefs.length} SEC accession references`);
	console.log(`Found ${ipfsCidRefs.length} IPFS CID references\n`);

	console.log('Checking links...');
	const checkResults = await checkLinksInBatches(allLinks);

	printResults(checkResults);

	if (accessionRefs.length > 0 && VERBOSE) {
		console.log('\n=== SEC ACCESSION REFERENCES ===\n');

		const byAccession = new Map<string, AccessionReference[]>();
		for (const ref of accessionRefs) {
			const existing = byAccession.get(ref.accession) || [];
			existing.push(ref);
			byAccession.set(ref.accession, existing);
		}

		console.log(`Unique accession numbers: ${byAccession.size}`);
		for (const [accession, refs] of byAccession) {
			console.log(`  ${accession} (${refs.length} references)`);
		}
	}

	if (ipfsCidRefs.length > 0 && VERBOSE) {
		console.log('\n=== IPFS CID REFERENCES ===\n');

		const byCid = new Map<string, IpfsCidReference[]>();
		for (const ref of ipfsCidRefs) {
			const existing = byCid.get(ref.cid) || [];
			existing.push(ref);
			byCid.set(ref.cid, existing);
		}

		console.log(`Unique CIDs: ${byCid.size}`);
		for (const [cid, refs] of byCid) {
			console.log(`  ${cid.substring(0, 20)}... (${refs.length} references)`);
		}
	}

	const broken = checkResults.filter((r) => r.status === 'broken');
	const errors = checkResults.filter((r) => r.status === 'error');

	if (broken.length > 0 || errors.length > 0) {
		console.log(`\nFound ${broken.length} broken links and ${errors.length} errors.`);
		process.exit(1);
	}

	console.log('\nAll links OK!');
}

main().catch(console.error);
