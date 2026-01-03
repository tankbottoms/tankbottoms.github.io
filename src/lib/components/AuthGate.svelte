<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let authState = $state($auth);
	let initialized = $state(false);
	let passwordInput = $state('');
	let passwordError = $state('');
	let logoSpinning = $state(false);

	// Subscribe to auth store changes
	auth.subscribe((value) => {
		authState = value;
	});

	onMount(() => {
		if (browser) {
			auth.initialize();
			initialized = true;
		}
	});

	function handlePasswordSubmit(e: Event) {
		e.preventDefault();
		passwordError = '';

		if (auth.verifyPassword(passwordInput)) {
			auth.authenticate();
		} else {
			passwordError = 'Incorrect password';
			passwordInput = '';
			// Trigger logo spin on error
			logoSpinning = true;
			setTimeout(() => logoSpinning = false, 1000);
		}
	}
</script>

{#if !browser || !initialized}
	<!-- Loading state -->
	<div class="auth-loading">
		<img src="{base}/images/mrwhiskers-cat.svg" alt="" class="loading-logo spinning" />
	</div>
{:else if !authState.isAuthenticated}
	<!-- Password entry screen -->
	<div class="auth-container">
		<div class="auth-card">
			<div class="auth-logo-container">
				<img
					src="{base}/images/mrwhiskers-cat.svg"
					alt=""
					class="auth-logo"
					class:spinning={logoSpinning}
				/>
			</div>

			<h1 class="auth-title">Mr. Whiskers Blog</h1>
			<p class="auth-subtitle">Enter password to access</p>

			<form onsubmit={handlePasswordSubmit} class="auth-form">
				<input
					type="password"
					bind:value={passwordInput}
					placeholder="Password"
					class="auth-input"
					autocomplete="current-password"
				/>
				{#if passwordError}
					<p class="auth-error">{passwordError}</p>
				{/if}
				<button type="submit" class="auth-submit">
					<i class="fat fa-right-to-bracket"></i>
					Enter
				</button>
			</form>
		</div>
	</div>
{:else}
	<!-- Authenticated - render children -->
	{@render children()}
{/if}

<style>
	.auth-loading {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg);
	}

	.loading-logo {
		width: 80px;
		height: 80px;
	}

	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg);
		padding: 1rem;
	}

	.auth-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2.5rem;
		max-width: 380px;
		width: 100%;
		text-align: center;
	}

	.auth-logo-container {
		margin-bottom: 1.5rem;
	}

	.auth-logo {
		width: 100px;
		height: 100px;
		transition: transform 0.3s ease;
	}

	.auth-logo.spinning {
		animation: spin 1s linear;
	}

	.spinning {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.auth-title {
		font-family: var(--font-serif);
		font-size: 1.75rem;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.auth-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-muted);
		margin: 0 0 1.5rem 0;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 5px;
		background: var(--color-bg);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 1rem;
		text-align: center;
		letter-spacing: 0.1em;
		box-sizing: border-box;
	}

	.auth-input:focus {
		outline: none;
		border-color: var(--color-border-dark);
		box-shadow: 0 0 0 2px var(--color-shadow);
	}

	.auth-input::placeholder {
		letter-spacing: normal;
		color: var(--color-text-muted);
	}

	.auth-error {
		color: #c62828;
		font-size: 0.875rem;
		margin: 0;
	}

	.auth-submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background: var(--color-text);
		color: var(--color-bg);
		border: none;
		border-radius: 5px;
		font-family: var(--font-mono);
		font-size: 1rem;
		cursor: pointer;
		transition: opacity 0.2s, transform 0.1s;
	}

	.auth-submit:hover {
		opacity: 0.9;
	}

	.auth-submit:active {
		transform: translateY(1px);
	}

	@media (max-width: 480px) {
		.auth-card {
			padding: 1.5rem;
		}

		.auth-logo {
			width: 80px;
			height: 80px;
		}
	}
</style>
