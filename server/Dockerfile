FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p uploads/avatars

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "src/server.js"]
