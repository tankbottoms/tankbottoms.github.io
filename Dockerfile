# Dockerfile for Mr. Whiskers Blog - Multi-Stage Build with adapter-node

# Stage 1: Install dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build with adapter-node for Docker deployment
ENV DOCKER=true
RUN bun run build

# Stage 3: Production runner (minimal image)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV ORIGIN=http://localhost:3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

# Copy only the build output from adapter-node
# adapter-node outputs to: build/index.js, build/client/, build/server/, build/prerendered/
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json

# Install only production dependencies for the server
RUN bun install --production --frozen-lockfile && \
    rm -rf /root/.bun/install/cache

# Switch to non-root user
USER sveltekit

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Node adapter server
CMD ["bun", "run", "build/index.js"]
