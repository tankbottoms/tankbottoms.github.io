<script lang="ts">
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import AuthGate from '$lib/components/AuthGate.svelte';
	import { statistics } from '$lib/stores/statistics';
	import { dev, browser } from '$app/environment';
	import { base } from '$app/paths';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initIpfsIframeUpgrader } from '$lib/utils/ipfs-iframe-upgrader';
	import { initializePrefetch } from '$lib/utils/prefetch';
	import { env } from '$env/dynamic/public';

	// Disable AuthGate - password protection is disabled
	const skipAuth = true;

	let { children: pageChildren, data } = $props();
	let stats = $state($statistics);
	let currentPath = $derived($page.url.pathname);
	let cidCopied = $state(false);

	const FULL_CID = 'bafybeibzxgh5oisojsajju4xcnyrzixxggbne65vvrfl4tv6onuuvjkbxa';

	async function copyCidToClipboard(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(FULL_CID);
			cidCopied = true;
			setTimeout(() => { cidCopied = false; }, 2000);
		} catch (err) {
			console.error('Failed to copy CID:', err);
		}
	}

	// Subscribe to statistics changes
	statistics.subscribe((value) => {
		stats = value;
	});

	// Inject Vercel Analytics and Speed Insights
	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	// Initialize IPFS gateway checking, iframe upgrader, and prefetch on app load
	onMount(() => {
		if (browser) {
			// Small delay to ensure DOM is ready and first paint is complete
			setTimeout(() => {
				initIpfsIframeUpgrader();
				// Initialize background prefetching after first paint
				initializePrefetch();
			}, 100);
		}
	});
</script>

<svelte:head>
	<script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.2/dist/svg.min.js"></script>
	<link rel="stylesheet" href="{base}/fontawesome/css/all.min.css" />
</svelte:head>

{#snippet pageContent()}
	<div class="container">
		<header class="header-wrapper">
			<div class="header">
				<div class="title-block">
					<a class="title" href="{base}/">
						<img src="{base}/images/mrwhiskers-me.svg" alt="" class="title-logo" />
						<span class="title-text">
							<span class="title-default">Mr. Whiskers Blog</span>
							<span class="title-hover">A Feline Perspective</span>
						</span>
					</a>
					<span class="title-subtitle">
						Documenting feline observations since 2018
					</span>
				</div>
				<nav class="nav">
					<a href="{base}/" class:active={currentPath === '/'}>Home</a>
					<a href="{base}/research" class:active={currentPath === '/research' || currentPath.startsWith('/research/')}>Research</a>
					<a href="{base}/about" class:active={currentPath === '/about'}>About</a>
					<a href="{base}/search" class="search-icon" aria-label="Search">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<path d="m21 21-4.35-4.35"></path>
						</svg>
					</a>
					<ThemeToggle />
				</nav>
			</div>
		</header>

		<main class="content">
			{@render pageChildren()}
		</main>

		<footer class="footer-wrapper">
			<div class="footer">
				<div class="footer-content">
					<span class="footer-title">
						<span class="footer-title-default">Mr. Whiskers Blog</span>
						<span class="footer-title-hover">Purr-fect Observations</span>
					</span>
					<span class="footer-separator">*</span>
					<span class="footer-views">
						<i class="fa-solid fa-eye"></i>
						{stats.totalViews.toLocaleString()} views
					</span>
					<span class="footer-separator">*</span>
					<span class="footer-cid-wrapper">
						<a
							href="https://ipfs.io/ipfs/{FULL_CID}"
							target="_blank"
							rel="noopener"
							class="footer-cid"
							title={FULL_CID}
						>
							<span class="cid-start">{FULL_CID.slice(0, 20)}</span>
							<span class="cid-ellipsis">...</span>
							<span class="cid-end">{FULL_CID.slice(-12)}</span>
							<span class="cid-full">{FULL_CID}</span>
						</a>
						<button
							class="cid-copy-btn"
							onclick={copyCidToClipboard}
							title={cidCopied ? 'Copied!' : 'Copy CID to clipboard'}
							aria-label="Copy CID to clipboard"
						>
							<i class="fat {cidCopied ? 'fa-check' : 'fa-copy'}"></i>
						</button>
					</span>
				</div>
			</div>
		</footer>
	</div>
	<CookieConsent />
{/snippet}

{#if skipAuth}
	{@render pageContent()}
{:else}
	<AuthGate>
		{#snippet children()}
			{@render pageContent()}
		{/snippet}
	</AuthGate>
{/if}

<style>
	.container {
		min-height: 100vh;
		padding: 3rem 0.5in 1rem 0.5in;
		background-color: var(--color-bg);
	}

	.header-wrapper,
	.footer-wrapper {
		max-width: 750px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 3rem;
		padding-bottom: 1rem;
	}

	@media (min-width: 768px) {
		.header {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}

	.title-block {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.title {
		font-size: 1.5rem;
		font-family: var(--font-serif);
		color: var(--color-text);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.title:hover {
		text-decoration: none;
	}

	.title-text {
		position: relative;
	}

	.title-default {
		display: inline;
	}

	.title-hover {
		display: none;
	}

	.title:hover .title-default {
		display: none;
	}

	.title:hover .title-hover {
		display: inline;
	}

	.title-subtitle {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		margin-top: 0.15rem;
	}

	.title-logo {
		width: 56px;
		height: 56px;
		animation: spin 4s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.title:hover .title-logo {
		animation-duration: 1s;
	}

	.nav {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-top: 0.25rem;
	}

	.nav a {
		text-decoration: none;
		text-underline-offset: 8px;
		color: var(--color-text);
		transition: text-decoration 0.2s;
	}

	.nav a:hover {
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	.nav a.active {
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	.search-icon {
		display: flex;
		align-items: center;
		text-decoration: none !important;
		padding: 0.25rem;
		transition: opacity 0.2s;
	}

	.search-icon:hover {
		opacity: 0.7;
	}

	.search-icon svg {
		stroke: var(--color-text);
	}

	.content {
		min-height: 60vh;
	}

	.footer {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border-dark);
	}

	.footer-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.footer-title {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		color: var(--color-text);
		cursor: default;
	}

	.footer-title-default {
		display: inline;
	}

	.footer-title-hover {
		display: none;
	}

	.footer-title:hover .footer-title-default {
		display: none;
	}

	.footer-title:hover .footer-title-hover {
		display: inline;
	}

	.footer-separator {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.footer-views {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.footer-views i {
		font-size: 0.875rem;
	}

	.footer-cid-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		flex: 1;
		min-width: 0;
		justify-content: flex-end;
	}

	.footer-cid {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		text-decoration: none;
		display: inline-flex;
		min-width: 0;
	}

	.footer-cid:hover {
		color: var(--color-link);
		text-decoration: underline;
	}

	/* CID truncation - show start...end by default */
	.cid-start,
	.cid-ellipsis,
	.cid-end {
		display: inline;
	}

	.cid-full {
		display: none;
	}

	/* On wider screens, show full CID */
	@media (min-width: 900px) {
		.cid-start,
		.cid-ellipsis,
		.cid-end {
			display: none;
		}

		.cid-full {
			display: inline;
		}
	}

	/* On very narrow screens, show even shorter truncation */
	@media (max-width: 480px) {
		.cid-start {
			display: none;
		}

		.cid-ellipsis::before {
			content: 'bafybei';
		}
	}

	.cid-copy-btn {
		background: none;
		border: none;
		padding: 0.15rem 0.25rem;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 0.7rem;
		opacity: 0.6;
		transition: opacity 0.2s, color 0.2s;
		line-height: 1;
	}

	.cid-copy-btn:hover {
		opacity: 1;
		color: var(--color-link);
	}

	.cid-copy-btn i.fa-check {
		color: #4caf50;
	}

	/* Mobile responsive layout - optimized for readability and visual balance */
	@media (max-width: 768px) {
		.container {
			/* Optimal mobile padding: 1rem vertical, 2em horizontal provides
			   balanced whitespace that keeps content readable without
			   wasting screen real estate on narrow viewports */
			padding: 1rem 2em;
		}

		.header {
			margin-bottom: 1.5rem;
		}

		.nav {
			flex-wrap: wrap;
		}

		/* Shorten CID display on mobile for cleaner footer */
		.cid-start {
			display: none;
		}

		.cid-end {
			display: none;
		}

		.cid-ellipsis::before {
			content: 'bafybei';
		}

		.cid-ellipsis::after {
			content: '';
		}
	}
</style>
