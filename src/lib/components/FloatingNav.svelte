<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { userSettings, type ReferrerInfo } from '$lib/stores/userSettings';

	let isVisible = $state(false);
	let isHovered = $state(false);
	let isScrolling = $state(false);
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
	let referrerInfo = $state<ReferrerInfo | null>(null);
	let backLabel = $state('Back to timeline');

	function handleScroll() {
		// Show when scrolled past 150px (approximately past the header)
		isVisible = window.scrollY > 150;

		// Trigger spinning while scrolling
		isScrolling = true;

		// Clear existing timeout
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
		}

		// Stop spinning 300ms after scroll stops
		scrollTimeout = setTimeout(() => {
			isScrolling = false;
		}, 300);
	}

	function getBackLabel(path: string): string {
		if (path.startsWith('/search')) return 'Back to search results';
		if (path.startsWith('/research')) return 'Back to research';
		if (path.startsWith('/about')) return 'Back to about';
		return 'Back to timeline';
	}

	async function navigateBack() {
		const ref = referrerInfo;
		// Clear the referrer after using it
		userSettings.clearReferrer();

		const storedPath = ref?.path || '/';
		// Prepend base for IPFS compatibility
		const destination = base + storedPath;
		const scrollPos = ref?.scrollPosition || 0;

		// Navigate first
		await goto(destination);

		// Then restore scroll position after a brief delay for content to render
		if (scrollPos > 0) {
			setTimeout(() => {
				window.scrollTo({ top: scrollPos, behavior: 'instant' });
			}, 50);
		}
	}

	// Subscribe to referrer changes reactively
	userSettings.subscribe((settings) => {
		referrerInfo = settings.referrer;
		if (referrerInfo) {
			backLabel = getBackLabel(referrerInfo.path);
		} else {
			backLabel = 'Back to timeline';
		}
	});

	onMount(() => {
		if (browser) {
			window.addEventListener('scroll', handleScroll, { passive: true });
			handleScroll(); // Check initial state
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
		}
	});
</script>

{#if isVisible}
	<button
		class="floating-nav"
		onclick={navigateBack}
		onmouseenter={() => isHovered = true}
		onmouseleave={() => isHovered = false}
		aria-label={backLabel}
		title={backLabel}
	>
		<img
			src="{base}/images/mrwhiskers-me.svg"
			alt="Back to timeline"
			class="nav-icon"
			class:spinning={isHovered || isScrolling}
		/>
	</button>
{/if}

<style>
	.floating-nav {
		position: fixed;
		bottom: 32px;
		left: 32px;
		z-index: 1000;
		width: 64px;
		height: 64px;
		padding: 0 !important;
		margin: 0 !important;
		border: none !important;
		border-radius: 0 !important;
		background: none !important;
		background-color: transparent !important;
		box-shadow: none !important;
		outline: none !important;
		cursor: pointer;
		transition: transform 0.2s ease-out;
		animation: fade-in 0.3s ease-out;
		-webkit-appearance: none;
		appearance: none;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.floating-nav:hover {
		transform: scale(1.1);
		background: none !important;
		border: none !important;
		box-shadow: none !important;
	}

	.floating-nav:focus {
		outline: none !important;
		border: none !important;
		box-shadow: none !important;
	}

	.floating-nav:active {
		outline: none !important;
		border: none !important;
		box-shadow: none !important;
		background: none !important;
	}

	.nav-icon {
		width: 64px;
		height: 64px;
		display: block;
		border: none !important;
		border-radius: 0 !important;
		background: none !important;
		box-shadow: none !important;
	}

	.nav-icon.spinning {
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile: 10px right adjustment, same gap from bottom as left */
	@media (max-width: 768px) {
		.floating-nav {
			bottom: 32px;
			left: 42px;
			width: 64px;
			height: 64px;
		}

		.nav-icon {
			width: 64px;
			height: 64px;
		}
	}

	/* Small mobile */
	@media (max-width: 480px) {
		.floating-nav {
			bottom: 24px;
			left: 34px;
		}
	}
</style>
