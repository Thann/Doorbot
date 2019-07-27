#TODO: use rpio which is faster and can build on node 10+
FROM node:alpine AS base
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["server"]

HEALTHCHECK --start-period=5s \
        CMD curl --fail localhost:3000/api/v1/health || exit 1

# Create app directory
RUN mkdir -p /app/dist
WORKDIR /app

# Install updates
RUN apk upgrade --no-cache && \
    apk add --no-cache curl

COPY package.json \
     package-lock.json \
     /app/

# Install build dependencies
FROM base AS build
RUN apk add --no-cache git python make g++

# Install app dependencies
RUN npm install

# Make app
FROM base
COPY --from=build /app/node_modules /app/node_modules

# Bundle app source
COPY dist/favicon* /app/dist/
COPY migrations /app/migrations
COPY plugins /app/plugins
COPY lib /app/lib
COPY api /app/api
COPY webapp /app/webapp
COPY test /app/test
COPY server.js \
     door.js \
     webpack.config.js \
     .eslintrc.json \
     /app/

# Build webapp
RUN node_modules/.bin/webpack
