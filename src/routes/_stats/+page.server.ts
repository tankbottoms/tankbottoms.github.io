import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface AccessLog {
	timestamp: string;
	timestampMs: number;
	method: string;
	path: string;
	query: string;
	origin: string;
	userAgent: string;
	referer: string;
	ip: string;
	cfRay: string | null;
	country: string | null;
	responseTime: number;
	statusCode: number;
}

interface PageView {
	path: string;
	title: string;
	views: number;
	uniqueVisitors: number;
}

interface Referrer {
	source: string;
	visits: number;
}

interface CountryStats {
	country: string;
	visits: number;
}

interface TimeSeriesPoint {
	date: string;
	views: number;
	uniqueVisitors: number;
}

interface AnalyticsData {
	totalViews: number;
	uniqueVisitors: number;
	topPages: PageView[];
	topReferrers: Referrer[];
	countries: CountryStats[];
	timeSeries: TimeSeriesPoint[];
	avgResponseTime: number;
	statusCodeBreakdown: Record<string, number>;
}

// Fetch page titles from markdown files
async function getPageTitle(path: string): Promise<string> {
	try {
		// Handle root path
		if (path === '/') {
			return 'Home';
		}

		// Handle special routes
		if (path === '/about') return 'About';
		if (path === '/research') return 'Research';
		if (path === '/search') return 'Search';

		// Extract slug from path
		let filePath: string | null = null;
		let slug: string | null = null;

		// Blog posts: /slug
		if (path.startsWith('/') && !path.includes('/research/')) {
			slug = path.substring(1);
			const postsDir = join(process.cwd(), 'src/docs/posts');
			if (existsSync(postsDir)) {
				const files = await readdir(postsDir);
				const matchingFile = files.find((f) => f.endsWith(`${slug}.md`));
				if (matchingFile) {
					filePath = join(postsDir, matchingFile);
				}
			}
		}
		// Research posts: /research/slug
		else if (path.startsWith('/research/')) {
			slug = path.replace('/research/', '');
			const researchDir = join(process.cwd(), 'src/docs/research');
			if (existsSync(researchDir)) {
				const files = await readdir(researchDir);
				const matchingFile = files.find((f) => f.endsWith(`${slug}.md`));
				if (matchingFile) {
					filePath = join(researchDir, matchingFile);
				}
			}
		}

		// Read and parse frontmatter
		if (filePath && existsSync(filePath)) {
			const content = await readFile(filePath, 'utf-8');
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
			if (frontmatterMatch) {
				const frontmatter = frontmatterMatch[1];
				const titleMatch = frontmatter.match(/title:\s*(.+)/);
				if (titleMatch) {
					return titleMatch[1].trim();
				}
			}
		}
	} catch (error) {
		console.error('Failed to get page title for', path, error);
	}

	// Fallback to path
	return path;
}

// Read all log files
async function readLogFiles(): Promise<AccessLog[]> {
	const logsDir = join(process.cwd(), 'logs');

	if (!existsSync(logsDir)) {
		return [];
	}

	const files = await readdir(logsDir);
	const logFiles = files.filter((f) => f.startsWith('access-') && f.endsWith('.jsonl'));

	const allLogs: AccessLog[] = [];

	for (const file of logFiles) {
		const content = await readFile(join(logsDir, file), 'utf-8');
		const lines = content.trim().split('\n').filter(Boolean);

		for (const line of lines) {
			try {
				const log = JSON.parse(line);
				allLogs.push(log);
			} catch (error) {
				console.error('Failed to parse log line:', error);
			}
		}
	}

	return allLogs;
}

// Aggregate analytics data
async function aggregateAnalytics(logs: AccessLog[]): Promise<AnalyticsData> {
	// Filter out /stats requests and asset requests
	const filteredLogs = logs.filter((log) => {
		// Exclude analytics page
		if (log.path.startsWith('/stats')) return false;

		// Exclude common assets
		const assetPatterns = [
			'/apple-touch-icon',
			'/favicon',
			'/robots.txt',
			'/sitemap.xml',
			'/_app/',
			'/.well-known/',
			'/images/',
			'/audio/',
			'/video/',
			'/pdfs/'
		];

		return !assetPatterns.some(pattern => log.path.startsWith(pattern));
	});

	// Total views
	const totalViews = filteredLogs.length;

	// Unique visitors (by IP)
	const uniqueIPs = new Set(filteredLogs.map((log) => log.ip));
	const uniqueVisitors = uniqueIPs.size;

	// Top pages
	const pageViews = new Map<string, Set<string>>();
	filteredLogs.forEach((log) => {
		if (!pageViews.has(log.path)) {
			pageViews.set(log.path, new Set());
		}
		pageViews.get(log.path)!.add(log.ip);
	});

	const topPagesData = Array.from(pageViews.entries())
		.map(([path, ips]) => ({
			path,
			views: filteredLogs.filter((log) => log.path === path).length,
			uniqueVisitors: ips.size
		}))
		.sort((a, b) => b.views - a.views)
		.slice(0, 10);

	// Fetch titles for top pages
	const topPages: PageView[] = await Promise.all(
		topPagesData.map(async (page) => ({
			...page,
			title: await getPageTitle(page.path)
		}))
	);

	// Top referrers
	const referrers = new Map<string, number>();
	filteredLogs.forEach((log) => {
		const ref = log.referer === 'direct' ? 'Direct' : new URL(log.referer).hostname;
		referrers.set(ref, (referrers.get(ref) || 0) + 1);
	});

	const topReferrers: Referrer[] = Array.from(referrers.entries())
		.map(([source, visits]) => ({ source, visits }))
		.sort((a, b) => b.visits - a.visits)
		.slice(0, 10);

	// Country stats
	const countries = new Map<string, number>();
	filteredLogs.forEach((log) => {
		const country = log.country || 'Unknown';
		countries.set(country, (countries.get(country) || 0) + 1);
	});

	const countryStats: CountryStats[] = Array.from(countries.entries())
		.map(([country, visits]) => ({ country, visits }))
		.sort((a, b) => b.visits - a.visits)
		.slice(0, 10);

	// Time series (daily)
	const dailyStats = new Map<string, { views: Set<string>; uniqueIPs: Set<string> }>();
	filteredLogs.forEach((log) => {
		const date = log.timestamp.split('T')[0];
		if (!dailyStats.has(date)) {
			dailyStats.set(date, { views: new Set(), uniqueIPs: new Set() });
		}
		const stats = dailyStats.get(date)!;
		stats.views.add(log.timestampMs.toString());
		stats.uniqueIPs.add(log.ip);
	});

	const timeSeries: TimeSeriesPoint[] = Array.from(dailyStats.entries())
		.map(([date, stats]) => ({
			date,
			views: stats.views.size,
			uniqueVisitors: stats.uniqueIPs.size
		}))
		.sort((a, b) => a.date.localeCompare(b.date));

	// Average response time
	const totalResponseTime = filteredLogs.reduce((sum, log) => sum + log.responseTime, 0);
	const avgResponseTime = filteredLogs.length > 0 ? totalResponseTime / filteredLogs.length : 0;

	// Status code breakdown
	const statusCodeBreakdown: Record<string, number> = {};
	filteredLogs.forEach((log) => {
		const code = log.statusCode.toString();
		statusCodeBreakdown[code] = (statusCodeBreakdown[code] || 0) + 1;
	});

	return {
		totalViews,
		uniqueVisitors,
		topPages,
		topReferrers,
		countries: countryStats,
		timeSeries,
		avgResponseTime,
		statusCodeBreakdown
	};
}

export async function load() {
	const logs = await readLogFiles();
	const analytics = await aggregateAnalytics(logs);

	return {
		analytics
	};
}

export const prerender = false;
