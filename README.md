# ОМА Лаб: Бэкенд

Бэкенд прототипа детской мастерской «ОМА Лаб» на базе **NestJS**, **Prisma** и **PostgreSQL**.

---

## Архитектура и принципы

- **Анонимные сессии:** без логина/пароля. При `POST /api/session` создается пользователь и выдается бессрочный JWT-токен (`Authorization: Bearer <token>`).
- **Единый формат ошибок:**
  ```json
  {
    "code": "CODE_ALREADY_USED",
    "message": "Описание ошибки"
  }
  ```
- **Защита маршрутов:** глобальный `JwtAuthGuard` с исключениями (`@Public` и `@OptionalAuth`).
- **Интеграция с Neon PostgreSQL:** схема с моделями `User`, `Kit`, `KitCode`, `Lesson`, `LessonStep`, `LessonProgress`, `Skill`, `UserSkill`, `Store`, `StoreKit`, `ChatSession`, `ChatMessage`.
- **Чат-помощник Омик:** интеграция с Groq (OpenAI-совместимый API), контекст последних 10 сообщений, учет возраста и имени ребёнка, перехват опасных тем (газ, дым, искры, замыкание, ожог) до вызова ИИ, поддержка Server-Sent Events (SSE) стриминга.
- **Магазины:** расчет расстояния по формуле гаверсинуса, фильтрация по наличию набора.

---

## Переменные окружения (.env)

| Переменная | Описание | Пример |
|---|---|---|
| `DATABASE_URL` | Подключение к PostgreSQL | `postgresql://...` |
| `JWT_SECRET` | Секретный ключ подписи JWT | `oma_secret_jwt_key_...` |
| `GROQ_API_KEY` | API-ключ Groq для чата Омика | `gsk_...` |
| `GROQ_MODEL` | Модель Groq | `llama-3.3-70b-versatile` |
| `CORS_ORIGIN` | Разрешенные CORS-адреса | `*` |
| `PORT` | Порт сервера | `3000` |

---

## Запуск и разработка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Накатка схемы и сид базы данных
```bash
npm run prisma:push
npm run prisma:seed
```

### 3. Запуск сервера в режиме разработки
```bash
npm run start:dev
```

Сервер будет доступен по адресу: `http://localhost:3000/api`

### 4. Swagger-документация
Интерактивная документация доступна по адресу:
`http://localhost:3000/api/docs`

---

## Тестирование

Запуск полного сквозного e2e-сценария (все шаги демо-тестирования):
```bash
npm run test:e2e
```

---

## Запуск в Docker

Сборка и запуск контейнера:
```bash
docker compose up --build
```
