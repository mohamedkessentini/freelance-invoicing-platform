# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .
# Baked in at build time since Vite inlines env vars into the static bundle.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Run stage ---
FROM nginx:1.27-alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
