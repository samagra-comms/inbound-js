# Stage 1: Build the application
FROM node:18-bullseye AS builder

# Install dependencies required for building
RUN apt-get -q update

WORKDIR /app

# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./

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
COPY --from=builder /app .

# Set the entrypoint to start the application
ENTRYPOINT [ "yarn", "start:prod" ]
