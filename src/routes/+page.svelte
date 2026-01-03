<script lang="ts">
	import { statistics } from '$lib/stores/statistics';
	import { userSettings } from '$lib/stores/userSettings';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import NapRating from '$lib/components/NapRating.svelte';
	import NapFilter from '$lib/components/NapFilter.svelte';
	import WhiskersLoader from '$lib/components/WhiskersLoader.svelte';
	import { createVisibilityPrefetcher, queueTimelineEntryPrefetch } from '$lib/utils/prefetch';

	let { data } = $props();
	let prefetchObserver: IntersectionObserver | null = $state(null);
	let stats = $state($statistics);
	let napFilter = $state<number | null>($userSettings.severityFilter);
	let scrollDebounceTimer: ReturnType<typeof setTimeout>;
	let isLoading = $state(true);
	let activeYearElement = $state<HTMLElement | null>(null);
	let activeMonthElement = $state<HTMLElement | null>(null);

	// Research category data
	type ResearchCategory = {
		id: string;
		name: string;
		shortName: string;
		description: string;
		color: string;
	};

	let categories = $state<ResearchCategory[]>([]);

	async function loadCategories() {
		try {
			const response = await fetch(`${base}/json/research-categories.json`);
			const data = await response.json();
			categories = data.categories || [];
		} catch (error) {
			console.debug('Failed to load categories:', error);
		} finally {
			isLoading = false;
		}
	}

	// Subscribe to statistics changes
	statistics.subscribe((value) => {
		stats = value;
	});

	// Load saved settings on mount
	onMount(() => {
		statistics.incrementViews();
		loadCategories();

		// Load saved nap filter
		const unsubscribe = userSettings.subscribe((settings) => {
			napFilter = settings.severityFilter;
		});

		// Restore scroll position after a brief delay to ensure content is rendered
		if (browser) {
			setTimeout(() => {
				const savedPosition = userSettings.getScrollPosition('/');
				if (savedPosition > 0) {
					window.scrollTo({ top: savedPosition, behavior: 'instant' });
				}
			}, 50);

			// Set up scroll listener
			window.addEventListener('scroll', handleScroll, { passive: true });

			// Set up visibility-based prefetching (2x scroll depth ahead)
			setTimeout(() => {
				prefetchObserver = createVisibilityPrefetcher(2);
				if (prefetchObserver) {
					// Observe all timeline items
					document.querySelectorAll('[data-prefetch-path]').forEach((el) => {
						prefetchObserver?.observe(el);
					});
				}

				// Immediately queue first viewport of entries for prefetch
				const firstBatch = data.posts.slice(0, 10).map((p: any) => p.path);
				queueTimelineEntryPrefetch(firstBatch);
			}, 500);
		}

		return () => {
			unsubscribe();
			if (browser) {
				window.removeEventListener('scroll', handleScroll);
				prefetchObserver?.disconnect();
			}
		};
	});

	// Category colors for marker animation
	const markerColors = [
		'#9c27b0', // purple (naps)
		'#ff9800', // orange (toys)
		'#f44336', // red (things to knock over)
		'#607d8b', // blue-grey (mondays)
		'#ff5722', // deep orange (lasagna)
		'#e91e63', // pink (owner appreciation)
		'#795548'  // brown (pet peeves)
	];

	let isScrolling = $state(false);
	let scrollStopTimer: ReturnType<typeof setTimeout>;

	// Debounced scroll handler to save position and update active markers
	function handleScroll() {
		if (scrollDebounceTimer) {
			clearTimeout(scrollDebounceTimer);
		}
		scrollDebounceTimer = setTimeout(() => {
			userSettings.setScrollPosition('/', window.scrollY);
		}, 150);

		// Set scrolling state for color animation
		isScrolling = true;
		document.body.classList.add('page-scrolling');

		// Clear existing stop timer
		if (scrollStopTimer) {
			clearTimeout(scrollStopTimer);
		}

		// Stop scrolling state after scroll ends
		scrollStopTimer = setTimeout(() => {
			isScrolling = false;
			document.body.classList.remove('page-scrolling');
		}, 200);

		// Update active year/month markers based on scroll position
		updateActiveMarkers();
	}

	function updateActiveMarkers() {
		if (!browser) return;

		const yearMarkers = document.querySelectorAll('.year-marker');
		const monthMarkers = document.querySelectorAll('.month-marker');

		// Find the year marker that's currently at the sticky position
		let newActiveYear: HTMLElement | null = null;
		yearMarkers.forEach((marker) => {
			const rect = marker.getBoundingClientRect();
			// Check if the marker is near the top (sticky position)
			if (rect.top <= 20 && rect.top >= -rect.height) {
				newActiveYear = marker as HTMLElement;
			}
		});

		// Find the month marker that's currently at the sticky position
		let newActiveMonth: HTMLElement | null = null;
		monthMarkers.forEach((marker) => {
			const rect = marker.getBoundingClientRect();
			// Check if the marker is near its sticky position (around 3.5rem = 56px)
			if (rect.top <= 70 && rect.top >= -rect.height) {
				newActiveMonth = marker as HTMLElement;
			}
		});

		// Update active states
		if (newActiveYear !== activeYearElement) {
			if (activeYearElement) {
				(activeYearElement as HTMLElement).classList.remove('sticky-active');
			}
			if (newActiveYear) {
				(newActiveYear as HTMLElement).classList.add('sticky-active');
			}
			activeYearElement = newActiveYear;
		}

		if (newActiveMonth !== activeMonthElement) {
			if (activeMonthElement) {
				(activeMonthElement as HTMLElement).classList.remove('sticky-active');
			}
			if (newActiveMonth) {
				(newActiveMonth as HTMLElement).classList.add('sticky-active');
			}
			activeMonthElement = newActiveMonth;
		}
	}

	// Special value -1 indicates "featured only" filter
	const FEATURED_FILTER = -1;

	// Filter posts based on nap-worthiness level or featured flag
	const filteredPosts = $derived(
		napFilter === null
			? data.posts
			: napFilter === FEATURED_FILTER
				? data.posts.filter((post: any) => post.metadata.featured === true)
				: data.posts.filter((post: any) => {
						const napScore = post.metadata.napScore;
						const minNapScore = napFilter as number;
						return napScore !== undefined && napScore >= minNapScore;
					})
	);

	// Group posts by year and month
	interface PostWithIndex {
		post: any;
		globalIndex: number;
	}

	interface GroupedPosts {
		year: number;
		months: {
			month: string;
			monthNum: number;
			posts: PostWithIndex[];
		}[];
	}

	const groupedPosts = $derived(() => {
		const groups: Map<number, Map<number, PostWithIndex[]>> = new Map();

		filteredPosts.forEach((post: any, globalIndex: number) => {
			if (!post.metadata.date) return;
			const date = new Date(post.metadata.date);
			const year = date.getFullYear();
			const month = date.getMonth();

			if (!groups.has(year)) {
				groups.set(year, new Map());
			}
			const yearGroup = groups.get(year)!;
			if (!yearGroup.has(month)) {
				yearGroup.set(month, []);
			}
			yearGroup.get(month)!.push({ post, globalIndex });
		});

		// Convert to array and sort by year descending, month descending
		const result: GroupedPosts[] = [];
		const sortedYears = Array.from(groups.keys()).sort((a, b) => b - a);

		for (const year of sortedYears) {
			const yearGroup = groups.get(year)!;
			const sortedMonths = Array.from(yearGroup.keys()).sort((a, b) => b - a);
			const months = sortedMonths.map(monthNum => ({
				month: new Date(year, monthNum).toLocaleDateString('en-US', { month: 'short' }),
				monthNum,
				posts: yearGroup.get(monthNum)!
			}));
			result.push({ year, months });
		}

		return result;
	});

	function handleFilterChange(level: number | null) {
		napFilter = level;
		userSettings.setSeverityFilter(level);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDay(dateString: string) {
		const date = new Date(dateString);
		return date.getDate().toString();
	}

	// Handle clicking on a timeline item - save referrer for back navigation
	function handlePostClick(path: string, event: MouseEvent) {
		event.preventDefault();
		// Save current URL and scroll position
		userSettings.setReferrer('/', window.scrollY);
		// Record the visit
		userSettings.recordVisit('/' + path);
		// Navigate to the post (use base for IPFS compatibility)
		goto(base + '/' + path);
	}

	// Get visit history for reactivity
	let visitHistory = $state<Record<string, { count: number; firstVisited: string; lastVisited: string }>>({});

	// Subscribe to settings changes to get visit history
	userSettings.subscribe((settings) => {
		visitHistory = settings.visitHistory;
	});

	// Format visit info for display
	function formatVisitInfo(path: string): string | null {
		const visit = visitHistory['/' + path];
		if (!visit || visit.count === 0) return null;

		// Validate the date
		const lastDate = new Date(visit.lastVisited);
		if (isNaN(lastDate.getTime())) return null;

		const formattedDate = lastDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
		const count = visit.count;

		if (count === 1) {
			return `last viewed ${formattedDate}`;
		}
		return `last viewed ${formattedDate}, ${count} times`;
	}
</script>

<svelte:head>
	<title>Mr. Whiskers Blog | A Feline Perspective</title>
	<meta name="description" content="Documenting feline observations, research, and adventures since 2018" />
</svelte:head>

<div class="page-wrapper">
	{#if isLoading}
		<div class="loader-container">
			<WhiskersLoader message="Loading timeline..." />
		</div>
	{:else}
	<div class="intro">
		<p>
			<strong>Mr. Whiskers Blog</strong> documents the profound observations, scientific research, and daily adventures of a distinguished feline scholar. Each entry presents carefully researched analysis of topics ranging from optimal napping positions to the physics of knocking objects off elevated surfaces.
		</p>
		<p class="intro-stats">
			This timeline comprises <strong>22 entries</strong> across <strong>8 research categories</strong>, documenting observations spanning January 2018 to December 2025. Topics include <strong>naps</strong>, <strong>toys</strong>, <strong>things to knock over</strong>, <strong>Mondays</strong>, <strong>lasagna</strong>, and more.
		</p>
		<p class="intro-rating">
			Each entry is rated by nap-worthiness - because the best content is the kind that makes you sleepy. The more whiskers, the more nap-inducing the topic. Click a whisker to filter by nap-worthiness.
		</p>
		<p class="intro-featured">
			The sixth whisker marks <strong>featured posts</strong> - comprehensive analyses denoted by the special timeline marker and border. These entries represent Mr. Whiskers' most important research findings.
		</p>
		<div class="filter-row">
			<span class="filter-label">Filter by nap-worthiness:</span>
			<NapFilter selectedLevel={napFilter} onFilterChange={handleFilterChange} />
		</div>
		{#if napFilter !== null}
			<p class="filter-status">
				{#if napFilter === FEATURED_FILTER}
					Showing {filteredPosts.length} featured entries
				{:else}
					Showing {filteredPosts.length} of {data.posts.length} entries with nap-worthiness {napFilter}+
				{/if}
			</p>
		{/if}
	</div>

	<div class="timeline-container">
	{#each groupedPosts() as yearGroup}
		<div class="year-section">
			<div class="year-marker">
				<span class="year-text">{yearGroup.year}</span>
			</div>
			<div class="year-content">
				{#each yearGroup.months as monthGroup}
					<div class="month-section">
						<div class="month-marker">
							<span class="month-text">{monthGroup.month}</span>
						</div>
						<div class="month-content">
							<div class="timeline">
								{#each monthGroup.posts as { post, globalIndex }}
									<div class="timeline-item-wrapper">
										<a href="{base}/{post.path}" class="timeline-item" class:featured={post.metadata.featured === true} onclick={(e) => handlePostClick(post.path, e)} data-prefetch-path={post.path}>
											<div class="timeline-content">
											<div class="timeline-header">
												<div class="timeline-dot"></div>
												<span class="timeline-day">{formatDay(post.metadata.date)}</span>
												<div class="timeline-title">{post.metadata.title || 'Untitled'}</div>
											</div>
											{#if post.metadata.blurb}
												{@const visitInfo = formatVisitInfo(post.path)}
												<p class="timeline-blurb">
													{post.metadata.blurb}{#if post.metadata.wordCount && post.metadata.readingTimeText}<span class="reading-stats"> * {post.metadata.wordCount.toLocaleString()} words * {post.metadata.readingTimeText}</span>{/if}{#if visitInfo}<span class="visit-info"> * {visitInfo}</span>{/if}
												</p>
											{/if}
											{#if post.metadata.napScore || post.metadata.research}
												<div class="timeline-meta">
													<div class="timeline-badges-left">
														{#if post.metadata.research && categories.length > 0}
															<div class="timeline-categories">
																{#each post.metadata.research as categoryId}
																	{@const category = categories.find(c => c.id === categoryId)}
																	{#if category}
																		<span
																			class="category-badge"
																			style="background-color: {category.color}20; border-color: {category.color}; color: {category.color};"
																			title="{category.name}: {category.description}">
																			{category.shortName}
																		</span>
																	{/if}
																{/each}
															</div>
														{/if}
													</div>
													{#if post.metadata.napScore}
														<div class="timeline-nap-rating">
															<NapRating rating={post.metadata.napScore} size="sm" />
														</div>
													{/if}
												</div>
											{/if}
											</div>
										</a>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
	{#if filteredPosts.length === 0}
		<div class="no-results">
			<p>No entries match the selected nap-worthiness filter.</p>
			<button onclick={() => handleFilterChange(null)}>Clear filter</button>
		</div>
	{/if}
</div>

<!-- Research Category Legend -->
{#if categories.length > 0}
	<div class="category-legend">
		<h4>Research Categories</h4>
		<div class="legend-items">
			{#each categories as category}
				<span
					class="legend-category"
					style="background-color: {category.color}20; border-color: {category.color}; color: {category.color};"
					title="{category.name}: {category.description}">
					{category.shortName}
				</span>
			{/each}
		</div>
	</div>
{/if}
{/if}
</div>

<style>
	.page-wrapper {
		max-width: 750px;
		margin: 0 auto;
	}

	.loader-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: calc(100vh - 200px);
	}

	.intro {
		margin-bottom: 2rem;
		padding: 1rem 0;
	}

	.intro p {
		margin: 0 0 1rem 0;
		line-height: 1.6;
		color: var(--color-text);
	}

	.intro p:last-of-type {
		margin-bottom: 0;
	}

	.intro-rating {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.intro-stats {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		padding: 0.75rem 1rem;
		margin-top: 0.5rem;
		line-height: 1.6;
	}

	.intro-stats strong {
		color: var(--color-text);
		font-family: var(--font-mono);
	}

	.intro-featured {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		border-left: 3px solid #9c27b0;
		padding-left: 0.75rem;
		margin-left: 0;
	}

	.filter-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
		padding: 0.75rem 0;
	}

	.filter-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	.filter-status {
		font-size: 0.75rem;
		color: var(--color-link);
		font-family: var(--font-mono, monospace);
		margin-top: 0.5rem !important;
		padding: 0.25rem 0.5rem;
		background: var(--color-bg-secondary);
		border-radius: 3px;
		display: inline-block;
	}

	.timeline-container {
		padding-bottom: 1rem;
	}

	/* Year section with sticky marker */
	.year-section {
		display: flex;
		position: relative;
		margin-bottom: 1rem;
	}

	.year-marker {
		position: sticky;
		top: 1rem;
		width: 70px;
		min-width: 70px;
		height: fit-content;
		padding-right: 1rem;
		z-index: 10;
	}

	.year-text {
		display: block;
		font-family: var(--font-mono);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text);
		opacity: 0.4;
		line-height: 1;
		transition: opacity 0.3s ease, color 0.3s ease;
	}

	:global(.year-marker.sticky-active) .year-text {
		opacity: 1;
		color: #9c27b0;
	}

	/* Color cycling animation during scroll */
	@keyframes marker-color-cycle {
		0% { color: #9c27b0; }
		14% { color: #ff9800; }
		28% { color: #f44336; }
		42% { color: #607d8b; }
		57% { color: #ff5722; }
		71% { color: #e91e63; }
		85% { color: #795548; }
		100% { color: #9c27b0; }
	}

	:global(.page-scrolling .year-marker.sticky-active) .year-text {
		animation: marker-color-cycle 1.5s linear infinite;
	}

	.year-content {
		flex: 1;
		min-width: 0;
	}

	/* Month section with sticky marker */
	.month-section {
		display: flex;
		position: relative;
		margin-bottom: 0.5rem;
	}

	.month-marker {
		position: sticky;
		top: 3.5rem;
		width: 45px;
		min-width: 45px;
		height: fit-content;
		padding-right: 0.75rem;
		z-index: 5;
	}

	.month-text {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: color 0.3s ease;
	}

	:global(.month-marker.sticky-active) .month-text {
		color: #9c27b0;
	}

	:global(.page-scrolling .month-marker.sticky-active) .month-text {
		animation: marker-color-cycle 1.2s linear infinite;
		animation-delay: 0.3s;
	}

	.month-content {
		flex: 1;
		min-width: 0;
	}

	.timeline {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-left: 1px solid var(--color-timeline);
		padding: 0.5rem 0;
		margin-left: 0;
	}

	.timeline::before {
		content: '';
		position: absolute;
		left: -1px;
		top: 0;
		width: 1px;
		height: 0.75rem;
		background: linear-gradient(to top, var(--color-timeline), transparent);
	}

	.timeline::after {
		content: '';
		position: absolute;
		left: -1px;
		bottom: 0;
		width: 1px;
		height: 0.75rem;
		background: linear-gradient(to bottom, var(--color-timeline), transparent);
	}

	/* Wrapper for timeline item */
	.timeline-item-wrapper {
		position: relative;
		margin-left: 1rem;
	}

	.timeline-item {
		display: block;
		text-decoration: none;
		color: inherit;
		padding: 0.5rem 0.75rem;
		transition: all 0.15s ease;
		cursor: pointer;
		isolation: isolate;
		position: relative;
	}

	.timeline-item:hover {
		background-color: var(--color-hover-bg);
	}

	/* Depressed click animation */
	.timeline-item:active {
		transform: translateY(1px);
	}

	.timeline-item.featured:active {
		transform: scale(1.01) translateY(1px);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.timeline-item.featured {
		background: var(--color-featured-bg);
		border: 1px solid var(--color-featured-border);
		box-shadow: 3px 3px 0px var(--color-shadow);
		padding: 0.75rem;
		transform: scale(1.02);
		transform-origin: left center;
		position: relative;
	}

	.timeline-item.featured::before {
		content: '';
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 20px;
		height: 20px;
		background: url('/images/mrwhiskers-cat.svg') no-repeat center center;
		background-size: contain;
		opacity: 0.6;
	}

	.timeline-item.featured:hover {
		box-shadow: 6px 6px 0px var(--color-shadow);
		background: var(--color-featured-bg);
		transform: scale(1.04);
	}

	.timeline-item.featured:hover::before {
		opacity: 1;
		animation: wiggle 0.5s ease-in-out;
	}

	@keyframes wiggle {
		0%, 100% { transform: rotate(0deg); }
		25% { transform: rotate(-10deg); }
		75% { transform: rotate(10deg); }
	}

	.timeline-item.featured .timeline-dot {
		background-color: var(--color-text);
	}

	.timeline-content {
		position: relative;
	}

	.timeline-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		position: relative;
		flex-wrap: wrap;
	}

	.timeline-dot {
		position: absolute;
		left: calc(-1rem - 0.75rem - 3px);
		top: 4px;
		width: 6px;
		height: 6px;
		background-color: var(--color-border-dark);
		border-radius: 1px;
		outline: 2px solid var(--color-bg);
	}

	.timeline-day {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-muted);
		min-width: 1.25rem;
		opacity: 0.7;
	}

	.timeline-title {
		font-weight: 600;
		font-size: 0.8rem;
		flex: 1;
		min-width: 0;
		color: var(--color-text);
	}

	.timeline-blurb {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin: 0.35rem 0 0 0;
		line-height: 1.5;
	}

	.timeline-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.35rem;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.timeline-badges-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.reading-stats {
		color: var(--color-text-muted);
		opacity: 0.7;
		font-size: 0.7rem;
		white-space: nowrap;
	}

	.visit-info {
		color: #4caf50;
		font-size: 0.65rem;
		font-family: var(--font-mono);
		opacity: 0.9;
	}

	.timeline-nap-rating {
		flex-shrink: 0;
	}

	.timeline-categories {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.category-badge {
		font-size: 0.6rem;
		padding: 0.15rem 0.4rem;
		border: 1px solid;
		border-radius: 3px;
		font-family: var(--font-mono);
		white-space: nowrap;
		cursor: help;
		transition: all 0.2s;
	}

	.category-badge:hover {
		transform: translateY(-1px);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	/* Research Category Legend */
	.category-legend {
		margin: 2rem 0 1rem 115px;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
	}

	.category-legend h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: var(--color-text);
		font-weight: 600;
	}

	.legend-items {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.legend-category {
		font-size: 0.7rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid;
		border-radius: 3px;
		font-family: var(--font-mono);
		white-space: nowrap;
		cursor: help;
		transition: all 0.2s;
	}

	.legend-category:hover {
		transform: translateY(-1px);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.no-results {
		margin-left: 115px;
		padding: 2rem 1rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.no-results p {
		margin: 0 0 1rem 0;
		font-size: 0.85rem;
	}

	.no-results button {
		font-family: var(--font-mono, monospace);
		font-size: 0.75rem;
		padding: 0.4rem 0.8rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		cursor: pointer;
		color: var(--color-text);
		transition: background 0.2s ease;
	}

	.no-results button:hover {
		background: var(--color-hover-bg);
	}

	@media (max-width: 640px) {
		.page-wrapper {
			max-width: 100%;
		}

		.year-marker {
			width: 50px;
			min-width: 50px;
			padding-right: 0.5rem;
		}

		.year-text {
			font-size: 0.9rem;
		}

		.month-marker {
			width: 35px;
			min-width: 35px;
			padding-right: 0.5rem;
		}

		.month-text {
			font-size: 0.6rem;
		}

		.timeline-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.15rem;
		}

		.timeline-day {
			display: none;
		}

		.timeline-meta {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
		}

		.timeline-badges-left {
			flex: 1;
			min-width: 0;
		}

		.timeline-nap-rating {
			flex-shrink: 0;
			margin-left: auto;
		}

		.filter-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.no-results {
			margin-left: 85px;
		}

		.category-legend {
			margin-left: 85px;
		}
	}
</style>
