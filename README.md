# 🖨️ BRUCE 3D SHOP

Полноценный интернет-магазин услуг 3D-печати с панелью администратора, Telegram-ботом и чатом поддержки.

## 🚀 Быстрый деплой

### Render (рекомендуется)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Нажми кнопку выше
2. Подключи GitHub-репозиторий
3. Render автоматически прочитает `render.yaml` и создаст все сервисы

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Нажми кнопку выше
2. Подключи GitHub-репозиторий
3. Следуй инструкции ниже

---

## 📋 Что внутри

- **Фронтенд:** React + Vite + TailwindCSS + Three.js (3D-анимации)
- **Бэкенд:** Express.js + Drizzle ORM
- **База данных:** PostgreSQL (9 таблиц)
- **Telegram:** бот для уведомлений о заказах + чат с клиентами
- **Чат поддержки:** виджет с SSE (реального времени)
- **Панель администратора:** заказы, клиенты, магазин, отзывы, галерея, статистика

---

## 🛠️ Локальная установка

### Требования
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL

### Установка

```bash
# Распакуй архив и перейди в папку
tar -xf bruce3d-shop-COMPLETE.tar
cd workspace

# Установи зависимости
pnpm install

# Скопируй и заполни переменные окружения
cp .env.example .env
# Отредактируй .env — укажи DATABASE_URL и SESSION_SECRET

# Создай таблицы в базе данных
pnpm --filter @workspace/db run push

# Запусти проект
pnpm --filter @workspace/api-server run dev    # API на порту 8080
pnpm --filter @workspace/bruce3d run dev       # Сайт на порту 22923
```

Открой браузер: **http://localhost:22923**  
Панель администратора: **http://localhost:22923/admin**

---

## ⚙️ Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

| Переменная | Описание | Обязательно |
|-----------|---------|------------|
| `DATABASE_URL` | Строка подключения PostgreSQL | ✅ |
| `SESSION_SECRET` | Секрет для сессий (любая строка 32+ символов) | ✅ |
| `ADMIN_PASSWORD` | Пароль для входа в `/admin` | ✅ |
| `PORT` | Порт API-сервера (по умолчанию 8080) | — |
| `NODE_ENV` | `production` для продакшена | — |

> Telegram-бот настраивается прямо в панели администратора — токен и chat_id не нужно прописывать в .env

---

## 🚂 Деплой на Railway (подробно)

### 1. База данных
- New Project → **Deploy PostgreSQL**
- Скопируй **DATABASE_URL** из вкладки Variables

### 2. API-сервер
- New → GitHub Repo → выбери репозиторий
- **Settings → Root Directory:** `artifacts/api-server`
- **Variables:**
  ```
  DATABASE_URL=<из шага 1>
  NODE_ENV=production
  SESSION_SECRET=любая_случайная_строка
  PORT=8080
  ```
- После деплоя: **Settings → Generate Domain** → скопируй URL

### 3. Применить схему БД
В Railway Shell API-сервиса:
```bash
cd ../..
pnpm --filter @workspace/db run push
```

### 4. Фронтенд
- New → GitHub Repo → тот же репозиторий
- **Settings → Root Directory:** `artifacts/bruce3d`
- **Variables:**
  ```
  VITE_API_URL=<URL API из шага 2>
  PORT=3000
  ```

---

## 🎛️ Деплой на Render (подробно)

### 1. База данных
- New → **PostgreSQL** → Create

### 2. API-сервер
- New → **Web Service** → GitHub repo
- **Root Directory:** `artifacts/api-server`
- **Build:** `cd ../.. && npm install -g pnpm && pnpm install && pnpm --filter @workspace/api-server run build`
- **Start:** `node --enable-source-maps ./dist/index.mjs`
- **Variables:** `DATABASE_URL`, `NODE_ENV=production`, `SESSION_SECRET`, `PORT=10000`

### 3. Фронтенд
- New → **Static Site** → GitHub repo
- **Root Directory:** `artifacts/bruce3d`
- **Build:** `cd ../.. && npm install -g pnpm && pnpm install && pnpm --filter @workspace/bruce3d run build`
- **Publish Directory:** `dist`
- **Variables:** `VITE_API_URL=<URL API>`

---

## 📁 Структура проекта

```
workspace/
├── artifacts/
│   ├── api-server/          # Express API (бэкенд)
│   │   ├── src/
│   │   │   ├── routes/      # Маршруты API
│   │   │   └── lib/         # Утилиты, конфиг, сессии
│   │   ├── data/            # bot-config.json (Telegram настройки)
│   │   └── railway.toml     # Конфиг Railway для API
│   └── bruce3d/             # React фронтенд
│       ├── src/
│       │   ├── pages/       # Страницы (Admin, Home и т.д.)
│       │   ├── components/  # Компоненты (SupportChat и др.)
│       │   └── lib/         # API клиент
│       └── railway.toml     # Конфиг Railway для фронтенда
├── lib/
│   └── db/                  # Drizzle ORM схема и миграции
├── render.yaml              # Конфиг Render (один файл для всего)
├── .env.example             # Шаблон переменных окружения
└── DEPLOY.md                # Краткая инструкция по деплою
```

---

## 🤖 Telegram-бот

1. Создай бота у [@BotFather](https://t.me/BotFather) — получи токен
2. Узнай свой Chat ID у [@userinfobot](https://t.me/userinfobot)
3. Зайди в `/admin` → **Настройки → Telegram Bot**
4. Введи токен и Chat ID → сохрани

После этого при каждом новом заказе ты будешь получать уведомление в Telegram.

---

## 📞 Поддержка

Панель администратора: `/admin`  
Вкладка **Чаты** — здесь отображаются все обращения клиентов через виджет чата на сайте.
# bruce3d-shop
