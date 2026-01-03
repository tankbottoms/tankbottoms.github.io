#!/usr/bin/env bun
/**
 * Filebase IPFS Deployment Script
 *
 * Deploys the static site to Filebase IPFS pinning service via S3 API.
 * Filebase provides persistent IPFS storage with dedicated gateways.
 *
 * Usage:
 *   bun run scripts/deploy-filebase.ts [account]
 *
 * Options:
 *   account - Account name from .filebase-config.json (default: first account)
 *
 * Prerequisites:
 *   - .filebase-config.json with account credentials
 *   - .ipfs-build/ directory (run `bun run ipfs` first to build)
 */

import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = join(import.meta.dir, '..');
const IPFS_BUILD_DIR = join(PROJECT_ROOT, '.ipfs-build');
const CONFIG_PATH = join(PROJECT_ROOT, '.filebase-config.json');
const IPFS_CID_FILE = join(PROJECT_ROOT, 'IPFS-CID.md');

interface FilebaseAccount {
	name: string;
	description: string;
	bucket: string;
	accessKey: string;
	secretKey: string;
	gateway: string;
	rpcApiKey: string;
}

interface FilebaseConfig {
	version: string;
	description: string;
	s3Endpoint: string;
	ipfsApiEndpoint: string;
	accounts: FilebaseAccount[];
}

interface DeployResult {
	account: string;
	bucket: string;
	gateway: string;
	cid: string | null;
	filesUploaded: number;
	totalSize: number;
	urls: {
		gateway: string;
		ipfsIo: string;
		dweb: string;
	};
}

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject',
	'.pdf': 'application/pdf',
	'.mp3': 'audio/mpeg',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.txt': 'text/plain',
	'.xml': 'application/xml',
};

// ============================================================================
// LOGGING
// ============================================================================

const COLORS = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	dim: '\x1b[2m',
	bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
	console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadConfig(): FilebaseConfig {
	if (!existsSync(CONFIG_PATH)) {
		throw new Error(`Config file not found: ${CONFIG_PATH}`);
	}
	return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

function getMimeType(filePath: string): string {
	const ext = extname(filePath).toLowerCase();
	return MIME_TYPES[ext] || 'application/octet-stream';
}

// Files/directories to exclude for Filebase free tier (500 file limit)
// These files are available via spark-2 IPFS gateway or CDN
const EXCLUDE_PATTERNS = [
	// Cache directories
	'/pdf/cache/',
	'/.osgrep/',
	// System files
	'.DS_Store',
	// Large PDFs (already on IPFS via spark-2)
	'/pdfs/',
	// Lance DB files
	'.lance',
	'.txn',
	'.manifest',
	// Font Awesome (load from CDN: cdnjs.cloudflare.com/ajax/libs/font-awesome)
	'/fontawesome/',
	// Media files (load from spark-2 IPFS gateway)
	'/audio/',
	'/video/',
	// Game assets
	'/trex/',
	// Large image directories (available via spark-2)
	'/images/wallace/',
	'/images/lahka/',
	// SVG icons (should be inlined as base64 in HTML)
	'/images/svg-icons/',
	// Cane head images (load from spark-2)
	'/images/cane/',
	// JSON skiptraces (available via spark-2)
	'/json/skiptraces/',
	// Sprite files (game assets)
	'cane-sprite-',
	// Infographic JSON data (SVGs are self-contained)
	'infographic-',
	// Individual asset JSON files (not essential for core site)
	'-assets.json',
	// Panama papers data
	'panama-bermuda-papers.json',
	// Scheme data JSON (stock charts - load from spark-2)
	'davi-skin.json',
	'sdi-ventures.json',
	'galaxy-gaming.json',
	'mw-medical.json',
	'sedona-software.json',
	'legal-access-tech.json',
	// Semantic triples (load from spark-2)
	'semantic-triples.json',
	// IPFS CID-addressed images (available via spark-2)
	'bafybei',
	// Timeline statistics (computed at build time on spark-2)
	'timeline-statistics.json',
	// Exhibits data (load from spark-2)
	'exhibits.json',
	// Additional site images (load from spark-2)
	'screenshot.png',
	'us.svg',
	'wallace.svg',
	'lahka.svg',
	// Markdown documentation files
	'/md/',
	'README.md',
	// Placeholder SVG (use inline)
	'placeholder.svg',
	// Version JSON (not needed for static site)
	'version.json',
	// Team JSON (load from spark-2, keep team-associates)
	'/json/team.json',
	// Favicon (can be served from HTML inline)
	'favicon.svg',
	// Cane head SVGs (inline as base64)
	'cane-color.svg',
	'cane-bw.svg',
	// Old/test blog posts (earliest entries from 1983-2000)
	'19830101-',
	'19861023-',
	'19960611-',
	'19961202-',
];

function shouldExcludeFile(filePath: string): boolean {
	for (const pattern of EXCLUDE_PATTERNS) {
		if (filePath.includes(pattern)) {
			return true;
		}
	}
	return false;
}

function getAllFiles(dir: string, excludeForFilebase = false): string[] {
	const results: string[] = [];
	if (!existsSync(dir)) return results;

	const entries = readdirSync(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			results.push(...getAllFiles(fullPath, excludeForFilebase));
		} else {
			// Apply exclusion filter if requested
			if (excludeForFilebase && shouldExcludeFile(fullPath)) {
				continue;
			}
			results.push(fullPath);
		}
	}
	return results;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// S3 CLIENT
// ============================================================================

function createS3Client(account: FilebaseAccount, endpoint: string): S3Client {
	return new S3Client({
		endpoint,
		region: 'us-east-1',
		credentials: {
			accessKeyId: account.accessKey,
			secretAccessKey: account.secretKey
		},
		forcePathStyle: true
	});
}

async function verifyBucketAccess(client: S3Client, bucket: string): Promise<boolean> {
	try {
		await client.send(new HeadBucketCommand({ Bucket: bucket }));
		return true;
	} catch {
		return false;
	}
}

// ============================================================================
// DEPLOYMENT
// ============================================================================

async function deployToFilebase(account: FilebaseAccount, config: FilebaseConfig): Promise<DeployResult> {
	const result: DeployResult = {
		account: account.name,
		bucket: account.bucket,
		gateway: account.gateway,
		cid: null,
		filesUploaded: 0,
		totalSize: 0,
		urls: {
			gateway: '',
			ipfsIo: '',
			dweb: ''
		}
	};

	log(`\n${'='.repeat(70)}`, 'blue');
	log(`  DEPLOYING TO FILEBASE: ${account.name}`, 'bold');
	log(`${'='.repeat(70)}\n`, 'blue');

	// Verify build directory exists
	if (!existsSync(IPFS_BUILD_DIR)) {
		throw new Error(`Build directory not found: ${IPFS_BUILD_DIR}\nRun 'bun run ipfs' first to build the static site.`);
	}

	const client = createS3Client(account, config.s3Endpoint);

	// Verify bucket access
	log('Verifying bucket access...', 'dim');
	const hasAccess = await verifyBucketAccess(client, account.bucket);
	if (!hasAccess) {
		throw new Error(`Cannot access bucket: ${account.bucket}`);
	}
	log(`  Bucket: ${account.bucket} [OK]`, 'green');

	// Get all files to upload (with exclusions for Filebase free tier limit)
	const files = getAllFiles(IPFS_BUILD_DIR, true);
	log(`\nPreparing ${files.length} files...`, 'dim');

	// Check against Filebase free tier limit
	const FREE_TIER_LIMIT = 500;
	if (files.length > FREE_TIER_LIMIT) {
		log(`  [WARN] File count (${files.length}) exceeds free tier limit (${FREE_TIER_LIMIT})`, 'yellow');
		log(`  Some files will not be uploaded. Consider paid account for full deployment.`, 'yellow');
	}

	// Generate a unique deployment folder name
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const deployFolder = `cane-timeline-${timestamp}`;

	let lastCid: string | null = null;
	let uploadedCount = 0;
	let totalBytes = 0;

	// Upload each file
	for (const filePath of files) {
		const relativePath = relative(IPFS_BUILD_DIR, filePath);
		const s3Key = `${deployFolder}/${relativePath}`;
		const content = readFileSync(filePath);
		const mimeType = getMimeType(filePath);

		try {
			const response = await client.send(
				new PutObjectCommand({
					Bucket: account.bucket,
					Key: s3Key,
					Body: content,
					ContentType: mimeType
				})
			);

			// Filebase returns CID in metadata
			// @ts-ignore
			const cid = response.$metadata?.httpHeaders?.['x-amz-meta-cid'];
			if (cid) {
				lastCid = cid;
			}

			uploadedCount++;
			totalBytes += content.length;

			// Progress indicator
			if (uploadedCount % 50 === 0 || uploadedCount === files.length) {
				process.stdout.write(`\r  Uploaded: ${uploadedCount}/${files.length} (${formatBytes(totalBytes)})    `);
			}
		} catch (error: any) {
			log(`\n  [ERROR] Failed to upload ${relativePath}: ${error.message}`, 'red');
		}
	}

	console.log(''); // New line after progress

	result.filesUploaded = uploadedCount;
	result.totalSize = totalBytes;

	// Now we need to get the root CID for the deployment folder
	// Filebase creates a CID for each file, but we need the folder CID
	// We'll use the Filebase IPFS API to get it

	log('\nGetting deployment CID...', 'dim');

	// Try to get the folder CID via the gateway
	// The folder CID can be obtained by uploading an index that references all files
	// For now, we'll use a workaround: pin the root via IPFS API

	if (lastCid) {
		// Use the API to get the root CID
		try {
			const response = await fetch(`${config.ipfsApiEndpoint}/pins`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${account.rpcApiKey}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				// Find our deployment
				const pins = data.results || [];
				const ourPin = pins.find((p: any) => p.pin?.name?.includes(deployFolder));
				if (ourPin?.pin?.cid) {
					result.cid = ourPin.pin.cid;
				}
			}
		} catch (e) {
			// API might not return folder CID directly
		}
	}

	// If we couldn't get the folder CID, use the last file CID as reference
	if (!result.cid && lastCid) {
		log('  Note: Using individual file CID (folder CID requires IPFS car upload)', 'yellow');
		result.cid = lastCid;
	}

	// Build URLs
	if (result.cid) {
		result.urls = {
			gateway: `${account.gateway}${result.cid}/`,
			ipfsIo: `https://ipfs.io/ipfs/${result.cid}/`,
			dweb: `https://dweb.link/ipfs/${result.cid}/`
		};
	}

	return result;
}

// ============================================================================
// CAR FILE APPROACH (Better for folder uploads)
// ============================================================================

async function deployViaCarFile(account: FilebaseAccount, config: FilebaseConfig): Promise<DeployResult> {
	const result: DeployResult = {
		account: account.name,
		bucket: account.bucket,
		gateway: account.gateway,
		cid: null,
		filesUploaded: 0,
		totalSize: 0,
		urls: {
			gateway: '',
			ipfsIo: '',
			dweb: ''
		}
	};

	log(`\n${'='.repeat(70)}`, 'blue');
	log(`  DEPLOYING TO FILEBASE VIA IPFS ADD: ${account.name}`, 'bold');
	log(`${'='.repeat(70)}\n`, 'blue');

	// Verify build directory exists
	if (!existsSync(IPFS_BUILD_DIR)) {
		throw new Error(`Build directory not found: ${IPFS_BUILD_DIR}`);
	}

	// Use ipfs-car to create a CAR file and upload
	// This preserves the directory structure and gives us a root CID

	const files = getAllFiles(IPFS_BUILD_DIR);
	let totalBytes = 0;
	for (const f of files) {
		totalBytes += statSync(f).size;
	}

	log(`Files: ${files.length}`, 'dim');
	log(`Total size: ${formatBytes(totalBytes)}`, 'dim');

	// For Filebase, we can use their IPFS pinning API directly
	// Upload via multipart form similar to standard IPFS add

	const formData = new FormData();

	for (const filePath of files) {
		const relativePath = relative(IPFS_BUILD_DIR, filePath);
		const content = readFileSync(filePath);
		const blob = new Blob([content], { type: getMimeType(filePath) });
		formData.append('file', blob, relativePath);
	}

	log('\nUploading to Filebase IPFS API...', 'dim');

	try {
		// Filebase supports standard IPFS HTTP API
		const response = await fetch(`${config.s3Endpoint.replace('s3.', 'api.')}/v1/ipfs/pins`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${account.rpcApiKey}`
			},
			body: JSON.stringify({
				name: `cane-timeline-${Date.now()}`,
				// We'd need to provide the CID here, which requires pre-computing
			})
		});

		if (response.ok) {
			const data = await response.json();
			result.cid = data.pin?.cid || data.cid;
		}
	} catch (e: any) {
		log(`  API error: ${e.message}`, 'yellow');
	}

	result.filesUploaded = files.length;
	result.totalSize = totalBytes;

	if (result.cid) {
		result.urls = {
			gateway: `${account.gateway}${result.cid}/`,
			ipfsIo: `https://ipfs.io/ipfs/${result.cid}/`,
			dweb: `https://dweb.link/ipfs/${result.cid}/`
		};
	}

	return result;
}

// ============================================================================
// SIMPLE S3 UPLOAD WITH IPFS PINNING
// ============================================================================

async function deploySimple(account: FilebaseAccount, config: FilebaseConfig): Promise<DeployResult> {
	const result: DeployResult = {
		account: account.name,
		bucket: account.bucket,
		gateway: account.gateway,
		cid: null,
		filesUploaded: 0,
		totalSize: 0,
		urls: {
			gateway: '',
			ipfsIo: '',
			dweb: ''
		}
	};

	log(`\n${'='.repeat(70)}`, 'blue');
	log(`  DEPLOYING TO FILEBASE: ${account.name}`, 'bold');
	log(`${'='.repeat(70)}\n`, 'blue');

	if (!existsSync(IPFS_BUILD_DIR)) {
		throw new Error(`Build directory not found: ${IPFS_BUILD_DIR}\nRun 'bun run ipfs' first.`);
	}

	const client = createS3Client(account, config.s3Endpoint);

	// Verify bucket
	log('Verifying bucket access...', 'dim');
	if (!await verifyBucketAccess(client, account.bucket)) {
		throw new Error(`Cannot access bucket: ${account.bucket}`);
	}
	log(`  Bucket: ${account.bucket} [OK]`, 'green');

	// Get files
	const files = getAllFiles(IPFS_BUILD_DIR);
	log(`\nPreparing ${files.length} files...`, 'dim');

	// Upload index.html first to get a reference CID
	const indexPath = join(IPFS_BUILD_DIR, 'index.html');
	if (existsSync(indexPath)) {
		const indexContent = readFileSync(indexPath);
		const indexKey = `site-${Date.now()}/index.html`;

		try {
			const response = await client.send(
				new PutObjectCommand({
					Bucket: account.bucket,
					Key: indexKey,
					Body: indexContent,
					ContentType: 'text/html',
					Metadata: {
						'import': 'car', // Request CAR import for directory
						'name': 'cane-timeline'
					}
				})
			);

			// Get CID from response headers
			// @ts-ignore - Filebase custom header
			const headers = response.$metadata?.httpHeaders || {};
			result.cid = headers['x-amz-meta-cid'] || null;

			log(`  Index uploaded, CID: ${result.cid || 'pending'}`, result.cid ? 'green' : 'yellow');
		} catch (e: any) {
			log(`  Index upload error: ${e.message}`, 'red');
		}
	}

	// Upload remaining files
	let uploaded = 0;
	let totalBytes = 0;
	const deployKey = `site-${Date.now()}`;

	for (const filePath of files) {
		const relativePath = relative(IPFS_BUILD_DIR, filePath);
		const s3Key = `${deployKey}/${relativePath}`;
		const content = readFileSync(filePath);

		try {
			await client.send(
				new PutObjectCommand({
					Bucket: account.bucket,
					Key: s3Key,
					Body: content,
					ContentType: getMimeType(filePath)
				})
			);
			uploaded++;
			totalBytes += content.length;

			if (uploaded % 100 === 0) {
				process.stdout.write(`\r  Progress: ${uploaded}/${files.length} files...    `);
			}
		} catch (e: any) {
			// Continue on error
		}
	}

	console.log(`\r  Uploaded: ${uploaded}/${files.length} files (${formatBytes(totalBytes)})    `);

	result.filesUploaded = uploaded;
	result.totalSize = totalBytes;

	// Build URLs if we have a CID
	if (result.cid) {
		result.urls = {
			gateway: `${account.gateway}${result.cid}/`,
			ipfsIo: `https://ipfs.io/ipfs/${result.cid}/`,
			dweb: `https://dweb.link/ipfs/${result.cid}/`
		};
	}

	return result;
}

// ============================================================================
// OUTPUT
// ============================================================================

function printResult(result: DeployResult): void {
	log(`\n${'='.repeat(70)}`, 'blue');
	log(`  FILEBASE DEPLOYMENT COMPLETE`, 'bold');
	log(`${'='.repeat(70)}\n`, 'blue');

	log(`  Account:  ${result.account}`, 'cyan');
	log(`  Bucket:   ${result.bucket}`);
	log(`  Files:    ${result.filesUploaded}`);
	log(`  Size:     ${formatBytes(result.totalSize)}`);

	if (result.cid) {
		log(`\n  CID: ${result.cid}`, 'green');
		log(`\n  Access URLs:`);
		log(`    Gateway: ${result.urls.gateway}`);
		log(`    IPFS.io: ${result.urls.ipfsIo}`);
		log(`    Dweb:    ${result.urls.dweb}`);
	} else {
		log(`\n  Note: CID not available via S3 upload.`, 'yellow');
		log(`  Files are stored but need IPFS pinning API for CID.`, 'yellow');
		log(`\n  Alternative: Use existing spark-2 CID with Filebase pinning:`);
		log(`    1. Get CID from spark-2: bun run ipfs`);
		log(`    2. Pin to Filebase via their pinning API`);
	}

	log('');
}

function updateCidFile(result: DeployResult, spark2Cid?: string): void {
	if (!existsSync(IPFS_CID_FILE)) return;

	let content = readFileSync(IPFS_CID_FILE, 'utf-8');

	// Add Filebase section if not present
	if (!content.includes('## Filebase')) {
		const filebaseSection = `
## Filebase Mirror

| Field | Value |
|-------|-------|
| Account | \`${result.account}\` |
| Gateway | ${result.gateway} |
| CID | \`${result.cid || spark2Cid || 'N/A'}\` |

### Filebase URLs
- ${result.urls.gateway || `${result.gateway}${spark2Cid}/`}
`;
		content = content.replace('## ENS Configuration', filebaseSection + '\n## ENS Configuration');

		const { writeFileSync } = require('fs');
		writeFileSync(IPFS_CID_FILE, content);
		log(`\n[FILE] Updated ${IPFS_CID_FILE}`, 'dim');
	}
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const accountName = args[0];

	log('\n' + '='.repeat(70), 'blue');
	log('  FILEBASE IPFS DEPLOYMENT', 'bold');
	log('='.repeat(70) + '\n', 'blue');

	// Load config
	let config: FilebaseConfig;
	try {
		config = loadConfig();
		log(`Loaded config v${config.version}`, 'dim');
	} catch (e: any) {
		log(`Error: ${e.message}`, 'red');
		process.exit(1);
	}

	// Select account
	let account: FilebaseAccount;
	if (accountName) {
		const found = config.accounts.find(a => a.name === accountName);
		if (!found) {
			log(`Account not found: ${accountName}`, 'red');
			log(`Available accounts: ${config.accounts.map(a => a.name).join(', ')}`, 'dim');
			process.exit(1);
		}
		account = found;
	} else {
		account = config.accounts[0];
	}

	log(`Using account: ${account.name}`, 'cyan');

	try {
		const result = await deploySimple(account, config);
		printResult(result);

		// Read existing spark-2 CID to use for Filebase pinning
		if (existsSync(IPFS_CID_FILE)) {
			const cidContent = readFileSync(IPFS_CID_FILE, 'utf-8');
			const cidMatch = cidContent.match(/\| CID \| `(bafybe[a-z0-9]+)`/);
			const spark2Cid = cidMatch?.[1];

			if (spark2Cid && !result.cid) {
				log(`\n  Spark-2 CID available: ${spark2Cid}`, 'cyan');
				log(`  Pin this CID to Filebase for redundancy.`, 'dim');

				// Try to pin the spark-2 CID to Filebase
				log('\n  Attempting to pin spark-2 CID to Filebase...', 'dim');

				try {
					const pinResponse = await fetch('https://api.filebase.io/v1/ipfs/pins', {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${account.rpcApiKey}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							cid: spark2Cid,
							name: `cane-timeline-${Date.now()}`
						})
					});

					if (pinResponse.ok) {
						const pinData = await pinResponse.json();
						log(`  [OK] Pinned to Filebase: ${pinData.requestid || 'success'}`, 'green');
						result.cid = spark2Cid;
						result.urls = {
							gateway: `${account.gateway}${spark2Cid}/`,
							ipfsIo: `https://ipfs.io/ipfs/${spark2Cid}/`,
							dweb: `https://dweb.link/ipfs/${spark2Cid}/`
						};
					} else {
						const errorText = await pinResponse.text();
						log(`  [WARN] Pin request: ${pinResponse.status} - ${errorText.slice(0, 100)}`, 'yellow');
					}
				} catch (e: any) {
					log(`  [WARN] Pin error: ${e.message}`, 'yellow');
				}
			}

			updateCidFile(result, spark2Cid);
		}

		// Final summary
		if (result.cid) {
			log('\n' + '='.repeat(70), 'green');
			log('  DEPLOYMENT SUCCESSFUL', 'bold');
			log('='.repeat(70), 'green');
			log(`\n  Filebase Gateway: ${result.urls.gateway}`, 'cyan');
		}

	} catch (e: any) {
		log(`\nDeployment failed: ${e.message}`, 'red');
		process.exit(1);
	}
}

main().catch(console.error);
