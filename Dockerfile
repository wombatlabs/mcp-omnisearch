# Use Node.js 20 LTS Alpine for smallest image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the TypeScript project
RUN pnpm run build

# Remove development dependencies to reduce image size
RUN pnpm prune --prod

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run the MCP server
CMD ["node", "dist/index.js"]