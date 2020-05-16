FROM node:lts-alpine
RUN mkdir -p /opt/docker-container-updater
COPY src /opt/docker-container-updater/src
COPY package*.json /opt/docker-container-updater/
COPY babel.config.json /opt/docker-container-updater/babel.config.json
RUN cd /opt/docker-container-updater && npm install && npm run build

FROM node:lts-alpine
MAINTAINER Hannes Hochreiner <hannes@hochreiner.net>
COPY --from=0 /opt/docker-container-updater/bld /opt/docker-container-updater
COPY --from=0 /opt/docker-container-updater/package*.json /opt/docker-container-updater/
RUN cd /opt/docker-container-updater && npm install --production
EXPOSE 8888
# VOLUME /etc/docker-container-updater/config.json
CMD ["node", "/opt/docker-container-updater/index"]
