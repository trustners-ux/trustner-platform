# =============================================================================
# Multi-stage Dockerfile for Trustner Partner OS Backend
# Stage 1: Build
# Stage 2: Production Runtime
# =============================================================================

# ============================================================================
# STAGE 1: BUILD
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (dev + prod needed for build)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build application
RUN npm run build

# ============================================================================
# STAGE 2: PRODUCTION
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and openssl for Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Copy Prisma schema for client generation
COPY --from=builder /build/prisma ./prisma

# Install production dependencies only
RUN npm install --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /build/dist ./dist

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]

# Expose port
EXPOSE 5000
