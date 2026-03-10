"""
Middleware de seguridad según informe de ciberseguridad ERP:
- Headers HTTP (CSP, X-Frame-Options, etc.)
- Rate limiting en memoria para /api/auth/login
- HSTS cuando la app se sirve por HTTPS (config use_https=True)
"""
import time
from collections import defaultdict
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings

# Rate limit: máximo de intentos de login por IP por ventana (1 minuto)
LOGIN_RATE_LIMIT = 10
LOGIN_RATE_WINDOW = 60.0

_login_attempts: dict[str, list[float]] = defaultdict(list)


def _clean_old_attempts(attempts: list[float], window: float) -> None:
    now = time.monotonic()
    while attempts and attempts[0] < now - window:
        attempts.pop(0)


def is_login_rate_limited(ip: str) -> bool:
    attempts = _login_attempts[ip]
    _clean_old_attempts(attempts, LOGIN_RATE_WINDOW)
    return len(attempts) >= LOGIN_RATE_LIMIT


def record_login_attempt(ip: str) -> None:
    _login_attempts[ip].append(time.monotonic())


def _get_security_headers() -> dict[str, str]:
    settings = get_settings()
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        ),
    }
    if getattr(settings, "use_https", False):
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return headers


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        for key, value in _get_security_headers().items():
            response.headers[key] = value
        return response


class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limit para /api/auth/login por IP."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path != "/api/auth/login" or request.method != "POST":
            return await call_next(request)
        client_host = request.client.host if request.client else "unknown"
        if is_login_rate_limited(client_host):
            return Response(
                content='{"detail":"Demasiados intentos de login. Intente en 1 minuto."}',
                status_code=429,
                media_type="application/json",
            )
        record_login_attempt(client_host)
        return await call_next(request)
