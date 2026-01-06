<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userSettings } from '$lib/stores/userSettings';
	import NapRating from '$lib/components/NapRating.svelte';

	let { data } = $props();

	// Get category info
	let categoryId = $derived($page.params.slug);
	let categoryInfo = $derived(data.categories.find((c: any) => c.id === categoryId));

	// Filter posts by category
	let categoryPosts = $derived(
		data.posts.filter((post: any) =>
			post.metadata.research?.includes(categoryId)
		)
	);

	function handlePostClick(path: string, event: MouseEvent) {
		event.preventDefault();
		userSettings.setReferrer(`/research/${categoryId}`, window.scrollY);
		userSettings.recordVisit('/' + path);
		goto(base + '/' + path);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{categoryInfo?.name || 'Research'} | Mr. Whiskers Blog</title>
	<meta name="description" content="Research entries in the {categoryInfo?.name} category" />
</svelte:head>

<div class="category-page">
	<nav class="breadcrumb">
		<a href="{base}/research">&larr; All Categories</a>
	</nav>

	{#if categoryInfo}
		<header class="category-header" style="border-color: {categoryInfo.color};">
			<h1 style="color: {categoryInfo.color};"><i class="fat {categoryInfo.icon}"></i> {categoryInfo.name}</h1>
			<p>{categoryInfo.description}</p>
			<span class="post-count">{categoryPosts.length} {categoryPosts.length === 1 ? 'entry' : 'entries'}</span>
		</header>
	{/if}

	<div class="posts-list">
		{#each categoryPosts as post}
			<a href="{base}/{post.path}" class="post-card" onclick={(e) => handlePostClick(post.path, e)}>
				<div class="post-date">{formatDate(post.metadata.date)}</div>
				<h2>{post.metadata.title}</h2>
				{#if post.metadata.blurb}
					<p>{post.metadata.blurb}</p>
				{/if}
				{#if post.metadata.napScore}
					<div class="post-meta">
						<NapRating rating={post.metadata.napScore} size="sm" />
					</div>
				{/if}
			</a>
		{/each}

		{#if categoryPosts.length === 0}
			<p class="no-posts">No entries in this category yet.</p>
		{/if}
	</div>
</div>

<style>
	.category-page {
		max-width: 750px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	.breadcrumb {
		margin-bottom: 1.5rem;
	}

	.breadcrumb a {
		color: var(--color-link);
		text-decoration: underline;
	}

	.category-header {
		padding: 1.5rem;
		margin-bottom: 2rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-left-width: 4px;
		border-radius: 5px;
	}

	.category-header h1 {
		font-family: var(--font-serif);
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
	}

	.category-header h1 i {
		margin-right: 0.35rem;
	}

	.category-header p {
		color: var(--color-text-muted);
		margin: 0 0 0.5rem 0;
	}

	.post-count {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.posts-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.post-card {
		display: block;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.post-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.post-date {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-bottom: 0.25rem;
	}

	.post-card h2 {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.post-card p {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.post-meta {
		margin-top: 0.5rem;
	}

	.no-posts {
		text-align: center;
		color: var(--color-text-muted);
		padding: 2rem;
	}
</style>
