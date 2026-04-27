FROM node:22-alpine AS build

WORKDIR /app

ENV YARN_NODE_LINKER=node-modules

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./

COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json

COPY apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json

RUN yarn install --immutable

COPY packages/shared ./packages/shared
COPY apps/admin-backend ./apps/admin-backend

RUN yarn workspace @ommr/shared build
RUN yarn workspace @ommr/admin-backend build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV YARN_NODE_LINKER=node-modules

RUN corepack enable

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/.yarnrc.yml ./.yarnrc.yml

COPY --from=build /app/node_modules ./node_modules

COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

COPY --from=build /app/apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY --from=build /app/apps/admin-backend/dist ./apps/admin-backend/dist

EXPOSE 4000

CMD ["yarn", "workspace", "@ommr/admin-backend", "start"]