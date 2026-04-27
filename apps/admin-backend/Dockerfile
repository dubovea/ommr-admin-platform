# -----------------------------
# Stage 1: build
# -----------------------------
# На этом этапе ставим зависимости и собираем TypeScript в dist.
# В финальный runtime-образ исходники TypeScript не обязательны.
FROM node:22-alpine AS build

# Рабочая директория внутри контейнера.
WORKDIR /app

# Yarn 4 в Docker иногда может использовать PnP.
# Для простоты runtime-контейнера явно включаем node_modules.
ENV YARN_NODE_LINKER=node-modules

# Включаем Corepack, чтобы Docker использовал Yarn из packageManager:
# "packageManager": "yarn@4.14.1"
RUN corepack enable

# Копируем только root manifest-файлы.
# Это нужно для Docker cache: если исходники изменились, но package.json/yarn.lock нет,
# слой yarn install можно переиспользовать.
COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./

# Копируем package.json workspace-пакетов.
# Yarn должен видеть весь workspace graph, иначе `yarn install --immutable`
# может решить, что lockfile не совпадает с текущей структурой.
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json

COPY apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json

# Устанавливаем зависимости строго по lockfile.
# Если lockfile неактуален, сборка упадёт — это правильно для production.
RUN yarn install --immutable

# Теперь копируем исходники только тех пакетов, которые нужны для backend build.
COPY packages/shared ./packages/shared
COPY apps/admin-backend ./apps/admin-backend

# Сначала собираем shared, потому что backend импортирует @ommr/shared
# как обычный workspace package через packages/shared/dist.
RUN yarn workspace @ommr/shared build

# Собираем backend: apps/admin-backend/src -> apps/admin-backend/dist.
RUN yarn workspace @ommr/admin-backend build

# -----------------------------
# Stage 2: runtime
# -----------------------------
# Финальный образ: здесь только то, что нужно для запуска backend.
FROM node:22-alpine AS runtime

WORKDIR /app

# Production runtime-переменные по умолчанию.
# DATABASE_URL и прочие секреты сюда НЕ зашиваем — они приходят из docker-compose/.env.
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV YARN_NODE_LINKER=node-modules

# Включаем Corepack, чтобы команда `yarn workspace ... start` работала.
RUN corepack enable

# Копируем root package-файлы.
# Они нужны Yarn, чтобы понимать workspaces.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/.yarnrc.yml ./.yarnrc.yml

# Копируем уже установленные node_modules из build stage.
# Так runtime не делает yarn install заново.
COPY --from=build /app/node_modules ./node_modules

# Копируем собранный shared package.
# Важно: backend в runtime импортирует @ommr/shared через package exports,
# которые смотрят на packages/shared/dist.
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Копируем только package.json и dist backend-а.
# Исходники src в runtime не нужны.
COPY --from=build /app/apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY --from=build /app/apps/admin-backend/dist ./apps/admin-backend/dist

# Документируем порт backend-а внутри контейнера.
EXPOSE 4000

# Запуск backend-приложения.
CMD ["yarn", "workspace", "@ommr/admin-backend", "start"]