# Diva Admin

Отдельная панель управления контентом для сайта ДИВА.

## Быстрый старт

```bash
cd admin
npm install
cp .env.example .env  # настройте DATABASE_URL
npm run db:push       # создать таблицы
npm run seed           # создать админа
npm run dev            # http://localhost:3001
```

## Созданные компоненты

### CRUD страницы (15 сущностей)

| Сущность | CRUD | API |
|----------|------|-----|
| services | ✅ | ✅ |
| faqs | ✅ | ✅ |
| team-members | ✅ | ✅ |
| reviews | ✅ | ✅ |
| articles | ✅ | ✅ |
| videos | ✅ | ✅ |
| announcements | ✅ | ✅ |
| case-studies | ✅ | ✅ |
| site-statistics | ✅ | ✅ |
| district-stats | ✅ | ✅ |
| navigation | ✅ | ✅ |
| social-links | ✅ | ✅ |
| trust-pillars | ✅ | ✅ |
| fsi-deadlines | ✅ | ✅ |
| glossary | ✅ | ✅ |

### UI компоненты

- `AdminLayout` — сайдбар с навигацией
- `EntityListPage` — универсальная страница списка
- `EntityFormPage` — универсальная форма редактирования

### Auth

- Логин/выход через cookies
- Защищённые API routes
- Seed скрипт для первого админа

### Тесты

- Unit тесты для всех CRUD операций
- Integration тесты для API
- E2E тесты с Playwright

## Структура файлов

```
admin/
├── src/
│   ├── app/
│   │   ├── login/page.tsx          # Страница входа
│   │   ├── admin/
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── layout.tsx         # Admin layout
│   │   │   ├── services/         # CRUD услуг
│   │   │   ├── faqs/             # CRUD FAQ
│   │   │   ├── team-members/     # CRUD команды
│   │   │   └── ...
│   │   └── api/
│   │       ├── auth/             # Авторизация
│   │       ├── services/          # CRUD услуг
│   │       ├── faqs/             # CRUD FAQ
│   │       └── ...
│   ├── components/
│   │   ├── AdminLayout.tsx
│   │   ├── EntityListPage.tsx
│   │   └── EntityFormPage.tsx
│   └── lib/
│       ├── db.ts                 # Подключение к БД
│       └── schema.ts             # Схема Drizzle (16 таблиц)
├── tests/
│   ├── database.test.ts           # Unit тесты
│   ├── integration/api.test.ts   # API тесты
│   └── e2e/admin.spec.ts         # E2E тесты
└── scripts/
    └── seed.ts                   # Создание админа
```

## Команды

```bash
npm run dev        # Dev сервер
npm run build      # Production сборка
npm run start      # Production сервер
npm run seed       # Создать админа
npm run db:push    # Push схемы в БД
npm run test       # Unit + Integration тесты
npm run test:e2e  # E2E тесты
```
