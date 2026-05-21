FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY . .
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

# Copy production node_modules + built dist
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]
