# Stage 1: Build the application
FROM node:18-bullseye AS builder

WORKDIR /app

# Copy package.json and yarn.lock files
COPY package.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Create the run-time image
FROM node:18-bullseye

WORKDIR /app

# Copy the built application from the previous stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

ARG SERVER_RELEASE_VERSION
ENV SERVER_RELEASE_VERSION=${SERVER_RELEASE_VERSION}

# Set the entrypoint to start the application
ENTRYPOINT [ "yarn", "start:prod" ]
