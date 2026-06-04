FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/gateway ./services/gateway
RUN npm install -w @restful/shared -w @restful/gateway
RUN npm run build -w @restful/shared
RUN npm run build -w @restful/gateway

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/gateway ./services/gateway
WORKDIR /app/services/gateway
EXPOSE 3000
CMD ["node", "dist/index.js"]
