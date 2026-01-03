/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	theme: {
		extend: {
			fontFamily: {
				mono: ['ui-monospace', 'Cascadia Code', 'Source Code Pro', 'Menlo', 'Consolas', 'monospace'],
				serif: ['Georgia', 'Times New Roman', 'serif']
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
