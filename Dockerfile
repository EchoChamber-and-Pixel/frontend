FROM node:15 as build
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY . ./
RUN yarn build

FROM node:15-alpine
WORKDIR /app
COPY --from=build /app/build /app
RUN yarn global add serve

CMD [ "serve", "-s", "." ]