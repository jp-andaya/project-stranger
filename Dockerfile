# ── Project Stranger frontend — Vite build served by nginx ──

# Stage 1: build the static assets
FROM node:20-alpine AS build

WORKDIR /app

# Install deps from the lockfile first (cached unless lockfile changes)
COPY package.json package-lock.json ./
RUN npm ci

# Build. VITE_API_URL is baked in at build time (Vite inlines env vars).
# Empty string => same-origin relative API calls, proxied by nginx (see nginx.conf).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine

# SPA + API reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
