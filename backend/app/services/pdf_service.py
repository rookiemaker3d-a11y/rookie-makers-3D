import io
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
def build_quote_pdf(
    items: list[dict],
    vendedor_nombre: str,
    vendedor_banco: str = "",
    vendedor_cuenta: str = "",
    tipo: str = "cotizacion",
    logo_path: str | None = None,
) -> bytes:
    """
    Genera PDF de cotización o recibo. Usa fuentes PDF estándar (Helvetica).
    tipo: "cotizacion" | "recibo"
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name="Title", fontName="Helvetica-Bold", fontSize=18, spaceAfter=12)
    body_style = styles["Normal"]
    elements = []

    if logo_path:
        try:
            logo = RLImage(logo_path, width=50 * mm, height=35 * mm)
            elements.append(logo)
            elements.append(Spacer(1, 10))
        except Exception:
            pass

    titulo = "Rookie Makers 3D"
    subtitulo = "COTIZACIÓN DE IMPRESIÓN 3D" if tipo == "cotizacion" else "RECIBO DE VENTA"
    elements.append(Paragraph(titulo, title_style))
    elements.append(Paragraph(subtitulo, title_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Fecha: {date.today().isoformat()}", body_style))
    elements.append(Paragraph(f"Vendedor: {vendedor_nombre}", body_style))
    elements.append(Spacer(1, 15))

    # Tabla
    headers = ["Descripción", "Cant.", "Tiempo (min)", "Costo Final"]
    if tipo == "recibo":
        headers[2] = "Tiempo (hrs)"
    data = [headers]
    total_final = 0.0
    for item in items:
        desc = item.get("descripcion", "N/A")
        cant = item.get("cantidad", 1)
        detalles = item.get("detalles") or {}
        tiempo = detalles.get("tiempo_total", 0)
        if tipo == "recibo":
            tiempo = round(tiempo / 60, 2)
        costo = item.get("costo_final", 0)
        total_final += costo
        data.append([desc, str(int(cant)), f"{tiempo:.2f}", f"${costo:.2f}"])
    data.append(["", "", "Total:", f"${total_final:.2f}"])
    t = Table(data, colWidths=[220, 45, 95, 95])
    t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    if tipo == "cotizacion":
        terms = "Términos Generales: Esta cotización tiene una validez de 3 días hábiles. El tiempo de entrega es de 3 días hábiles a partir de la confirmación del pedido."
    else:
        terms = "Términos de Garantía: Solo nos hacemos responsables durante 24 horas después de la entrega. Después de este periodo, no se emitirán reembolsos ni se aceptarán devoluciones."
    elements.append(Paragraph(terms, body_style))
    elements.append(Spacer(1, 15))
    if vendedor_banco or vendedor_cuenta:
        elements.append(Paragraph("Cuenta para Depósito:", ParagraphStyle(name="Bold", fontName="Helvetica-Bold", fontSize=10)))
        elements.append(Paragraph(f"Banco: {vendedor_banco} - Cuenta: {vendedor_cuenta}", body_style))

    doc.build(elements)
    buf.seek(0)
    return buf.read()
