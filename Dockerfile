FROM nginx:alpine
RUN echo charset utf-8; > /etc/nginx/conf.d/charset.conf
COPY index.html /usr/share/nginx/html/index.html
COPY favicon-32x32.png /usr/share/nginx/html/favicon-32x32.png
COPY favicon.ico /usr/share/nginx/html/favicon.ico
COPY brasao-dehonianos.png /usr/share/nginx/html/brasao-dehonianos.png
COPY banner-aguarde.png /usr/share/nginx/html/banner-aguarde.png
COPY banner-vertical.png /usr/share/nginx/html/banner-vertical.png
EXPOSE 80