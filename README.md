# OMMR Admin Platform

Админ-панель для управления metadata таблиц и UX-настройками интерфейса.

## Стек

- `apps/admin-frontend` — React + Vite + Refine + shadcn/ui
- `apps/admin-backend` — Express + Drizzle ORM
- `packages/shared` — общие типы, DTO, enum-значения, menu/group metadata
- PostgreSQL через отдельные `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## Быстрый старт в разработке

```bash
corepack enable
corepack prepare yarn@4.14.1 --activate

yarn install

# Проверьте и при необходимости отредактируйте .env.development.

yarn db:push
yarn dev
```

По умолчанию:

- Admin UI: http://localhost:5174
- API: http://localhost:4000
- Health: http://localhost:4000/health

Frontend в dev использует `VITE_BACKEND_BASE_URL=/api/admin`, а Vite proxy отправляет `/api` на backend. Поэтому в разработке нет CORS-проблем. Для production можно оставить такой же относительный URL и проксировать `/api` через nginx.

## Запуск всего проекта в Docker

```bash
# Проверьте и при необходимости отредактируйте .env.production.
yarn docker:build
yarn docker:run
```

Или без Yarn:

```bash
docker build -t ommr-admin-platform .
docker run --rm --name ommr-admin-platform --env-file .env.production -p 5174:80 ommr-admin-platform
```

После запуска:

- Admin UI: http://localhost:5174
- API: http://localhost:5174/api/admin
- Health: http://localhost:5174/health

Публичный порт на хосте задается левой частью `-p 5174:80`. Внутри контейнера nginx слушает `80`, а backend слушает только внутренний `127.0.0.1:4000`.

Docker-образ запускает внутри одного контейнера:

- `admin-backend` на `127.0.0.1:4000`
- `admin-frontend` как static-файлы
- `nginx`, который отдает frontend и проксирует `/api/*` и `/health` в backend

База данных не поднимается внутри контейнера. Укажите внешние PostgreSQL параметры в `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` и примените схему через `yarn db:push`.

Если запускаете образ вручную или через Docker Desktop, обязательно передайте переменные `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. Для CLI-запуска используйте `--env-file .env.production` или набор `-e DB_HOST=... -e DB_PORT=...`.

## ENV

Единственный источник env для проекта находится в корне:

- `.env.development` — локальная разработка;
- `.env.production` — production/Docker;
- `.env.example` — общий шаблон без секретов.

Backend, seed и Drizzle-команды запускают Node с нативным `--env-file` из корня проекта, например `node --env-file=.env.development ...`. Frontend тоже читает env из корня через Vite `envDir`.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ommr_admin
DB_USER=ommr
DB_PASSWORD=ommr_password
DB_SSL=false

HOST=0.0.0.0
PORT=4000
JSON_BODY_LIMIT=20mb
CORS_ORIGIN=http://localhost:5174

VITE_BACKEND_BASE_URL=/api/admin
VITE_BACKEND_PROXY_TARGET=http://localhost:4000
VITE_REFINE_DEVTOOLS=false
REFINE_NO_TELEMETRY=true
VITE_HOST=0.0.0.0
VITE_PORT=5174
```

Для production можно заменить:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` на реальные параметры PostgreSQL;
- `DB_SSL` на `require`, если база требует SSL;
- `CORS_ORIGIN` на публичный домен frontend, например `https://admin.example.com`;
- `PORT`/`HOST` на нужные значения инфраструктуры.

Рекомендация: оставлять `VITE_BACKEND_BASE_URL=/api/admin` и в dev/prod проксировать `/api` на backend. Если нужно ходить напрямую на backend, можно поставить полный URL, например `https://api.example.com/api/admin`, но тогда backend должен корректно отдавать CORS.

## Shared types

`packages/shared` — единый источник типов и справочников для frontend/backend:

- `FIELD_INPUT_TYPES`, `FieldInputType`
- `ADMIN_TABLE_STATUSES`, `AdminTableStatus`
- `ADMIN_TABLE_SOURCES`, `AdminTableSource`
- `ADMIN_TABLE_GROUPS`, `AdminTableGroup`, `ADMIN_TABLE_GROUP_OPTIONS`
- `AdminTableMeta`, `AdminFieldMeta`
- `CreateAdminTableInput`, `UpdateAdminTableInput`
- `CreateAdminFieldInput`, `UpdateAdminFieldInput`
- `FieldRelationMeta`, `FieldRelationInput`
- `MetadataExport`, `MetadataExportTable`, `MetadataExportMenuGroup`

Frontend использует shared для UI, фильтров, dropdown-ов и metadata export. Backend использует те же значения в Drizzle enum и Zod validation.

## Скрипты

```bash
yarn dev                    # frontend + backend
yarn dev:admin-frontend     # только frontend
yarn dev:admin-backend      # только backend

yarn build                  # shared typecheck + backend build + frontend build
yarn typecheck              # typecheck всех workspace

yarn db:push                # применить схему через drizzle-kit push
yarn db:generate            # сгенерировать миграции
yarn db:migrate             # применить миграции
yarn db:studio              # Drizzle Studio

yarn docker:build           # docker build -t ommr-admin-platform .
yarn docker:run             # docker run --rm --name ommr-admin-platform --env-file .env.production -p 5174:80 ommr-admin-platform
yarn docker:run:dev         # docker run --rm --name ommr-admin-platform --env-file .env.development -p 5174:80 ommr-admin-platform
```

## Структура

```txt
ommr-admin-platform
├── apps
│   ├── admin-backend
│   └── admin-frontend
├── packages
│   └── shared
├── docker
├── Dockerfile
├── .env.example
├── .env.development
├── .env.production
├── package.json
└── tsconfig.base.json
```

## Metadata export

`GET /api/admin/metadata` теперь возвращает объект:

```json
{
  "tables": [],
  "menu": []
}
```

- `tables` — описание таблиц и полей;
- `menu` — готовая структура sidebar, собранная по `group/groupName/showInMenu`.

`showInMenu=false` оставляет таблицу в `tables`, но исключает её из `menu`.
