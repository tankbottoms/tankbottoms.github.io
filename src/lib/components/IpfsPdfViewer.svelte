<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	// Props
	let {
		cid,
		title = 'PDF Document',
		height = '800px'
	}: {
		cid: string;
		title?: string;
		height?: string;
	} = $props();

	// Multiple IPFS gateways to try (in order of preference)
	const GATEWAYS = [
		'https://ipfs.pantsonfire.xyz/ipfs',
		'https://dweb.link/ipfs',
		'https://ipfs.io/ipfs',
		'https://cloudflare-ipfs.com/ipfs',
		'https://gateway.pinata.cloud/ipfs'
	];

	let pdfUrl = $state<string>('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let usedSource = $state<string>('');

	async function checkCacheFile(): Promise<boolean> {
		try {
			const cachePath = `${base}/pdf/cache/${cid}.pdf`;
			const response = await fetch(cachePath, { method: 'HEAD' });
			if (response.ok) {
				pdfUrl = cachePath;
				usedSource = 'local cache';
				return true;
			}
		} catch {
			// Cache file doesn't exist, continue to gateways
		}
		return false;
	}

	async function tryGateway(gateway: string): Promise<boolean> {
		try {
			const url = `${gateway}/${cid}`;
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(url, {
				method: 'HEAD',
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (response.ok) {
				pdfUrl = url;
				usedSource = gateway.replace('https://', '').split('/')[0];
				return true;
			}
		} catch {
			// Gateway failed, try next
		}
		return false;
	}

	async function loadPdf() {
		loading = true;
		error = null;

		// First, check local cache
		if (await checkCacheFile()) {
			loading = false;
			return;
		}

		// Try each gateway
		for (const gateway of GATEWAYS) {
			if (await tryGateway(gateway)) {
				loading = false;
				return;
			}
		}

		// All sources failed
		error = 'Unable to load PDF from any source';
		loading = false;
	}

	onMount(() => {
		loadPdf();
	});
</script>

<div class="pdf-viewer">
	{#if loading}
		<div class="pdf-loading" style="height: {height};">
			<div class="loading-spinner"></div>
			<p>Loading PDF...</p>
			<p class="loading-cid">{cid.slice(0, 20)}...</p>
		</div>
	{:else if error}
		<div class="pdf-error" style="height: {height};">
			<i class="fat fa-file-pdf"></i>
			<p>{error}</p>
			<p class="error-cid">CID: {cid}</p>
			<div class="retry-links">
				<span>Try manually:</span>
				{#each GATEWAYS as gateway}
					<a href="{gateway}/{cid}" target="_blank" rel="noopener">
						{gateway.replace('https://', '').split('/')[0]}
					</a>
				{/each}
			</div>
		</div>
	{:else}
		<div class="pdf-container">
			<div class="pdf-source">
				<i class="fat fa-file-pdf"></i>
				<span>Source: {usedSource}</span>
				<a href={pdfUrl} target="_blank" rel="noopener" title="Open in new tab">
					<i class="fat fa-external-link"></i>
				</a>
			</div>
			<iframe
				src={pdfUrl}
				width="100%"
				{height}
				{title}
				style="border: 1px solid var(--color-border); border-radius: 4px;"
			></iframe>
		</div>
	{/if}
</div>

<style>
	.pdf-viewer {
		margin: 1rem 0;
	}

	.pdf-loading,
	.pdf-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text-muted);
	}

	.pdf-loading p,
	.pdf-error p {
		margin: 0.5rem 0;
	}

	.loading-cid,
	.error-cid {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-text-muted);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.pdf-error i {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.retry-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		font-size: 0.75rem;
	}

	.retry-links span {
		opacity: 0.6;
	}

	.retry-links a {
		color: var(--color-link);
		text-decoration: underline;
	}

	.pdf-source {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-bottom: none;
		border-radius: 4px 4px 0 0;
	}

	.pdf-source a {
		color: var(--color-text-muted);
		margin-left: auto;
	}

	.pdf-source a:hover {
		color: var(--color-text);
	}

	.pdf-container iframe {
		display: block;
		border-radius: 0 0 4px 4px !important;
	}
</style>
