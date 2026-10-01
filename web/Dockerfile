FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV DATABASE_URL="postgresql://monitoring_user:monitoring_password@postgres:5432/monitoring_ukpbj?schema=public"
ENV JWT_SECRET="build-time-placeholder-change-at-runtime"

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]
