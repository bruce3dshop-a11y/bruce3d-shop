#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "================================================"
echo "   BRUCE 3D SHOP — Автоматическая установка"
echo "================================================"
echo -e "${NC}"

# ── 1. Проверка Node.js ──────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js не установлен!${NC}"
  echo ""
  echo "Установи Node.js 20+:"
  echo "  Ubuntu/Debian:"
  echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "    sudo apt-get install -y nodejs"
  echo "  Или скачай с https://nodejs.org"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}❌ Нужен Node.js 18+, найден: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# ── 2. Установка pnpm ─────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}📦 Устанавливаю pnpm...${NC}"
  npm install -g pnpm@9
fi
echo -e "${GREEN}✅ pnpm $(pnpm -v)${NC}"

# ── 3. Создание .env ──────────────────────────────────
if [ ! -f ".env" ]; then
  if [ ! -f ".env.example" ]; then
    echo -e "${RED}❌ Файл .env.example не найден!${NC}"
    exit 1
  fi

  cp .env.example .env

  # Авто-генерация SESSION_SECRET
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|смените_на_случайную_строку_минимум_32_символа|$SECRET|" .env
  else
    sed -i "s|смените_на_случайную_строку_минимум_32_символа|$SECRET|" .env
  fi

  echo ""
  echo -e "${YELLOW}📋 Создан .env файл (SESSION_SECRET сгенерирован автоматически)${NC}"
  echo ""
  echo -e "${BLUE}Укажи обязательные параметры в файле .env:${NC}"
  echo "  DATABASE_URL   — строка подключения PostgreSQL"
  echo "                   пример: postgresql://user:pass@localhost:5432/bruce3d"
  echo "  ADMIN_PASSWORD — пароль для входа в /admin"
  echo ""
  echo "Открой .env в редакторе:"
  echo -e "  ${YELLOW}nano .env${NC}   или   ${YELLOW}vi .env${NC}"
  echo ""
  read -p "▶ Нажми Enter после того как заполнил .env..."
fi
echo -e "${GREEN}✅ .env файл найден${NC}"

# ── 4. Загрузка переменных ────────────────────────────
set -a
source .env
set +a

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL не задан в .env!${NC}"
  exit 1
fi
echo -e "${GREEN}✅ DATABASE_URL настроен${NC}"

# ── 5. Установка зависимостей ─────────────────────────
echo ""
echo -e "${BLUE}[1/4] Установка зависимостей...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✅ Зависимости установлены${NC}"

# ── 6. База данных ────────────────────────────────────
echo ""
echo -e "${BLUE}[2/4] Создание таблиц в базе данных...${NC}"
pnpm --filter @workspace/db run push
echo -e "${GREEN}✅ База данных настроена (9 таблиц)${NC}"

# ── 7. Сборка API ─────────────────────────────────────
echo ""
echo -e "${BLUE}[3/4] Сборка API-сервера...${NC}"
pnpm --filter @workspace/api-server run build
echo -e "${GREEN}✅ API собран → artifacts/api-server/dist/index.mjs${NC}"

# ── 8. Сборка фронтенда ───────────────────────────────
echo ""
echo -e "${BLUE}[4/4] Сборка фронтенда...${NC}"
pnpm --filter @workspace/bruce3d run build
echo -e "${GREEN}✅ Фронтенд собран → artifacts/bruce3d/dist/${NC}"

# ── Итог ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}================================================"
echo "   ✅ Установка завершена!"
echo -e "================================================${NC}"
echo ""

PORT_VAL=${PORT:-8080}

echo -e "${BLUE}▶ Способ 1 — Запуск напрямую:${NC}"
echo "  node artifacts/api-server/dist/index.mjs"
echo ""
echo -e "${BLUE}▶ Способ 2 — Запуск через PM2 (рекомендуется для сервера):${NC}"
echo "  npm install -g pm2"
echo "  pm2 start artifacts/api-server/dist/index.mjs --name bruce3d-api"
echo "  pm2 save && pm2 startup"
echo ""
echo -e "${BLUE}▶ Способ 3 — Режим разработки:${NC}"
echo "  # Терминал 1:"
echo "  pnpm --filter @workspace/api-server run dev"
echo "  # Терминал 2:"
echo "  pnpm --filter @workspace/bruce3d run dev"
echo ""
echo -e "${YELLOW}ℹ️  API запускается на порту: ${PORT_VAL}${NC}"
echo -e "${YELLOW}ℹ️  Панель администратора: http://localhost:22923/admin${NC}"
echo ""
echo -e "${YELLOW}💡 Не забудь настроить Telegram-бот в панели /admin → Настройки${NC}"
echo ""
