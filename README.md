# OMMR Admin Platform

Прототип админ-панели для управления metadata таблиц и UX-настройками интерфейса.

Стек:

- `apps/admin` — React + Vite + Refine headless
- `apps/api` — Express + Drizzle ORM
- `packages/shared` — общие типы и справочники
- PostgreSQL через Docker Compose



## Быстрый старт

Проект настроен под **Yarn Modern 4.x** и использует нормальные workspace-зависимости без относительных `file:../../...`:

```json
"@ommr/shared": "workspace:*"
```

На Windows PowerShell:

```powershell
corepack enable

# Если сейчас `yarn -v` показывает 1.x, активируй Yarn Modern:
corepack prepare yarn@4.14.1 --activate

yarn -v
yarn install

docker compose up -d

Copy-Item apps/api/.env.example apps/api/.env

yarn db:push
yarn seed
yarn dev
```

После запуска:

- Admin UI: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/health

> В `.yarnrc.yml` включён `nodeLinker: node-modules`, чтобы проект был привычным для Vite/Node.js и не требовал настройки Plug'n'Play.

## Основная идея

Pydantic импортирует только базовые свойства:

- название таблицы
- имя в БД
- список полей
- базовые типы
- required

А в админке пользователь настраивает metadata и UX:

- отображаемые названия таблиц и полей
- типы полей
- обязательность
- редактируемость
- сортировка
- фильтрация
- показывать в таблице
- показывать в форме
- связи для select-полей

## Доступные типы полей

```ts
"text"        // Текст
"number"      // Числовой ввод
"date"        // Дата
"time"        // Время
"datetime"    // Дата и время
"select"      // Выпадающий список, одиночный выбор
"multiselect" // Выпадающий список, мульти выбор
```

## Скрипты

```bash
npm run dev          # admin + api
npm run dev:admin    # только frontend
npm run dev:api      # только backend

npm run db:push      # применить схему без генерации миграций
npm run db:generate  # сгенерировать миграции
npm run db:migrate   # применить миграции
npm run db:studio    # Drizzle Studio
npm run seed         # демо-данные
```

## Структура

```txt
ommr-admin-platform
├── apps
│   ├── admin
│   └── api
├── packages
│   └── shared
├── docker-compose.yml
├── package.json
└── tsconfig.base.json
```


## Роль `packages/shared`

`packages/shared` — единый источник для общих metadata-типов и enum-значений:

- `FIELD_INPUT_TYPES`
- `ADMIN_TABLE_STATUSES`
- `ADMIN_TABLE_SOURCES`
- `RELATION_TYPES`
- `AdminTableMeta`
- `AdminFieldMeta`
- `FieldRelationMeta`

Frontend использует эти типы для UI, dropdown-ов и подписей.

Backend использует эти же значения в Zod validation и Drizzle enum-ах.

Drizzle остаётся DB-схемой и описывает только физическую структуру PostgreSQL: таблицы, колонки, типы колонок, связи и defaults.


## Что уже сделано

- базовая структура monorepo
- PostgreSQL + Drizzle schema
- Express CRUD API для таблиц и полей
- seed-данные: users, orders, products, invoices, categories
- Refine подключен как headless framework
- кастомный UI-прототип:
  - список таблиц
  - предпросмотр таблицы
  - экран редактирования
  - настройка полей
  - dropdown выбора типа поля


## Финальная организация API

Express entrypoint теперь отвечает только за middleware и подключение роутеров:

```ts
app.use("/api/admin", adminRouter);
```

Роутинг разнесён по файлам:

```txt
apps/api/src/routes/admin/index.ts
apps/api/src/routes/admin/tables.routes.ts
apps/api/src/routes/admin/fields.routes.ts
```

Ошибки обрабатываются через общий middleware:

```txt
apps/api/src/middlewares/error-handler.ts
```

Асинхронные обработчики завернуты в:

```txt
apps/api/src/lib/async-handler.ts
```


## Что можно добавить дальше

- импорт реальной Pydantic JSON Schema
- генерация metadata из OpenAPI/JSON Schema
- сохранение порядка полей
- relation builder
- enum options editor
- preview формы/таблицы
- авторизация
