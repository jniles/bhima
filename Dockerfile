# define base image
FROM ghcr.io/puppeteer/puppeteer:latest

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1

ENV YARN_VERSION 1.22.19
RUN yarn policies set-version $YARN_VERSION

# define working directory inside the container
WORKDIR /usr/src/app

# Copy all the source code from host machine to the container project directory
COPY . .

# install all the dependencies
RUN yarn --frozen-lockfile \
  && NODE_ENV=production yarn build

# yarn build creates the bin/ folder
COPY .env bin/

# change directory to the bin diretory
WORKDIR /usr/src/app/bin/

# ensure this container runs as the user "node"
USER node

# define the start up command of the container to run the server
CMD ["node", "server/app.js"]
