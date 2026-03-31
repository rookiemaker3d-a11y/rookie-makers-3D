"""
Webhook WhatsApp Cloud API (Meta) + respuestas con Ollama.

Callback URL en Meta: https://TU_DOMINIO/api/whatsapp/webhook
"""
import hashlib
import hmac
import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query, Request, Response

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

DEFAULT_SYSTEM = """Eres el asistente de Rookie Makers 3D (impresión 3D profesional en México).
Responde en español, breve y claro. Si piden cotización, pide tipo de pieza, material aproximado y ciudad de envío.
No inventes precios: di que un humano confirma la cotización en la app o por WhatsApp de negocio."""


def _verify_meta_signature(raw_body: bytes, signature_header: str | None, app_secret: str) -> bool:
    if not app_secret or not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = signature_header[7:]
    mac = hmac.new(app_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, expected)


async def _ollama_reply(user_text: str) -> str:
    s = get_settings()
    base = (s.ollama_base_url or "").rstrip("/")
    model = (s.ollama_model or "llama3.2").strip()
    if not base:
        return "Servicio de IA no configurado (OLLAMA_BASE_URL)."
    url = f"{base}/api/chat"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": DEFAULT_SYSTEM},
            {"role": "user", "content": user_text},
        ],
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.exception("Ollama error: %s", e)
        return "Ahora no puedo generar una respuesta automática. Escribe tu consulta y te contactamos pronto."

    msg = (data.get("message") or {}).get("content") or ""
    if isinstance(msg, str) and msg.strip():
        return msg.strip()
    return "No pude generar respuesta. Intenta de nuevo en un momento."


async def _send_whatsapp_text(to_wa_id: str, body: str) -> None:
    s = get_settings()
    phone_id = (s.whatsapp_phone_number_id or "").strip()
    token = (s.whatsapp_access_token or "").strip()
    ver = (s.whatsapp_graph_version or "v22.0").strip()
    if not phone_id or not token:
        logger.warning("WhatsApp: falta PHONE_NUMBER_ID o ACCESS_TOKEN")
        return
    url = f"https://graph.facebook.com/{ver}/{phone_id}/messages"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "messaging_product": "whatsapp",
        "to": to_wa_id,
        "type": "text",
        "text": {"preview_url": False, "body": body[:4096]},
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            if r.status_code >= 400:
                logger.error("WhatsApp send error %s: %s", r.status_code, r.text)
    except Exception as e:
        logger.exception("WhatsApp send: %s", e)


def _iter_incoming_texts(body: dict[str, Any]) -> list[tuple[str, str]]:
    """Lista de (wa_id_sin_mas, texto)."""
    out: list[tuple[str, str]] = []
    if body.get("object") != "whatsapp_business_account":
        return out
    for entry in body.get("entry") or []:
        for change in entry.get("changes") or []:
            value = change.get("value") or {}
            for msg in value.get("messages") or []:
                if msg.get("type") != "text":
                    continue
                from_id = (msg.get("from") or "").strip()
                text_body = ((msg.get("text") or {}).get("body") or "").strip()
                if from_id and text_body:
                    out.append((from_id, text_body))
    return out


@router.get("/webhook")
async def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    """Verificación GET de Meta (subscribe)."""
    if hub_mode != "subscribe":
        raise HTTPException(status_code=403, detail="Forbidden")
    s = get_settings()
    expected = (s.whatsapp_verify_token or "").strip()
    if not expected or hub_verify_token != expected:
        raise HTTPException(status_code=403, detail="Invalid verify token")
    return Response(content=hub_challenge or "", media_type="text/plain")


@router.post("/webhook")
async def receive_webhook(request: Request):
    raw = await request.body()
    s = get_settings()

    secret = (s.whatsapp_app_secret or "").strip()
    if secret:
        sig = request.headers.get("x-hub-signature-256")
        if not _verify_meta_signature(raw, sig, secret):
            raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        body = json.loads(raw.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    pairs = _iter_incoming_texts(body)
    if not pairs:
        return {"status": "ok"}

    for wa_id, user_text in pairs:
        reply = await _ollama_reply(user_text)
        await _send_whatsapp_text(wa_id, reply)

    return {"status": "ok"}
