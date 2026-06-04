# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder
# Install all dependencies (including devDependencies) and compile TypeScript.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (dev deps needed for tsc)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Generate Prisma client before compiling
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production runner
# Copy only the compiled output and production dependencies.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Set NODE_ENV so npm ci skips devDependencies
ENV NODE_ENV=production

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client (needed at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose the application port (overridable via PORT env var)
EXPOSE 3000

# Run database migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
