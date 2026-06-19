#ARG IMAGE_PREFIX=harbor.ds.ecpk.sibintek.ru/proj-irommr/
ARG IMAGE_PREFIX=
FROM ${IMAGE_PREFIX}node:22-alpine AS build

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
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json

RUN yarn install --immutable

COPY packages/shared ./packages/shared
COPY apps/admin-backend ./apps/admin-backend
COPY apps/admin-frontend ./apps/admin-frontend

RUN yarn build

FROM ${IMAGE_PREFIX}node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV NGINX_PORT=80
ENV JSON_BODY_LIMIT=20mb
ENV NGINX_CLIENT_MAX_BODY_SIZE=20m
ENV API_PROXY_PASS=http://0.0.0.0:4000
ENV YARN_NODE_LINKER=node-modules

RUN apk add --no-cache gettext nginx tini \
    && mkdir -p /etc/nginx/templates /run/nginx /usr/share/nginx/html

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY --from=build /app/apps/admin-backend/dist ./apps/admin-backend/dist
COPY --from=build /app/apps/admin-frontend/dist /usr/share/nginx/html

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["tini", "--", "/entrypoint.sh"]
