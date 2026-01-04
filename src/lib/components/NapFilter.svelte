<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		selectedLevel: number | null;
		onFilterChange: (level: number | null) => void;
	}

	let { selectedLevel = null, onFilterChange }: Props = $props();

	const levels = [1, 2, 3, 4, 5];
	// Special value -1 indicates "featured only" filter
	const FEATURED_FILTER = -1;

	function handleClick(level: number) {
		if (selectedLevel === level) {
			// Clicking the same level again clears the filter
			onFilterChange(null);
		} else {
			onFilterChange(level);
		}
	}

	function handleFeaturedClick() {
		if (selectedLevel === FEATURED_FILTER) {
			onFilterChange(null);
		} else {
			onFilterChange(FEATURED_FILTER);
		}
	}

	function handleClear() {
		onFilterChange(null);
	}
</script>

<div class="nap-filter">
	<div class="filter-icons">
		{#each levels as level}
			<button
				class="filter-icon"
				class:active={selectedLevel !== null && selectedLevel !== FEATURED_FILTER && level <= selectedLevel}
				class:selected={selectedLevel === level}
				onclick={() => handleClick(level)}
				title="Filter: Show nap-worthiness {level} and above"
				aria-label="Filter by nap-worthiness level {level}"
			>
				<img
					src={selectedLevel !== null && selectedLevel !== FEATURED_FILTER && level <= selectedLevel ? `${base}/images/mrwhiskers-cat.svg` : `${base}/images/mrwhiskers-grey.svg`}
					alt="Nap-worthiness {level}"
					width="40"
					height="40"
					class="filter-img"
				/>
			</button>
		{/each}
		<span class="filter-separator">|</span>
		<button
			class="filter-icon featured-icon"
			class:active={selectedLevel === FEATURED_FILTER}
			class:selected={selectedLevel === FEATURED_FILTER}
			onclick={handleFeaturedClick}
			title="Filter: Show featured posts only"
			aria-label="Show featured posts only"
		>
			<img
				src={selectedLevel === FEATURED_FILTER ? `${base}/images/mrwhiskers-me.svg` : `${base}/images/mrwhiskers-grey.svg`}
				alt="Featured posts"
				width="40"
				height="40"
				class="filter-img featured-img"
			/>
		</button>
	</div>
	{#if selectedLevel !== null}
		<button class="clear-filter" onclick={handleClear} aria-label="Clear filter">
			clear
		</button>
	{/if}
</div>

<style>
	.nap-filter {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.filter-icons {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.filter-icon {
		padding: 0;
		margin: 0;
		background: none;
		border: none;
		cursor: pointer;
		transition: transform 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.filter-icon:hover {
		transform: scale(1.5);
	}

	.filter-icon:hover .filter-img {
		transition: transform 0.5s ease;
	}

	.filter-icon.active:hover .filter-img {
		transform: rotate(360deg);
	}

	.filter-img {
		display: block;
		transition: transform 0.3s ease, filter 0.3s ease, opacity 0.3s ease;
	}

	.filter-icon:not(.active) .filter-img {
		opacity: 0.3;
		filter: grayscale(100%);
	}

	.filter-icon:not(.active):hover .filter-img {
		opacity: 0.6;
		filter: grayscale(50%);
	}

	.filter-icon.selected {
		position: relative;
	}

	.filter-separator {
		color: var(--color-border, #ccc);
		font-size: 1rem;
		margin: 0 2px;
		opacity: 0.5;
	}

	.featured-icon {
		position: relative;
	}

	.featured-icon .featured-img {
		filter: none;
	}

	.featured-icon.active .featured-img {
		/* Just use the color SVG as-is, no filter */
		filter: none;
	}

	.featured-icon.active:hover .featured-img {
		/* Spin and enlarge on hover */
		transform: rotate(360deg);
	}

	.featured-icon:not(.active) .featured-img {
		opacity: 0.4;
	}

	.featured-icon:not(.active):hover .featured-img {
		opacity: 0.7;
	}

	.clear-filter {
		font-family: var(--font-mono, monospace);
		font-size: 0.65rem;
		color: var(--color-text-muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		opacity: 0.7;
		transition: opacity 0.2s ease, color 0.2s ease;
	}

	.clear-filter:hover {
		opacity: 1;
		color: var(--color-link);
	}
</style>
