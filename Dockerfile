FROM ghcr.io/puppeteer/puppeteer:24.15.0

# Switch to root to install system packages
USER root

# Install Debian’s Chromium package
RUN apt-get update \
  && apt-get install -y chromium \
  && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer where to find the system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "start"]
