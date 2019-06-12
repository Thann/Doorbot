#TODO: use rpio which is faster and can build on node 10+
FROM node:alpine AS base
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["server"]

HEALTHCHECK --start-period=5s \
        CMD curl --fail localhost:3000/api/v1/health || exit 1

# Create app directory
RUN mkdir -p /usr/src/app/dist
WORKDIR /usr/src/app

# Install updates
RUN apk update  && \
    apk upgrade && \
    apk add curl

COPY package.json \
     package-lock.json \
     /usr/src/app/

# Install build dependencies
FROM base AS build
RUN apk add git python make g++

# Install app dependencies
RUN npm install

# Make app
FROM base
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules

# Bundle app source
COPY dist/favicon* /usr/src/app/dist/
COPY migrations /usr/src/app/migrations
COPY lib /usr/src/app/lib
COPY api /usr/src/app/api
COPY webapp /usr/src/app/webapp
COPY test /usr/src/app/test
COPY server.js \
     door.js \
     webpack.config.js \
     .eslintrc.json \
     /usr/src/app/

# Build webapp
RUN node_modules/.bin/webpack
