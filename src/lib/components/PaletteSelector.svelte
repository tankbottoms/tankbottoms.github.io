<script lang="ts">
	import { selectedPalette, palettes, getPalette } from '$lib/stores/palette';
	import { onMount } from 'svelte';

	let isOpen = $state(false);
	let currentPaletteId = $state('greyscale');

	// Subscribe to palette changes
	selectedPalette.subscribe((value) => {
		currentPaletteId = value;
	});

	onMount(() => {
		selectedPalette.initialize();
	});

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectPalette(paletteId: string) {
		selectedPalette.setPalette(paletteId);
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.palette-selector')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	const currentPalette = $derived(getPalette(currentPaletteId));
</script>

<div class="palette-selector">
	<button class="palette-toggle" onclick={toggleDropdown} aria-label="Select color palette">
		<div class="color-grid">
			{#if currentPalette}
				{#each currentPalette.colors.slice(0, 4) as color}
					<span class="color-pixel" style="background-color: {color.hex}"></span>
				{/each}
			{/if}
		</div>
	</button>

	{#if isOpen}
		<div class="palette-dropdown">
			<div class="dropdown-header">Color Palette</div>
			{#each palettes as palette}
				<button
					class="palette-option"
					class:active={palette.id === currentPaletteId}
					onclick={() => selectPalette(palette.id)}
				>
					<div class="option-grid">
						{#each palette.colors.slice(0, 4) as color}
							<span class="option-pixel" style="background-color: {color.hex}"></span>
						{/each}
					</div>
					<span class="option-name">{palette.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.palette-selector {
		position: relative;
	}

	.palette-toggle {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.2s;
	}

	.palette-toggle:hover {
		opacity: 0.7;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1px;
		width: 16px;
		height: 16px;
	}

	.color-pixel {
		width: 7px;
		height: 7px;
		border: 1px solid var(--color-border);
	}

	.palette-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
		min-width: 160px;
		z-index: 100;
	}

	.dropdown-header {
		padding: 0.5rem 0.75rem;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-mono);
	}

	.palette-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s;
	}

	.palette-option:hover {
		background: var(--color-hover-bg);
	}

	.palette-option.active {
		background: var(--color-hover-bg);
	}

	.option-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1px;
		width: 20px;
		height: 20px;
	}

	.option-pixel {
		width: 9px;
		height: 9px;
		border: 1px solid var(--color-border);
	}

	.option-name {
		font-size: 0.75rem;
		color: var(--color-text);
	}
</style>
