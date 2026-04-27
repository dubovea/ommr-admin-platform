# -----------------------------
# Stage 1: build
# -----------------------------
# На этом этапе ставим зависимости и собираем React/Vite frontend в static dist.
FROM node:22-alpine AS build

WORKDIR /app

# Для Yarn workspace используем node_modules.
# Это проще для Docker и nginx runtime.
ENV YARN_NODE_LINKER=node-modules

# Build-time переменные для Vite.
# Важно: VITE_* переменные встраиваются в frontend именно во время `vite build`.
ARG VITE_BACKEND_BASE_URL=/api/admin
ARG VITE_REFINE_DEVTOOLS=false
ARG REFINE_NO_TELEMETRY=true

# Прокидываем ARG в ENV, чтобы Vite увидел их при сборке.
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
ENV VITE_REFINE_DEVTOOLS=$VITE_REFINE_DEVTOOLS
ENV REFINE_NO_TELEMETRY=$REFINE_NO_TELEMETRY

# Включаем Corepack, чтобы использовать Yarn из packageManager.
RUN corepack enable

# Копируем root manifest-файлы для кешируемого yarn install.
COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./

# Копируем package.json workspace-пакетов.
# Даже если frontend напрямую не собирает backend, Yarn должен видеть все workspaces,
# которые описаны в root package.json.
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json

COPY apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json

# Устанавливаем зависимости строго по lockfile.
RUN yarn install --immutable

# Копируем исходники shared и frontend.
COPY packages/shared ./packages/shared
COPY apps/admin-frontend ./apps/admin-frontend

# Собираем shared, потому что frontend импортирует @ommr/shared
# как workspace package через packages/shared/dist.
RUN yarn workspace @ommr/shared build

# Собираем frontend: apps/admin-frontend -> apps/admin-frontend/dist.
RUN yarn workspace @ommr/admin-frontend build

# -----------------------------
# Stage 2: runtime
# -----------------------------
# В production React/Vite — это статические файлы.
# nginx отдаёт их браузеру и проксирует /api на backend.
FROM nginx:1.29-alpine AS runtime

# Конфиг nginx как template.
# Официальный nginx image подставит ENV-переменные в шаблон при старте контейнера.
COPY apps/admin-frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Копируем собранный frontend dist в директорию, откуда nginx отдаёт static.
COPY --from=build /app/apps/admin-frontend/dist /usr/share/nginx/html

# Порт nginx внутри контейнера.
ENV NGINX_PORT=80

# Адрес backend-а внутри docker compose network.
# service name в docker-compose.yml должен быть `admin-backend`.
ENV API_PROXY_PASS=http://admin-backend:4000

# Документируем порт frontend container.
EXPOSE 80