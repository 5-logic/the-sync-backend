FROM node:20.19.2-slim AS base
RUN npm install -g --ignore-scripts pnpm

#--------------------------------------------------
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json nest-cli.json ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY ./src ./src
COPY ./prisma ./prisma
RUN \
	pnpm run prisma:generate && \
	pnpm run build

#--------------------------------------------------

FROM base AS library
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN \
	pnpm install --frozen-lockfile --prod --ignore-scripts && \
	pnpm cache delete

#--------------------------------------------------

FROM node:20.19.2-slim AS pre-production
RUN \
	apt-get update && \
	apt-get --no-install-recommends install -y openssl && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* \
	groupadd -r backend && \
	useradd -r -g backend backend

#--------------------------------------------------

FROM pre-production AS production
WORKDIR /app
COPY --from=library /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY package.json ./
USER backend
ENTRYPOINT ["node", "dist/main.js"]
EXPOSE 4000
