FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./

COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/admin-backend/package.json ./apps/admin-backend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json

RUN yarn install --immutable

COPY packages ./packages
COPY apps/admin-backend ./apps/admin-backend

RUN yarn workspace @ommr/shared typecheck
RUN yarn workspace @ommr/admin-backend build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/admin-backend ./apps/admin-backend

EXPOSE 4000

CMD ["yarn", "workspace", "@ommr/admin-backend", "start"]