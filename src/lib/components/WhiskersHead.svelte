<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		size?: number;
		inline?: boolean;
	}

	let { size = 32, inline = true }: Props = $props();
	let isHovered = $state(false);
</script>

<span
	class="whiskers-head"
	class:inline
	class:hovered={isHovered}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	role="img"
	aria-label="Mr. Whiskers icon"
>
	{#if isHovered}
		<img
			src="{base}/images/mrwhiskers-cat.svg"
			alt=""
			width={size}
			height={size}
			style="width: {size}px; height: {size}px; min-width: {size}px; min-height: {size}px;"
			class="spinning"
		/>
	{:else}
		<img
			src="{base}/images/mrwhiskers-grey.svg"
			alt=""
			width={size}
			height={size}
			style="width: {size}px; height: {size}px; min-width: {size}px; min-height: {size}px;"
		/>
	{/if}
</span>

<style>
	.whiskers-head {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: middle;
		cursor: default;
	}

	.whiskers-head.inline {
		margin: 0 0.15em;
	}

	.whiskers-head img {
		transition: transform 0.3s ease;
	}

	.whiskers-head.hovered img.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
