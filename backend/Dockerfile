# Backend Rookie Makers 3D - FastAPI
FROM python:3.12-slim

WORKDIR /app

# Dependencias del sistema (por si algún paquete Python las necesita)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Variables de entorno se inyectan en docker-compose / .env
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
