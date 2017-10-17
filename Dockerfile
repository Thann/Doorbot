FROM arm32v7/node
#FROM node:alpine
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["server"]

# Install dependencies
RUN apt update && \
    apt upgrade
## x86 - alpine
#RUN apk update && \
#    apk upgrade
#RUN apk add git python make g++

# Create app directory
RUN mkdir -p /usr/src/app/dist
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install --only=production

# Bundle app source
COPY webapp /usr/src/app/webapp
COPY api /usr/src/app/api
COPY lib /usr/src/app/lib
COPY door.js /usr/src/app/
COPY server.js /usr/src/app/
COPY webpack.config.js /usr/src/app/
COPY dist/index.html /usr/src/app/dist
COPY migrations /usr/src/app/migrations

# Build
RUN node_modules/.bin/webpack

