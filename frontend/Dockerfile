# Contexto: raíz del repo (docker-compose). Paginaweb/Content-Hub para build de la web en /.
FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY Paginaweb /app/Paginaweb
ENV VITE_API_URL=
RUN npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/frontend/landing-dist/ /usr/share/nginx/html/
COPY --from=builder /app/frontend/dist/ /usr/share/nginx/html/app/
COPY frontend/deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
