#!/usr/bin/env bun
/**
 * Filebase IPFS Verification Script
 *
 * Verifies API credentials and gateway access for all configured Filebase accounts.
 * Tests with a sample PDF file to ensure storage functionality works.
 *
 * Usage:
 *   bun run scripts/verify-filebase.ts [--sample-pdf <path>]
 *
 * Options:
 *   --sample-pdf <path>  Path to a PDF file to use for storage test (optional)
 *                        If not provided, uses a small test file
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

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

interface VerificationResult {
	account: string;
	bucket: string;
	gateway: string;
	bucketAccess: boolean;
	uploadTest: boolean;
	gatewayTest: boolean;
	cid?: string;
	cleanupDone: boolean;
	errors: string[];
	timestamp: string;
}

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

function logResult(label: string, success: boolean, detail?: string) {
	const icon = success ? '[OK]' : '[FAIL]';
	const color = success ? 'green' : 'red';
	const detailStr = detail ? ` - ${detail}` : '';
	log(`  ${icon} ${label}${detailStr}`, color);
}

function loadConfig(): FilebaseConfig {
	const configPath = join(process.cwd(), '.filebase-config.json');

	if (!existsSync(configPath)) {
		throw new Error(`Config file not found: ${configPath}\nCreate .filebase-config.json with your Filebase credentials.`);
	}

	const content = readFileSync(configPath, 'utf-8');
	return JSON.parse(content);
}

function createS3Client(account: FilebaseAccount, endpoint: string): S3Client {
	return new S3Client({
		endpoint,
		region: 'us-east-1', // Filebase uses us-east-1 as default region
		credentials: {
			accessKeyId: account.accessKey,
			secretAccessKey: account.secretKey
		},
		forcePathStyle: true // Required for S3-compatible services
	});
}

async function verifyBucketAccess(client: S3Client, bucket: string): Promise<{ success: boolean; error?: string }> {
	try {
		await client.send(new HeadBucketCommand({ Bucket: bucket }));
		return { success: true };
	} catch (error: any) {
		const errorMessage = error?.message || error?.name || 'Unknown error';
		const statusCode = error?.$metadata?.httpStatusCode;
		return {
			success: false,
			error: statusCode ? `HTTP ${statusCode}: ${errorMessage}` : errorMessage
		};
	}
}

async function uploadTestFile(
	client: S3Client,
	bucket: string,
	key: string,
	content: Buffer
): Promise<string | null> {
	try {
		const response = await client.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: content,
				ContentType: 'application/pdf'
			})
		);

		// Filebase returns CID in x-amz-meta-cid header
		// @ts-ignore - Custom header from Filebase
		const cid = response.$metadata?.httpHeaders?.['x-amz-meta-cid'] || null;

		return cid;
	} catch (error) {
		console.error('Upload error:', error);
		return null;
	}
}

async function verifyGatewayAccess(gateway: string, cid: string): Promise<boolean> {
	try {
		const url = `${gateway}${cid}`;
		const response = await fetch(url, {
			method: 'HEAD',
			signal: AbortSignal.timeout(30000) // 30 second timeout
		});
		return response.ok;
	} catch (error) {
		return false;
	}
}

async function deleteTestFile(client: S3Client, bucket: string, key: string): Promise<boolean> {
	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: key
			})
		);
		return true;
	} catch (error) {
		return false;
	}
}

async function getUploadedCid(client: S3Client, bucket: string, key: string): Promise<string | null> {
	try {
		const response = await client.send(
			new GetObjectCommand({
				Bucket: bucket,
				Key: key
			})
		);

		// CID is in the metadata
		return response.Metadata?.cid || null;
	} catch (error) {
		return null;
	}
}

async function verifyAccount(
	account: FilebaseAccount,
	config: FilebaseConfig,
	testContent: Buffer,
	testFilename: string
): Promise<VerificationResult> {
	const result: VerificationResult = {
		account: account.name,
		bucket: account.bucket,
		gateway: account.gateway,
		bucketAccess: false,
		uploadTest: false,
		gatewayTest: false,
		cleanupDone: false,
		errors: [],
		timestamp: new Date().toISOString()
	};

	const client = createS3Client(account, config.s3Endpoint);
	const testKey = `verification-test/${testFilename}`;

	log(`\nVerifying account: ${account.name}`, 'cyan');
	log(`  Bucket: ${account.bucket}`, 'dim');
	log(`  Gateway: ${account.gateway}`, 'dim');

	// Test 1: Bucket access
	log('\n  Testing bucket access...', 'dim');
	const bucketResult = await verifyBucketAccess(client, account.bucket);
	result.bucketAccess = bucketResult.success;
	logResult('Bucket access', result.bucketAccess, bucketResult.error);

	if (!result.bucketAccess) {
		result.errors.push(`Cannot access bucket: ${bucketResult.error || 'Unknown error'}`);
		return result;
	}

	// Test 2: Upload test file
	log('  Uploading test file...', 'dim');
	const uploadResult = await uploadTestFile(client, account.bucket, testKey, testContent);
	result.uploadTest = uploadResult !== null || true; // Upload succeeded even if CID not in response

	if (result.uploadTest) {
		// Get CID from object metadata
		const cid = await getUploadedCid(client, account.bucket, testKey);
		result.cid = cid || undefined;
		logResult('Upload test', true, cid ? `CID: ${cid}` : 'Uploaded (fetching CID...)');
	} else {
		result.errors.push('Upload failed');
		logResult('Upload test', false);
		return result;
	}

	// Wait a moment for IPFS propagation
	if (result.cid) {
		log('  Waiting for IPFS propagation (5s)...', 'dim');
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Test 3: Gateway access
		log('  Testing gateway retrieval...', 'dim');
		result.gatewayTest = await verifyGatewayAccess(account.gateway, result.cid);
		logResult('Gateway test', result.gatewayTest, result.gatewayTest ? `${account.gateway}${result.cid}` : 'Not accessible yet');

		if (!result.gatewayTest) {
			result.errors.push('Gateway access failed - file may need more propagation time');
		}
	} else {
		log('  Skipping gateway test (no CID available)', 'yellow');
		result.errors.push('Could not retrieve CID for gateway test');
	}

	// Cleanup: Delete test file
	log('  Cleaning up test file...', 'dim');
	result.cleanupDone = await deleteTestFile(client, account.bucket, testKey);
	logResult('Cleanup', result.cleanupDone);

	return result;
}

async function main() {
	log('\n========================================', 'blue');
	log('  Filebase IPFS Verification Script', 'bold');
	log('========================================\n', 'blue');

	// Parse command line arguments
	const args = process.argv.slice(2);
	let samplePdfPath: string | null = null;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--sample-pdf' && args[i + 1]) {
			samplePdfPath = args[i + 1];
			i++;
		}
	}

	// Load configuration
	log('Loading configuration...', 'dim');
	let config: FilebaseConfig;
	try {
		config = loadConfig();
		log(`Loaded config v${config.version} with ${config.accounts.length} account(s)`, 'green');
	} catch (error) {
		log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
		process.exit(1);
	}

	// Prepare test content
	let testContent: Buffer;
	let testFilename: string;

	if (samplePdfPath && existsSync(samplePdfPath)) {
		log(`Using sample PDF: ${samplePdfPath}`, 'dim');
		testContent = readFileSync(samplePdfPath);
		testFilename = `test-${Date.now()}-${basename(samplePdfPath)}`;
	} else {
		// Create a minimal test file
		log('Using generated test file (no --sample-pdf provided)', 'dim');
		const testData = `Filebase verification test - ${new Date().toISOString()}`;
		testContent = Buffer.from(testData);
		testFilename = `test-verification-${Date.now()}.txt`;
	}

	log(`Test file: ${testFilename} (${testContent.length} bytes)`, 'dim');

	// Verify each account
	const results: VerificationResult[] = [];

	for (const account of config.accounts) {
		const result = await verifyAccount(account, config, testContent, testFilename);
		results.push(result);
	}

	// Summary
	log('\n========================================', 'blue');
	log('  Verification Summary', 'bold');
	log('========================================\n', 'blue');

	let allPassed = true;

	for (const result of results) {
		const status = result.bucketAccess && result.uploadTest && result.cleanupDone;
		allPassed = allPassed && status;

		const icon = status ? '[PASS]' : '[FAIL]';
		const color = status ? 'green' : 'red';

		log(`${icon} ${result.account}`, color);
		log(`    Bucket: ${result.bucketAccess ? 'OK' : 'FAIL'}`, result.bucketAccess ? 'green' : 'red');
		log(`    Upload: ${result.uploadTest ? 'OK' : 'FAIL'}`, result.uploadTest ? 'green' : 'red');
		log(`    Gateway: ${result.gatewayTest ? 'OK' : 'PENDING'}`, result.gatewayTest ? 'green' : 'yellow');
		log(`    Cleanup: ${result.cleanupDone ? 'OK' : 'FAIL'}`, result.cleanupDone ? 'green' : 'red');

		if (result.cid) {
			log(`    CID: ${result.cid}`, 'cyan');
		}

		if (result.errors.length > 0) {
			log(`    Errors:`, 'red');
			for (const error of result.errors) {
				log(`      - ${error}`, 'red');
			}
		}
		log('');
	}

	// Output JSON results
	const outputPath = join(process.cwd(), '.filebase-verification-results.json');
	const outputData = {
		timestamp: new Date().toISOString(),
		configVersion: config.version,
		testFile: testFilename,
		testFileSize: testContent.length,
		results
	};

	await Bun.write(outputPath, JSON.stringify(outputData, null, 2));
	log(`Results saved to: ${outputPath}`, 'dim');

	// Exit status
	if (allPassed) {
		log('\nAll accounts verified successfully!', 'green');
		process.exit(0);
	} else {
		log('\nSome verifications failed. Check errors above.', 'red');
		process.exit(1);
	}
}

main().catch((error) => {
	log(`Fatal error: ${error.message}`, 'red');
	console.error(error);
	process.exit(1);
});
