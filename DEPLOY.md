# BRUCE 3D SHOP — Руководство по развёртыванию

## Требования к серверу

- **OS**: Ubuntu 20.04+ / Debian 11+
- **Node.js**: 20+
- **pnpm**: 9+
- **PostgreSQL**: 14+
- **RAM**: минимум 512 MB (рекомендуется 1 GB+)
- **Disk**: минимум 1 GB свободного места

---

## Быстрый старт (автоматически)

```bash
chmod +x setup.sh
./setup.sh
```

---

## Ручная установка

### 1. Установите Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Установите pnpm

```bash
npm install -g pnpm@9
```

### 3. Установите PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Создайте базу данных

```bash
sudo -u postgres psql <<EOF
CREATE USER bruce3d WITH PASSWORD 'ВАШ_ПАРОЛЬ';
CREATE DATABASE bruce3d OWNER bruce3d;
GRANT ALL PRIVILEGES ON DATABASE bruce3d TO bruce3d;
EOF
```

### 5. Скопируйте и настройте .env

```bash
cp .env.example .env
nano .env
```

Заполните значения:
```
DATABASE_URL=postgresql://bruce3d:ВАШ_ПАРОЛЬ@localhost:5432/bruce3d
ADMIN_PASSWORD=ваш_пароль_администратора
SESSION_SECRET=любая_длинная_случайная_строка_32+символа
PORT=8080
```

### 6. Установите зависимости

```bash
pnpm install
```

### 7. Примените схему базы данных

```bash
pnpm --filter @workspace/db run push
```

### 8. Соберите фронтенд

```bash
pnpm --filter @workspace/bruce3d run build
```

### 9. Соберите API-сервер

```bash
pnpm --filter @workspace/api-server run build
```

---

## Запуск в production

### Вариант A — через PM2 (рекомендуется)

```bash
npm install -g pm2

# Запуск API-сервера
pm2 start artifacts/api-server/dist/index.mjs --name bruce3d-api

# Сохранить конфиг PM2 для автозапуска
pm2 save
pm2 startup
```

### Вариант B — через systemd

Создайте файл `/etc/systemd/system/bruce3d.service`:

```ini
[Unit]
Description=BRUCE 3D SHOP API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/bruce3d
ExecStart=/usr/bin/node artifacts/api-server/dist/index.mjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable bruce3d
sudo systemctl start bruce3d
```

---

## Настройка Nginx (раздача фронтенда + проксирование API)

Установите Nginx:

```bash
sudo apt install -y nginx
```

Конфиг `/etc/nginx/sites-available/bruce3d`:

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.ru www.ВАШ_ДОМЕН.ru;

    # Фронтенд (статика)
    root /path/to/bruce3d/artifacts/bruce3d/dist/public;
    index index.html;

    # API — проксируем на Node.js
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        # Важно для SSE (чат в реальном времени)
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }

    # Загруженные файлы
    location /uploads/ {
        proxy_pass http://localhost:8080/uploads/;
    }

    # Webhook Telegram
    location /api/webhook/ {
        proxy_pass http://localhost:8080/api/webhook/;
    }

    # SPA fallback — все маршруты отдаём index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 100M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bruce3d /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ВАШ_ДОМЕН.ru -d www.ВАШ_ДОМЕН.ru
```

---

## Настройка Telegram-бота

1. Войдите в панель администратора (`/admin`)
2. Введите токен бота (получить у [@BotFather](https://t.me/BotFather))
3. Введите домен сайта и нажмите **Webhook**
4. Отправьте `/start` боту — он запомнит ваш chat_id
5. Для группы заказов: добавьте бота в группу, получите chat_id через [@getidsbot](https://t.me/getidsbot), вставьте в настройки

---

## Обновление сайта

```bash
# Пересобрать фронтенд
pnpm --filter @workspace/bruce3d run build

# Пересобрать и перезапустить API
pnpm --filter @workspace/api-server run build
pm2 restart bruce3d-api
```

---

## Структура папок

```
├── artifacts/
│   ├── api-server/         # Express API + Telegram бот
│   │   ├── src/            # Исходный код
│   │   ├── dist/           # Сборка (после build)
│   │   ├── data/           # bot-config.json (настройки бота)
│   │   └── uploads/        # Загруженные файлы заказов
│   └── bruce3d/            # React фронтенд
│       ├── src/            # Исходный код
│       └── dist/public/    # Собранный сайт (после build)
├── lib/
│   └── db/                 # Схема базы данных (Drizzle ORM)
├── attached_assets/        # Изображения сайта
├── .env                    # Переменные окружения (создать из .env.example)
└── pnpm-lock.yaml          # Зафиксированные версии пакетов
```
