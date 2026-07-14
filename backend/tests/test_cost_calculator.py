"""Tests unitarios de la lógica de cálculo de costo (sin BD)."""
from app.services.cost_calculator import calculate_cost


def test_calculate_cost_devuelve_todas_las_claves():
    r = calculate_cost()
    for k in ("costo_filamento", "costo_energia", "costo_limpieza", "costo_diseno",
              "costo_base_pieza", "costo_final_total", "tiempo_total_min", "detalles"):
        assert k in r
    assert "tiempo_total" in r["detalles"]


def test_costo_base_es_suma_de_componentes():
    r = calculate_cost(horas=2, gramos=200, limpieza=10, diseno=5)
    esperado = r["costo_filamento"] + r["costo_energia"] + r["costo_limpieza"] + r["costo_diseno"]
    # Cada componente se redondea a 2 decimales por separado, por lo que la suma
    # puede diferir del total redondeado hasta ~0.02.
    assert abs(r["costo_base_pieza"] - esperado) < 0.02


def test_envio_se_suma_sin_margen():
    base = calculate_cost(gramos=500)
    con_envio = calculate_cost(gramos=500, envio=50)
    # El envio se suma al final, sin aplicar margen.
    assert abs((con_envio["costo_final_total"] - base["costo_final_total"]) - 50) < 0.01


def test_cantidad_multiplica_el_costo_base():
    uno = calculate_cost(gramos=500)
    dos = calculate_cost(gramos=500, cantidad=2)
    # La parte de base*1.5 se duplica; el envio (0) no cambia.
    assert abs((dos["costo_final_total"] - uno["costo_final_total"]) - uno["costo_final_total"]) < 0.01


def test_entradas_en_cero_devuelven_cero():
    r = calculate_cost()
    assert r["costo_base_pieza"] == 0
    assert r["costo_final_total"] == 0


def test_tiempo_total_convierte_horas_a_minutos():
    r = calculate_cost(horas=1, minutos=30)
    assert r["tiempo_total_min"] == 90