FROM nginx:alpine
ADD ./dist/elibrary-portal /usr/share/nginx/html/elib
COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
