<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import FloatingWhiskersNav from '$lib/components/FloatingWhiskersNav.svelte';
	import { downloadPdf, downloadWord, downloadMd } from '$lib/utils/download';
	import { initDiagramModal } from '$lib/utils/diagramModal';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { statistics } from '$lib/stores/statistics';
	import { userSettings, type ReferrerInfo } from '$lib/stores/userSettings';
	import { onMount } from 'svelte';

	let { data } = $props();
	let stats = $state($statistics);
	let postSlug = $state('');
	// DOM reference - not reactive state, just a reference for PDF generation
	let contentRef: HTMLDivElement | undefined = $state(undefined);

	// Referrer tracking for back navigation
	let referrerInfo = $state<ReferrerInfo | null>(null);
	let backLabel = $state('Back to all posts');
	let backHref = $state(`${base}/`);

	// Subscribe to referrer changes
	userSettings.subscribe((settings) => {
		referrerInfo = settings.referrer;
		if (referrerInfo) {
			if (referrerInfo.path.startsWith('/search')) {
				backLabel = 'Back to search results';
			} else if (referrerInfo.path.startsWith('/research')) {
				backLabel = 'Back to research';
			} else {
				backLabel = 'Back to timeline';
			}
			backHref = base + referrerInfo.path;
		} else {
			backLabel = 'Back to all posts';
			backHref = `${base}/`;
		}
	});

	// Handle back navigation with scroll position restore
	async function handleBackClick(e: MouseEvent) {
		e.preventDefault();
		const ref = referrerInfo;
		userSettings.clearReferrer();

		const destination = ref?.path ? base + ref.path : `${base}/`;
		const scrollPos = ref?.scrollPosition || 0;

		await goto(destination);

		if (scrollPos > 0) {
			setTimeout(() => {
				window.scrollTo({ top: scrollPos, behavior: 'instant' });
			}, 50);
		}
	}

	// Research category data
	type ResearchCategory = {
		id: string;
		name: string;
		shortName: string;
		description: string;
		color: string;
	};

	let categories = $state<ResearchCategory[]>([]);

	async function loadCategoryData() {
		try {
			const response = await fetch(`${base}/json/research-categories.json`);
			const categoryData = await response.json();
			categories = categoryData.categories || [];
		} catch (error) {
			console.debug('Failed to load category data:', error);
		}
	}

	// Subscribe to statistics changes
	statistics.subscribe((value) => {
		stats = value;
	});

	// Extract slug from URL and initialize diagram modal
	onMount(() => {
		const path = window.location.pathname;
		postSlug = path.split('/').filter(Boolean).pop() || '';

		// Load category data for badges
		loadCategoryData();

		// Initialize expandable diagram modal after content loads
		const cleanup = initDiagramModal();
		return cleanup;
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function handleThumbsUp() {
		if (postSlug) {
			statistics.thumbsUp(postSlug);
		}
	}

	function handleThumbsDown() {
		if (postSlug) {
			statistics.thumbsDown(postSlug);
		}
	}

	async function handlePdf() {
		if (contentRef) {
			await downloadPdf(data.metadata.title || 'Blog Post', contentRef.innerHTML);
		}
	}

	async function handleWord() {
		const slug = $page.params.slug;
		await downloadWord(`posts/${slug}.md`);
	}

	async function handleMarkdown() {
		const slug = $page.params.slug;
		await downloadMd(`posts/${slug}.md`);
	}

	// Get current post stats
	let postStats = $derived(() => {
		return stats.posts[postSlug] || { thumbsUp: 0, thumbsDown: 0 };
	});

	// Helper functions for badges
	function getCategoryById(categoryId: string) {
		return categories.find(c => c.id === categoryId);
	}

	// Tag color mapping based on categories
	function getTagColor(tag: string): string {
		const tagLower = tag.toLowerCase();
		// Sleep related
		if (tagLower.includes('nap') || tagLower.includes('sleep') || tagLower.includes('rest')) {
			return '#9c27b0'; // Purple
		}
		// Play/Toys related
		if (tagLower.includes('toy') || tagLower.includes('play') || tagLower.includes('chase')) {
			return '#ff9800'; // Orange
		}
		// Food related
		if (tagLower.includes('food') || tagLower.includes('lasagna') || tagLower.includes('treat')) {
			return '#ef5350'; // Red
		}
		// Chaos/Destruction
		if (tagLower.includes('chaos') || tagLower.includes('knock') || tagLower.includes('destroy')) {
			return '#f44336'; // Deep Red
		}
		// Comfort/Warmth
		if (tagLower.includes('warm') || tagLower.includes('sun') || tagLower.includes('cozy')) {
			return '#ffeb3b'; // Yellow
		}
		// Default
		return '#66bb6a'; // Green
	}
</script>

<svelte:head>
	<title>{data.metadata.title || 'Blog Post'} | Mr. Whiskers Blog</title>
	{#if data.metadata.blurb}
		<meta name="description" content={data.metadata.blurb} />
	{/if}
</svelte:head>

<FloatingWhiskersNav />

<article class="post">
	<nav class="post-nav-top">
		<a href={backHref} class="back-link" onclick={handleBackClick}>&larr; {backLabel}</a>
	</nav>

	{#key $page.params.slug}
		{#if data.metadata.title}
			<h1 class="post-title">{data.metadata.title}</h1>
		{/if}

	<div class="post-meta">
		<div class="post-meta-left">
			{#if data.metadata.date}
				<span class="post-date">Published: {formatDate(data.metadata.date)}</span>
			{/if}
			{#if data.metadata.author}
				<span class="post-author">* By {data.metadata.author}</span>
			{/if}
			{#if data.metadata.wordCount && data.metadata.readingTimeText}
				<span class="post-stats"
					>* {data.metadata.wordCount.toLocaleString()} words * {data.metadata
						.readingTimeText}</span
				>
			{/if}
		</div>
		<div class="post-reactions">
			<span class="thumbs-count">{postStats().thumbsUp}</span>
			<button
				type="button"
				class="reaction-btn"
				class:active={postStats().hasVoted === 'up'}
				onclick={handleThumbsUp}
				aria-label="Thumbs up"
			>
				<i class="fat fa-thumbs-up"></i>
			</button>
			<button
				type="button"
				class="reaction-btn"
				class:active={postStats().hasVoted === 'down'}
				onclick={handleThumbsDown}
				aria-label="Thumbs down"
			>
				<i class="fat fa-thumbs-down"></i>
			</button>
		</div>
	</div>

	<!-- Metadata Badges -->
	{#if data.metadata.research || data.metadata.tags}
		<div class="post-badges">
			{#if data.metadata.research && data.metadata.research.length > 0 && categories.length > 0}
				<div class="badge-section">
					<span class="badge-label">Research:</span>
					<div class="badge-group">
						{#each data.metadata.research as categoryId}
							{@const category = getCategoryById(categoryId)}
							{#if category}
								<a
									href="{base}/search?q={encodeURIComponent(category.shortName)}"
									class="category-badge"
									style="background-color: {category.color}20; border-color: {category.color}; color: {category.color};"
									title="Search for {category.name}">
									{category.shortName}
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			{#if data.metadata.tags && data.metadata.tags.length > 0}
				<div class="badge-section">
					<span class="badge-label">Tags:</span>
					<div class="badge-group">
						{#each data.metadata.tags as tag}
							{@const tagColor = getTagColor(tag)}
							<a
								href="{base}/search?q={encodeURIComponent(tag)}"
								class="tag-badge"
								style="background-color: {tagColor}20; border-color: {tagColor}; color: {tagColor};"
								title="Search for '{tag}'">
								{tag}
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<div class="post-content prose" bind:this={contentRef}>
		{@render data.component()}
	</div>
	{/key}

	<div class="post-actions-bottom">
		<button onclick={handlePdf} aria-label="Download PDF" title="Download PDF">
			<Icon name="file-pdf-thin" />
		</button>
		<button onclick={handleWord} aria-label="Download Word" title="Download Word">
			<Icon name="file-word-light" />
		</button>
		<button onclick={handleMarkdown} aria-label="Download Markdown" title="Download Markdown">
			<Icon name="markdown" />
		</button>
	</div>

	<nav class="post-nav">
		<a href={backHref} class="back-link" onclick={handleBackClick}>&larr; {backLabel}</a>
	</nav>
</article>

<style>
	.post {
		padding: 2rem 0;
		padding-top: 40px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.post-nav-top {
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.post-title {
		font-family: var(--font-serif);
		font-size: 2.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		line-height: 1.2;
		color: var(--color-text);
	}

	@media (max-width: 768px) {
		.post {
			max-width: 100%;
			width: 100%;
			padding: 1rem 0;
		}
	}

	@media (max-width: 640px) {
		.post {
			padding: 1rem 0;
		}
	}

	.post-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
	}

	.post-meta-left {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.post-date,
	.post-author,
	.post-stats {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.post-reactions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.thumbs-count {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		font-weight: 600;
		min-width: 2rem;
		text-align: right;
	}

	.reaction-btn {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
	}

	.reaction-btn:hover {
		background: var(--color-hover-bg);
		border-color: var(--color-text);
		color: var(--color-text);
		transform: translateY(-2px);
	}

	.reaction-btn.active {
		background: var(--color-featured-bg);
		border-color: var(--color-featured-border);
		color: var(--color-text);
	}

	.reaction-btn:active {
		transform: translateY(0);
	}

	.post-content {
		margin-bottom: 3rem;
		max-width: none;
		font-size: 14px;
	}

	.post-content :global(img),
	.post-content :global(svg) {
		max-width: 100%;
		height: auto;
	}

	.post-content :global(p) {
		margin: 1rem 0;
		font-size: 14px;
	}

	.post-content :global(h2) {
		margin-top: 2.5rem;
		margin-bottom: 1rem;
	}

	.post-content :global(h3) {
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	.post-actions-bottom {
		display: flex;
		justify-content: flex-end;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-top: 2rem;
	}

	.post-actions-bottom button {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		color: var(--color-text-muted);
		font-size: 1.5rem;
		transition: color 0.2s;
		display: flex;
		align-items: center;
	}

	.post-actions-bottom button:hover {
		color: #3b82f6;
	}

	.post-nav {
		padding-top: 2rem;
		border-top: none;
	}

	.back-link {
		color: var(--color-link);
		text-decoration: underline;
		text-decoration-skip-ink: auto;
	}

	.back-link:hover {
		text-decoration-thickness: 2px;
	}

	@media (max-width: 640px) {
		.post-title {
			font-size: 2rem;
		}
	}

	/* Post Badges */
	.post-badges {
		margin-bottom: 2rem;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
	}

	.badge-section {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.badge-section:last-child {
		margin-bottom: 0;
	}

	.badge-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		font-family: var(--font-mono);
		flex-shrink: 0;
		padding-top: 0.2rem;
		min-width: 80px;
	}

	.badge-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.category-badge,
	.tag-badge {
		font-size: 0.7rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid;
		border-radius: 3px;
		font-family: var(--font-mono);
		white-space: nowrap;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.category-badge:hover,
	.tag-badge:hover {
		transform: translateY(-1px);
		box-shadow: 2px 2px 0px var(--color-shadow);
		text-decoration: none;
	}

	@media (max-width: 640px) {
		.badge-section {
			flex-direction: column;
			gap: 0.5rem;
		}

		.badge-label {
			min-width: auto;
		}
	}
</style>
