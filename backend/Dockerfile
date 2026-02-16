# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Set ownership and user early for security
RUN chown -R node:node /app
USER node

# Copy only production dependencies and source
COPY --from=builder --chown=node:node /app/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node . .

EXPOSE 3000

CMD ["node", "src/index.js"]
