"""Tests unitarios de cifrado de tarjetas (sin BD)."""
from app.services.card_crypto import encrypt_card_number, decrypt_card_number, card_last4


def test_encrypt_decrypt_roundtrip():
    pan = "4111111111111111"
    token = encrypt_card_number(pan)
    assert token != pan  # realmente cifra
    assert decrypt_card_number(token) == pan


def test_card_last4_extrae_ultimos_4_digitos():
    assert card_last4("4111 1111 1111 1234") == "1234"
    assert card_last4("1234567890") == "7890"


def test_card_last4_devuelve_none_si_menos_de_4_digitos():
    assert card_last4("123") is None
    assert card_last4("") is None
    assert card_last4(None) is None


def test_encrypt_vacio_no_crachea():
    token = encrypt_card_number("")
    assert isinstance(token, str)