# Descargar cotizaciones a tu PC

Este programa se conecta a la API de Rookie, inicia sesión con tu cuenta y descarga los archivos adjuntos de las cotizaciones a una carpeta en tu computadora.

## Requisitos

- Python 3.7 o superior
- Conexión a internet

## Instalación

1. Abre una terminal en esta carpeta (`download-cotizaciones`).
2. Crea un entorno virtual (opcional pero recomendado):

   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. Instala la dependencia:

   ```bash
   pip install -r requirements.txt
   ```

## Uso

### Opción 1: Argumentos en la línea de comandos

```bash
python descargar_cotizaciones.py --api-url https://rookie-makers-3d.onrender.com --email tu@email.com --carpeta C:\RookieMaker\Cotizaciones
```

Te pedirá la contraseña si no la pasas. Para no escribirla en la consola, usa variables de entorno (ver abajo).

### Opción 2: Variables de entorno

En Windows (PowerShell):

```powershell
$env:ROOKIE_API_URL = "https://rookie-makers-3d.onrender.com"
$env:ROOKIE_EMAIL = "tu@email.com"
$env:ROOKIE_PASSWORD = "tu_contraseña"
$env:ROOKIE_CARPETA = "C:\RookieMaker\Cotizaciones"
python descargar_cotizaciones.py
```

En Windows (CMD):

```cmd
set ROOKIE_API_URL=https://rookie-makers-3d.onrender.com
set ROOKIE_EMAIL=tu@email.com
set ROOKIE_PASSWORD=tu_contraseña
set ROOKIE_CARPETA=C:\RookieMaker\Cotizaciones
python descargar_cotizaciones.py
```

### Opción 3: Guardar también un JSON con los datos

Para guardar además un archivo `cotizaciones_metadata.json` con la lista de cotizaciones y los archivos descargados:

```bash
python descargar_cotizaciones.py --api-url ... --email ... --carpeta ... --json
```

## Parámetros

| Parámetro   | Variable de entorno | Descripción                                      |
|-------------|---------------------|--------------------------------------------------|
| `--api-url` | `ROOKIE_API_URL`    | URL base de la API (sin `/api` al final)         |
| `--email`   | `ROOKIE_EMAIL`      | Correo con el que inicias sesión en la app       |
| `--password`| `ROOKIE_PASSWORD`   | Contraseña                                       |
| `--carpeta` | `ROOKIE_CARPETA`    | Carpeta donde se guardarán los archivos          |
| `--json`    | —                   | Guardar además `cotizaciones_metadata.json`     |

Si no indicas carpeta, se usa la carpeta `Cotizaciones` en el directorio actual.

## Notas

- Solo se descargan cotizaciones a las que tu usuario tiene acceso (las tuyas si eres vendedor de ventas, o las de tu equipo si eres diseñador/admin).
- Las cuentas con MFA (código en el correo) deben usar la aplicación web; este script no pide el código MFA.
- Los archivos se guardan con el nombre `{id}_{nombre_original}` para evitar sobrescrituras.
