<script lang="ts">
	import { base } from '$app/paths';
	import ContactPopup from '$lib/components/ContactPopup.svelte';

	let showContact = $state(false);
</script>

<svelte:head>
	<title>About Mr. Whiskers | Mr. Whiskers Blog</title>
	<meta name="description" content="Learn about Mr. Whiskers, a distinguished feline scholar documenting observations since 2018" />
</svelte:head>

<div class="about-page">
	<h1>About Mr. Whiskers</h1>

	<div class="about-content">
		<div class="hero-section">
			<img src="{base}/images/mrwhiskers-me.svg" alt="Mr. Whiskers" class="hero-image" />
			<div class="hero-text">
				<p class="tagline">A Distinguished Feline Scholar</p>
				<p class="subtitle">Documenting observations since 2018</p>
			</div>
		</div>

		<section class="stats-section">
			<h2><i class="fat fa-trophy"></i> Achievements</h2>
			<div class="stats-grid">
				<div class="stat-card">
					<i class="fat fa-glass-water stat-icon"></i>
					<span class="stat-number">2,847</span>
					<span class="stat-label">Objects Knocked Over</span>
				</div>
				<div class="stat-card">
					<i class="fat fa-bed stat-icon"></i>
					<span class="stat-number">14,392</span>
					<span class="stat-label">Hours Napped</span>
				</div>
				<div class="stat-card">
					<i class="fat fa-music stat-icon"></i>
					<span class="stat-number">573</span>
					<span class="stat-label">3 AM Serenades</span>
				</div>
				<div class="stat-card">
					<i class="fat fa-cookie-bite stat-icon"></i>
					<span class="stat-number"><i class="fat fa-infinity"></i></span>
					<span class="stat-label">Treats Demanded</span>
				</div>
			</div>
		</section>

		<section class="bio-section">
			<h2><i class="fat fa-cat"></i> Biography</h2>
			<p>
				Mr. Whiskers is a distinguished orange tabby with a passion for scientific inquiry and a deep appreciation for the finer things in life: warm sunbeams, cardboard boxes, and the occasional slice of lasagna.
			</p>
			<p>
				Born in the spring of 2017, Mr. Whiskers quickly established himself as a keen observer of household phenomena. His groundbreaking research into optimal napping positions has been cited by cats worldwide, and his treatise on "The Physics of Knocking Objects Off Tables" remains a seminal work in the field of feline chaos theory.
			</p>
			<p>
				When not engaged in rigorous research, Mr. Whiskers can be found staring judgmentally at closed doors, demanding treats at precisely 3:47 AM, or contemplating the eternal mysteries of the red dot.
			</p>
		</section>

		<section class="interests-section">
			<h2><i class="fat fa-heart"></i> Research Interests</h2>
			<div class="interests-grid">
				<div class="interest-card">
					<h3><i class="fat fa-bed"></i> Sleep Science</h3>
					<p>Optimal napping positions, sunbeam tracking, and the art of sleeping 18 hours a day</p>
				</div>
				<div class="interest-card">
					<h3><i class="fat fa-box"></i> Box Theory</h3>
					<p>Why if I fits, I sits. A comprehensive analysis of cardboard container habitation</p>
				</div>
				<div class="interest-card">
					<h3><i class="fat fa-glass-water"></i> Applied Physics</h3>
					<p>Gravitational experiments involving objects and elevated surfaces</p>
				</div>
				<div class="interest-card">
					<h3><i class="fat fa-utensils"></i> Culinary Arts</h3>
					<p>The superior taste of lasagna and why all other foods are inferior</p>
				</div>
			</div>
		</section>

		<section class="contact-section">
			<h2><i class="fat fa-envelope"></i> Contact</h2>
			<p>
				Mr. Whiskers is available for consultations on matters of feline importance. Please note that responses may be delayed due to nap schedules.
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
		padding: 2rem 0;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 2.5rem;
		margin-bottom: 2rem;
		color: var(--color-text);
	}

	.hero-section {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 3rem;
		padding: 2rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
	}

	.hero-image {
		width: 150px;
		height: 150px;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	.hero-text {
		flex: 1;
	}

	.tagline {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	section {
		margin-bottom: 3rem;
	}

	h2 {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		color: var(--color-text);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	h2 i {
		color: var(--color-text-muted);
		font-size: 1.25rem;
	}

	.bio-section p {
		line-height: 1.7;
		color: var(--color-text);
		margin-bottom: 1rem;
	}

	.interests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.interest-card {
		padding: 1.25rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		transition: all 0.2s;
	}

	.interest-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.interest-card h3 {
		font-family: var(--font-serif);
		font-size: 1rem;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.interest-card h3 i {
		color: #9c27b0;
	}

	.interest-card p {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.stats-section {
		margin-bottom: 3rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		padding: 1.5rem 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		text-align: center;
		transition: all 0.2s;
	}

	.stat-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
		transform: translateY(-2px);
	}

	.stat-icon {
		display: block;
		font-size: 1.75rem;
		color: #9c27b0;
		margin-bottom: 0.75rem;
	}

	.stat-number {
		display: block;
		font-family: var(--font-mono);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.stat-number i {
		color: #9c27b0;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.contact-section p {
		color: var(--color-text);
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.contact-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 5px;
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.contact-button:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	@media (max-width: 640px) {
		.hero-section {
			flex-direction: column;
			text-align: center;
		}

		h1 {
			font-size: 2rem;
		}
	}
</style>
