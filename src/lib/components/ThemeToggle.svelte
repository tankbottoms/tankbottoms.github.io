<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
</script>

<button class="theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
	{#if $theme === 'light'}
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="10" cy="10" r="4" fill="currentColor"/>
			<line x1="10" y1="1" x2="10" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="10" y1="17" x2="10" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="1" y1="10" x2="3" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="17" y1="10" x2="19" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="3.5" y1="3.5" x2="5" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="15" y1="15" x2="16.5" y2="16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="3.5" y1="16.5" x2="5" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			<line x1="15" y1="5" x2="16.5" y2="3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
	{:else}
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M17 11.5C16.1 13.4 14.1 15 11.5 15C8 15 5 12 5 8.5C5 6.4 6.1 4.6 7.8 3.5C4.5 4 2 7 2 10.5C2 14.6 5.4 18 9.5 18C13 18 15.9 15.6 17 12.3L17 11.5Z" fill="currentColor"/>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text);
		transition: opacity 0.2s;
	}

	.theme-toggle:hover {
		opacity: 0.7;
	}
</style>
