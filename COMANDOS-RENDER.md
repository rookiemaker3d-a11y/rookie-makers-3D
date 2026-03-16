# Subir cambios a Render

Render despliega automáticamente cuando haces **push** a tu rama (por ejemplo `main`).

## Comandos para subir

Abre terminal en la carpeta del proyecto (`rokie`) y ejecuta:

```powershell
cd c:\Users\norbe\Desktop\rokie

# 1. Añadir todos los cambios
git add .

# 2. Crear commit
git commit -m "Correcciones UI: modo claro, logo, cotización PDF, inventario y resumidor"

# 3. Subir a GitHub (Render detecta el push y vuelve a desplegar)
git push origin main
```

Si usas otra rama (por ejemplo `master`), cambia `main` por el nombre de tu rama:

```powershell
git push origin master
```

## Después del push

- Si en Render el servicio está conectado a este repo, en unos minutos se iniciará el deploy.
- En el dashboard de Render verás el build y luego el servicio actualizado.
- El backend suele ser `rookie-makers-3d-1.onrender.com` (o el nombre que tenga tu Web Service).

## Si no tienes nada subido aún

1. Crea un repo en GitHub (si no lo tienes).
2. Si aún no añadiste el remoto:
   ```powershell
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   ```
3. Luego:
   ```powershell
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
4. En [dashboard.render.com](https://dashboard.render.com): **New** → **Web Service**, conecta el repo de GitHub y configura build/start según tu backend o frontend.
