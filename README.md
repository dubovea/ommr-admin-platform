# OMMR Admin Platform

Админ-панель для управления metadata таблиц и UX-настройками интерфейса.

## Стек

- `apps/admin-frontend` — React + Vite + Refine + shadcn/ui
- `apps/admin-backend` — Express + Drizzle ORM
- `packages/shared` — общие типы, DTO, enum-значения, menu/group metadata
- PostgreSQL через Docker Compose

## Быстрый старт в разработке

```bash
corepack enable
corepack prepare yarn@4.14.1 --activate

yarn install
cp apps/admin-backend/.env.example apps/admin-backend/.env
cp apps/admin-frontend/.env.example apps/admin-frontend/.env

docker compose up -d postgres
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
cp .env.docker.example .env
yarn docker:up
```

Или без Yarn:

```bash
docker compose up --build
```

После запуска:

- Frontend: http://localhost:8080
- Backend: http://localhost:4000
- Postgres: localhost:5433

Docker Compose поднимает:

- `postgres`
- `backend`
- `frontend` на nginx, который проксирует `/api/*` в backend

Backend перед стартом выполняет `drizzle-kit push`, чтобы схема БД соответствовала текущему `src/db/schema.ts`.

## ENV

### Backend

Файл: `apps/admin-backend/.env.example`

```env
HOST=0.0.0.0
PORT=4000
JSON_BODY_LIMIT=20mb
CORS_ORIGIN=http://localhost:5174
DATABASE_URL=postgres://ommr:ommr_password@localhost:5433/ommr_admin
```

Для production можно заменить:

- `DATABASE_URL` на реальную PostgreSQL строку;
- `CORS_ORIGIN` на публичный домен frontend, например `https://admin.example.com`;
- `PORT`/`HOST` на нужные значения инфраструктуры.

### Frontend

Файл: `apps/admin-frontend/.env.example`

```env
VITE_BACKEND_BASE_URL=/api/admin
VITE_BACKEND_PROXY_TARGET=http://localhost:4000
VITE_REFINE_DEVTOOLS=false
REFINE_NO_TELEMETRY=true
VITE_HOST=0.0.0.0
VITE_PORT=5174
```

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

yarn docker:up              # docker compose up --build
yarn docker:down            # docker compose down
yarn docker:logs            # docker compose logs -f
```

## Структура

```txt
ommr-admin-platform
├── apps
│   ├── admin-backend
│   └── admin-frontend
├── packages
│   └── shared
├── docker-compose.yml
├── .env.docker.example
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
