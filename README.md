# OMMR Admin Platform

Прототип админ-панели для управления metadata таблиц и UX-настройками интерфейса.

Стек:

- `apps/admin` — React + Vite + Refine headless
- `apps/api` — Express + Drizzle ORM
- `packages/shared` — общие типы и справочники
- PostgreSQL через Docker Compose



## Быстрый старт

Проект настроен под **Yarn Modern 4.x**:

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

## Что можно добавить дальше

- импорт реальной Pydantic JSON Schema
- генерация metadata из OpenAPI/JSON Schema
- сохранение порядка полей
- relation builder
- enum options editor
- preview формы/таблицы
- авторизация
