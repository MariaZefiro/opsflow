FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm --workspace @opsflow/web run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
