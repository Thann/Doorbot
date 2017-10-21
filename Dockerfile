FROM node:alpine AS base
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["server"]

# Create app directory
RUN mkdir -p /usr/src/app/dist
WORKDIR /usr/src/app

# Install updates
RUN apk update && \
    apk upgrade

# Install build dependencies
FROM base AS build
RUN apk add git python make g++

# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install --only=production && npm cache clean --force && rm -rf /tmp/*

# Make app
FROM base
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules

# Bundle app source
COPY migrations /usr/src/app/migrations
COPY server.js /usr/src/app/
COPY door.js /usr/src/app/
COPY lib /usr/src/app/lib
COPY api /usr/src/app/api
COPY dist/index.html /usr/src/app/dist
COPY webpack.config.js /usr/src/app/
COPY webapp /usr/src/app/webapp

# Build webapp
RUN node_modules/.bin/webpack

