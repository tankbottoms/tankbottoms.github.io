# Dockerfile for SvelteKit Blog - Size Optimized Multi-Stage Build

# Stage 1: Install dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build the application
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4173
ENV HOST=0.0.0.0

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

# Copy built output from SvelteKit
COPY --from=builder --chown=sveltekit:nodejs /app/.svelte-kit/output ./.svelte-kit/output
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules

# Create a simple Bun server to serve the SvelteKit app
RUN cat > server.js <<'EOF'
import { Server } from './.svelte-kit/output/server/index.js';
import { manifest } from './.svelte-kit/output/server/manifest.js';

const server = new Server(manifest);
await server.init({ env: process.env });

const PORT = process.env.PORT || 4173;
const HOST = process.env.HOST || '0.0.0.0';

Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(request) {
    // Serve static files from client directory
    const url = new URL(request.url);
    const staticFile = Bun.file(`.svelte-kit/output/client${url.pathname}`);

    if (await staticFile.exists()) {
      return new Response(staticFile);
    }

    // Otherwise use SvelteKit SSR
    return await server.respond(request, {
      getClientAddress: () => request.headers.get('x-forwarded-for') || '127.0.0.1'
    });
  }
});

console.log('Server running on http://' + HOST + ':' + PORT);
EOF

RUN chown sveltekit:nodejs server.js

# Switch to non-root user
USER sveltekit

# Expose the port
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun --eval "fetch('http://localhost:4173').then(() => process.exit(0)).catch(() => process.exit(1))"

# Start the Bun server
CMD ["bun", "run", "server.js"]
