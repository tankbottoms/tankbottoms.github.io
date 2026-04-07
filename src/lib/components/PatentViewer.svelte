<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		patentId: string;
	}

	let { patentId }: Props = $props();

	// Parse patent ID: "US7667123B2" or "US20080125080A1"
	const isGranted = $derived(patentId.includes('B'));
	const number = $derived(patentId.replace(/^US/, '').replace(/[AB]\d$/, ''));
	const typeLabel = $derived(isGranted ? 'Patent' : 'Patent Application');
	const googlePatentsUrl = $derived(`https://patents.google.com/patent/${patentId}/en`);
	const usptoUrl = $derived(
		isGranted
			? `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${number}`
			: `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${number}`
	);
	const googlePdfViewerUrl = $derived(
		`https://docs.google.com/gview?url=${encodeURIComponent(usptoUrl)}&embedded=true`
	);

	let iframeError = $state(false);
	let iframeLoaded = $state(false);

	function handleIframeLoad() {
		iframeLoaded = true;
	}

	function handleIframeError() {
		iframeError = true;
	}
</script>

<div class="patent-viewer">
	<div class="patent-viewer-header">
		<div class="patent-viewer-title">
			<i class="fat fa-file-certificate"></i>
			<span>{typeLabel}: {patentId}</span>
		</div>
		<div class="patent-viewer-links">
			<a href={googlePatentsUrl} target="_blank" rel="noopener" class="patent-link" title="View on Google Patents">
				<i class="fat fa-arrow-up-right-from-square"></i> Google Patents
			</a>
			<a href={usptoUrl} target="_blank" rel="noopener" class="patent-link" title="Download PDF from USPTO">
				<i class="fat fa-file-pdf"></i> USPTO PDF
			</a>
		</div>
	</div>
	<div class="patent-viewer-frame">
		{#if !iframeError}
			{#if !iframeLoaded}
				<div class="patent-viewer-loading">
					<i class="fat fa-spinner fa-spin"></i> Loading patent document...
				</div>
			{/if}
			<iframe
				src={googlePdfViewerUrl}
				title="{typeLabel} {patentId}"
				onload={handleIframeLoad}
				onerror={handleIframeError}
				class:hidden={!iframeLoaded}
			></iframe>
		{:else}
			<div class="patent-viewer-fallback">
				<i class="fat fa-file-pdf"></i>
				<p>Patent document could not be loaded inline.</p>
				<div class="fallback-links">
					<a href={googlePatentsUrl} target="_blank" rel="noopener" class="fallback-btn">
						View on Google Patents
					</a>
					<a href={usptoUrl} target="_blank" rel="noopener" class="fallback-btn">
						Download USPTO PDF
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.patent-viewer {
		margin: 2rem 0;
		border: 1px solid var(--color-border);
		border-radius: 5px;
		overflow: hidden;
		background: var(--color-bg-secondary);
	}

	.patent-viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg);
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.patent-viewer-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.patent-viewer-title i {
		color: #6a1b9a;
		font-size: 1rem;
	}

	.patent-viewer-links {
		display: flex;
		gap: 0.75rem;
	}

	.patent-link {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		transition: all 0.15s ease;
	}

	.patent-link:hover {
		color: var(--color-link);
		border-color: var(--color-link);
		background: color-mix(in srgb, var(--color-link) 8%, transparent);
	}

	.patent-viewer-frame {
		position: relative;
		width: 100%;
		height: 700px;
	}

	.patent-viewer-frame iframe {
		width: 100%;
		height: 100%;
		border: none;
	}

	.patent-viewer-frame iframe.hidden {
		opacity: 0;
	}

	.patent-viewer-loading {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.patent-viewer-fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.patent-viewer-fallback > i {
		font-size: 3rem;
		color: var(--color-text-muted);
		opacity: 0.4;
	}

	.patent-viewer-fallback p {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.fallback-links {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.fallback-btn {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		transition: all 0.15s ease;
	}

	.fallback-btn:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	@media (max-width: 640px) {
		.patent-viewer-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.patent-viewer-frame {
			height: 500px;
		}
	}
</style>
