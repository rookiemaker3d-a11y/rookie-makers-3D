# Seguridad ERP – Controles implementados (informe ciberseguridad)

Resumen de lo implementado en el backend y frontend del ERP Rookie Makers 3D.

## Fase 1 (implementado)

### 1. Headers de seguridad
- **Middleware** (`app/middleware/security.py`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, `Strict-Transport-Security` (HSTS) cuando `use_https=True`, y `Cache-Control: no-store` para todas las rutas `/api/*` para evitar caché de tokens y datos sensibles.

### 2. Autenticación y contraseñas
- **Política de contraseñas** (`app/auth.py`): Mínimo 12 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial. Se aplica al cambiar contraseña (admin) en `PATCH /api/auth/users/{id}/password`.
- **Bloqueo por intentos fallidos**: Tras 5 intentos fallidos de login por email, la cuenta queda bloqueada 15 minutos (por email + rate limit por IP en middleware).
- **Hash**: bcrypt (passlib). Opción futura: Argon2id.

### 3. Auditoría y logging
- **Tabla `audit_log`**: Eventos `login_success`, `login_failed`, `password_changed` con `user_id`, `ip`, `details` (JSON).
- **Registro**: En login (éxito/fallo), cambio de contraseña y verificación MFA.
- **Endpoint** `GET /api/auth/audit-log` (solo administrador): listado de eventos recientes.

### 4. JWT
- **Claims**: `exp`, `iat`, `sub` (user_id). Token temporal para MFA: `type: mfa_pending`, válido 5 minutos.
- **Expiración**: Configurable con `access_token_expire_minutes` (por defecto 30 min).

### 5. Rate limiting
- **Login**: Límite por IP en ventana de 1 minuto (middleware) y bloqueo por cuenta (5 intentos / 15 min).

---

## Fase 2 (implementado)

### 6. MFA (TOTP)
- **Modelo**: Campos `User.mfa_secret` y `User.mfa_enabled`.
- **Flujo**:  
  - `POST /api/auth/mfa/setup` (autenticado): genera secreto y `provisioning_uri` para escanear con Google Authenticator / Authy.  
  - `POST /api/auth/mfa/confirm` (autenticado): envía `code` y activa MFA.  
  - `POST /api/auth/mfa/disable` (autenticado): desactiva MFA enviando el código actual.  
  - Login: si el usuario tiene MFA activo, el backend responde con `mfa_required: true` y `temp_token`; el frontend pide el código y llama a `POST /api/auth/mfa/verify-login` con `temp_token` y `code` para obtener el `access_token`.
- **Frontend**: Pantalla de login en dos pasos (correo/contraseña → código TOTP) cuando el backend indica MFA.

---

## Migración de base de datos existente (MFA)

Si la tabla `users` ya existía antes de añadir MFA, hay que agregar las columnas. En **PostgreSQL** (por ejemplo en Render):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

En **SQLite** (desarrollo), si tu versión no soporta `ADD COLUMN ... IF NOT EXISTS`, puedes recrear la base o ejecutar:

```sql
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(64);
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0;
```

(Si las columnas ya existen, el ALTER fallará; en ese caso no hace falta hacer nada.)

---

## Producción recomendado

- **Variables de entorno**: `SECRET_KEY` fuerte y único, `DATABASE_URL`, `CORS_ORIGINS` con el origen del frontend (p. ej. `https://rookie-makers-3-d.vercel.app`), `USE_HTTPS=true` para HSTS.
- **Secretos**: No subir `database_url.txt` ni `.env` al repositorio; usar variables de entorno del host (Render, Vercel).
- **Backups**: Estrategia 3-2-1 documentada para la base de datos (Render ofrece backups; configurar retención).
- **WAF / DDoS**: Delegar en la infra (Cloudflare delante de Render/Vercel, opciones de Render, etc.).

---

## Pendiente / opcional

- Historial de contraseñas (últimas N) y expiración (p. ej. 90 días).
- CSRF explícito (SameSite en cookies si se usan; APIs con Bearer no requieren CSRF clásico).
- Comprobación HIBP al establecer contraseña (API o lista offline).
- Argon2id en lugar de bcrypt.
- Documentación de respuesta a incidentes y cumplimiento (ISO 27001, GDPR/LFPDPPP) según necesidad del negocio.
