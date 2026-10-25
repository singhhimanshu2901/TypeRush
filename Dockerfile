# Stage 1: Build Frontend & Install Dependencies
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full application source
COPY . .

# Build Vite frontend static assets into /dist
RUN npm run build

# Stage 2: Production Runtime Container
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built artifacts and server files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Create data directory for file database persistence
RUN mkdir -p /app/data

# Expose application port
EXPOSE 3000

# Launch server
CMD ["npx", "tsx", "server.ts"]
