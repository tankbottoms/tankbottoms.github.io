<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		message?: string;
	}

	let { message = 'Loading...' }: Props = $props();
</script>

<div class="loader">
	<img src="{base}/images/mrwhiskers-me.svg" alt="Loading" class="loader-icon" />
	<span class="loader-text">{message}</span>
</div>

<style>
	.loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.loader-icon {
		width: 64px;
		height: 64px;
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loader-text {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
</style>
