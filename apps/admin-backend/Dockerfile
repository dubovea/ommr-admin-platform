FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

RUN yarn install --immutable
RUN yarn workspace @ommr/shared build
RUN yarn workspace @ommr/admin-backend build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=build /app /app

EXPOSE 4000
CMD ["yarn", "workspace", "@ommr/admin-backend", "start"]
