# define base image
FROM node:lts-bookworm-slim

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  CHROME_BIN=/usr/bin/chromium \
  NODE_ENV=production

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && \
  apt-get install chromium --no-install-recommends -y && \
  apt-get install -y libx11-xcb1 libxcomposite1 libasound2 \
    libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
    libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# define working directory inside the container
WORKDIR /usr/src/app

# Copy all the source code from host machine to the container project directory
COPY . .

# install all the dependencies
RUN npm install --production=false && \
  npm run build && \
  npm prune --production

# yarn build creates the bin/ folder
COPY .env bin/

# change directory to the bin diretory
WORKDIR /usr/src/app/bin/

# ensure this container runs as the user "node"
USER node

# define the start up command of the container to run the server
CMD ["node", "server/app.js"]
