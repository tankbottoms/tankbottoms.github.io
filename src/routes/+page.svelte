<script lang="ts">
	import { statistics } from '$lib/stores/statistics';
	import { userSettings } from '$lib/stores/userSettings';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import SignificanceRating from '$lib/components/SignificanceRating.svelte';
	import SignificanceFilter from '$lib/components/SignificanceFilter.svelte';
	import PortfolioLoader from '$lib/components/PortfolioLoader.svelte';
	import { createVisibilityPrefetcher, queueTimelineEntryPrefetch } from '$lib/utils/prefetch';

	let { data } = $props();
	let prefetchObserver: IntersectionObserver | null = $state(null);
	let stats = $state($statistics);
	let significanceFilter = $state<number | null>($userSettings.severityFilter);
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
		extendedDescription?: string;
		color: string;
		icon: string;
	};

	let categories = $state<ResearchCategory[]>([]);
	let selectedCategory = $state<string | null>(null);

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

	function selectCategory(id: string) {
		selectedCategory = selectedCategory === id ? null : id;
	}

	function clearCategoryFilter() {
		selectedCategory = null;
	}

	const selectedCategoryInfo = $derived(
		selectedCategory ? categories.find(c => c.id === selectedCategory) : null
	);

	// Stats for filtered posts
	const filteredStats = $derived(() => {
		const posts = filteredPosts;
		if (posts.length === 0) return { entries: 0, words: 0, chars: 0, earliest: '', latest: '' };

		let totalWords = 0;
		let totalChars = 0;
		let earliest = '';
		let latest = '';

		for (const post of posts) {
			totalWords += post.metadata.wordCount || 0;
			// Estimate chars from words (avg 5.5 chars/word + spaces)
			totalChars += (post.metadata.wordCount || 0) * 6;

			const d = post.metadata.date;
			if (d) {
				if (!earliest || d < earliest) earliest = d;
				if (!latest || d > latest) latest = d;
			}
		}

		return { entries: posts.length, words: totalWords, chars: totalChars, earliest, latest };
	});

	function formatDateRange(earliest: string, latest: string): string {
		if (!earliest || !latest) return '';
		const e = new Date(earliest);
		const l = new Date(latest);
		const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
		if (e.getTime() === l.getTime()) return fmt(e);
		return `${fmt(e)} to ${fmt(l)}`;
	}

	// Subscribe to statistics changes
	statistics.subscribe((value) => {
		stats = value;
	});

	// Load saved settings on mount
	onMount(() => {
		statistics.incrementViews();
		loadCategories();

		// Load saved significance filter
		const unsubscribe = userSettings.subscribe((settings) => {
			significanceFilter = settings.severityFilter;
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
		'#1565c0', // blue (embedded)
		'#6a1b9a', // purple (patents)
		'#e65100', // orange (retail)
		'#00838f', // teal (payments)
		'#7b1fa2', // violet (web3)
		'#2e7d32', // green (ai/llm)
		'#c62828', // red (legal)
		'#37474f'  // slate (crypto)
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

	// Filter posts based on significance level, featured flag, and category
	const filteredPosts = $derived(
		data.posts.filter((post: any) => {
			// Nap filter
			if (significanceFilter !== null) {
				if (significanceFilter === FEATURED_FILTER) {
					if (post.metadata.featured !== true) return false;
				} else {
					const significance = post.metadata.significance;
					if (significance === undefined || significance < (significanceFilter as number)) return false;
				}
			}

			// Category filter (single-select)
			if (selectedCategory) {
				if (!post.metadata.research || !post.metadata.research.includes(selectedCategory)) return false;
			}

			return true;
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
		significanceFilter = level;
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
	<title>atsignhandle.xyz | Development Portfolio</title>
	<meta name="description" content="Development portfolio documenting embedded systems, patents, content delivery, mobile payments, Web3, AI/LLM tooling, and legal tech" />
</svelte:head>

<div class="page-wrapper">
	{#if isLoading}
		<div class="loader-container">
			<PortfolioLoader message="Loading portfolio..." />
		</div>
	{:else}
	<div class="intro" style={selectedCategoryInfo ? `border-left: 3px solid ${selectedCategoryInfo.color};` : ''}>
		{#if selectedCategoryInfo}
			{@const s = filteredStats()}
			<h2 class="intro-title" style="color: {selectedCategoryInfo.color};">
				<i class="fat {selectedCategoryInfo.icon}"></i> {selectedCategoryInfo.name}
			</h2>
			<p class="intro-description">{selectedCategoryInfo.extendedDescription || selectedCategoryInfo.description}</p>
			<p class="intro-narrative-stats">
				This collection comprises {s.entries} {s.entries === 1 ? 'entry' : 'entries'} totaling approximately {s.words.toLocaleString()} words and {s.chars.toLocaleString()} characters{#if s.earliest}, spanning {formatDateRange(s.earliest, s.latest)}{/if}.
			</p>
		{:else}
			{@const s = filteredStats()}
			<p>
				<strong>atsignhandle.xyz</strong> chronicles projects spanning three decades of development -- from fixed-point audio codecs and embedded media players to retail kiosk platforms, mobile payment protocols, digital content distribution systems, Web3 smart contracts, cryptographic privacy tools, digital forensics, and AI/LLM agent development. The portfolio includes 11 patents, 55+ open source repositories, and projects in HITL testing, NFC transactions, NFT marketplaces, document intelligence, and browser automation.
			</p>
			<p class="intro-narrative-stats">
				This timeline comprises {s.entries} entries across {categories.length} categories totaling approximately {s.words.toLocaleString()} words and {s.chars.toLocaleString()} characters{#if s.earliest}, spanning {formatDateRange(s.earliest, s.latest)}{/if}. Each entry is rated by significance -- the more stars, the greater the impact.
			</p>
		{/if}
		<div class="filter-row">
			<span class="filter-label">Filter by significance:</span>
			<SignificanceFilter selectedLevel={significanceFilter} onFilterChange={handleFilterChange} />
		</div>
		{#if categories.length > 0}
			<div class="filter-row category-filter-row">
				<span class="filter-label">Research:</span>
				<div class="category-filters">
					{#each categories as category}
						<button
							class="cat-filter-badge"
							class:active={selectedCategory === category.id}
							style="--badge-color: {category.color};"
							onclick={() => selectCategory(category.id)}
							title="{category.name}: {category.description}"
						>
							<i class="fat {category.icon}"></i>
							{category.shortName}
						</button>
					{/each}
					{#if selectedCategory}
						<button class="cat-toggle" onclick={clearCategoryFilter}>all</button>
					{/if}
				</div>
			</div>
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
											{#if post.metadata.significance || post.metadata.research}
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
																			<i class="fat {category.icon}"></i>
																			{category.shortName}
																		</span>
																	{/if}
																{/each}
															</div>
														{/if}
													</div>
													{#if post.metadata.significance}
														<div class="timeline-significance-rating">
															<SignificanceRating rating={post.metadata.significance} size="sm" />
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
			<p>No entries match the selected filters.</p>
			<button onclick={() => { handleFilterChange(null); clearCategoryFilter(); }}>Clear filters</button>
		</div>
	{/if}
</div>
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
		padding: 0;
		margin-top: -0.5rem;
		transition: border-color 0.2s ease, padding-left 0.2s ease;
	}

	.intro[style*="border-left"] {
		padding-left: 1rem;
	}

	.intro p {
		margin: 0 0 1rem 0;
		line-height: 1.6;
		color: var(--color-text);
	}

	.intro p:last-of-type {
		margin-bottom: 0;
	}

	.intro-title {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		margin: 0 0 0.75rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.intro-title i {
		font-size: 1.25rem;
	}

	.intro-description {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.7;
	}

	.intro-narrative-stats {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		line-height: 1.6;
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
		white-space: nowrap;
	}

	.category-filter-row {
		margin-top: 0.25rem;
		padding-top: 0.25rem;
		flex-wrap: wrap;
	}

	.category-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}

	.cat-filter-badge {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		padding: 0.2rem 0.45rem;
		border: 1px solid var(--badge-color);
		border-radius: 3px;
		background: color-mix(in srgb, var(--badge-color) 10%, transparent);
		color: var(--badge-color);
		cursor: pointer;
		transition: all 0.15s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		opacity: 0.6;
	}

	.cat-filter-badge i {
		font-size: 0.7rem;
	}

	.cat-filter-badge.active {
		background: color-mix(in srgb, var(--badge-color) 20%, transparent);
		color: var(--badge-color);
		opacity: 1;
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.cat-filter-badge:hover {
		opacity: 1;
		transform: translateY(-1px);
	}

	.cat-toggle {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		padding: 0.15rem 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		background: var(--color-bg);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s;
	}

	.cat-toggle:hover:not(:disabled) {
		background: var(--color-hover-bg);
	}

	.cat-toggle:disabled {
		opacity: 0.3;
		cursor: default;
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
		color: #7b1fa2;
	}

	/* Color cycling animation during scroll */
	@keyframes marker-color-cycle {
		0% { color: #1565c0; }
		12% { color: #6a1b9a; }
		25% { color: #e65100; }
		37% { color: #00838f; }
		50% { color: #7b1fa2; }
		62% { color: #2e7d32; }
		75% { color: #c62828; }
		87% { color: #37474f; }
		100% { color: #1565c0; }
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
		color: #7b1fa2;
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

	.timeline-item.featured:hover {
		box-shadow: 6px 6px 0px var(--color-shadow);
		background: var(--color-featured-bg);
		transform: scale(1.04);
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

	.timeline-significance-rating {
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
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.category-badge i {
		font-size: 0.7rem;
	}

	.category-badge:hover {
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

		.timeline-significance-rating {
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
