# Comandos para actualizar Rookie Makers 3D en VPS Hostinger

## 1. Conectarte por SSH al VPS

Desde tu PC (PowerShell o terminal):
```bash
ssh root@187.124.234.72
```

## 2. Actualizar backend (despues de hacer git push desde tu PC)

Dentro del VPS, ejecuta en orden:

```bash
cd /root/rookie-makers-3D
git pull
docker compose build --no-cache backend
docker compose up -d backend
docker compose restart frontend
```

## 3. Verificar que el backend arrancó bien

```bash
docker compose logs backend --tail 50
```

Si ves errores de pydantic (`created_at` str vs datetime), faltó el `git pull` o no se hizo rebuild con `--no-cache`.

## 4. Deploy del frontend en Vercel (desde tu PC)

Desde la raiz del repo en tu PC:
```bash
npx vercel --prod --yes --archive=tgz
```

Esto sube el frontend/landing-dist actualizado (incluye el cambio de contacto).

## 5. Verificar cambios en produccion

- Landing: https://www.rookiemakers3d.com → contacto debe mostrar el nuevo email y telefono
- ERP: https://www.rookiemakers3d.com/app/ → input de horas maquina debe aceptar 2:30
- Backend: http://187.124.234.72/api/health → debe responder {"status":"ok"}

## Resumen de comandos (copiar y pegar en bloque en el VPS)

```bash
cd /root/rookie-makers-3D && \
git pull && \
docker compose build --no-cache backend && \
docker compose up -d backend && \
docker compose restart frontend && \
docker compose logs backend --tail 20
```

## Nota importante sobre el input de horas

El fix del input `2:30` ya está commiteado y pusheado a GitHub. Solo falta hacer `git pull` en el VPS y rebuild del contenedor frontend (porque el ERP/frontend se sirve desde Vercel, no del VPS). El deploy de Vercel con `npx vercel --prod` es suficiente para el frontend.
