<script lang="ts">
	import { searchHistory, type SearchEntry } from '$lib/stores/searchHistory';
	import { userSettings } from '$lib/stores/userSettings';
	import { onMount, untrack } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';

	let { data } = $props();

	// Initialize search state from URL params (handles direct links and back navigation)
	// Using untrack() to explicitly capture initial value without reactivity warning
	let searchTerm = $state(untrack(() => data.searchQuery || ''));
	let searchSource = $state<'associate' | 'scheme' | 'manual'>(
		untrack(() => (data.searchSource as 'associate' | 'scheme' | 'manual') || 'manual')
	);
	let searchColor = $state('');
	let history = $state<SearchEntry[]>([]);
	let searchInput: HTMLInputElement;
	let teamData = $state<any>(null);

	// Track if we're updating from URL to avoid loops
	let isUpdatingFromUrl = false;

	// Track pending debounced URL updates (prevents race condition during typing)
	let urlUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

	// Handle URL changes (back/forward navigation, direct links)
	// Only sync when the URL actually changes from external navigation
	// CRITICAL: Use untrack() for searchTerm to prevent effect from running when user types
	$effect(() => {
		if (!browser) return;

		// Skip sync if we have a pending debounced URL update (user is actively typing)
		// This prevents the race condition where $page updates before our replaceState runs
		if (untrack(() => urlUpdateTimeout !== null)) return;

		const urlQuery = $page.url.searchParams.get('q') || '';
		const urlColor = $page.url.searchParams.get('color') || '';
		const urlSource = ($page.url.searchParams.get('source') as 'associate' | 'scheme' | 'manual') || 'manual';

		// Read current values without tracking them as dependencies
		// This prevents the effect from re-running when user types (which changes searchTerm)
		const currentTerm = untrack(() => searchTerm);
		const updating = untrack(() => isUpdatingFromUrl);

		// Only update if URL changed externally (not from our own replaceState)
		if (urlQuery !== currentTerm && !updating) {
			isUpdatingFromUrl = true;
			searchTerm = urlQuery;
			searchColor = urlColor;
			searchSource = urlSource;
			// Reset flag after a tick
			setTimeout(() => { isUpdatingFromUrl = false; }, 0);
		}
	});

	// Subscribe to search history changes
	searchHistory.subscribe((value) => {
		history = value;
	});

	// Collect unique tags from all content
	let allTags = $derived.by(() => {
		const tags = new Set<string>();
		for (const item of data.allContent) {
			if (item.metadata.tags) {
				for (const tag of item.metadata.tags) {
					tags.add(tag);
				}
			}
		}
		return Array.from(tags).sort();
	});

	// Handle initial setup - load category data and set color from URL
	onMount(async () => {
		// Focus search input immediately
		if (searchInput) {
			searchInput.focus();
		}

		// Load research category data for tag filtering
		try {
			const response = await fetch(`${base}/json/research-categories.json`);
			teamData = await response.json();
		} catch (error) {
			console.error('Failed to load research category data:', error);
		}

		// Get color from URL if provided (for research category badge clicks)
		if (data.searchQuery) {
			const urlParams = new URLSearchParams(window.location.search);
			const urlColor = urlParams.get('color');
			if (urlColor) {
				searchColor = urlColor;
			}
			// Add to search history on initial load (not on back navigation)
			// Only add if this is a fresh search, not a back navigation
			const isBackNavigation = document.referrer.includes(window.location.origin);
			if (!isBackNavigation) {
				handleSearch();
			}
		}
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Normalize text for fuzzy matching (handle hyphens and whitespace)
	function normalizeText(text: string): string {
		return text.toLowerCase().replace(/[-\s]+/g, '').trim();
	}

	// Filter content based on search term with fuzzy matching
	let filteredContent = $derived.by(() => {
		const term = searchTerm.trim();
		if (!term) return [];

		const normalizedTerm = normalizeText(term);

		return data.allContent.filter((item) => {
			// Search in title and blurb
			const title = normalizeText(item.metadata.title || '');
			const blurb = normalizeText(item.metadata.blurb || '');

			// Search in arrays - check if any element matches
			const tags = item.metadata.tags || [];
			const research = item.metadata.research || [];

			const matchesTags = tags.some((t: string) => normalizeText(t).includes(normalizedTerm) || normalizedTerm.includes(normalizeText(t)));
			const matchesResearch = research.some((r: string) => normalizeText(r).includes(normalizedTerm) || normalizedTerm.includes(normalizeText(r)));

			return (
				title.includes(normalizedTerm) ||
				blurb.includes(normalizedTerm) ||
				matchesTags ||
				matchesResearch
			);
		});
	});

	// Handle search term change
	function handleSearch() {
		const term = searchTerm.trim();
		if (term) {
			searchHistory.addSearch(term, searchSource, searchColor || undefined);
			// Reset source to manual after adding
			searchSource = 'manual';
			searchColor = '';
		}
	}

	// Handle keyboard events
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	// Sync search term to URL for back navigation support
	// Debounce URL updates to avoid interfering with typing
	$effect(() => {
		if (!browser || isUpdatingFromUrl) return;

		const term = searchTerm.trim();
		const currentUrlTerm = $page.url.searchParams.get('q') || '';

		// Only update URL if term changed
		if (term !== currentUrlTerm) {
			// Clear any pending update
			if (urlUpdateTimeout) clearTimeout(urlUpdateTimeout);

			// Debounce the URL update to avoid interfering with typing
			urlUpdateTimeout = setTimeout(() => {
				const url = new URL($page.url);
				if (term) {
					url.searchParams.set('q', term);
					if (searchSource && searchSource !== 'manual') {
						url.searchParams.set('source', searchSource);
					} else {
						url.searchParams.delete('source');
					}
					if (searchColor) {
						url.searchParams.set('color', searchColor);
					} else {
						url.searchParams.delete('color');
					}
				} else {
					url.searchParams.delete('q');
					url.searchParams.delete('source');
					url.searchParams.delete('color');
				}
				// Use replaceState to update URL without navigation
				replaceState(url.pathname + url.search, {});
				// Clear timeout reference after URL is updated
				urlUpdateTimeout = null;
			}, 150); // Small debounce to let typing complete
		}
	});

	// Handle clicking on a previous search
	function selectPreviousSearch(entry: SearchEntry) {
		searchTerm = entry.term;
		searchSource = entry.source || 'manual';
		searchColor = entry.color || '';
		handleSearch();
	}

	// Get chip style based on source
	function getChipStyle(entry: SearchEntry): string {
		if (entry.color) {
			return `background-color: ${entry.color}20; border-color: ${entry.color}; color: ${entry.color};`;
		}
		if (entry.source === 'associate') {
			return 'background-color: #ffcdd220; border-color: #ef5350; color: #ef5350;';
		}
		if (entry.source === 'scheme') {
			return 'background-color: #e3f2fd; border-color: #1976d2; color: #1976d2;';
		}
		return '';
	}

	// Handle clicking on a scheme tag
	function selectScheme(schemeId: string) {
		const scheme = teamData?.schemes?.find((s: any) => s.id === schemeId);
		if (scheme) {
			searchTerm = schemeId;
			searchSource = 'scheme';
			searchColor = scheme.color || '';
			handleSearch();
		}
	}

	// Handle clicking on an individual tag
	function selectIndividual(individualId: string) {
		const associate = teamData?.associates?.find((a: any) => a.id === individualId);
		if (associate) {
			searchTerm = individualId;
			searchSource = 'associate';
			const tier = teamData?.tiers?.find((t: any) => t.id === associate.tier);
			searchColor = tier?.borderColor || '';
			handleSearch();
		}
	}

	// Handle clicking on a generic tag
	function selectTag(tag: string) {
		searchTerm = tag;
		searchSource = 'manual';
		searchColor = '';
		handleSearch();
	}

	// Handle clicking on a search result - save referrer for back navigation
	function handleResultClick(path: string) {
		// Ensure path starts with /
		const fullPath = path.startsWith('/') ? path : '/' + path;
		const destination = base + fullPath;

		// Build referrer URL from current STATE, not $page.url
		// This is critical because URL updates are debounced by 150ms
		// If user types and clicks quickly, $page.url won't have the search term yet
		const referrerParams = new URLSearchParams();
		const term = searchTerm.trim();
		if (term) {
			referrerParams.set('q', term);
			if (searchSource && searchSource !== 'manual') {
				referrerParams.set('source', searchSource);
			}
			if (searchColor) {
				referrerParams.set('color', searchColor);
			}
		}
		const referrerUrl = '/search' + (referrerParams.toString() ? '?' + referrerParams.toString() : '');

		const scrollPosition = window.scrollY;
		userSettings.setReferrer(referrerUrl, scrollPosition);
		userSettings.recordVisit(fullPath);

		// Navigate to the destination
		goto(destination);
	}

	// Get visit history for reactivity
	let visitHistory = $state<Record<string, { count: number; firstVisited: string; lastVisited: string }>>({});

	// Subscribe to settings changes to get visit history
	userSettings.subscribe((settings) => {
		visitHistory = settings.visitHistory;
	});

	// Format visit info for display
	function formatVisitInfo(path: string): string | null {
		const visit = visitHistory[path];
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
	<title>Search - Mr. Whiskers Blog</title>
	<meta name="description" content="Search Mr. Whiskers blog posts and research" />
</svelte:head>

<div class="page-wrapper">
	<div class="search-container">
		<input
			type="text"
			bind:value={searchTerm}
			bind:this={searchInput}
			placeholder="Search..."
			class="search-input"
			onkeydown={handleKeydown}
		/>
	</div>

	<div class="search-info">
		{#if searchTerm}
			<p class="match-count">
				{filteredContent.length}
				{filteredContent.length === 1 ? 'match' : 'matches'} found
			</p>
		{/if}
		{#if history.length > 0}
			<div class="previous-searches">
				<span class="previous-label">Previous searches:</span>
				{#each history as entry}
					<button
						type="button"
						class="search-tag"
						class:search-tag-colored={entry.color || entry.source !== 'manual'}
						style={getChipStyle(entry)}
						onclick={() => selectPreviousSearch(entry)}
					>
						{entry.term}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Tag Filtering Section -->
	{#if teamData?.categories}
		<div class="filter-separator"></div>
		<div class="tag-filters-container">
			<div class="tag-filters">
				<!-- Research Categories -->
				<div class="filter-group">
					<span class="filter-label">Research:</span>
					<div class="filter-tags">
						{#each teamData.categories as category}
							<button
								type="button"
								class="filter-tag"
								style="background-color: {category.color}20; border-color: {category.color}; color: {category.color};"
								onclick={() => selectTag(category.id)}
								title={category.description}
							>
								{category.shortName}
							</button>
						{/each}
					</div>
				</div>

				<!-- Generic Tags -->
				<div class="filter-group">
					<span class="filter-label">Tags:</span>
					<div class="filter-tags">
						{#each allTags.slice(0, 20) as tag}
							<button
								type="button"
								class="filter-tag"
								onclick={() => selectTag(tag)}
							>
								{tag}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if searchTerm && filteredContent.length > 0}
		<div class="timeline-container">
			<div class="timeline">
				{#each filteredContent as item, i}
					<a href="{base}{item.path}" class="timeline-item" class:featured={i % 3 === 0} onclick={(e) => { e.preventDefault(); handleResultClick(item.path); }}>
						<div class="timeline-content">
							<div class="timeline-header">
								<div class="timeline-dot"></div>
								<div class="timeline-title">
									{item.metadata.title || 'Untitled'}
									{#if item.type === 'research'}
										<span class="content-type">[Research]</span>
									{/if}
								</div>
								<div class="timeline-date">
									{item.metadata.date ? formatDate(item.metadata.date) : ''}
								</div>
							</div>
							{#if item.metadata.blurb}
								{@const visitInfo = formatVisitInfo(item.path)}
								<p class="timeline-blurb">
									{item.metadata.blurb}
									{#if item.metadata.wordCount && item.metadata.readingTimeText}
										<span class="reading-stats">
											• {item.metadata.wordCount.toLocaleString()} words • {item.metadata
												.readingTimeText}
										</span>
									{/if}
									{#if visitInfo}
										<span class="visit-info">  • {visitInfo}</span>
									{/if}
								</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>
	{:else if searchTerm}
		<div class="no-results">
			<p>No matches found for "{searchTerm}"</p>
		</div>
	{/if}
</div>

<style>
	.page-wrapper {
		max-width: 600px;
		margin: 0 auto;
	}

	.search-container {
		margin-bottom: 2rem;
		padding: 1rem 0;
	}

	.search-input {
		width: 100%;
		font-size: 1rem;
		font-family: var(--font-mono);
		color: var(--color-text);
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--color-text);
		padding: 0.5rem 0;
		outline: none;
		transition: border-color 0.2s;
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
		opacity: 0.6;
	}

	.search-input:focus {
		border-bottom-color: var(--color-text);
		border-bottom-width: 2px;
	}

	.search-info {
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.match-count {
		margin: 0 0 0.5rem 0;
	}

	.previous-searches {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.previous-label {
		font-style: italic;
		color: var(--color-text-muted);
	}

	.search-tag {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: var(--color-featured-bg);
		border: 1px solid var(--color-featured-border);
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s;
		font-family: var(--font-mono);
	}

	.search-tag:hover {
		background: var(--color-hover-bg);
		box-shadow: 2px 2px 0px var(--color-shadow);
		transform: translateY(-1px);
	}

	.search-tag:active {
		transform: translateY(0);
		box-shadow: 1px 1px 0px var(--color-shadow);
	}

	.search-tag-colored {
		border-width: 1px;
		border-style: solid;
	}

	.filter-separator {
		margin: 1.5rem 0 1rem 0;
		border-top: 1px solid var(--color-border);
	}

	.tag-filters-container {
		margin-bottom: 1.5rem;
	}

	.tag-filters {
		padding: 0;
	}

	.filter-group {
		margin-bottom: 0.75rem;
	}

	.filter-group:last-child {
		margin-bottom: 0;
	}

	.filter-label {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.35rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.filter-tag {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		background: var(--color-featured-bg);
		border: 1px solid var(--color-featured-border);
		border-radius: 3px;
		font-size: 0.65rem;
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s;
		font-family: var(--font-mono);
		white-space: nowrap;
	}

	.filter-tag:hover {
		background: var(--color-hover-bg);
		box-shadow: 2px 2px 0px var(--color-shadow);
		transform: translateY(-1px);
	}

	.filter-tag:active {
		transform: translateY(0);
		box-shadow: 1px 1px 0px var(--color-shadow);
	}

	.no-results {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-muted);
	}

	.no-results p {
		margin: 0;
	}

	.timeline-container {
		padding-left: 0.5rem;
		padding-right: 1rem;
		padding-bottom: 1rem;
	}

	.timeline {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-left: 1px solid var(--color-timeline);
		padding: 1rem 0;
	}

	.timeline::before {
		content: '';
		position: absolute;
		left: -1px;
		top: 0;
		width: 1px;
		height: 1.5rem;
		background: linear-gradient(to top, var(--color-timeline), transparent);
	}

	.timeline::after {
		content: '';
		position: absolute;
		left: -1px;
		bottom: 0;
		width: 1px;
		height: 1.5rem;
		background: linear-gradient(to bottom, var(--color-timeline), transparent);
	}

	.timeline-item {
		display: block;
		text-decoration: none;
		color: inherit;
		margin-left: 1.5rem;
		padding: 0.75rem 0.75rem;
		transition: all 0.2s;
		cursor: pointer;
		isolation: isolate;
		width: calc(100% - 1.5rem);
		text-align: left;
		background: transparent;
		border: none;
		font-family: inherit;
	}

	.timeline-item:hover {
		background-color: var(--color-hover-bg);
	}

	.timeline-item.featured {
		background: var(--color-featured-bg);
		border: 1px solid var(--color-featured-border);
		box-shadow: 3px 3px 0px var(--color-shadow);
		padding: 0.75rem;
	}

	.timeline-item.featured:hover {
		box-shadow: 5px 5px 0px var(--color-shadow);
		background: var(--color-featured-bg);
	}

	.timeline-content {
		position: relative;
	}

	.timeline-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		justify-content: space-between;
		position: relative;
		flex-wrap: wrap;
	}

	.timeline-dot {
		position: absolute;
		left: calc(-1.5rem - 0.75rem - 4px);
		top: 4px;
		width: 7px;
		height: 7px;
		background-color: var(--color-border-dark);
		border-radius: 1px;
		outline: 2px solid var(--color-bg);
	}

	.timeline-title {
		font-weight: 600;
		font-size: 0.875rem;
		flex: 1;
		min-width: 0;
		color: var(--color-text);
	}

	.content-type {
		font-weight: 400;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-left: 0.5rem;
	}

	.timeline-date {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		white-space: nowrap;
		margin-left: auto;
	}

	.timeline-blurb {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0.5rem 0 0 0;
		line-height: 1.5;
	}

	.reading-stats {
		color: var(--color-text-muted);
		opacity: 0.8;
		font-size: 0.7rem;
	}

	.visit-info {
		color: #4caf50;
		font-size: 0.65rem;
		font-family: var(--font-mono);
		opacity: 0.9;
	}

	@media (max-width: 640px) {
		.timeline-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.timeline-date {
			margin-left: 0;
		}
	}
</style>
