/**
 * Calculates word count and estimated reading time for text content
 */

export interface ReadingTimeResult {
	wordCount: number;
	readingTime: number; // in minutes
	readingTimeText: string; // formatted string like "5 min read"
}

/**
 * Calculate word count and reading time from markdown/HTML content
 * @param content - The text content (markdown or HTML)
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns ReadingTimeResult object with word count and reading time
 */
export function calculateReadingTime(
	content: string,
	wordsPerMinute: number = 200
): ReadingTimeResult {
	// Remove HTML tags
	const textOnly = content.replace(/<[^>]*>/g, ' ');

	// Remove markdown syntax (links, images, etc.)
	const cleanText = textOnly
		.replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
		.replace(/\[.*?\]\(.*?\)/g, '') // Remove links but keep text
		.replace(/```[\s\S]*?```/g, '') // Remove code blocks
		.replace(/`[^`]*`/g, '') // Remove inline code
		.replace(/#{1,6}\s/g, '') // Remove heading markers
		.replace(/[*_~]{1,3}/g, '') // Remove emphasis markers
		.replace(/^\s*[-*+]\s/gm, '') // Remove list markers
		.replace(/^\s*\d+\.\s/gm, ''); // Remove numbered list markers

	// Count words (split by whitespace and filter empty strings)
	const words = cleanText
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0);

	const wordCount = words.length;

	// Calculate reading time in minutes (rounded up)
	const readingTime = Math.ceil(wordCount / wordsPerMinute);

	// Format reading time text
	const readingTimeText = readingTime === 1 ? '1 min read' : `${readingTime} min read`;

	return {
		wordCount,
		readingTime,
		readingTimeText
	};
}

/**
 * Format word count for display
 * @param count - The word count
 * @returns Formatted string like "1,234 words"
 */
export function formatWordCount(count: number): string {
	return `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'}`;
}
