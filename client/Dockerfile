# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY server.js .

# Don't hardcode port - Railway sets it via PORT env var
# But expose both common ports for flexibility
EXPOSE 3000 8080

# Start the app - let server.js use PORT env var
CMD ["npm", "start"]

