<script lang="ts">
	interface ContactInfo {
		name: string;
		fullName: string;
		aliases: string[];
		barNumber?: string;
		barStatus?: string;
		locations: string[];
		identifiers: { label: string; value: string }[];
		notes: string[];
	}

	let { visible = false, contact = null, onClose } = $props<{
		visible: boolean;
		contact: ContactInfo | null;
		onClose: () => void;
	}>();

	function handleBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('popup-backdrop')) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible && contact}
	<div class="popup-backdrop" onclick={handleBackdropClick} role="presentation">
		<div class="popup-container">
			<button class="close-button" onclick={onClose} aria-label="Close popup">
				<i class="fas fa-times"></i>
			</button>

			<div class="popup-header">
				<h2>{contact.name}</h2>
				<div class="full-name">{contact.fullName}</div>
			</div>

			{#if contact.aliases.length > 0}
				<div class="popup-section">
					<h3><i class="fas fa-user-secret"></i> Known Aliases</h3>
					<ul class="alias-list">
						{#each contact.aliases as alias}
							<li>{alias}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if contact.barNumber}
				<div class="popup-section">
					<h3><i class="fas fa-balance-scale"></i> Bar Registration</h3>
					<div class="bar-info">
						<span class="bar-number">Nevada State Bar #{contact.barNumber}</span>
						<span class="bar-status" class:inactive={contact.barStatus === 'Inactive'}>{contact.barStatus}</span>
					</div>
				</div>
			{/if}

			{#if contact.locations.length > 0}
				<div class="popup-section">
					<h3><i class="fas fa-map-marker-alt"></i> Known Locations</h3>
					<ul class="location-list">
						{#each contact.locations as location}
							<li>{location}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if contact.identifiers.length > 0}
				<div class="popup-section">
					<h3><i class="fas fa-fingerprint"></i> Identifiers</h3>
					<div class="identifiers-grid">
						{#each contact.identifiers as id}
							<div class="identifier">
								<span class="id-label">{id.label}:</span>
								<span class="id-value">{id.value}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if contact.notes.length > 0}
				<div class="popup-section">
					<h3><i class="fas fa-sticky-note"></i> Notes</h3>
					<ul class="notes-list">
						{#each contact.notes as note}
							<li>{note}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		animation: fade-in 0.2s ease-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.popup-container {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 8px 8px 0px var(--color-shadow);
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		padding: 1.5rem;
		position: relative;
		animation: slide-up 0.3s ease-out;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.25rem;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0.25rem;
		transition: all 0.2s;
	}

	.close-button:hover {
		color: var(--color-text);
		transform: scale(1.1);
	}

	.popup-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.popup-header h2 {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		margin: 0 0 0.25rem 0;
		color: var(--color-text);
	}

	.full-name {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.popup-section {
		margin-bottom: 1.25rem;
	}

	.popup-section h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.popup-section h3 i {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.alias-list, .location-list, .notes-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.alias-list li, .location-list li, .notes-list li {
		font-size: 0.85rem;
		color: var(--color-text);
		padding: 0.25rem 0;
		padding-left: 1rem;
		position: relative;
	}

	.alias-list li::before, .location-list li::before, .notes-list li::before {
		content: '-';
		position: absolute;
		left: 0;
		color: var(--color-text-muted);
	}

	.bar-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.bar-number {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-text);
	}

	.bar-status {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-weight: 600;
		background: #4caf5020;
		color: #4caf50;
		border: 1px solid #4caf50;
	}

	.bar-status.inactive {
		background: #ef535020;
		color: #ef5350;
		border-color: #ef5350;
	}

	.identifiers-grid {
		display: grid;
		gap: 0.5rem;
	}

	.identifier {
		display: flex;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.id-label {
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.id-value {
		font-family: var(--font-mono);
		color: var(--color-text);
	}

	.notes-list li {
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	@media (max-width: 640px) {
		.popup-container {
			padding: 1rem;
			margin: 1rem;
		}

		.popup-header h2 {
			font-size: 1.25rem;
		}
	}
</style>
