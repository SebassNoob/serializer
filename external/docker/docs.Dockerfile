FROM oven/bun:alpine AS base

FROM base AS pruner
WORKDIR /usr/local

COPY . .
RUN bun i turbo

# generates a partial monorepo in ./out/full
RUN bunx turbo prune docs --docker

FROM base AS builder
WORKDIR /usr/local

ENV NODE_ENV=production

# this is crazy but we need the .git folder for the docs app to work
COPY --from=pruner /usr/local/.git .
COPY --from=pruner /usr/local/out/full .
RUN bun i

# generates next.js app in ./apps/docs/.next
RUN bun run build

FROM base AS runner
WORKDIR /usr/local/app

COPY --from=pruner /usr/local/.git .

COPY --from=builder /usr/local/apps/docs .
COPY --from=builder /usr/local/node_modules ./node_modules
RUN rm -rf .turbo src

CMD ["bun", "--bun", "run", "start", "-p", "9333"]