FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/file-service ./services/file-service
RUN npm install -w @restful/shared -w @restful/file-service
RUN npm run build -w @restful/shared
RUN npm run prisma:generate -w @restful/file-service
RUN npm run build -w @restful/file-service

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/file-service ./services/file-service
WORKDIR /app/services/file-service
EXPOSE 4003
CMD ["node", "dist/src/index.js"]
