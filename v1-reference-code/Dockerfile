FROM node:18-alpine

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma schema for generation
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "dev"]
