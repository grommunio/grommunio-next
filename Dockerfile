# SPDX-License-Identifier: AGPL-3.0-or-later
# SPDX-FileCopyrightText: 2024 grommunio GmbH
#
# Builds the static bundle and serves it with nginx.
# Provide the runtime configuration by mounting a config.json:
#   docker run -p 8080:80 -v $PWD/config.json:/usr/share/nginx/html/config.json grommunio-next

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock postinstall.js ./
COPY vendor ./vendor
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY deploy/nginx-docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
