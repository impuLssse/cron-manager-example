FROM node:18-alpine as build
LABEL stage=builder
WORKDIR /client-api-ts

COPY package.json .
COPY package-lock.json .
COPY tsconfig.build.json .
COPY tsconfig.json .
COPY src src
COPY certs certs
RUN npm ci
RUN npm i cpy-cli -g
RUN npm run build

FROM node:18-alpine
WORKDIR /client-api-ts
COPY package.json .
COPY certs certs
COPY package-lock.json .
RUN npm ci --omit=dev
RUN apk add --no-cache ffmpeg
COPY --from=build ./client-api-ts/dist ./dist
CMD ["npm", "run", "start"]
