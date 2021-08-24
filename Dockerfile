FROM node:alpine as build-step
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN npm run build --prod


FROM nginx:alpine

COPY --from=build-step /app/dist/elibrary-portal /usr/share/nginx/html/elib
COPY ./app/docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200:80
