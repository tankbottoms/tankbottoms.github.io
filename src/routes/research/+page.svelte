<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	type ResearchCategory = {
		id: string;
		name: string;
		shortName: string;
		description: string;
		color: string;
	};

	let categories = $state<ResearchCategory[]>([]);
	let isLoading = $state(true);

	async function loadCategories() {
		try {
			const response = await fetch(`${base}/json/research-categories.json`);
			const data = await response.json();
			categories = data.categories || [];
		} catch (error) {
			console.error('Failed to load categories:', error);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadCategories();
	});
</script>

<svelte:head>
	<title>Research Categories | Mr. Whiskers Blog</title>
	<meta name="description" content="Explore Mr. Whiskers' research categories including naps, toys, things to knock over, and more." />
</svelte:head>

<div class="research-page">
	<h1>Research Categories</h1>
	<p class="intro">
		Mr. Whiskers' research spans multiple domains of feline inquiry. Select a category to explore related entries.
	</p>

	{#if isLoading}
		<div class="loading">Loading categories...</div>
	{:else}
		<div class="categories-grid">
			{#each categories as category}
				<a href="{base}/research/{category.id}" class="category-card" style="border-color: {category.color};">
					<h2 style="color: {category.color};">{category.name}</h2>
					<p>{category.description}</p>
					<span class="badge" style="background-color: {category.color}20; color: {category.color}; border-color: {category.color};">
						{category.shortName}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.research-page {
		max-width: 750px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 2.5rem;
		margin-bottom: 1rem;
		color: var(--color-text);
	}

	.intro {
		color: var(--color-text-muted);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.loading {
		text-align: center;
		color: var(--color-text-muted);
		padding: 2rem;
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.category-card {
		display: block;
		padding: 1.5rem;
		background: var(--color-bg-secondary);
		border: 2px solid var(--color-border);
		border-left-width: 4px;
		border-radius: 5px;
		text-decoration: none;
		transition: all 0.2s;
	}

	.category-card:hover {
		box-shadow: 3px 3px 0px var(--color-shadow);
		transform: translateY(-2px);
	}

	.category-card h2 {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		margin: 0 0 0.5rem 0;
	}

	.category-card p {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.badge {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid;
		border-radius: 3px;
	}
</style>
