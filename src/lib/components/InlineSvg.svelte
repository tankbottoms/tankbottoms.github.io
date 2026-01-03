<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		alt?: string;
		class?: string;
		style?: string;
	}

	let { src, alt = '', class: className = '', style = '' }: Props = $props();
	let svgContent = $state('');
	let containerRef: HTMLDivElement;

	onMount(async () => {
		try {
			const response = await fetch(src);
			if (response.ok) {
				let svg = await response.text();

				// Replace hardcoded colors with CSS variables for chart elements
				// Accumulation phase colors
				svg = svg.replace(/fill="#9bf6ff"/g, 'fill="var(--chart-accumulation, #9bf6ff)"');
				svg = svg.replace(/fill="#caffbf"/g, 'fill="var(--chart-accumulation-line, #caffbf)"');
				svg = svg.replace(/stroke="#caffbf"/g, 'stroke="var(--chart-accumulation-line, #caffbf)"');
				svg = svg.replace(/fill="#e9ecef"/g, 'fill="var(--chart-accumulation, #e9ecef)"');
				svg = svg.replace(/stroke="#ced4da"/g, 'stroke="var(--chart-accumulation-line, #ced4da)"');

				// Pump phase colors
				svg = svg.replace(/fill="#ffadad"/g, 'fill="var(--chart-pump, #ffadad)"');
				svg = svg.replace(/fill="#ef9a9a"/g, 'fill="var(--chart-pump-line, #ef9a9a)"');
				svg = svg.replace(/stroke="#ef9a9a"/g, 'stroke="var(--chart-pump-line, #ef9a9a)"');

				// Dump phase colors
				svg = svg.replace(/fill="#ffc6ff"/g, 'fill="var(--chart-dump, #ffc6ff)"');
				svg = svg.replace(/stroke="#ffc6ff"/g, 'stroke="var(--chart-dump-line, #ffc6ff)"');

				// Volume bar colors
				svg = svg.replace(/fill="#90caf9"/g, 'fill="var(--chart-volume-low, #90caf9)"');

				// Event marker colors
				svg = svg.replace(/fill="#a0c4ff"/g, 'fill="var(--chart-event-1, #a0c4ff)"');
				svg = svg.replace(/stroke="#a0c4ff"/g, 'stroke="var(--chart-event-1, #a0c4ff)"');
				svg = svg.replace(/fill="#ffcc80"/g, 'fill="var(--chart-event-2, #ffcc80)"');
				svg = svg.replace(/stroke="#ffcc80"/g, 'stroke="var(--chart-event-2, #ffcc80)"');
				svg = svg.replace(/fill="#bdb2ff"/g, 'fill="var(--chart-event-3, #bdb2ff)"');
				svg = svg.replace(/stroke="#bdb2ff"/g, 'stroke="var(--chart-event-3, #bdb2ff)"');

				svgContent = svg;
			}
		} catch (error) {
			console.error('Failed to load SVG:', src, error);
		}
	});
</script>

<div
	bind:this={containerRef}
	class="inline-svg {className}"
	style={style}
	role="img"
	aria-label={alt}
>
	{@html svgContent}
</div>

<style>
	.inline-svg {
		display: block;
		width: 100%;
	}

	.inline-svg :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
</style>
