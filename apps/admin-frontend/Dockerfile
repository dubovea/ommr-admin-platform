FROM node:22-alpine AS build

WORKDIR /app

ENV YARN_NODE_LINKER=node-modules

ARG VITE_BACKEND_BASE_URL=/api/admin
ARG VITE_REFINE_DEVTOOLS=false
ARG REFINE_NO_TELEMETRY=true

ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
ENV VITE_REFINE_DEVTOOLS=$VITE_REFINE_DEVTOOLS
ENV REFINE_NO_TELEMETRY=$REFINE_NO_TELEMETRY

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./

COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json

COPY apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json

RUN yarn install --immutable

COPY packages/shared ./packages/shared
COPY apps/admin-frontend ./apps/admin-frontend

RUN yarn workspace @ommr/shared build
RUN yarn workspace @ommr/admin-frontend build

FROM nginx:1.27-alpine AS runtime

COPY apps/admin-frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/admin-frontend/dist /usr/share/nginx/html

ENV NGINX_PORT=80
ENV API_PROXY_PASS=http://admin-backend:4000

EXPOSE 80