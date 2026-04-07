<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		rating: number;
		max?: number;
		size?: 'sm' | 'md' | 'lg';
		showLabel?: boolean;
	}

	let { rating, max = 5, size = 'md', showLabel = false }: Props = $props();

	const sizes = {
		sm: 18,
		md: 22,
		lg: 28
	};

	const iconSize = $derived(sizes[size]);
	const filledCount = $derived(Math.min(Math.max(0, Math.round(rating)), max));
	const emptyCount = $derived(max - filledCount);

	const labels: Record<number, string> = {
		5: 'Landmark',
		4: 'Major Impact',
		3: 'Significant',
		2: 'Notable',
		1: 'Reference'
	};

	const label = $derived(labels[filledCount] || '');
</script>

<div class="significance-rating significance-rating--{size}" title="{filledCount}/{max} - {label}">
	<div class="significance-icons">
		{#each Array(filledCount) as _, i}
			<img
				src="{base}/images/mrwhiskers-cat.svg"
				alt="Filled"
				width={iconSize}
				height={iconSize}
				class="significance-icon significance-icon--filled"
			/>
		{/each}
		{#each Array(emptyCount) as _, i}
			<img
				src="{base}/images/mrwhiskers-grey.svg"
				alt="Empty"
				width={iconSize}
				height={iconSize}
				class="significance-icon significance-icon--empty"
			/>
		{/each}
	</div>
	{#if showLabel}
		<span class="significance-label significance-label--{filledCount}">{label}</span>
	{/if}
</div>

<style>
	.significance-rating {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.significance-icons {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	.significance-icon {
		flex-shrink: 0;
		transition: transform 0.3s ease;
		cursor: pointer;
	}

	.significance-icon--filled {
		opacity: 1;
	}

	.significance-icon--filled:hover {
		transform: scale(1.5) rotate(360deg);
		transition: transform 0.5s ease;
	}

	.significance-icon--empty {
		opacity: 0.25;
		filter: grayscale(100%);
	}

	.significance-icon--empty:hover {
		transform: scale(1.5);
		opacity: 0.4;
		transition: transform 0.3s ease, opacity 0.3s ease;
	}

	.significance-label {
		font-family: var(--font-mono, monospace);
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		background: var(--color-bg-secondary, #f5f5f5);
	}

	.significance-label--5 {
		color: #6a1b9a;
		background: #f3e5f5;
	}

	.significance-label--4 {
		color: #4527a0;
		background: #ede7f6;
	}

	.significance-label--3 {
		color: #1565c0;
		background: #e3f2fd;
	}

	.significance-label--2 {
		color: #00838f;
		background: #e0f7fa;
	}

	.significance-label--1 {
		color: #2e7d32;
		background: #e8f5e9;
	}

	/* Dark mode adjustments */
	:global([data-theme='dark']) .significance-label--5 {
		color: #ce93d8;
		background: rgba(106, 27, 154, 0.2);
	}

	:global([data-theme='dark']) .significance-label--4 {
		color: #b39ddb;
		background: rgba(69, 39, 160, 0.2);
	}

	:global([data-theme='dark']) .significance-label--3 {
		color: #82b1ff;
		background: rgba(21, 101, 192, 0.2);
	}

	:global([data-theme='dark']) .significance-label--2 {
		color: #80deea;
		background: rgba(0, 131, 143, 0.2);
	}

	:global([data-theme='dark']) .significance-label--1 {
		color: #69f0ae;
		background: rgba(46, 125, 50, 0.2);
	}

	/* Size variants */
	.significance-rating--sm .significance-icons {
		gap: 1px;
	}

	.significance-rating--lg .significance-icons {
		gap: 3px;
	}
</style>
