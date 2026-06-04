FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY services ./services
RUN npm install
RUN npm run build -w packages/shared && npm run build -w services/api-gateway

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
CMD ["node", "services/api-gateway/dist/server.js"]
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=30s CMD node -e "const port=process.env.PORT||3000; fetch('http://127.0.0.1:'+port+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
