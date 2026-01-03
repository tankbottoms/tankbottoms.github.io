<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let showModal = $state(false);

	onMount(() => {
		if (browser) {
			const consent = localStorage.getItem('cookie-consent');
			if (!consent) {
				showModal = true;
			}
		}
	});

	function acceptCookies() {
		if (browser) {
			localStorage.setItem('cookie-consent', 'accepted');
			showModal = false;
		}
	}
</script>

{#if showModal}
	<div class="modal-backdrop">
		<div class="modal">
			<h2>Privacy & Cookie Notice</h2>

			<div class="info-section">
				<h3>Welcome to Mr. Whiskers Blog</h3>
				<p>
					This blog documents the profound observations, scientific research, and daily adventures of a distinguished feline scholar.
				</p>
				<p>
					<strong>Disclaimer:</strong> All nap ratings, research findings, and feline opinions expressed on this site are purely for entertainment purposes. Any resemblance to actual scientific methodology is coincidental.
				</p>
			</div>

			<div class="privacy-section">
				<h3>Privacy & Analytics</h3>
				<p>
					This website uses cookies and collects analytics data. We store theme preferences locally and collect access logs
					(timestamps, IP addresses, user agents, referrer info, page requests). No personal data is shared with third parties.
				</p>
			</div>

			<button onclick={acceptCookies} class="accept-button">I Understand - Continue</button>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 5px;
	}

	.modal {
		background: var(--color-bg-secondary);
		border: 2px solid var(--color-border-dark);
		border-radius: 8px;
		padding: 1.5rem;
		max-width: calc(100vw - 10px);
		max-height: calc(100vh - 10px);
		width: 100%;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	@media (min-width: 768px) {
		.modal-backdrop {
			padding: 1rem;
		}

		.modal {
			max-width: 500px;
			max-height: 90vh;
			padding: 2rem;
		}
	}

	.modal h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-family: var(--font-serif);
		font-size: 1.5rem;
		color: var(--color-text);
		border-bottom: 2px solid var(--color-border-dark);
		padding-bottom: 0.5rem;
	}

	.info-section {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.info-section h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.1rem;
		font-family: var(--font-serif);
	}

	.info-section p {
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
		color: var(--color-text);
		font-size: 0.9rem;
	}

	.info-section p:last-child {
		margin-bottom: 0;
	}

	.privacy-section {
		margin-bottom: 1.5rem;
	}

	.privacy-section h3 {
		margin: 0 0 0.75rem 0;
		color: var(--color-text);
		font-size: 1.1rem;
		font-family: var(--font-serif);
	}

	.privacy-section p {
		margin: 0;
		line-height: 1.5;
		color: var(--color-text);
		font-size: 0.9rem;
	}

	.accept-button {
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: var(--color-text);
		color: var(--color-bg);
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.accept-button:hover {
		opacity: 0.9;
	}
</style>
