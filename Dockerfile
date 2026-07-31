# ==============================================================================
# SSO Login - Multi-stage Dockerfile
# ==============================================================================
# Optimized for production with minimal image size and layer caching
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base image with dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

# Install required system dependencies for native modules (argon2, better-sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Install dependencies
# ------------------------------------------------------------------------------
FROM base AS deps

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Build the application
# ------------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Nuxt application
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies only (for argon2)
RUN apk add --no-cache libc6-compat

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json

# Copy drizzle config and migrations (for db:migrate command)
COPY --from=builder --chown=nuxtjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nuxtjs:nodejs /app/server/db ./server/db
COPY --from=builder --chown=nuxtjs:nodejs /app/tsconfig.json ./tsconfig.json

# Install migration dependencies (tsx + drizzle-orm + postgres driver)
RUN npm install -g tsx && npm install drizzle-orm postgres

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Switch to non-root user
USER nuxtjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]
