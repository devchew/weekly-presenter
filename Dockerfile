# Multi-stage build for React + Express.js application
FROM node:22-alpine AS dependencies
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci

FROM node:22-alpine AS build
COPY . /app/
COPY --from=dependencies /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

# Runtime stage - serves both frontend and API
FROM node:22-alpine AS runtime
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/database.sqlite

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy server files
COPY ./server /app/server
COPY ./package.json /app/

# Copy built frontend
COPY --from=build /app/dist /app/dist

# Install only production dependencies
RUN npm ci

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the API port
EXPOSE 3001


# Start the server
CMD ["node", "server/index.js"]