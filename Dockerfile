FROM nginx:alpine
ADD ./dist/elibrary-portal /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
