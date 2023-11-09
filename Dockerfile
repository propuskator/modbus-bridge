FROM node:14.17-alpine

RUN apk update \
    && apk add bash git make gcc g++ python linux-headers udev tzdata

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm i --production

COPY etc etc
COPY lib lib
COPY utils utils
COPY .env.defaults.sample .env.defaults

COPY index.js index.js

CMD node index.js