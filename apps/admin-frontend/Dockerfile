FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

ARG VITE_BACKEND_BASE_URL=/api/admin
ARG VITE_REFINE_DEVTOOLS=false
ARG REFINE_NO_TELEMETRY=true

ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
ENV VITE_REFINE_DEVTOOLS=$VITE_REFINE_DEVTOOLS
ENV REFINE_NO_TELEMETRY=$REFINE_NO_TELEMETRY

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

RUN yarn install --immutable
RUN yarn workspace @ommr/shared build
RUN yarn workspace @ommr/admin-frontend build

FROM nginx:1.27-alpine AS runtime

COPY apps/admin-frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/admin-frontend/dist /usr/share/nginx/html

ENV NGINX_PORT=80
ENV API_PROXY_PASS=http://backend:4000

EXPOSE 80
