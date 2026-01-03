<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import TRexGame from '$lib/components/TRexGame.svelte';
</script>

<svelte:head>
	<title>{$page.status} - {$page.error?.message || 'Error'}</title>
</svelte:head>

<div class="error-page">
	<div class="error-header">
		<div class="error-code">{$page.status}</div>
		<div class="error-message">
			{#if $page.status === 404}
				<h1>Page Not Found</h1>
				<p>{$page.error?.message || "The page you're looking for doesn't exist."}</p>
			{:else if $page.status === 500}
				<h1>Internal Server Error</h1>
				<p>{$page.error?.message || 'Something went wrong on our end.'}</p>
			{:else}
				<h1>Error {$page.status}</h1>
				<p>{$page.error?.message || 'An unexpected error occurred.'}</p>
			{/if}
		</div>
	</div>

	<div class="game-section">
		<TRexGame />
	</div>

	<div class="error-footer">
		<div class="error-actions">
			<a href="{base}/" class="btn-home">
				<i class="fa-solid fa-home"></i>
				Go Home
			</a>
			<a href="{base}/research" class="btn-research">
				<i class="fa-solid fa-flask"></i>
				View Research
			</a>
		</div>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 2rem 1rem;
		align-items: center;
	}

	.error-header {
		text-align: center;
		padding-top: 1rem;
		margin-bottom: 1rem;
		flex-shrink: 0;
		width: 100%;
		max-width: 600px;
	}

	.error-code {
		font-family: var(--font-serif);
		font-size: 5rem;
		font-weight: 700;
		color: var(--color-text-muted);
		line-height: 1;
		margin-bottom: 0.5rem;
		opacity: 0.3;
	}

	.error-message {
		margin-bottom: 1rem;
	}

	.error-message h1 {
		font-family: var(--font-serif);
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.75rem 0;
	}

	.error-message p {
		font-size: 0.95rem;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	.game-section {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		width: 100%;
	}

	.error-footer {
		text-align: center;
		padding-bottom: 1rem;
		flex-shrink: 0;
		width: 100%;
		max-width: 600px;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn-home,
	.btn-research {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-featured-bg);
		border: 1px solid var(--color-featured-border);
		border-radius: 4px;
		color: var(--color-text);
		text-decoration: none;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.btn-home i,
	.btn-research i {
		font-size: 1rem;
	}

	.btn-home:hover,
	.btn-research:hover {
		background: var(--color-hover-bg);
		box-shadow: 3px 3px 0px var(--color-shadow);
		transform: translateY(-2px);
	}

	.btn-home:active,
	.btn-research:active {
		transform: translateY(0);
		box-shadow: 1px 1px 0px var(--color-shadow);
	}

	@media (max-width: 640px) {
		.error-page {
			padding: 1rem 0.5rem;
		}

		.error-code {
			font-size: 3.5rem;
		}

		.error-message h1 {
			font-size: 1.5rem;
		}

		.error-message p {
			font-size: 0.875rem;
		}

		.game-section {
			margin-bottom: 1.5rem;
		}

		.error-actions {
			flex-direction: column;
			gap: 0.75rem;
			max-width: 300px;
			margin: 0 auto;
		}

		.btn-home,
		.btn-research {
			width: 100%;
			justify-content: center;
		}
	}
</style>
