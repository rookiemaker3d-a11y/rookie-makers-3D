import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet

from app.config import get_settings


def _fernet() -> Fernet:
    """
    Deriva una llave Fernet desde settings.secret_key.
    Importante: solo para ofuscar/encriptar en DB; nunca devolvemos tarjeta completa por API.
    """
    settings = get_settings()
    raw = (settings.secret_key or "").encode("utf-8")
    digest = hashlib.sha256(raw).digest()
    key = base64.urlsafe_b64encode(digest)  # 32 bytes -> base64 urlsafe
    return Fernet(key)


def encrypt_card_number(pan: str) -> str:
    f = _fernet()
    token = f.encrypt((pan or "").encode("utf-8"))
    return token.decode("utf-8")


def decrypt_card_number(token: str) -> str:
    f = _fernet()
    pan = f.decrypt((token or "").encode("utf-8"))
    return pan.decode("utf-8")


def card_last4(pan: Optional[str]) -> Optional[str]:
    digits = "".join([c for c in (pan or "") if c.isdigit()])
    if len(digits) < 4:
        return None
    return digits[-4:]

