# Build frontend from source
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend-build

# Copy package files first for better layer caching
COPY frontend/package*.json ./
RUN npm ci --silent --no-audit --no-fund

# Copy only necessary files for building (exclude node_modules, coverage, etc.)
COPY frontend/index.html ./
COPY frontend/postcss.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/tsconfig.json ./
COPY frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts ./

# Copy source files excluding tests
COPY frontend/src/App.tsx frontend/src/index.css frontend/src/main.tsx frontend/src/vite-env.d.ts ./src/
COPY frontend/src/components ./src/components
COPY frontend/src/context ./src/context
COPY frontend/src/hooks ./src/hooks
COPY frontend/src/images ./src/images
COPY frontend/src/pages ./src/pages
COPY frontend/src/services ./src/services
COPY frontend/src/types ./src/types

# Build frontend (output goes to ../backend/public per vite.config, but we override it)
RUN npx vite build --outDir dist

# Build backend from source
FROM node:18-alpine AS backend-builder
WORKDIR /backend-build

# Copy package files first for better layer caching
COPY backend/package*.json ./
RUN npm ci --silent --no-audit --no-fund

# Copy backend source files
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Install production-only dependencies
FROM node:18-alpine AS backend-deps
WORKDIR /backend-deps
COPY backend/package*.json ./
RUN npm ci --only=production --silent --no-audit --no-fund

# Production image
FROM node:18-alpine AS production

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy compiled backend files
COPY --from=backend-builder --chown=nodejs:nodejs /backend-build/dist ./dist

# Copy production dependencies
COPY --from=backend-deps --chown=nodejs:nodejs /backend-deps/node_modules ./node_modules

# Copy frontend build to public folder (where server.ts expects it)
COPY --from=frontend-builder --chown=nodejs:nodejs /frontend-build/dist ./public

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check using the existing /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start the Node.js server directly
CMD ["node", "dist/server.js"]