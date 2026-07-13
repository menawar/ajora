FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Generate ponder types
RUN npm run codegen

# Build TypeScript
RUN npm run typecheck

# Start ponder
CMD ["npm", "run", "start"]
