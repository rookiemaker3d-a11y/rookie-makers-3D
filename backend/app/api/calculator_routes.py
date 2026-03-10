from fastapi import APIRouter, Depends
from app.auth import require_user
from app.schemas import CalculateCostRequest, CalculateCostResponse
from app.services.cost_calculator import calculate_cost

router = APIRouter(prefix="/calculator", tags=["calculator"])


@router.post("/calculate", response_model=CalculateCostResponse)
async def api_calculate_cost(body: CalculateCostRequest, _user=Depends(require_user)):
    result = calculate_cost(
        horas=body.horas,
        minutos=body.minutos,
        gramos=body.gramos,
        limpieza=body.limpieza,
        diseno=body.diseno,
        cantidad=body.cantidad,
        envio=body.envio,
    )
    return CalculateCostResponse(
        costo_filamento=result["costo_filamento"],
        costo_energia=result["costo_energia"],
        costo_limpieza=result["costo_limpieza"],
        costo_diseno=result["costo_diseno"],
        costo_base_pieza=result["costo_base_pieza"],
        costo_final_total=result["costo_final_total"],
        tiempo_total_min=result["tiempo_total_min"],
    )
