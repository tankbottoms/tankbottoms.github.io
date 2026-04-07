export const prerender = true;

// Generate entries for prerendering all research categories
export async function entries() {
	// These are the category IDs from research-categories.json
	const categoryIds = [
		'embedded-systems',
		'patents',
		'content-delivery',
		'mobile-payments',
		'web3-blockchain',
		'ai-llm',
		'legal-forensics',
		'cryptography'
	];

	return categoryIds.map((slug) => ({ slug }));
}

export async function load({ params, parent }) {
	const parentData = await parent();

	// Load categories
	let categories: any[] = [];
	try {
		const response = await fetch('/json/research-categories.json');
		const data = await response.json();
		categories = data.categories || [];
	} catch {
		// Categories will be loaded client-side
	}

	return {
		...parentData,
		categories,
		slug: params.slug
	};
}
