# Flujo: perfil Vendedor vs Diseñador y peticiones de cotización

Resumen de lo que se pidió para implementar más adelante.

---

## 1. Roles

- **Diseñadores:** Los que hoy están como "Vendedores" en la tabla (Daniel, Fidel, Norberto como diseñadores). Siguen siendo los que fabrican/desarrollan.
- **Vendedor (nuevo):** Rol para 2 o más usuarios nuevos. No fabrican; envían peticiones de cotización a Norberto. Se afilian a un diseñador.

---

## 2. Tabla de usuarios y botón “Agregar usuario”

- En la pantalla donde “estamos todos” (p. ej. Vendedores / Usuarios): agregar o actualizar el botón **Agregar usuario** para dar de alta **nuevos Vendedores** (y que se guarden en BD con rol `vendedor` y, si aplica, vínculo al diseñador).

---

## 3. Flujo del Vendedor: petición de cotización

- El **Vendedor** sube una **petición de cotización**:
  - Escribe el **nombre del cliente** (se guarda).
  - Sube solo **foto** y/o **enlace del STL** para que se calcule.
- Esa orden/petición se envía **directo al perfil de Norberto** (administrador).
- En Norberto aparece como **“Petición de cotización”** (lista o bandeja).

---

## 4. Flujo de Norberto (admin) al atender la petición

- Norberto **abre** la petición.
- **Omite** los pasos de carga de información (cliente ya viene de la petición; no repite carga).
- Pasa **directo a la calculadora** (y cuando corresponda, a los demás pasos).
- Cuando **termine** (cotización lista), el Vendedor recibe que ya está lista.

---

## 5. Lo que ve el Vendedor al terminar Norberto

- **Vista previa del PDF** (módulo de la cotización para el cliente).
- **Módulo de costos** (solo visible para el Vendedor):
  - **Costo que te cuesta a ti (Norberto)** hacerlo.
  - **Costo al cliente** (lo que se le cobra).
  - **Porcentaje que se le da al Vendedor:**
    - De tu costo (Norberto) se resta **20%** y ese 20% va para el Vendedor (tiene que verse explícito: “se me resta X y se le va a él”).
    - Sobre el costo que tú le das al Vendedor, se saca **10%** y se añade (ej. 20% + 10% = total que ve el Vendedor).
  - **Apartado de descuento** si el Vendedor quiere aplicar descuento.
  - **MUI** en el apartado de Norberto (campo/valor que solo tú manejas).

---

## 6. Afiliación y “Cotización en espera”

- Cada **Vendedor** se afilia a **un Diseñador** (relación en BD).
- El Vendedor tiene un apartado **“Cotización en espera”** (o similar) donde:
  - Ve **en qué punto está** la cotización.
  - Ve **cómo se va desarrollando** (Norberto va subiendo foto o omitiendo foto y avanzando).
- Cuando Norberto **termina**, al Vendedor le llega **notificación de que terminó**.
- El Vendedor le avisa al cliente y se entrega el producto.

---

## 7. Resumen técnico (para implementación futura)

| Tema | Acción |
|------|--------|
| Roles | Renombrar “Vendedor” actual → “Diseñador”; nuevo rol “Vendedor” (vendedor externo). |
| BD | Tabla o campos: usuario.rol (`diseñador` | `vendedor` | `administrador`), vendedor.diseñador_id (afiliación). |
| UI | Pantalla usuarios: botón **Agregar usuario** que permita crear usuario con rol Vendedor y asignar diseñador. |
| Petición | Formulario “Petición de cotización”: nombre cliente + foto/enlace STL; guardar y crear registro que llegue a Norberto. |
| Bandeja Norberto | Lista “Peticiones de cotización” con atajo a calculadora (sin repetir pasos de cliente). |
| Vista Vendedor | Al cerrar cotización: vista previa PDF + bloque “Costos” (costo interno, 20%, 10%, descuento, MUI). |
| Estado / notificación | Cotización en espera con estados; notificación al Vendedor cuando estado = terminado. |

---

Cuando quieras implementar esto, se puede hacer por fases: primero roles y tabla de usuarios, luego peticiones, luego bandeja de Norberto y por último costos y notificaciones.
