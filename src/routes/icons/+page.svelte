<script lang="ts">
	import { browser } from '$app/environment';

	// Font Awesome Pro 6.1.1 Icon Showcase
	// Styles: thin (fat), light (fal), regular (far), solid (fas), duotone (fad), brands (fab)

	let copiedIcon = $state<string | null>(null);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	async function copyIconClass(prefix: string, icon: string) {
		if (!browser) return;

		const classString = `${prefix} ${icon}`;
		try {
			await navigator.clipboard.writeText(classString);
			copiedIcon = classString;

			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copiedIcon = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	const commonIcons = [
		'fa-user', 'fa-home', 'fa-heart', 'fa-star', 'fa-check', 'fa-times',
		'fa-search', 'fa-cog', 'fa-bell', 'fa-envelope', 'fa-calendar', 'fa-clock',
		'fa-file', 'fa-folder', 'fa-image', 'fa-camera', 'fa-video', 'fa-music',
		'fa-lock', 'fa-unlock', 'fa-key', 'fa-shield', 'fa-eye', 'fa-eye-slash',
		'fa-comment', 'fa-comments', 'fa-share', 'fa-bookmark', 'fa-tag', 'fa-tags',
		'fa-download', 'fa-upload', 'fa-cloud', 'fa-database', 'fa-server', 'fa-code',
		'fa-terminal', 'fa-bug', 'fa-wrench', 'fa-tools', 'fa-hammer', 'fa-screwdriver',
		'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie', 'fa-table', 'fa-list', 'fa-th',
		'fa-map', 'fa-globe', 'fa-location-dot', 'fa-compass', 'fa-plane', 'fa-car',
		'fa-building', 'fa-university', 'fa-hospital', 'fa-school', 'fa-store', 'fa-warehouse',
		'fa-gavel', 'fa-balance-scale', 'fa-file-contract', 'fa-briefcase', 'fa-handshake', 'fa-dollar-sign',
		'fa-credit-card', 'fa-wallet', 'fa-coins', 'fa-money-bill', 'fa-receipt', 'fa-calculator',
		'fa-print', 'fa-fax', 'fa-phone', 'fa-mobile', 'fa-laptop', 'fa-desktop',
		'fa-wifi', 'fa-signal', 'fa-battery-full', 'fa-plug', 'fa-power-off', 'fa-sync',
		'fa-trash', 'fa-edit', 'fa-copy', 'fa-paste', 'fa-cut', 'fa-save',
		'fa-undo', 'fa-redo', 'fa-plus', 'fa-minus', 'fa-circle', 'fa-square'
	];

	const legalIcons = [
		'fa-gavel', 'fa-balance-scale', 'fa-file-contract', 'fa-stamp', 'fa-signature',
		'fa-fingerprint', 'fa-id-card', 'fa-passport', 'fa-user-secret', 'fa-mask',
		'fa-handcuffs', 'fa-scale-balanced', 'fa-landmark', 'fa-scroll', 'fa-file-signature'
	];

	const financeIcons = [
		'fa-dollar-sign', 'fa-euro-sign', 'fa-sterling-sign', 'fa-yen-sign', 'fa-bitcoin-sign',
		'fa-coins', 'fa-money-bill', 'fa-money-bill-wave', 'fa-piggy-bank', 'fa-vault',
		'fa-chart-line', 'fa-chart-area', 'fa-arrow-trend-up', 'fa-arrow-trend-down', 'fa-percent',
		'fa-credit-card', 'fa-wallet', 'fa-sack-dollar', 'fa-hand-holding-dollar', 'fa-building-columns'
	];

	const brandIcons = [
		'fa-github', 'fa-twitter', 'fa-facebook', 'fa-instagram', 'fa-linkedin',
		'fa-youtube', 'fa-tiktok', 'fa-discord', 'fa-slack', 'fa-reddit',
		'fa-google', 'fa-apple', 'fa-microsoft', 'fa-amazon', 'fa-paypal',
		'fa-stripe', 'fa-bitcoin', 'fa-ethereum', 'fa-docker', 'fa-linux',
		'fa-windows', 'fa-chrome', 'fa-firefox', 'fa-safari', 'fa-edge',
		'fa-node', 'fa-npm', 'fa-js', 'fa-python', 'fa-rust'
	];

	const styles = [
		{ prefix: 'fat', name: 'Thin', weight: '100' },
		{ prefix: 'fal', name: 'Light', weight: '300' },
		{ prefix: 'far', name: 'Regular', weight: '400' },
		{ prefix: 'fas', name: 'Solid', weight: '900' },
		{ prefix: 'fad', name: 'Duotone', weight: '900' }
	];

	let selectedStyle = $state('fat');
	let searchTerm = $state('');
	let iconSize = $state('2x');

	const sizes = ['xs', 'sm', '1x', '2x', '3x', '4x', '5x'];

	let filteredIcons = $derived(
		commonIcons.filter(icon =>
			searchTerm === '' || icon.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Font Awesome Icons - Reference</title>
	<meta name="description" content="Font Awesome Pro 6.1.1 icon reference showing thin, light, regular, solid, duotone, and brand styles" />
</svelte:head>

<div class="page-wrapper">
	<h1><i class="fat fa-icons"></i> Font Awesome Pro 6.1.1</h1>

	<p class="intro">
		This page showcases a curated subset of Font Awesome Pro 6.1.1 icons across all available styles.
		The project default is <strong>Thin (fat)</strong> for a clean, modern outline appearance.
		<strong>Click any icon</strong> to copy its class to clipboard.
	</p>
	<p class="intro">
		<a href="https://fontawesome.com/icons" target="_blank" rel="noopener">View all 16,000+ icons on fontawesome.com</a>
	</p>

	<div class="controls">
		<div class="control-group">
			<label for="style-select">Style:</label>
			<select id="style-select" bind:value={selectedStyle}>
				{#each styles as style}
					<option value={style.prefix}>{style.name} ({style.prefix}) - weight {style.weight}</option>
				{/each}
			</select>
		</div>

		<div class="control-group">
			<label for="size-select">Size:</label>
			<select id="size-select" bind:value={iconSize}>
				{#each sizes as size}
					<option value={size}>fa-{size}</option>
				{/each}
			</select>
		</div>

		<div class="control-group">
			<label for="search">Search:</label>
			<input id="search" type="text" bind:value={searchTerm} placeholder="Filter icons..." />
		</div>
	</div>

	{#if copiedIcon}
		<div class="copy-toast">
			Copied: <code>{copiedIcon}</code>
		</div>
	{/if}

	<section class="icon-section">
		<h2><i class="{selectedStyle} fa-shapes"></i> Common Icons ({filteredIcons.length})</h2>
		<p class="usage-hint">
			Usage: <code>&lt;i class="{selectedStyle} {filteredIcons[0] || 'fa-icon'}"&gt;&lt;/i&gt;</code>
			<span class="click-hint">Click any icon to copy its class</span>
		</p>
		<div class="icon-grid">
			{#each filteredIcons as icon}
				<button
					type="button"
					class="icon-card"
					class:copied={copiedIcon === `${selectedStyle} ${icon}`}
					title="Click to copy: {selectedStyle} {icon}"
					onclick={() => copyIconClass(selectedStyle, icon)}
				>
					<i class="{selectedStyle} {icon} fa-{iconSize}"></i>
					<span class="icon-name">{icon.replace('fa-', '')}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="icon-section">
		<h2><i class="{selectedStyle} fa-gavel"></i> Legal & Justice</h2>
		<div class="icon-grid">
			{#each legalIcons as icon}
				<button
					type="button"
					class="icon-card"
					class:copied={copiedIcon === `${selectedStyle} ${icon}`}
					title="Click to copy: {selectedStyle} {icon}"
					onclick={() => copyIconClass(selectedStyle, icon)}
				>
					<i class="{selectedStyle} {icon} fa-{iconSize}"></i>
					<span class="icon-name">{icon.replace('fa-', '')}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="icon-section">
		<h2><i class="{selectedStyle} fa-chart-line"></i> Finance & Business</h2>
		<div class="icon-grid">
			{#each financeIcons as icon}
				<button
					type="button"
					class="icon-card"
					class:copied={copiedIcon === `${selectedStyle} ${icon}`}
					title="Click to copy: {selectedStyle} {icon}"
					onclick={() => copyIconClass(selectedStyle, icon)}
				>
					<i class="{selectedStyle} {icon} fa-{iconSize}"></i>
					<span class="icon-name">{icon.replace('fa-', '')}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="icon-section">
		<h2><i class="fab fa-font-awesome"></i> Brand Icons (fab only)</h2>
		<p class="usage-hint">
			Brand icons only use the <code>fab</code> prefix: <code>&lt;i class="fab fa-github"&gt;&lt;/i&gt;</code>
		</p>
		<div class="icon-grid">
			{#each brandIcons as icon}
				<button
					type="button"
					class="icon-card"
					class:copied={copiedIcon === `fab ${icon}`}
					title="Click to copy: fab {icon}"
					onclick={() => copyIconClass('fab', icon)}
				>
					<i class="fab {icon} fa-{iconSize}"></i>
					<span class="icon-name">{icon.replace('fa-', '')}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="icon-section">
		<h2><i class="fat fa-table"></i> Style Comparison</h2>
		<p class="intro">Same icons across all styles for comparison:</p>
		<table class="comparison-table">
			<thead>
				<tr>
					<th>Icon</th>
					{#each styles as style}
						<th>{style.name}<br/><code>{style.prefix}</code></th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each ['fa-user', 'fa-heart', 'fa-star', 'fa-gavel', 'fa-lock', 'fa-chart-line'] as icon}
					<tr>
						<td class="icon-label">{icon.replace('fa-', '')}</td>
						{#each styles as style}
							<td><i class="{style.prefix} {icon} fa-2x"></i></td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</div>

<style>
	.page-wrapper {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 2rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	h1 i {
		color: var(--color-text-muted);
	}

	h2 {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		padding-left: 0.75rem;
		border-left: 4px solid var(--color-border-dark);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	h2 i {
		color: var(--color-text-muted);
	}

	.intro {
		color: var(--color-text-muted);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-group label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.control-group select,
	.control-group input {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		background: var(--color-bg);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}

	.control-group input {
		width: 150px;
	}

	.icon-section {
		margin-bottom: 3rem;
	}

	.usage-hint {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.usage-hint code {
		background: var(--color-bg-secondary);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.75rem;
	}

	.copy-toast {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		padding: 0.75rem 1.25rem;
		background: var(--color-text);
		color: var(--color-bg);
		border-radius: 5px;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		z-index: 1000;
		animation: toast-in 0.2s ease-out;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.copy-toast code {
		background: rgba(255, 255, 255, 0.2);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		margin-left: 0.25rem;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.click-hint {
		display: inline-block;
		margin-left: 1rem;
		padding: 0.2rem 0.5rem;
		background: var(--color-featured-bg);
		border: 1px solid var(--color-featured-border);
		border-radius: 3px;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.icon-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem 0.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		transition: all 0.2s;
		cursor: pointer;
		min-height: 80px;
		font-family: inherit;
	}

	.icon-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
		transform: translateY(-2px);
	}

	.icon-card.copied {
		border-color: #4caf50;
		background: rgba(76, 175, 80, 0.1);
	}

	.icon-card:active {
		transform: translateY(0);
		box-shadow: 1px 1px 0px var(--color-shadow);
	}

	.icon-card i {
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.icon-name {
		font-size: 0.65rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		text-align: center;
		word-break: break-word;
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	.comparison-table th,
	.comparison-table td {
		padding: 1rem;
		text-align: center;
		border: 1px solid var(--color-border);
	}

	.comparison-table th {
		background: var(--color-bg-secondary);
		font-family: var(--font-serif);
		font-weight: 600;
	}

	.comparison-table th code {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.comparison-table td i {
		color: var(--color-text);
	}

	.icon-label {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		text-align: left !important;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.controls {
			flex-direction: column;
		}

		.icon-grid {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		}

		.comparison-table {
			font-size: 0.8rem;
		}

		.comparison-table th,
		.comparison-table td {
			padding: 0.5rem;
		}
	}
</style>
