<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();
	let analytics = $derived(data.analytics);

	// Format numbers with commas
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Format response time
	function formatResponseTime(ms: number): string {
		return `${ms.toFixed(0)}ms`;
	}

	// Format date for display
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	onMount(() => {
		// Initialize time series chart
		function initTimeSeriesChart() {
			const SVG = (window as any).SVG;
			if (typeof SVG === 'undefined') {
				setTimeout(initTimeSeriesChart, 50);
				return;
			}

			const container = document.getElementById('timeseries-chart');
			if (!container || analytics.timeSeries.length === 0) return;

			const isMobile = window.innerWidth < 640;
			const WIDTH = isMobile ? window.innerWidth - 32 : 800;
			const HEIGHT = 300;
			const MARGIN = { top: 40, right: 40, bottom: 60, left: 60 };
			const chartWidth = WIDTH - MARGIN.left - MARGIN.right;
			const chartHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

			const draw = SVG().addTo('#timeseries-chart').size(WIDTH, HEIGHT);
			draw.rect(WIDTH, HEIGHT).fill('var(--color-bg-secondary)');

			// Calculate scales
			const maxViews = Math.max(...analytics.timeSeries.map((d) => d.views));
			const xStep = chartWidth / (analytics.timeSeries.length - 1 || 1);

			// Draw grid lines
			const gridLines = 5;
			for (let i = 0; i <= gridLines; i++) {
				const y = MARGIN.top + (chartHeight / gridLines) * i;
				draw
					.line(MARGIN.left, y, MARGIN.left + chartWidth, y)
					.stroke({ color: 'var(--color-border)', width: 1, dasharray: '2,2' });

				// Y-axis labels
				const value = Math.round(maxViews - (maxViews / gridLines) * i);
				draw
					.text(value.toString())
					.font({ size: 10, family: 'var(--font-mono)' })
					.fill('var(--color-text-muted)')
					.move(MARGIN.left - 35, y - 7);
			}

			// Draw line chart
			const points = analytics.timeSeries.map((d, i) => ({
				x: MARGIN.left + i * xStep,
				y: MARGIN.top + chartHeight - (d.views / maxViews) * chartHeight
			}));

			// Draw area fill
			let areaPath = `M ${points[0].x} ${MARGIN.top + chartHeight}`;
			points.forEach((p) => {
				areaPath += ` L ${p.x} ${p.y}`;
			});
			areaPath += ` L ${points[points.length - 1].x} ${MARGIN.top + chartHeight} Z`;

			draw
				.path(areaPath)
				.fill('var(--color-link)')
				.opacity(0.1)
				.stroke({ width: 0 });

			// Draw line
			let linePath = `M ${points[0].x} ${points[0].y}`;
			points.slice(1).forEach((p) => {
				linePath += ` L ${p.x} ${p.y}`;
			});

			draw
				.path(linePath)
				.fill('none')
				.stroke({ color: 'var(--color-link)', width: 2 });

			// Draw points
			points.forEach((p, i) => {
				draw.circle(6).fill('var(--color-link)').center(p.x, p.y);
			});

			// X-axis labels (show every nth label on mobile)
			const labelStep = isMobile ? Math.ceil(analytics.timeSeries.length / 4) : 1;
			analytics.timeSeries.forEach((d, i) => {
				if (i % labelStep === 0 || i === analytics.timeSeries.length - 1) {
					draw
						.text(formatDate(d.date))
						.font({ size: 10, family: 'var(--font-mono)' })
						.fill('var(--color-text-muted)')
						.center(points[i].x, HEIGHT - 30);
				}
			});
		}

		// Initialize top pages donut chart
		function initTopPagesChart() {
			const SVG = (window as any).SVG;
			if (typeof SVG === 'undefined') {
				setTimeout(initTopPagesChart, 50);
				return;
			}

			const container = document.getElementById('toppages-chart');
			if (!container || analytics.topPages.length === 0) return;

			const isMobile = window.innerWidth < 640;
			const SIZE = isMobile ? Math.min(window.innerWidth - 32, 400) : 400;
			const centerX = SIZE / 2;
			const centerY = SIZE / 2;
			const radius = SIZE / 3;
			const innerRadius = radius * 0.5;

			const draw = SVG().addTo('#toppages-chart').size(SIZE, SIZE);

			// Calculate total views and angles
			const topPages = analytics.topPages.slice(0, 8);
			const totalViews = topPages.reduce((sum, page) => sum + page.views, 0);

			// Color palette
			const colors = [
				'#3498db',
				'#2ecc71',
				'#e74c3c',
				'#f39c12',
				'#9b59b6',
				'#1abc9c',
				'#e67e22',
				'#34495e'
			];

			let currentAngle = -90;

			// Draw donut segments
			topPages.forEach((page, i) => {
				const percentage = (page.views / totalViews) * 100;
				const angle = (page.views / totalViews) * 360;
				const endAngle = currentAngle + angle;

				// Create donut segment path
				const startRad = (currentAngle * Math.PI) / 180;
				const endRad = (endAngle * Math.PI) / 180;

				const x1 = centerX + radius * Math.cos(startRad);
				const y1 = centerY + radius * Math.sin(startRad);
				const x2 = centerX + radius * Math.cos(endRad);
				const y2 = centerY + radius * Math.sin(endRad);

				const x3 = centerX + innerRadius * Math.cos(endRad);
				const y3 = centerY + innerRadius * Math.sin(endRad);
				const x4 = centerX + innerRadius * Math.cos(startRad);
				const y4 = centerY + innerRadius * Math.sin(startRad);

				const largeArc = angle > 180 ? 1 : 0;

				const pathData = [
					`M ${x1} ${y1}`,
					`A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
					`L ${x3} ${y3}`,
					`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
					'Z'
				].join(' ');

				const segment = draw
					.path(pathData)
					.fill(colors[i % colors.length])
					.opacity(0.9)
					.attr({ cursor: 'pointer' })
	
				// Create tooltip
				const tooltip = draw
					.group()
					.opacity(0)
					.attr({ 'pointer-events': 'none' });

				const tooltipBg = tooltip
					.rect(200, 60)
					.fill('var(--color-bg)')
					.stroke({ color: 'var(--color-border)', width: 2 })
					.radius(4);

				const tooltipTitle = tooltip
					.text(page.title)
					.font({ size: 12, family: 'var(--font-mono)', weight: 'bold' })
					.fill('var(--color-text)')
					.move(10, 10);

				const tooltipViews = tooltip
					.text(`${formatNumber(page.views)} views (${percentage.toFixed(1)}%)`)
					.font({ size: 11, family: 'var(--font-mono)' })
					.fill('var(--color-text-muted)')
					.move(10, 30);

				// Hover effects
				segment.mouseover(function (this: any, event: any) {
					this.animate(200).ease('<>').opacity(1);
					tooltip.opacity(1);
					const mouseX = event.clientX - container.getBoundingClientRect().left;
					const mouseY = event.clientY - container.getBoundingClientRect().top;
					tooltip.move(mouseX + 10, mouseY - 30);
				});

				segment.mouseout(function (this: any) {
					this.animate(200).ease('<>').opacity(0.9);
					tooltip.opacity(0);
				});

				// Click to navigate
				segment.click(function () {
					window.location.href = page.path;
				});

				currentAngle = endAngle;
			});

			// Center text showing total
			draw
				.text(formatNumber(totalViews))
				.font({ size: isMobile ? 24 : 32, family: 'var(--font-mono)', weight: 'bold' })
				.fill('var(--color-text)')
				.center(centerX, centerY - 10);

			draw
				.text('Total Views')
				.font({ size: isMobile ? 10 : 12, family: 'var(--font-mono)' })
				.fill('var(--color-text-muted)')
				.center(centerX, centerY + 20);
		}

		initTimeSeriesChart();
		initTopPagesChart();

		return () => {
			const timeseriesContainer = document.getElementById('timeseries-chart');
			const toppagesContainer = document.getElementById('toppages-chart');
			if (timeseriesContainer) timeseriesContainer.innerHTML = '';
			if (toppagesContainer) toppagesContainer.innerHTML = '';
		};
	});
</script>

<svelte:head>
	<title>Analytics - Site Statistics</title>
	<script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js"></script>
</svelte:head>

<div class="stats-page">
	<div class="page-header">
		<h1>Site Analytics</h1>
		<p class="subtitle">Public transparent analytics dashboard</p>
	</div>

	<!-- Key Metrics -->
	<div class="metrics-grid">
		<div class="metric-card">
			<div class="metric-label">Total Views</div>
			<div class="metric-value">{formatNumber(analytics.totalViews)}</div>
		</div>

		<div class="metric-card">
			<div class="metric-label">Unique Visitors</div>
			<div class="metric-value">{formatNumber(analytics.uniqueVisitors)}</div>
		</div>

		<div class="metric-card">
			<div class="metric-label">Avg Response Time</div>
			<div class="metric-value">{formatResponseTime(analytics.avgResponseTime)}</div>
		</div>

		<div class="metric-card">
			<div class="metric-label">Pages Tracked</div>
			<div class="metric-value">{formatNumber(analytics.topPages.length)}</div>
		</div>
	</div>

	<!-- Time Series Chart -->
	<div class="section">
		<h2>Page Views Over Time</h2>
		<div id="timeseries-chart" class="chart-container-inner"></div>
	</div>

	<!-- Two Column Layout -->
	<div class="two-column">
		<!-- Top Pages -->
		<div class="section donut-section">
			<h2>Top Pages</h2>
			<div id="toppages-chart" class="chart-container-donut"></div>
		</div>

		<!-- Top Referrers -->
		<div class="section">
			<h2>Top Referrers</h2>
			<div class="list-container">
				{#each analytics.topReferrers.slice(0, 5) as referrer}
					<div class="list-item">
						<div class="list-item-label">{referrer.source}</div>
						<div class="list-item-value">{formatNumber(referrer.visits)}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Countries and Status Codes -->
	<div class="two-column">
		<div class="section">
			<h2>Top Countries</h2>
			<div class="list-container">
				{#each analytics.countries.slice(0, 5) as country}
					<div class="list-item">
						<div class="list-item-label">{country.country}</div>
						<div class="list-item-value">{formatNumber(country.visits)}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="section">
			<h2>Status Codes</h2>
			<div class="list-container">
				{#each Object.entries(analytics.statusCodeBreakdown)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5) as [code, count]}
					<div class="list-item">
						<div class="list-item-label">
							<span class="status-code" class:success={code.startsWith('2')} class:error={code.startsWith('4') || code.startsWith('5')}>
								{code}
							</span>
						</div>
						<div class="list-item-value">{formatNumber(count)}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.stats-page {
		padding: 2rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-family: var(--font-serif);
		font-size: 2.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.metric-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.metric-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.metric-value {
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		text-align: center;
	}

	/* Chart Containers */
	.chart-container-inner {
		overflow-x: auto;
		padding: 1rem 0;
		display: flex;
		justify-content: center;
	}

	.chart-container-donut {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		min-height: 400px;
	}

	.donut-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* Two Column Layout */
	.two-column {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.section {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.section h2 {
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--color-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* List Container */
	.list-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-hover-bg);
		border-radius: 4px;
	}

	.list-item-label {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.list-item-value {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		margin-left: 1rem;
	}

	.status-code {
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.status-code.success {
		background: #d4edda;
		color: #155724;
	}

	.status-code.error {
		background: #f8d7da;
		color: #721c24;
	}

	/* Dark mode adjustments */
	:global([data-theme='dark']) .status-code.success {
		background: #1e4620;
		color: #4caf50;
	}

	:global([data-theme='dark']) .status-code.error {
		background: #4a1e1e;
		color: #f44336;
	}

	@media (max-width: 640px) {
		.stats-page {
			padding: 1rem 0.5rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.metrics-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.metric-value {
			font-size: 1.5rem;
		}

		.two-column {
			grid-template-columns: 1fr;
		}

		.chart-container-inner,
		.chart-container-donut {
			padding: 0.5rem;
			max-width: 100%;
		}

		.chart-container-donut {
			min-height: 300px;
		}

		.section {
			padding: 1rem;
		}
	}
</style>
