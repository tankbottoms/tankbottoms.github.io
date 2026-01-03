import type { Handle } from '@sveltejs/kit';
import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Types for analytics data
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

// Get client IP address from various possible headers
function getClientIP(request: Request): string {
	const headers = [
		'CF-Connecting-IP', // Cloudflare
		'True-Client-IP', // Cloudflare Enterprise
		'X-Real-IP', // Nginx proxy
		'X-Forwarded-For', // Standard proxy header
		'X-Client-IP', // Apache
		'remote-address' // Direct connection
	];

	for (const header of headers) {
		const value = request.headers.get(header);
		if (value) {
			// X-Forwarded-For can be comma-separated list, take first IP
			return value.split(',')[0].trim();
		}
	}

	return 'unknown';
}

// Store access logs to file
async function storeLog(log: AccessLog): Promise<void> {
	try {
		const logsDir = join(process.cwd(), 'logs');

		// Create logs directory if it doesn't exist
		if (!existsSync(logsDir)) {
			await mkdir(logsDir, { recursive: true });
		}

		// Use daily log files for easier management
		const date = new Date().toISOString().split('T')[0];
		const logFile = join(logsDir, `access-${date}.jsonl`);

		// Append log entry as JSON line
		const logLine = JSON.stringify(log) + '\n';
		await appendFile(logFile, logLine, 'utf-8');
	} catch (error) {
		console.error('Failed to write access log:', error);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();

	// Extract request information
	const userAgent = event.request.headers.get('user-agent') || 'unknown';
	const referer = event.request.headers.get('referer') || 'direct';
	const ip = getClientIP(event.request);
	const cfRay = event.request.headers.get('CF-Ray');
	const country = event.request.headers.get('CF-IPCountry');

	// Resolve the request
	const response = await resolve(event);

	// Calculate response time
	const responseTime = Date.now() - startTime;

	// Create detailed access log
	// Note: url.search and url.origin may not be available during prerendering
	let query = '';
	let origin = '';
	try {
		query = event.url.search;
		origin = event.url.origin;
	} catch {
		// Prerendering - these properties are not available
	}

	const log: AccessLog = {
		timestamp: new Date().toISOString(),
		timestampMs: Date.now(),
		method: event.request.method,
		path: event.url.pathname,
		query,
		origin,
		userAgent,
		referer,
		ip,
		cfRay,
		country,
		responseTime,
		statusCode: response.status
	};

	// Log to console for immediate visibility (commented out since logging to file)
	// console.log(
	// 	`[${log.timestamp}]`,
	// 	`${log.method} ${log.path}${log.query}`,
	// 	`- ${log.statusCode}`,
	// 	`- ${log.responseTime}ms`,
	// 	`- IP: ${log.ip}`,
	// 	`- UA: ${log.userAgent.substring(0, 50)}...`
	// );

	// Store to file for analytics (disabled for Vercel - filesystem is read-only)
	// For self-hosted deployments, uncomment the line below:
	// storeLog(log).catch((err) => console.error('Log storage error:', err));

	return response;
};
