import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PaletteColor {
	name: string;
	hex: string;
}

export interface Palette {
	id: string;
	name: string;
	colors: PaletteColor[];
}

// Chart-specific colors for each palette
export interface ChartColors {
	accumulation: string;
	accumulationLine: string;
	pump: string;
	pumpLine: string;
	dump: string;
	dumpLine: string;
	volumeLow: string;
	volumeHigh: string;
	event1: string;
	event2: string;
	event3: string;
}

export interface PaletteWithCharts extends Palette {
	chartColors: ChartColors;
}

export const palettes: PaletteWithCharts[] = [
	{
		id: 'greyscale',
		name: 'Greyscale',
		colors: [
			{ name: 'White', hex: '#f8f9fa' },
			{ name: 'Light Grey 1', hex: '#e9ecef' },
			{ name: 'Light Grey 2', hex: '#dee2e6' },
			{ name: 'Grey 1', hex: '#ced4da' },
			{ name: 'Grey 2', hex: '#adb5bd' },
			{ name: 'Grey 3', hex: '#6c757d' },
			{ name: 'Dark Grey 1', hex: '#495057' },
			{ name: 'Dark Grey 2', hex: '#343a40' },
			{ name: 'Black', hex: '#212529' }
		],
		chartColors: {
			accumulation: '#e9ecef',
			accumulationLine: '#ced4da',
			pump: '#adb5bd',
			pumpLine: '#6c757d',
			dump: '#dee2e6',
			dumpLine: '#adb5bd',
			volumeLow: '#ced4da',
			volumeHigh: '#6c757d',
			event1: '#adb5bd',
			event2: '#6c757d',
			event3: '#495057'
		}
	},
	{
		id: 'colorful',
		name: 'Colorful',
		colors: [
			{ name: 'Deep Blue', hex: '#0450b4' },
			{ name: 'Royal Blue', hex: '#046dc8' },
			{ name: 'Teal Blue', hex: '#1184a7' },
			{ name: 'Teal', hex: '#15a2a2' },
			{ name: 'Sage Green', hex: '#6fb1a0' },
			{ name: 'Magenta', hex: '#b4418e' },
			{ name: 'Pink', hex: '#d94a8c' },
			{ name: 'Coral', hex: '#ea515f' },
			{ name: 'Orange', hex: '#fe7434' },
			{ name: 'Amber', hex: '#fea802' }
		],
		chartColors: {
			accumulation: '#9bf6ff',
			accumulationLine: '#caffbf',
			pump: '#ffadad',
			pumpLine: '#ef9a9a',
			dump: '#ffc6ff',
			dumpLine: '#ffc6ff',
			volumeLow: '#90caf9',
			volumeHigh: '#ffadad',
			event1: '#a0c4ff',
			event2: '#ffcc80',
			event3: '#bdb2ff'
		}
	}
];

function createPaletteStore() {
	const defaultPaletteId = 'greyscale';
	const storedPaletteId = browser ? localStorage.getItem('selectedPalette') || defaultPaletteId : defaultPaletteId;

	// Validate stored palette ID exists
	const validPaletteId = palettes.find(p => p.id === storedPaletteId) ? storedPaletteId : defaultPaletteId;

	const { subscribe, set, update } = writable<string>(validPaletteId);

	return {
		subscribe,
		setPalette: (paletteId: string) => {
			if (browser) {
				localStorage.setItem('selectedPalette', paletteId);
				applyPalette(paletteId);
			}
			set(paletteId);
		},
		initialize: () => {
			if (browser) {
				applyPalette(validPaletteId);
			}
		}
	};
}

function applyPalette(paletteId: string) {
	const palette = palettes.find(p => p.id === paletteId);
	if (!palette || !browser) return;

	const root = document.documentElement;

	// Apply palette colors as CSS variables
	palette.colors.forEach((color, index) => {
		root.style.setProperty(`--palette-${index + 1}`, color.hex);
	});

	// Set primary accent colors from palette
	if (palette.colors.length >= 10) {
		root.style.setProperty('--palette-primary', palette.colors[0].hex);
		root.style.setProperty('--palette-secondary', palette.colors[4].hex);
		root.style.setProperty('--palette-accent', palette.colors[9].hex);
	} else if (palette.colors.length >= 6) {
		root.style.setProperty('--palette-primary', palette.colors[0].hex);
		root.style.setProperty('--palette-secondary', palette.colors[3].hex);
		root.style.setProperty('--palette-accent', palette.colors[5].hex);
	}

	// Apply chart-specific colors
	if (palette.chartColors) {
		root.style.setProperty('--chart-accumulation', palette.chartColors.accumulation);
		root.style.setProperty('--chart-accumulation-line', palette.chartColors.accumulationLine);
		root.style.setProperty('--chart-pump', palette.chartColors.pump);
		root.style.setProperty('--chart-pump-line', palette.chartColors.pumpLine);
		root.style.setProperty('--chart-dump', palette.chartColors.dump);
		root.style.setProperty('--chart-dump-line', palette.chartColors.dumpLine);
		root.style.setProperty('--chart-volume-low', palette.chartColors.volumeLow);
		root.style.setProperty('--chart-volume-high', palette.chartColors.volumeHigh);
		root.style.setProperty('--chart-event-1', palette.chartColors.event1);
		root.style.setProperty('--chart-event-2', palette.chartColors.event2);
		root.style.setProperty('--chart-event-3', palette.chartColors.event3);
	}
}

export const selectedPalette = createPaletteStore();

export function getPalette(id: string): Palette | undefined {
	return palettes.find(p => p.id === id);
}
