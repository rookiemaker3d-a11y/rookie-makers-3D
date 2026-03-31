# Desplegar Rookie Makers 3D en VPS (Hostinger, DigitalOcean, etc.) con Docker

Tu app queda en un solo servidor: PostgreSQL + backend FastAPI + frontend React (Nginx). **Docker no se paga**; solo pagas el VPS.

---

## 1. En tu PC (una vez)

- Tener el repo actualizado (con los `Dockerfile` y `docker-compose.yml`).
- Opcional: si quieres probar en local, instala [Docker Desktop](https://www.docker.com/products/docker-desktop/) y en la raíz del repo:
  ```bash
  cp .env.example .env
  # Edita .env con POSTGRES_PASSWORD y SECRET_KEY
  docker compose up -d
  ```
  Abre `http://localhost` y verás la app.

---

## 2. Contratar el VPS

- **Hostinger**: panel → VPS → plan más barato (ej. 4–6 USD/mes), SO **Ubuntu 22.04**.
- Te dan: **IP**, usuario (**root**) y contraseña (o llave SSH).

---

## 3. En el VPS: instalar Docker (solo una vez)

Conéctate por SSH desde tu PC (PowerShell o terminal):

```bash
ssh root@TU_IP_DEL_VPS
```

Dentro del VPS, ejecuta (Docker es gratis; solo se instala en el servidor):

```bash
apt update && apt install -y docker.io docker-compose-v2
systemctl enable docker && systemctl start docker
```

Comprueba:

```bash
docker --version
docker compose version
```

---

## 4. Subir el proyecto al VPS

**Opción A – Clonar desde GitHub (recomendado):**

```bash
cd /root
git clone https://github.com/rookiemaker3d-a11y/rookie-makers-3D.git
cd rookie-makers-3D
```

**Opción B – Subir con SCP desde tu PC:**

Desde tu PC (en la carpeta del proyecto):

```bash
scp -r . root@TU_IP_DEL_VPS:/root/rookie-makers-3D
```

Luego en el VPS: `cd /root/rookie-makers-3D`.

---

## 5. Configurar variables de entorno en el VPS

En el VPS, en la carpeta del proyecto:

```bash
cp .env.example .env
nano .env
```

Ajusta al menos:

- `POSTGRES_PASSWORD`: contraseña segura para PostgreSQL.
- `SECRET_KEY`: una clave larga y aleatoria para JWT (mín. 32 caracteres).
- `CORS_ORIGINS`: `*` o tu dominio (ej. `https://tu-dominio.com`).

Guarda (Ctrl+O, Enter, Ctrl+X en nano).

---

## 6. Levantar la app con Docker

En el VPS, en la raíz del repo:

```bash
docker compose --env-file .env up -d --build
```

La primera vez tarda unos minutos (build del backend y frontend). Luego:

- Frontend + API: **http://TU_IP_DEL_VPS** (puerto 80).
- La base de datos corre dentro del mismo servidor y los datos se guardan en un volumen (no se pierden al reiniciar).

---

## 7. Ejecutar el seed (usuarios y datos iniciales) – una sola vez

En el VPS:

```bash
docker compose exec backend python -m app.seed
```

Verás mensajes tipo “Seed completado” y los usuarios por defecto (admin, vendedores, etc.).

---

## 8. Comandos útiles

| Acción              | Comando |
|---------------------|--------|
| Ver contenedores    | `docker compose ps` |
| Ver logs            | `docker compose logs -f` |
| Parar todo          | `docker compose down` |
| Arrancar de nuevo   | `docker compose up -d` |
| Entrar al backend   | `docker compose exec backend sh` |
| Backup de la BD     | `docker compose exec db pg_dump -U rookie rookie_erp > backup.sql` |

---

## 9. Resumen

- **Docker**: lo instalas en el VPS con los comandos de arriba; **no pagas** por Docker.
- **Lo que pagas**: solo el VPS (Hostinger ~4–6 USD/mes).
- **No se apaga**: el servicio queda 24/7; no hay “spin-down” como en el plan gratis de Render.

---

## 10. Mismo dominio (sin `api.`) y migrar desde Vercel + Ollama

**Sí puedes usar solo `www.rookiemakers3d.com`**: el frontend va en `/` y la API en `/api/...` (Nginx del `docker-compose` ya hace `proxy_pass` de `/api/` al backend). No hace falta subdominio `api.`.

**Webhook de WhatsApp (Meta)** — misma URL de siempre:

`https://www.rookiemakers3d.com/api/whatsapp/webhook`

**Por qué quitar Vercel para Ollama:** el deploy en Vercel es serverless; **no puede** correr el contenedor `ollama` ni hablar con él como en Docker. El backend que responde WhatsApp debe vivir en el **mismo VPS** donde está `ollama` (red interna Docker `http://ollama:11434`).

### 10.1 DNS en Hostinger (dejar de apuntar a Vercel)

1. Panel Hostinger → **Dominios** → tu dominio → **DNS / Zona DNS**.
2. **Elimina** registros que apunten a Vercel, por ejemplo:
   - CNAME tipo `www` → `cname.vercel-dns.com` (o similar)
   - A o CNAME que Vercel te dio al conectar el dominio
3. **Añade** (sustituye `TU_IP_VPS` por la IP del VPS):
   - Tipo **A**, nombre **`@`**, valor **`TU_IP_VPS`**, TTL automático.
   - Tipo **A**, nombre **`www`**, valor **`TU_IP_VPS`**, TTL automático.

Espera propagación (minutos a unas horas). Comprueba:

```bash
curl -i https://www.rookiemakers3d.com/api/health
```

En el encabezado **no** debería salir `Server: Vercel` si ya responde tu VPS (puede salir `nginx` u otro).

### 10.2 En el VPS (una vez DNS apunta al VPS)

En la raíz del repo (con `.env` completo: WhatsApp, `POSTGRES_PASSWORD`, `SECRET_KEY`, etc.):

```bash
docker compose --env-file .env up -d --build
docker compose exec ollama ollama pull llama3.2   # o el modelo de OLLAMA_MODEL
docker compose exec backend python -m app.seed   # si es instalación nueva
```

### 10.3 HTTPS (Meta exige `https://`)

Mientras el VPS solo escuche **puerto 80**, Meta puede rechazar o dar problemas. Opciones prácticas:

- **Opción A — Cloudflare (rápida):** pones el dominio en Cloudflare, proxy naranja, SSL “Full” o “Full (strict)” y el origen es tu VPS en `:80`. El visitante y Meta ven HTTPS.
- **Opción B — Certbot en el VPS:** Let’s Encrypt en el mismo servidor; hay que añadir certificados al Nginx del contenedor o un reverse proxy en el host (paso aparte según tu setup).

### 10.4 Vercel

Cuando el dominio ya responde desde el VPS, en [vercel.com](https://vercel.com) puedes **archivar o eliminar** el proyecto para no tener dos orígenes confusos. El sitio “oficial” queda solo en Docker en el VPS.

### 10.5 Variables en el VPS (recordatorio)

En el `.env` del servidor (no en Vercel): `WHATSAPP_*`, `OLLAMA_BASE_URL=http://ollama:11434` (lo fija el `docker-compose`), `OLLAMA_MODEL`, `SECRET_KEY`, SMTP, etc.
