FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install deps first so this layer is cached while only src/ changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

USER node
EXPOSE 3000


CMD ["node", "src/server.js"]
