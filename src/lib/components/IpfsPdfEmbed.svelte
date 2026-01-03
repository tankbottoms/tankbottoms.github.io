<script lang="ts">
	import { onMount } from 'svelte';
	import {
		PUBLIC_GATEWAYS,
		gatewayCache,
		initializeGateways,
		extractCidFromUrl
	} from '$lib/utils/ipfs-gateways';

	interface Props {
		/** IPFS CID or full gateway URL */
		src: string;
		/** Document title for accessibility */
		title: string;
		/** Height of the iframe */
		height?: string;
		/** Custom class for the container */
		class?: string;
	}

	let {
		src,
		title,
		height = '800px',
		class: className = ''
	}: Props = $props();

	let currentUrl = $state<string>('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let gatewayIndex = $state(0);
	let triedGateways = $state<string[]>([]);
	let iframeLoaded = $state(false);

	// Gateway status: 'connecting' | 'cycling' | 'connected' | 'error'
	type GatewayStatusType = 'connecting' | 'cycling' | 'connected' | 'error';
	let gatewayStatus = $state<GatewayStatusType>('connecting');

	// Extract display name from gateway URL
	function getGatewayDisplayName(url: string): string {
		try {
			const parsed = new URL(url);
			return parsed.hostname;
		} catch {
			return url.replace('https://', '').replace('/ipfs/', '').split('/')[0];
		}
	}

	// Current gateway display name
	const currentGatewayName = $derived(() => {
		if (!currentUrl) return '';
		return getGatewayDisplayName(currentUrl);
	});

	// Extract CID from src (could be full URL or just CID)
	const cid = $derived(() => {
		if (src.startsWith('http')) {
			return extractCidFromUrl(src) || src;
		}
		return src;
	});

	// Build URL for current gateway
	function buildUrl(gateway: string, cidValue: string): string {
		const cleanGateway = gateway.endsWith('/') ? gateway : `${gateway}/`;
		return `${cleanGateway}${cidValue}`;
	}

	// Get ordered list of gateways (prefer cached operational ones)
	function getOrderedGateways(): string[] {
		const cache = $gatewayCache;

		// If we have cached results, put online gateways first
		if (cache.gateways.length > 0) {
			const online = cache.gateways
				.filter(g => g.online)
				.map(g => g.url);
			const offline = cache.gateways
				.filter(g => !g.online)
				.map(g => g.url);

			// Add any gateways not in cache
			const cached = new Set([...online, ...offline]);
			const uncached = PUBLIC_GATEWAYS.filter(g => !cached.has(g));

			return [...online, ...uncached, ...offline];
		}

		return [...PUBLIC_GATEWAYS];
	}

	// Try the next gateway
	async function tryNextGateway() {
		const gateways = getOrderedGateways();

		if (gatewayIndex >= gateways.length) {
			error = `Unable to load PDF from any gateway. Tried: ${triedGateways.join(', ')}`;
			loading = false;
			gatewayStatus = 'error';
			return;
		}

		const gateway = gateways[gatewayIndex];
		const cidValue = cid();
		const url = buildUrl(gateway, cidValue);

		// Set cycling status if we're past the first gateway
		if (gatewayIndex > 0) {
			gatewayStatus = 'cycling';
		} else {
			gatewayStatus = 'connecting';
		}

		triedGateways = [...triedGateways, gateway.replace('https://', '').replace('/ipfs/', '')];

		try {
			// Test if gateway responds for this CID
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 8000);

			const response = await fetch(url, {
				method: 'HEAD',
				signal: controller.signal,
				mode: 'cors'
			});

			clearTimeout(timeoutId);

			if (response.ok || response.status === 301 || response.status === 302) {
				currentUrl = url;
				loading = false;
				error = null;
				// Status will be set to 'connected' when iframe actually loads
				return;
			}
		} catch {
			// Gateway failed, try next
		}

		gatewayIndex++;
		await tryNextGateway();
	}

	// Handle successful iframe load
	function handleIframeLoad() {
		iframeLoaded = true;
		gatewayStatus = 'connected';
	}

	// Handle iframe load error
	function handleIframeError() {
		// Try next gateway if current one fails
		iframeLoaded = false;
		gatewayStatus = 'cycling';
		gatewayIndex++;
		tryNextGateway();
	}

	onMount(async () => {
		// Initialize gateway cache
		await initializeGateways();

		// Start trying gateways
		await tryNextGateway();
	});
</script>

<div class="pdf-embed {className}">
	{#if loading}
		<div class="pdf-loading" style="height: {height}">
			<div class="spinner"></div>
			<p>Loading PDF...</p>
			{#if triedGateways.length > 0}
				<p class="gateway-status">Trying gateways: {triedGateways.join(' → ')}</p>
			{/if}
		</div>
	{:else if error}
		<div class="pdf-error" style="height: {height}">
			<p class="error-icon">⚠</p>
			<p class="error-message">{error}</p>
			<p class="error-cid">CID: {cid()}</p>
			<button onclick={() => { gatewayIndex = 0; triedGateways = []; loading = true; iframeLoaded = false; gatewayStatus = 'connecting'; tryNextGateway(); }}>
				Retry
			</button>
		</div>
	{:else}
		<iframe
			src={currentUrl}
			width="100%"
			{height}
			style="border: 1px solid #ccc; border-radius: 4px 4px 0 0;"
			{title}
			onload={handleIframeLoad}
			onerror={handleIframeError}
		></iframe>
		<!-- Gateway status caption -->
		<div class="gateway-caption" class:status-connected={gatewayStatus === 'connected'} class:status-cycling={gatewayStatus === 'cycling'} class:status-error={gatewayStatus === 'error'}>
			<span class="status-indicator">
				{#if gatewayStatus === 'connected'}
					<i class="fat fa-check-circle"></i>
				{:else if gatewayStatus === 'cycling'}
					<i class="fat fa-arrows-rotate fa-spin"></i>
				{:else if gatewayStatus === 'error'}
					<i class="fat fa-circle-exclamation"></i>
				{:else}
					<i class="fat fa-circle-notch fa-spin"></i>
				{/if}
			</span>
			<span class="gateway-url">
				{#if gatewayStatus === 'cycling'}
					Cycling to gateway: {currentGatewayName()}
				{:else if gatewayStatus === 'connected'}
					{currentGatewayName()}
				{:else if gatewayStatus === 'error'}
					All gateways failed
				{:else}
					Connecting to {currentGatewayName() || 'gateway'}...
				{/if}
			</span>
		</div>
	{/if}
</div>

<style>
	.pdf-embed {
		width: 100%;
		margin: 1rem 0;
	}

	.pdf-loading,
	.pdf-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary, #f5f5f5);
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		color: var(--color-text-muted, #666);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border, #ddd);
		border-top-color: var(--color-link, #0066cc);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.gateway-status {
		font-size: 0.75rem;
		font-family: var(--font-mono, monospace);
		opacity: 0.7;
		margin-top: 0.5rem;
	}

	.pdf-error {
		background: var(--color-bg-error, #fff5f5);
		border-color: var(--color-error, #cc0000);
	}

	.error-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.error-message {
		color: var(--color-error, #cc0000);
		text-align: center;
		max-width: 80%;
	}

	.error-cid {
		font-family: var(--font-mono, monospace);
		font-size: 0.75rem;
		opacity: 0.7;
		margin-top: 0.5rem;
	}

	.pdf-error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: var(--color-link, #0066cc);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.pdf-error button:hover {
		opacity: 0.9;
	}

	iframe {
		display: block;
	}

	/* Gateway status caption */
	.gateway-caption {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.75rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border: 1px solid var(--color-border, #ddd);
		border-top: none;
		border-radius: 0 0 4px 4px;
		font-family: var(--font-mono, monospace);
		font-size: 0.7rem;
		color: var(--color-text-muted, #666);
		transition: all 0.3s ease;
	}

	.status-indicator {
		display: flex;
		align-items: center;
	}

	.status-indicator i {
		font-size: 0.75rem;
	}

	.gateway-url {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Connected state - green */
	.gateway-caption.status-connected {
		background: rgba(76, 175, 80, 0.1);
		border-color: #4caf50;
		color: #2e7d32;
	}

	.gateway-caption.status-connected .status-indicator i {
		color: #4caf50;
	}

	/* Cycling state - amber/orange */
	.gateway-caption.status-cycling {
		background: rgba(255, 152, 0, 0.1);
		border-color: #ff9800;
		color: #e65100;
	}

	.gateway-caption.status-cycling .status-indicator i {
		color: #ff9800;
	}

	/* Error state - red */
	.gateway-caption.status-error {
		background: rgba(244, 67, 54, 0.1);
		border-color: #f44336;
		color: #c62828;
	}

	.gateway-caption.status-error .status-indicator i {
		color: #f44336;
	}

	/* Dark mode adjustments */
	:global([data-theme='dark']) .gateway-caption.status-connected {
		background: rgba(76, 175, 80, 0.15);
		color: #81c784;
	}

	:global([data-theme='dark']) .gateway-caption.status-cycling {
		background: rgba(255, 152, 0, 0.15);
		color: #ffb74d;
	}

	:global([data-theme='dark']) .gateway-caption.status-error {
		background: rgba(244, 67, 54, 0.15);
		color: #ef9a9a;
	}
</style>
