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
	class="logo-icon"
	class:inline
	class:hovered={isHovered}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	role="img"
	aria-label="atsignhandle icon"
>
	<img
		src="{base}/images/mrwhiskers-me.svg"
		alt=""
		width={size}
		height={size}
		style="width: {size}px; height: {size}px; min-width: {size}px; min-height: {size}px;"
		class:spinning={isHovered}
	/>
</span>

<style>
	.logo-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: middle;
		cursor: default;
	}

	.logo-icon.inline {
		margin: 0 0.15em;
	}

	.logo-icon img {
		transition: transform 0.3s ease;
		opacity: 0.6;
	}

	.logo-icon.hovered img {
		opacity: 1;
	}

	.logo-icon img.spinning {
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
