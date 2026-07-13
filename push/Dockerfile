FROM node:23-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# The push service runs natively in TS using node >= 23.6
CMD ["npm", "start"]
