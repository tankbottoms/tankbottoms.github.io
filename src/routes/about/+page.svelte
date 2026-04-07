<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import ContactPopup from '$lib/components/ContactPopup.svelte';

	let showContact = $state(false);

	type ResearchCategory = {
		id: string;
		name: string;
		shortName: string;
		description: string;
		color: string;
		icon: string;
	};

	let categories = $state<ResearchCategory[]>([]);

	onMount(async () => {
		try {
			const response = await fetch(`${base}/json/research-categories.json`);
			const data = await response.json();
			categories = data.categories || [];
		} catch {}
	});
</script>

<svelte:head>
	<title>About | atsignhandle.xyz</title>
	<meta name="description" content="Development portfolio spanning embedded systems, content delivery, mobile payments, Web3, AI/LLM tooling, and legal tech" />
</svelte:head>

<div class="about-page">
	<div class="about-content">
		<div class="hero-section">
			<img src="{base}/images/mrwhiskers-me.svg" alt="atsignhandle" class="hero-image" />
			<div class="hero-text">
				<h1>atsignhandle.xyz</h1>
				<p class="subtitle">Development and Interests</p>
			</div>
		</div>

		<p class="narrative">
			This portfolio documents work across embedded systems, enterprise content delivery, mobile payments, blockchain, AI/LLM tooling, and legal technology. Browse the timeline for patents, products, and open source projects spanning these domains.
		</p>

		<section class="interests-section">
			<h2><i class="fat fa-layer-group"></i> Categories</h2>
			{#if categories.length > 0}
				<div class="interest-badges">
					{#each categories as category}
						<a
							href="{base}/research/{category.id}"
							class="interest-badge"
							style="--badge-color: {category.color};"
							title="{category.description}"
						>
							<i class="fat {category.icon}"></i>
							{category.name}
						</a>
					{/each}
				</div>
			{:else}
				<div class="interest-badges">
					<span class="interest-badge" style="--badge-color: #1565c0;"><i class="fat fa-microchip"></i> Embedded Systems</span>
					<span class="interest-badge" style="--badge-color: #6a1b9a;"><i class="fat fa-file-certificate"></i> Patents</span>
					<span class="interest-badge" style="--badge-color: #e65100;"><i class="fat fa-store"></i> Content Delivery</span>
					<span class="interest-badge" style="--badge-color: #00838f;"><i class="fat fa-mobile-screen-button"></i> Mobile Payments</span>
					<span class="interest-badge" style="--badge-color: #7b1fa2;"><i class="fat fa-cube"></i> Web3/NFT/DAO</span>
					<span class="interest-badge" style="--badge-color: #2e7d32;"><i class="fat fa-brain"></i> AI/LLM Tools</span>
					<span class="interest-badge" style="--badge-color: #c62828;"><i class="fat fa-scale-balanced"></i> Legal Tech</span>
					<span class="interest-badge" style="--badge-color: #37474f;"><i class="fat fa-shield-halved"></i> Cryptography</span>
				</div>
			{/if}
		</section>

		<section class="contact-section">
			<h2><i class="fat fa-envelope"></i> Contact</h2>
			<p>
				For inquiries about consulting, collaboration, or licensing, please get in touch.
			</p>
			<button class="contact-button" onclick={() => showContact = true}>
				<i class="fat fa-paper-plane"></i> Send a Message
			</button>
		</section>
	</div>
</div>

{#if showContact}
	<ContactPopup onClose={() => showContact = false} />
{/if}

<style>
	.about-page {
		max-width: 750px;
		margin: 0 auto;
		padding: 1rem 0;
	}

	.hero-section {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.hero-image {
		width: 80px;
		height: 80px;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 2rem;
		margin: 0;
		color: var(--color-text);
	}

	.subtitle {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin: 0.25rem 0 0 0;
	}

	.narrative {
		line-height: 1.7;
		color: var(--color-text);
		margin-bottom: 1rem;
		font-size: 0.95rem;
	}

	section {
		margin-top: 2rem;
		margin-bottom: 2rem;
	}

	h2 {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		color: var(--color-text);
		margin-bottom: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	h2 i {
		color: var(--color-text-muted);
		font-size: 1rem;
	}

	.interest-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.interest-badge {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--badge-color);
		border-radius: 3px;
		background: color-mix(in srgb, var(--badge-color) 12%, transparent);
		color: var(--badge-color);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		transition: all 0.15s ease;
		cursor: pointer;
	}

	.interest-badge:hover {
		transform: translateY(-1px);
		box-shadow: 2px 2px 0px var(--color-shadow);
		background: color-mix(in srgb, var(--badge-color) 20%, transparent);
	}

	.interest-badge i {
		font-size: 0.85rem;
	}

	.contact-section p {
		color: var(--color-text);
		margin-bottom: 1rem;
		line-height: 1.6;
		font-size: 0.95rem;
	}

	.contact-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.contact-button:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	@media (max-width: 640px) {
		.hero-section {
			gap: 1rem;
		}

		.hero-image {
			width: 60px;
			height: 60px;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
