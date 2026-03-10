# Seguridad del sistema ERP

Referencia: **Informe técnico de ciberseguridad para ERP en línea** (12 dominios, OWASP Top 10, ISO 27001 / NIST). Las acciones siguientes siguen la hoja de ruta del informe.

---

## Fase 1 – Controles críticos (implementados)

| # | Tarea | Estado |
|---|--------|--------|
| 1 | HTTPS/TLS y HSTS | **HSTS** se añade cuando `USE_HTTPS=true` en backend. TLS debe configurarse en el servidor/reverso (nginx, cloud). |
| 2 | MFA (TOTP) | Pendiente (Fase 2). |
| 3 | Hashing Argon2id | Pendiente; actualmente **bcrypt** (aceptable). |
| 4 | **Rate limiting** en login y API | **Hecho.** Límite por IP en `/api/auth/login` (10 req/min). Middleware: `app/middleware/security.py`. |
| 5 | **Headers de seguridad HTTP** | **Hecho.** X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy. HSTS opcional con `USE_HTTPS=true`. |
| 6 | **Consultas SQL parametrizadas** | **Cumplido.** Todo el backend usa SQLAlchemy ORM (select/where con modelos); no hay concatenación de SQL. |
| 7 | **Timeout de sesión** | **Hecho.** Token JWT expira en **30 minutos** (`ACCESS_TOKEN_EXPIRE_MINUTES=30`). Para 8h absoluto haría falta refresh token. |
| 8 | **Bloqueo de cuenta** tras 5 intentos fallidos | **Hecho.** Por email: 5 fallos → bloqueo 15 min. Por IP: 10 intentos/min en login. |

---

## Medidas ya aplicadas (anteriores)

- **CORS:** Orígenes desde variable de entorno.
- **JWT:** Bearer token; validación de exp y usuario activo.
- **Contraseñas:** bcrypt (hash con salt).
- **SECRET_KEY:** Por variable de entorno.
- **RBAC:** Roles `administrador` y `vendedor`; endpoints sensibles protegidos.

---

## Pendiente (Fase 2 y posteriores)

- MFA (TOTP) para todos los usuarios.
- Migrar contraseñas a Argon2id (opcional; bcrypt es aceptable).
- WAF delante de la aplicación (Cloudflare, AWS WAF, etc.).
- Logging centralizado (ELK o equivalente) y alertas en tiempo real.
- JWT con RS256, refresh tokens y lista de revocación.
- Cifrado de columnas sensibles en BD (datos financieros/personales).
- Escaneo de dependencias en CI/CD (Snyk, Dependabot).
- Backup automatizado con verificación de integridad.
- Pruebas de penetración y cumplimiento LFPDPPP documentado.

---

## Variables de entorno (seguridad)

- `SECRET_KEY`: Clave para JWT (obligatoria en producción).
- `CORS_ORIGINS`: Orígenes permitidos (ej. `https://tu-dominio.com`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Caducidad del token (por defecto 30).
- `USE_HTTPS`: `true` en producción con HTTPS para activar HSTS.

En producción: servir la API y el frontend solo por **HTTPS** y configurar TLS 1.2+ en el servidor o proxy.
