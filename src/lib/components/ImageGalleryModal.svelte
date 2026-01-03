<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	interface GalleryImage {
		src: string;
		caption: string;
	}

	interface Props {
		visible: boolean;
		images: GalleryImage[];
		title: string;
		onClose: () => void;
	}

	let { visible = false, images = [], title = '', onClose }: Props = $props();
	let currentIndex = $state(0);
	let modalElement: HTMLDivElement | undefined = $state(undefined);

	function handleKeyDown(e: KeyboardEvent) {
		if (!visible) return;

		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			nextImage();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			prevImage();
		}
	}

	function nextImage() {
		if (images.length > 0) {
			currentIndex = (currentIndex + 1) % images.length;
		}
	}

	function prevImage() {
		if (images.length > 0) {
			currentIndex = (currentIndex - 1 + images.length) % images.length;
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === modalElement) {
			onClose();
		}
	}

	function selectImage(index: number) {
		currentIndex = index;
	}

	$effect(() => {
		if (browser && visible) {
			currentIndex = 0;
			document.body.style.overflow = 'hidden';
			document.addEventListener('keydown', handleKeyDown);
		} else if (browser) {
			document.body.style.overflow = '';
			document.removeEventListener('keydown', handleKeyDown);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.body.style.overflow = '';
			document.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

{#if visible && images.length > 0}
	<div
		class="gallery-modal-overlay"
		bind:this={modalElement}
		onclick={handleOverlayClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="gallery-modal-content">
			<div class="gallery-header">
				<h3 class="gallery-title">{title}</h3>
				<button class="gallery-close" onclick={onClose} aria-label="Close gallery">×</button>
			</div>

			<div class="gallery-main">
				<button class="nav-button prev" onclick={prevImage} aria-label="Previous image">
					‹
				</button>

				<div class="image-container">
					<img
						src={images[currentIndex].src}
						alt={images[currentIndex].caption}
						class="gallery-image"
					/>
				</div>

				<button class="nav-button next" onclick={nextImage} aria-label="Next image">
					›
				</button>
			</div>

			<div class="gallery-caption">
				<span class="caption-text">{images[currentIndex].caption}</span>
				<span class="image-counter">{currentIndex + 1} / {images.length}</span>
			</div>

			<div class="gallery-thumbnails">
				{#each images as image, index}
					<button
						class="thumbnail"
						class:active={index === currentIndex}
						onclick={() => selectImage(index)}
						aria-label="View image {index + 1}"
					>
						<img src={image.src} alt={image.caption} />
					</button>
				{/each}
			</div>

			<div class="gallery-hint">
				Use arrow keys to navigate • Click outside or press ESC to close
			</div>
		</div>
	</div>
{/if}

<style>
	.gallery-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		animation: fade-in 0.2s ease-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.gallery-modal-content {
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 8px;
		box-shadow: 8px 8px 0px var(--color-shadow, rgba(0,0,0,0.15));
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: slide-up 0.2s ease-out;
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

	.gallery-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		background: var(--color-bg-secondary, #f5f5f5);
	}

	.gallery-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text, #333);
		font-family: var(--font-serif, Palatino, Georgia, serif);
		letter-spacing: 0.02em;
	}

	.gallery-close {
		background: none;
		border: none;
		font-size: 1.75rem;
		cursor: pointer;
		color: var(--color-text-muted, #666);
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.gallery-close:hover {
		background: var(--color-hover-bg, rgba(0,0,0,0.05));
		color: var(--color-text, #333);
	}

	.gallery-main {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		gap: 0.5rem;
		flex: 1;
		min-height: 0;
	}

	.nav-button {
		background: var(--color-bg-secondary, #f5f5f5);
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 4px;
		font-size: 2rem;
		cursor: pointer;
		color: var(--color-text-muted, #666);
		padding: 0.5rem 0.75rem;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.nav-button:hover {
		background: var(--color-hover-bg, rgba(0,0,0,0.05));
		border-color: var(--color-border-dark, #999);
		color: var(--color-text, #333);
	}

	.image-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		max-height: 50vh;
		overflow: hidden;
	}

	.gallery-image {
		max-width: 100%;
		max-height: 50vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 2px 2px 8px var(--color-shadow, rgba(0,0,0,0.1));
	}

	.gallery-caption {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-top: 1px solid var(--color-border, #e0e0e0);
	}

	.caption-text {
		font-size: 0.875rem;
		color: var(--color-text, #333);
	}

	.image-counter {
		font-size: 0.75rem;
		color: var(--color-text-muted, #666);
		font-family: var(--font-mono, monospace);
	}

	.gallery-thumbnails {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		overflow-x: auto;
		background: var(--color-bg, #fff);
		border-top: 1px solid var(--color-border, #e0e0e0);
	}

	.thumbnail {
		flex-shrink: 0;
		width: 60px;
		height: 60px;
		padding: 0;
		border: 2px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		overflow: hidden;
		transition: all 0.2s;
		opacity: 0.6;
		background: none;
	}

	.thumbnail:hover {
		opacity: 1;
		border-color: var(--color-border-dark, #999);
	}

	.thumbnail.active {
		opacity: 1;
		border-color: var(--color-link, #1565c0);
		box-shadow: 2px 2px 0px var(--color-shadow, rgba(0,0,0,0.1));
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.gallery-hint {
		text-align: center;
		padding: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-muted, #666);
		background: var(--color-bg-secondary, #f5f5f5);
		border-top: 1px solid var(--color-border, #e0e0e0);
	}

	@media (max-width: 640px) {
		.gallery-modal-content {
			max-width: 95vw;
			max-height: 95vh;
		}

		.nav-button {
			padding: 0.25rem 0.5rem;
			font-size: 1.5rem;
		}

		.gallery-image {
			max-height: 40vh;
		}

		.gallery-thumbnails {
			padding: 0.5rem;
		}

		.thumbnail {
			width: 48px;
			height: 48px;
		}
	}
</style>
