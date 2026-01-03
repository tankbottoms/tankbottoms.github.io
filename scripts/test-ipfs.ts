#!/usr/bin/env bun
/**
 * IPFS Deployment Test Script
 * Tests the complete IPFS/IPNS deployment workflow
 */

import { $ } from 'bun';

const IPFS_NODES = {
	local: { api: 'http://localhost:5001', gateway: 'http://localhost:8080' },
	'spark-2': { api: 'http://spark-2.local:5001', gateway: 'http://spark-2.local:8080' }
};

const TEST_DIR = 'test-ipfs-content';
const TEST_HTML = `<!DOCTYPE html>
<html>
<head><title>IPFS Test Page</title></head>
<body>
<h1>IPFS Test Page</h1>
<p>Deployed at: ${new Date().toISOString()}</p>
<p>This is a simple test page to verify IPFS deployment.</p>
<img src="./test-image.svg" alt="Test SVG" />
<script src="./test-script.js"></script>
</body>
</html>`;

const TEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
<circle cx="50" cy="50" r="40" fill="#4CAF50"/>
<text x="50" y="55" text-anchor="middle" fill="white">OK</text>
</svg>`;

const TEST_JS = `console.log('IPFS Test Script Loaded:', new Date().toISOString());`;

interface TestResult {
	test: string;
	passed: boolean;
	message: string;
	details?: string;
}

async function checkNodeConnectivity(name: string, apiUrl: string): Promise<TestResult> {
	try {
		const response = await fetch(`${apiUrl}/api/v0/id`, { method: 'POST', signal: AbortSignal.timeout(5000) });
		if (response.ok) {
			const data = await response.json();
			return { test: `${name} API connectivity`, passed: true, message: 'Connected', details: `PeerID: ${data.ID.slice(0, 20)}...` };
		}
		return { test: `${name} API connectivity`, passed: false, message: `HTTP ${response.status}` };
	} catch (e: any) {
		return { test: `${name} API connectivity`, passed: false, message: e.message };
	}
}

async function checkGateway(name: string, gatewayUrl: string): Promise<TestResult> {
	try {
		// Use a known CID that should exist - the IPFS logo
		const response = await fetch(`${gatewayUrl}/ipfs/bafybeibwzifw52ttrkqlikfzext5akxu7lz4xiwjgwzmqcpdzmp3n5vnbe`,
			{ method: 'HEAD', signal: AbortSignal.timeout(10000) });
		if (response.ok || response.status === 301) {
			return { test: `${name} gateway`, passed: true, message: 'Accessible' };
		}
		return { test: `${name} gateway`, passed: false, message: `HTTP ${response.status}` };
	} catch (e: any) {
		return { test: `${name} gateway`, passed: false, message: e.message };
	}
}

async function createTestContent(): Promise<void> {
	console.log('\n[1] Creating test content...');
	await $`rm -rf ${TEST_DIR}`.quiet();
	await $`mkdir -p ${TEST_DIR}`;

	await Bun.write(`${TEST_DIR}/index.html`, TEST_HTML);
	await Bun.write(`${TEST_DIR}/test-image.svg`, TEST_SVG);
	await Bun.write(`${TEST_DIR}/test-script.js`, TEST_JS);

	console.log(`    Created: ${TEST_DIR}/index.html`);
	console.log(`    Created: ${TEST_DIR}/test-image.svg`);
	console.log(`    Created: ${TEST_DIR}/test-script.js`);
}

async function addToIpfs(apiUrl: string, directory: string): Promise<string | null> {
	try {
		// Use ipfs add via API
		const result = await $`curl -s -X POST -F "file=@${directory}/index.html" -F "file=@${directory}/test-image.svg" -F "file=@${directory}/test-script.js" "${apiUrl}/api/v0/add?wrap-with-directory=true&pin=true"`.text();

		// Parse the JSON lines output - last line with empty Name is the directory CID
		const lines = result.trim().split('\n');
		for (const line of lines.reverse()) {
			const obj = JSON.parse(line);
			if (obj.Name === '') {
				return obj.Hash;
			}
		}
		return null;
	} catch (e: any) {
		console.error(`    Add failed: ${e.message}`);
		return null;
	}
}

async function verifyCid(apiUrl: string, cid: string, file: string): Promise<TestResult> {
	try {
		const response = await fetch(`${apiUrl}/api/v0/cat?arg=${cid}/${file}`,
			{ method: 'POST', signal: AbortSignal.timeout(10000) });
		if (response.ok) {
			const content = await response.text();
			const preview = content.slice(0, 50).replace(/\n/g, ' ');
			return { test: `Verify ${file}`, passed: true, message: 'Retrieved', details: `"${preview}..."` };
		}
		return { test: `Verify ${file}`, passed: false, message: `HTTP ${response.status}` };
	} catch (e: any) {
		return { test: `Verify ${file}`, passed: false, message: e.message };
	}
}

async function publishToIpns(apiUrl: string, cid: string, keyName: string): Promise<string | null> {
	try {
		// Check if key exists, create if not
		const keysResult = await fetch(`${apiUrl}/api/v0/key/list`, { method: 'POST' });
		const keysData = await keysResult.json();
		const keyExists = keysData.Keys?.some((k: any) => k.Name === keyName);

		if (!keyExists) {
			console.log(`    Creating IPNS key: ${keyName}`);
			await fetch(`${apiUrl}/api/v0/key/gen?arg=${keyName}&type=ed25519`, { method: 'POST' });
		}

		console.log(`    Publishing to IPNS (this may take a moment)...`);
		const response = await fetch(
			`${apiUrl}/api/v0/name/publish?arg=/ipfs/${cid}&key=${keyName}&allow-offline=true`,
			{ method: 'POST', signal: AbortSignal.timeout(60000) }
		);

		if (response.ok) {
			const data = await response.json();
			return data.Name;
		}
		return null;
	} catch (e: any) {
		console.error(`    IPNS publish failed: ${e.message}`);
		return null;
	}
}

async function verifyIpns(apiUrl: string, ipnsKey: string): Promise<TestResult> {
	try {
		const response = await fetch(
			`${apiUrl}/api/v0/name/resolve?arg=${ipnsKey}`,
			{ method: 'POST', signal: AbortSignal.timeout(30000) }
		);
		if (response.ok) {
			const data = await response.json();
			return { test: `IPNS resolve`, passed: true, message: 'Resolved', details: data.Path };
		}
		return { test: `IPNS resolve`, passed: false, message: `HTTP ${response.status}` };
	} catch (e: any) {
		return { test: `IPNS resolve`, passed: false, message: e.message };
	}
}

async function verifyGatewayAccess(gatewayUrl: string, cid: string): Promise<TestResult> {
	try {
		// Try subdomain style first (what modern gateways redirect to)
		const response = await fetch(`${gatewayUrl}/ipfs/${cid}/index.html`,
			{ method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });

		if (response.ok) {
			const content = await response.text();
			if (content.includes('IPFS Test Page')) {
				return { test: 'Gateway access', passed: true, message: 'Content verified' };
			}
			return { test: 'Gateway access', passed: false, message: 'Wrong content', details: content.slice(0, 100) };
		}
		return { test: 'Gateway access', passed: false, message: `HTTP ${response.status}` };
	} catch (e: any) {
		return { test: 'Gateway access', passed: false, message: e.message };
	}
}

function printResults(results: TestResult[]): void {
	console.log('\n' + '='.repeat(60));
	console.log('TEST RESULTS');
	console.log('='.repeat(60));

	let passed = 0;
	let failed = 0;

	for (const r of results) {
		const status = r.passed ? '[PASS]' : '[FAIL]';
		console.log(`${status} ${r.test}: ${r.message}`);
		if (r.details) console.log(`       ${r.details}`);
		if (r.passed) passed++; else failed++;
	}

	console.log('='.repeat(60));
	console.log(`Total: ${passed} passed, ${failed} failed`);
	console.log('='.repeat(60));
}

async function main() {
	console.log('IPFS Deployment Test Suite');
	console.log('==========================\n');

	const results: TestResult[] = [];

	// Step 1: Check node connectivity
	console.log('[0] Checking IPFS node connectivity...');
	for (const [name, urls] of Object.entries(IPFS_NODES)) {
		results.push(await checkNodeConnectivity(name, urls.api));
	}

	// Find first working node
	const workingNode = Object.entries(IPFS_NODES).find((_, i) => results[i].passed);
	if (!workingNode) {
		console.error('\nNo IPFS nodes accessible. Aborting.');
		printResults(results);
		process.exit(1);
	}

	const [nodeName, nodeUrls] = workingNode;
	console.log(`\n    Using node: ${nodeName}`);

	// Check gateway
	results.push(await checkGateway(nodeName, nodeUrls.gateway));

	// Step 2: Create test content
	await createTestContent();

	// Step 3: Add to IPFS
	console.log('\n[2] Adding content to IPFS...');
	const cid = await addToIpfs(nodeUrls.api, TEST_DIR);
	if (!cid) {
		console.error('    Failed to add content to IPFS');
		printResults(results);
		process.exit(1);
	}
	console.log(`    CID: ${cid}`);
	results.push({ test: 'Add to IPFS', passed: true, message: 'Success', details: `CID: ${cid}` });

	// Step 4: Verify content via API
	console.log('\n[3] Verifying content via API...');
	results.push(await verifyCid(nodeUrls.api, cid, 'index.html'));
	results.push(await verifyCid(nodeUrls.api, cid, 'test-image.svg'));
	results.push(await verifyCid(nodeUrls.api, cid, 'test-script.js'));

	// Step 5: Verify gateway access
	console.log('\n[4] Testing gateway access...');
	results.push(await verifyGatewayAccess(nodeUrls.gateway, cid));

	// Step 6: Publish to IPNS
	console.log('\n[5] Publishing to IPNS...');
	const ipnsKey = await publishToIpns(nodeUrls.api, cid, 'test-site');
	if (ipnsKey) {
		console.log(`    IPNS Key: ${ipnsKey}`);
		results.push({ test: 'IPNS publish', passed: true, message: 'Success', details: `Key: ${ipnsKey}` });

		// Verify IPNS resolution
		console.log('\n[6] Verifying IPNS resolution...');
		results.push(await verifyIpns(nodeUrls.api, ipnsKey));
	} else {
		results.push({ test: 'IPNS publish', passed: false, message: 'Failed to publish' });
	}

	// Cleanup
	await $`rm -rf ${TEST_DIR}`.quiet();

	// Print summary
	printResults(results);

	// Print access URLs
	console.log('\nAccess URLs:');
	console.log(`  API:     ${nodeUrls.api}/api/v0/cat?arg=${cid}/index.html`);
	console.log(`  Gateway: ${nodeUrls.gateway}/ipfs/${cid}/`);
	if (ipnsKey) {
		console.log(`  IPNS:    ${nodeUrls.gateway}/ipns/${ipnsKey}/`);
	}

	// Exit with appropriate code
	const allPassed = results.every(r => r.passed);
	process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
