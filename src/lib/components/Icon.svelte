<script lang="ts">
	import icons from '$lib/constants/svg';

	let { name, class: className = '' } = $props();

	const iconData = $derived(icons[name as keyof typeof icons]);
	const paths = $derived(Array.isArray(iconData) ? iconData : (iconData?.paths || []));
	const viewBox = $derived((!Array.isArray(iconData) && iconData?.svg?.viewBox) || '0 0 24 24');
</script>

<svg
	class={className}
	{viewBox}
	fill="currentColor"
	height="1em"
	width="1em"
>
	{#each paths as path}
		<path d={path} />
	{/each}
</svg>

<style>
	svg {
		display: inline-block;
		vertical-align: middle;
	}
</style>