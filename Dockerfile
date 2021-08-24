FROM node:alpine as build-step
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN npm install --legacy-peer-deps
COPY . /app
RUN npm run build --prod


FROM nginx:alpine

COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-step /app/dist/elibrary-portal /usr/share/nginx/html/elib

EXPOSE 4200:80
