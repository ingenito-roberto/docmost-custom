FROM node:22-slim AS base
LABEL org.opencontainers.image.source="https://github.com/docmost/docmost"

RUN npm install -g pnpm@10.4.0

FROM base AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Leverage Docker caching for pnpm install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY patches ./patches
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/
COPY packages/editor-ext/package.json ./packages/editor-ext/
COPY packages/base-formula/package.json ./packages/base-formula/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM base AS installer

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl bash python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Leverage Docker caching for production pnpm install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY patches ./patches
COPY apps/server/package.json ./apps/server/
COPY packages/editor-ext/package.json ./packages/editor-ext/
COPY packages/base-formula/package.json ./packages/base-formula/

RUN chown -R node:node /app
USER node

RUN pnpm install --frozen-lockfile --prod

# Copy compiled apps and packages with proper ownership
COPY --chown=node:node --from=builder /app/apps/server/dist /app/apps/server/dist
COPY --chown=node:node --from=builder /app/apps/client/dist /app/apps/client/dist
COPY --chown=node:node --from=builder /app/packages/editor-ext/dist /app/packages/editor-ext/dist
COPY --chown=node:node --from=builder /app/packages/base-formula/dist /app/packages/base-formula/dist

RUN mkdir -p /app/data/storage

VOLUME ["/app/data/storage"]

EXPOSE 3000

CMD ["pnpm", "start"]
