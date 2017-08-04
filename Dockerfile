FROM node:boron-alpine AS builder

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install

# Bundle app source
COPY . /usr/src/app
ENV NODE_ENV=production
RUN yarn build

FROM node:boron-alpine

ENV NODE_ENV=production

# Add tini
RUN apk add --no-cache tini curl
ENTRYPOINT ["/sbin/tini", "--"]

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install

# Bundle app source
COPY --from=builder /usr/src/app/build/ /usr/src/app/

# Dont run as root
USER node

# Healthcheck
ENV HEALTHCHECK=True
HEALTHCHECK --interval=1m --timeout=3s --retries=5 \
	CMD curl -f http://localhost:3000/health || exit 1

CMD [ "node", "index.js" ]
