<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		initializeGateways,
		getOperationalGatewayUrlSync,
		findWorkingGatewayForCid,
		gatewayCache,
		PUBLIC_GATEWAYS
	} from '$lib/utils/ipfs-gateways';

	interface Props {
		cid: string;
		title?: string;
		height?: string;
	}

	let { cid, title = 'PDF Document', height = '800px' }: Props = $props();

	let iframeSrc = $state('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let currentGateway = $state('');

	// Placeholder for loading state
	const placeholderSrc = '/pdfs/sec-citation-guide.pdf';

	onMount(async () => {
		if (!browser) return;

		try {
			// First, try to use cached gateway
			await initializeGateways();

			// Get the sync URL (uses cache)
			let url = getOperationalGatewayUrlSync(cid);
			iframeSrc = url;
			currentGateway = url.replace(cid, '');
			loading = false;

			// Verify the URL works, if not find a working one
			const testResponse = await fetch(url, { method: 'HEAD', mode: 'cors' }).catch(() => null);

			if (!testResponse?.ok) {
				loading = true;
				// Find a working gateway for this specific CID
				const workingUrl = await findWorkingGatewayForCid(cid);

				if (workingUrl) {
					iframeSrc = workingUrl;
					currentGateway = workingUrl.replace(cid, '');
				} else {
					// Check if we have a local copy
					const localPath = `/pdfs/${cid}.pdf`;
					const localResponse = await fetch(localPath, { method: 'HEAD' }).catch(() => null);

					if (localResponse?.ok) {
						iframeSrc = localPath;
						currentGateway = 'local';
					} else {
						error = 'No available gateway could serve this document';
						iframeSrc = placeholderSrc;
					}
				}
				loading = false;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load PDF';
			iframeSrc = placeholderSrc;
			loading = false;
		}
	});
</script>

<div class="pdf-embed-container">
	{#if loading}
		<div class="loading-overlay">
			<div class="loading-spinner"></div>
			<p>Finding best gateway...</p>
		</div>
	{/if}

	{#if error}
		<div class="error-banner">
			<span class="error-icon">⚠️</span>
			<span>{error}</span>
		</div>
	{/if}

	<iframe
		src={iframeSrc || placeholderSrc}
		width="100%"
		{height}
		style="border: 1px solid var(--color-border); border-radius: 4px;"
		{title}
	></iframe>

	{#if currentGateway && currentGateway !== 'local'}
		<div class="gateway-info">
			<small>Served via: {currentGateway.replace('https://', '').replace('/ipfs/', '')}</small>
		</div>
	{/if}
</div>

<style>
	.pdf-embed-container {
		position: relative;
		width: 100%;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		z-index: 10;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-text);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-overlay p {
		margin-top: 1rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #ffebee;
		border: 1px solid #ef5350;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #c62828;
	}

	:global([data-theme='dark']) .error-banner {
		background: #4a1a1a;
		color: #ff8a80;
	}

	.gateway-info {
		margin-top: 0.25rem;
		text-align: right;
	}

	.gateway-info small {
		color: var(--color-text-muted);
		font-size: 0.7rem;
		font-family: var(--font-mono);
	}

	iframe {
		display: block;
	}
</style>
