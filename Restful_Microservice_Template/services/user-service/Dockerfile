FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/user-service ./services/user-service
RUN npm install -w @restful/shared -w @restful/user-service
RUN npm run build -w @restful/shared
RUN npm run prisma:generate -w @restful/user-service
RUN npm run build -w @restful/user-service

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/user-service ./services/user-service
WORKDIR /app/services/user-service
EXPOSE 4002
CMD ["node", "dist/src/index.js"]
