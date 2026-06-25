FROM node:20-alpine

# Включаем corepack для pnpm (без npm install -g)
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Копируем весь монорепозиторий
COPY . .

# Устанавливаем зависимости из корня (подхватит все workspace пакеты)
RUN pnpm install --no-frozen-lockfile

# Собираем api-server
RUN pnpm --filter @workspace/api-server run build

EXPOSE 3000

# Запускаем сервер
CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
