"""
Replica de la lógica de calculate_cost de calculator_window.py.
Márgen 50%, costo filamento base $500 MXN/kg.
"""
from app.config import get_settings


def calculate_cost(
    horas: float = 0,
    minutos: float = 0,
    gramos: float = 0,
    limpieza: float = 0,
    diseno: float = 0,
    cantidad: float = 1,
    envio: float = 0,
) -> dict:
    s = get_settings()
    tiempo_total_min = horas * 60 + minutos
    # Gramos -> kg: /1000, luego * costo por kg
    costo_filamento = (gramos / 1000) * s.costo_filamento_base
    costo_energia = (s.costo_energia_base * tiempo_total_min) / 60
    costo_limpieza = (s.costo_limpieza_base * limpieza) / 60
    costo_diseno = (s.costo_diseno_base * diseno) / 60
    costo_base_pieza = costo_filamento + costo_energia + costo_limpieza + costo_diseno
    costo_final_total = (costo_base_pieza + (costo_base_pieza * s.margen_ganancia)) * cantidad + envio
    return {
        "costo_filamento": round(costo_filamento, 2),
        "costo_energia": round(costo_energia, 2),
        "costo_limpieza": round(costo_limpieza, 2),
        "costo_diseno": round(costo_diseno, 2),
        "costo_base_pieza": round(costo_base_pieza, 2),
        "costo_final_total": round(costo_final_total, 2),
        "tiempo_total_min": round(tiempo_total_min, 2),
        "detalles": {
            "tiempo_total": round(tiempo_total_min, 2),
            "costo_filamento": round(costo_filamento, 2),
            "costo_energia": round(costo_energia, 2),
            "costo_limpieza": round(costo_limpieza, 2),
            "costo_diseno": round(costo_diseno, 2),
            "costo_envio": round(envio, 2),
        },
    }
