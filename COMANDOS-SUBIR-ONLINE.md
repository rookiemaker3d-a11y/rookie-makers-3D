# Comandos CMD para subir los cambios a la web en línea

Estos comandos hacen que el código llegue al repositorio (GitHub) que usa Vercel y Render. Cuando hagas **push**, ellos redespliegan solos.

---

## Opción A: Usar el archivo .bat (recomendado)

1. Doble clic en **`SUBIR-CAMBIOS-ONLINE.bat`** (está en la carpeta `rokie`).
2. Si sale que Git no está instalado: instala Git desde https://git-scm.com/download/win y vuelve a ejecutar el .bat.
3. Si es la primera vez y no tienes `.git`: el .bat te dirá que añadas el remote. En GitHub crea un repo (o usa el que ya tengas), copia la URL y en CMD ejecuta:
   ```cmd
   cd c:\Users\norbe\Desktop\rokie
   git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git
   ```
   Luego vuelve a ejecutar **SUBIR-CAMBIOS-ONLINE.bat**.

---

## Opción B: Comandos a mano (si ya tienes Git y repo)

Abre **CMD** (Win + R → `cmd` → Enter) y ejecuta **uno por uno**:

```cmd
cd c:\Users\norbe\Desktop\rokie
```

Si **nunca** has inicializado Git en esta carpeta:

```cmd
git init
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
```

(Sustituye `TU_USUARIO/TU_REPO` por tu usuario y nombre del repo en GitHub.)

Luego siempre:

```cmd
git add .
git commit -m "Subir cambios: estilos, vendedores, permisos"
git push -u origin main
```

Si te pide usuario y contraseña: en GitHub ya no se usa contraseña normal; usa un **Personal Access Token** como contraseña (GitHub → Settings → Developer settings → Personal access tokens).

---

## Después del push

- **Vercel** y **Render** detectan el push y redespliegan en 2–5 minutos.
- Recarga la web (rookie-makers-3-d.vercel.app) y la API en línea tendrá los cambios.

---

## Si no tienes Git instalado

1. Descarga: https://git-scm.com/download/win  
2. Instala (siguiente, siguiente).  
3. Cierra CMD y ábrelo de nuevo.  
4. Vuelve a ejecutar el .bat o los comandos de la Opción B.
