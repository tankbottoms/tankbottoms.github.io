/**
 * Diagram Modal Utility
 * Enables click-to-expand functionality for diagram images
 */

let modalOverlay: HTMLDivElement | null = null;
let modalImage: HTMLImageElement | null = null;
let isInitialized = false;

/**
 * Create the modal overlay element
 */
function createModal(): void {
	if (modalOverlay) return;

	modalOverlay = document.createElement('div');
	modalOverlay.className = 'diagram-modal-overlay';
	modalOverlay.setAttribute('role', 'dialog');
	modalOverlay.setAttribute('aria-modal', 'true');
	modalOverlay.setAttribute('tabindex', '-1');

	const closeButton = document.createElement('button');
	closeButton.className = 'diagram-modal-close';
	closeButton.innerHTML = '×';
	closeButton.setAttribute('aria-label', 'Close modal');
	closeButton.addEventListener('click', closeModal);

	modalImage = document.createElement('img');
	modalImage.alt = 'Enlarged diagram';

	const hint = document.createElement('div');
	hint.className = 'diagram-modal-hint';
	hint.textContent = 'Click anywhere or press ESC to close';

	modalOverlay.appendChild(closeButton);
	modalOverlay.appendChild(modalImage);
	modalOverlay.appendChild(hint);

	modalOverlay.addEventListener('click', (e) => {
		if (e.target === modalOverlay) {
			closeModal();
		}
	});

	document.body.appendChild(modalOverlay);
}

/**
 * Open the modal with the given image source
 */
function openModal(src: string, alt: string): void {
	if (!modalOverlay || !modalImage) {
		createModal();
	}

	if (modalImage) {
		modalImage.src = src;
		modalImage.alt = alt || 'Enlarged diagram';
	}

	if (modalOverlay) {
		modalOverlay.classList.add('active');
		modalOverlay.focus();
		document.body.style.overflow = 'hidden';
	}

	document.addEventListener('keydown', handleKeyDown);
}

/**
 * Close the modal
 */
function closeModal(): void {
	if (modalOverlay) {
		modalOverlay.classList.remove('active');
		document.body.style.overflow = '';
	}

	document.removeEventListener('keydown', handleKeyDown);
}

/**
 * Handle keyboard events
 */
function handleKeyDown(e: KeyboardEvent): void {
	if (e.key === 'Escape') {
		closeModal();
	}
}

/**
 * Handle image click
 */
function handleImageClick(e: Event): void {
	const img = e.currentTarget as HTMLImageElement;
	openModal(img.src, img.alt);
}

/**
 * Initialize diagram modal functionality
 * Call this in onMount of pages with diagrams
 */
export function initDiagramModal(): () => void {
	if (typeof window === 'undefined') return () => {};

	createModal();

	const images = document.querySelectorAll<HTMLImageElement>(
		'.svg-container img, .media-center img[src*="infographic"]'
	);

	images.forEach((img) => {
		img.addEventListener('click', handleImageClick);
	});

	isInitialized = true;

	// Return cleanup function
	return () => {
		images.forEach((img) => {
			img.removeEventListener('click', handleImageClick);
		});
		document.removeEventListener('keydown', handleKeyDown);
	};
}

/**
 * Cleanup modal from DOM
 */
export function destroyDiagramModal(): void {
	if (modalOverlay && modalOverlay.parentNode) {
		modalOverlay.parentNode.removeChild(modalOverlay);
		modalOverlay = null;
		modalImage = null;
	}
	isInitialized = false;
}
