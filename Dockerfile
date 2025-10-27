FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm install -g typescript

COPY tsconfig.json ./
COPY lib ./lib

RUN npm run build

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

CMD ["node", "build/main.js"]