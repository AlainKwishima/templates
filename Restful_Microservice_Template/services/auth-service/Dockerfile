FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/auth-service ./services/auth-service
RUN npm install -w @restful/shared -w @restful/auth-service
RUN npm run build -w @restful/shared
RUN npm run prisma:generate -w @restful/auth-service
RUN npm run build -w @restful/auth-service

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/auth-service ./services/auth-service
WORKDIR /app/services/auth-service
EXPOSE 4001
CMD ["node", "dist/src/index.js"]
