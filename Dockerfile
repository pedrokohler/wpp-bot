FROM markhobson/node-chrome:latest
RUN curl -sL https://deb.nodesource.com/setup_19.x | bash - \
	&& apt-get install -y nodejs \
	&& rm -rf /var/lib/apt/lists/* /var/cache/apt/*

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
	&& echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
	&& apt-get update -qqy \
	&& apt-get -qqy install google-chrome-stable \
	&& rm /etc/apt/sources.list.d/google-chrome.list \
	&& rm -rf /var/lib/apt/lists/* /var/cache/apt/* \
	&& sed -i 's/"$HERE\/chrome"/"$HERE\/chrome" --no-sandbox/g' /opt/google/chrome/google-chrome
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/google-chrome

RUN npm ci --verbose
COPY . .

RUN apt-get -y update
RUN apt-get install -y ffmpeg

ENV NODE_ENV=production

CMD [ "npm", "start" ]