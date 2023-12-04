FROM node:21-bullseye

RUN apt-get -q update

WORKDIR /app

COPY . .

RUN yarn install

RUN yarn build

ENTRYPOINT [ "yarn", "start:prod" ]