# Contexto: raíz del repo (docker-compose). Paginaweb/Content-Hub para la landing en /.
# ALLOW_MINIMAL_LANDING=1 si el clone no trae Content-Hub (submódulo vacío): landing mínima + ERP.
ARG ALLOW_MINIMAL_LANDING=1
FROM node:20-alpine AS builder
ARG ALLOW_MINIMAL_LANDING=1
ENV ALLOW_MINIMAL_LANDING=${ALLOW_MINIMAL_LANDING}
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
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
