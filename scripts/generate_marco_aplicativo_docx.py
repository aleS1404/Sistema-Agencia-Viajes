from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
OUTPUT = ROOT / "Marco_Aplicativo_Capitulo_III.docx"
USE_CASE_PDF = ROOT / "Distribucion_Tareas_Diagrama_Casos_de_Uso_Booking.pdf"
USE_CASE_IMAGE = ASSETS / "diagrama-casos-de-uso.jpg"

BLUE = "1F4E78"
LIGHT_BLUE = "D9EAF7"
LIGHT_GREEN = "E2F0D9"
LIGHT_GRAY = "F2F2F2"
WHITE = "FFFFFF"
TEXT = RGBColor(31, 31, 31)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=90, start=90, bottom=90, end=90):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("Página ")
    run.font.name = "Times New Roman"
    run.font.size = Pt(9)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


def add_toc(paragraph):
    run = paragraph.add_run()
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = ' TOC \\o "1-3" \\h \\z \\u '
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "Actualice la tabla de contenido en Word con F9."
    fld_char3 = OxmlElement("w:fldChar")
    fld_char3.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char1, instr_text, fld_char2, text, fld_char3])


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    rel_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), rel_id)
    run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), BLUE)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    r_pr.extend([color, underline])
    run.append(r_pr)
    text_node = OxmlElement("w:t")
    text_node.text = text
    run.append(text_node)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def style_document(doc):
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.2)
    section.left_margin = Cm(2.7)
    section.right_margin = Cm(2.2)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Times New Roman"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    normal.font.size = Pt(12)
    normal.font.color.rgb = TEXT
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    normal.paragraph_format.space_after = Pt(6)

    for name, size, color in (
        ("Title", 18, BLUE),
        ("Heading 1", 16, BLUE),
        ("Heading 2", 14, BLUE),
        ("Heading 3", 12, BLUE),
    ):
        style = styles[name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.space_before = Pt(10)
        style.paragraph_format.space_after = Pt(5)

    if "Caption Custom" not in [s.name for s in styles]:
        caption = styles.add_style("Caption Custom", WD_STYLE_TYPE.PARAGRAPH)
        caption.font.name = "Times New Roman"
        caption._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        caption.font.size = Pt(10)
        caption.font.italic = True
        caption.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        caption.paragraph_format.space_after = Pt(8)

    for sec in doc.sections:
        add_page_number(sec.footer.paragraphs[0])


def add_body(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_lead and text.startswith(bold_lead):
        p.add_run(bold_lead).bold = True
        p.add_run(text[len(bold_lead):])
    else:
        p.add_run(text)
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.add_run(text)
    return p


def add_number(doc, text):
    p = doc.add_paragraph(style="List Number")
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.add_run(text)
    return p


def make_table(doc, headers, rows, widths=None, font_size=9):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    header = table.rows[0]
    set_repeat_table_header(header)
    for idx, text in enumerate(headers):
        cell = header.cells[idx]
        set_cell_shading(cell, BLUE)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(str(text))
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.name = "Times New Roman"
        run.font.size = Pt(font_size)
    for ridx, row_data in enumerate(rows):
        row = table.add_row()
        for idx, text in enumerate(row_data):
            cell = row.cells[idx]
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            if ridx % 2 == 1:
                set_cell_shading(cell, LIGHT_GRAY)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.0
            run = p.add_run(str(text))
            run.font.name = "Times New Roman"
            run.font.size = Pt(font_size)
        if widths:
            for idx, width in enumerate(widths):
                row.cells[idx].width = Cm(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_caption(doc, text):
    p = doc.add_paragraph(style="Caption Custom")
    p.add_run(text)
    return p


def add_picture(doc, path, caption, width=None, height=None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    kwargs = {}
    if width:
        kwargs["width"] = width
    if height:
        kwargs["height"] = height
    p.add_run().add_picture(str(path), **kwargs)
    add_caption(doc, caption)


def extract_use_case_image():
    ASSETS.mkdir(parents=True, exist_ok=True)
    reader = PdfReader(str(USE_CASE_PDF))
    image = reader.pages[0].images[0]
    USE_CASE_IMAGE.write_bytes(image.data)


def add_cover(doc):
    for _ in range(2):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("UNIVERSIDAD MAYOR DE SAN ANDRÉS\nFACULTAD DE CIENCIAS PURAS Y NATURALES\nCARRERA DE INFORMÁTICA")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(45)
    r = p.add_run("CAPÍTULO III\nMARCO APLICATIVO")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(20)
    r.font.color.rgb = RGBColor.from_string(BLUE)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(25)
    r = p.add_run("SISTEMA PROTOTIPO DE GESTIÓN TURÍSTICA PARA UNA AGENCIA DE VIAJES DE LA PAZ, INSPIRADO EN BOOKING.COM")
    r.bold = True
    r.font.size = Pt(14)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(45)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Integrantes:\n").bold = True
    p.add_run(
        "Condori Alcazar Sheyla Micaela\n"
        "Masco Vargas Melani\n"
        "Salazar Gisberth Alexandra Cristal"
    )
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(55)
    p.add_run("La Paz – Bolivia\nGestión 2/2026")
    doc.add_page_break()


def add_introduction(doc):
    doc.add_heading("CAPÍTULO III: MARCO APLICATIVO", level=1)
    doc.add_heading("3.1 Introducción", level=2)
    add_body(
        doc,
        "El presente capítulo describe la aplicación práctica del proyecto mediante una adaptación académica de Scrum y un desarrollo iterativo e incremental. La propuesta toma como referencia funcional a Booking.com, pero se limita a un prototipo demostrativo para una agencia de viajes de pequeña escala en la ciudad de La Paz. El alcance comprende usuarios por rol, clientes y preferencias, proveedores, destinos, servicios turísticos, búsqueda y comparación, reservas simuladas, pagos demostrativos, cancelaciones, reembolsos, reclamos, recomendaciones personalizadas, reportes y auditoría.",
    )
    add_body(
        doc,
        "La construcción del marco aplicativo se fundamenta principalmente en el diagrama de casos de uso aprobado por el equipo y en los alcances definidos en la primera presentación. El sistema no procesa operaciones bancarias reales, no emite facturación fiscal y no representa ofertas comerciales vigentes. Los registros se identifican como datos sintéticos y la ejecución prevista es local mediante Docker.",
    )
    add_body(
        doc,
        "Para mantener coherencia tecnológica se adopta como línea base React y TypeScript para la interfaz, NestJS para la API, MySQL 8.4 para persistencia y Python/scikit-learn para el componente experimental de recomendación y predicción. Esta decisión resuelve, para el marco aplicativo, la contradicción existente entre el apartado tecnológico de la primera presentación y algunas menciones posteriores a Django y PostgreSQL.",
    )


def add_backlog(doc):
    doc.add_heading("3.2 Product Backlog", level=2)
    add_body(
        doc,
        "El Product Backlog reúne las necesidades funcionales y técnicas derivadas de los objetivos, alcances y casos de uso. La prioridad Alta corresponde al incremento mínimo que debe funcionar en la presentación; Media aporta operación y análisis; Baja se implementa cuando no compromete el núcleo del prototipo.",
    )
    backlog = [
        ("PB-01", "Entorno reproducible y arquitectura única", "Alta", "El proyecto inicia desde instrucciones versionadas y Docker."),
        ("PB-02", "Registro, autenticación y autorización por roles", "Alta", "Cada rol accede únicamente a las operaciones autorizadas."),
        ("PB-03", "Gestión de proveedores, destinos y servicios", "Alta", "Administrador/proveedor mantiene un catálogo sintético válido."),
        ("PB-04", "Perfil del cliente y preferencias", "Alta", "Presupuesto, duración e intereses quedan almacenados."),
        ("PB-05", "Búsqueda y comparación de servicios", "Alta", "Se filtra por destino, categoría, precio y duración."),
        ("PB-06", "Reserva e itinerario simulados", "Alta", "La reserva conserva detalle, importe, fechas y estado coherentes."),
        ("PB-07", "Pago simulado y trazabilidad", "Alta", "La transacción tiene referencia, monto y estado sin almacenar tarjetas."),
        ("PB-08", "Cancelación y reembolso", "Alta", "La solicitud y devolución quedan trazadas y respetan el monto pagado."),
        ("PB-09", "Registro y atención de reclamos", "Media", "El cliente registra el reclamo y soporte documenta su resolución."),
        ("PB-10", "Recomendación basada en contenido", "Alta", "Devuelve hasta cinco opciones válidas con explicación de coincidencias."),
        ("PB-11", "Dashboard empresarial", "Media", "Presenta reservas, estados, cancelaciones e importes definidos."),
        ("PB-12", "Predicción semanal experimental", "Baja", "Estima la siguiente semana y muestra límites y versión de datos."),
        ("PB-13", "Seguridad, auditoría, respaldo y restauración", "Alta", "Permisos se validan en servidor y la copia puede restaurarse."),
        ("PB-14", "Pruebas, UML, instalación y evidencias", "Alta", "Historias críticas tienen pruebas y documentación reproducible."),
    ]
    make_table(doc, ["ID", "Elemento del backlog", "Prioridad", "Criterio de aceptación"], backlog, font_size=8)


def add_scrum_roles(doc):
    doc.add_heading("3.3 Roles Scrum", level=2)
    add_body(
        doc,
        "Debido a que el equipo está conformado por tres integrantes y no existe un Product Owner externo, se adopta una distribución compatible con un proyecto académico. Las responsabilidades Scrum no sustituyen las responsabilidades de desarrollo: las tres integrantes participan como Developers y revisan cada incremento.",
    )
    roles = [
        ("Product Owner", "Sheyla", "Prioriza el backlog, aclara requisitos, valida alcance, casos de uso y modelos."),
        ("Scrum Master", "Alexandra", "Facilita planificación, seguimiento, revisión y retrospectiva; registra impedimentos."),
        ("Líder de desarrollo e integración", "Melani", "Coordina la integración de backend, frontend, base de datos y versiones ejecutables."),
        ("Developers", "Sheyla, Melani y Alexandra", "Analizan, diseñan, programan, prueban, documentan y presentan el incremento."),
        ("Especialista de IA y datos", "Alexandra", "Prepara datos sintéticos, recomendador, métricas y predicción experimental."),
        ("Arquitectura y seguridad", "Sheyla con apoyo del equipo", "Mantiene UML, reglas de acceso, trazabilidad y criterios de seguridad."),
    ]
    make_table(doc, ["Rol / responsabilidad", "Responsable", "Funciones"], roles, font_size=9)
    add_body(
        doc,
        "El docente se considera interesado y revisor académico. No se le asignan responsabilidades operativas de Product Owner ni Scrum Master sin aceptación expresa. Cuando una integrante cumple una responsabilidad Scrum y desarrolla una tarea técnica, ambas actividades se registran de manera separada.",
    )


SPRINTS = [
    {
        "title": "Sprint 1 — Base verificable",
        "dates": "10 al 23 de agosto de 2026",
        "goal": "Disponer de una base técnica reproducible, acceso inicial por roles y un modelo relacional coherente con el alcance.",
        "backlog": "PB-01, inicio de PB-02, PB-03, PB-04 y PB-13.",
        "increment": "MySQL 8.4 ejecutable con Docker, 17 tablas, datos sintéticos mínimos, consultas de verificación y documentación de instalación.",
        "acceptance": "Contenedor saludable; scripts ejecutados sin intervención; claves foráneas y CHECK activos; otra integrante reproduce la instalación.",
        "tasks": [
            ("Sheyla", "10 h", "Consolidar requisitos; delimitar actores y roles; revisar el modelo conceptual/ER; definir permisos y criterios de aceptación.", "Matriz de requisitos, UML y revisión del esquema."),
            ("Melani", "10 h", "Configurar Docker Compose; crear esquema MySQL, restricciones, índices, datos iniciales y README.", "Base ejecutable y scripts SQL."),
            ("Alexandra", "10 h", "Definir atributos de preferencias e intereses; preparar datos sintéticos mínimos; comprobar consultas y restricciones.", "Catálogo semilla y reporte de verificación."),
        ],
    },
    {
        "title": "Sprint 2 — Catálogo, clientes y búsqueda",
        "dates": "24 de agosto al 6 de septiembre de 2026",
        "goal": "Permitir administrar y consultar el catálogo de demostración según el perfil y las preferencias del viajero.",
        "backlog": "PB-02, PB-03, PB-04, PB-05 y parte de PB-14.",
        "increment": "Usuario autenticado consulta el catálogo; administrador mantiene proveedores y servicios; filtros principales disponibles.",
        "acceptance": "Contraseñas no se almacenan en texto plano; filtros cumplen restricciones; usuario no autorizado no modifica catálogo; datos se marcan como sintéticos.",
        "tasks": [
            ("Sheyla", "10 h", "Documentar casos de uso de acceso, catálogo y preferencias; definir matriz rol-permiso; validar formularios y navegación.", "Casos de uso y matriz de autorización."),
            ("Melani", "10 h", "Implementar autenticación/JWT, CRUD de proveedores y servicios, endpoints de filtros y primeras vistas React.", "API de catálogo y pantallas funcionales."),
            ("Alexandra", "10 h", "Generar catálogo objetivo de 60 servicios y 30 perfiles; verificar coherencia de precios, duración, etiquetas y filtros.", "Conjuntos sintéticos versionados y pruebas de datos."),
        ],
    },
    {
        "title": "Sprint 3 — Reserva, pago y recomendación",
        "dates": "7 al 20 de septiembre de 2026",
        "goal": "Completar el recorrido desde la búsqueda hasta una reserva simulada y una recomendación explicable.",
        "backlog": "PB-06, PB-07, versión mínima de PB-08, PB-09 y PB-10.",
        "increment": "Cliente obtiene hasta cinco recomendaciones y registra reserva, itinerario y pago simulado con trazabilidad.",
        "acceptance": "Recomendaciones respetan presupuesto/duración; total coincide con detalles; estados válidos; no se consultan reservas ajenas; cambios sensibles se auditan.",
        "tasks": [
            ("Sheyla", "10 h", "Definir estados y reglas de reserva, cancelación, reembolso y reclamo; revisar autorizaciones y auditoría.", "Reglas de negocio y diagramas de actividad."),
            ("Melani", "10 h", "Implementar reserva, detalle, pago simulado, cancelación/reclamo y sus interfaces; integrar transacciones.", "Flujo funcional reserva–pago–postventa."),
            ("Alexandra", "10 h", "Construir TF-IDF, codificación de intereses y similitud coseno; generar explicación y pruebas del top 5.", "Servicio de recomendación y resultados reproducibles."),
        ],
    },
    {
        "title": "Sprint 4 — Analítica e integración",
        "dates": "21 de septiembre al 4 de octubre de 2026",
        "goal": "Transformar el historial sintético en indicadores verificables y una predicción académica de corto plazo.",
        "backlog": "PB-11, PB-12, evaluación de PB-10 y parte de PB-14.",
        "increment": "Dashboard filtrable, métricas del recomendador y predicción de reservas de la semana siguiente.",
        "acceptance": "Indicadores usan definiciones documentadas; importe no se presenta como utilidad; datos de evaluación no contaminan ajuste; modelo conserva fecha de corte y parámetros.",
        "tasks": [
            ("Sheyla", "10 h", "Validar definiciones de indicadores y filtros; revisar privacidad, permisos, presentación y trazabilidad de reportes.", "Especificación del dashboard y control de acceso."),
            ("Melani", "10 h", "Implementar endpoints agregados e interfaz React del dashboard; integrar resultados de IA y exportación demostrativa.", "Dashboard conectado a la API."),
            ("Alexandra", "10 h", "Generar 156 semanas sintéticas; calcular Precision@5, NDCG@5, cobertura y p95; entrenar PoissonRegressor.", "Métricas, predictor y reporte de evaluación."),
        ],
    },
    {
        "title": "Sprint 5 — Seguridad y calidad",
        "dates": "5 al 18 de octubre de 2026",
        "goal": "Demostrar que el incremento integrado satisface los recorridos críticos y controles mínimos de calidad y seguridad.",
        "backlog": "Cierre de PB-08, PB-09, PB-13 y PB-14.",
        "increment": "Versión candidata para presentación con pruebas, respaldo/restauración, manuales y defectos críticos corregidos.",
        "acceptance": "Cero defectos bloqueantes; permisos validados en backend; restauración exitosa; secretos fuera del repositorio; resultados reproducibles.",
        "tasks": [
            ("Sheyla", "10 h", "Ejecutar pruebas de acceso indebido y manipulación; revisar UML, seguridad, respaldo y evidencias de aceptación.", "Matriz de pruebas de seguridad y acta de aceptación."),
            ("Melani", "10 h", "Corregir defectos de integración; completar flujos postventa; preparar instalación limpia y manual técnico.", "Release candidata e instalador reproducible."),
            ("Alexandra", "10 h", "Cerrar evaluación de IA, rendimiento y casos sin coincidencias; documentar límites y resultados.", "Informe de IA y pruebas de desempeño."),
        ],
    },
]


def add_sprint_planning(doc):
    doc.add_heading("3.4 Sprint Planning", level=2)
    add_body(
        doc,
        "Antes de cada Sprint se realiza una reunión de planificación. El equipo revisa el objetivo, selecciona los elementos priorizados del Product Backlog y los descompone en tareas compatibles con una capacidad conjunta de 30 horas. Cada integrante asume aproximadamente 10 horas por iteración, sin impedir apoyo cruzado. La estimación se registra en horas y la evidencia esperada se define antes de iniciar.",
    )
    add_body(
        doc,
        "Las fechas siguientes reproducen la línea base contenida en la primera presentación. Debido a que el cronograma termina el 25 de octubre de 2026, debe presentarse como cronograma ejecutado o reprogramarse si el desarrollo continúa después de esa fecha.",
    )
    for index, sprint in enumerate(SPRINTS, start=1):
        doc.add_heading(f"3.4.{index} {sprint['title']}", level=3)
        add_body(doc, f"Periodo: {sprint['dates']}.", bold_lead="Periodo:")
        add_body(doc, f"Objetivo del Sprint: {sprint['goal']}", bold_lead="Objetivo del Sprint:")
        add_body(doc, f"Backlog seleccionado: {sprint['backlog']}", bold_lead="Backlog seleccionado:")
        make_table(
            doc,
            ["Integrante", "Capacidad", "Trabajo comprometido en la planificación", "Evidencia esperada"],
            sprint["tasks"],
            font_size=8,
        )
        add_body(doc, f"Incremento esperado: {sprint['increment']}", bold_lead="Incremento esperado:")
        add_body(doc, f"Criterio de aceptación: {sprint['acceptance']}", bold_lead="Criterio de aceptación:")

    doc.add_heading("3.4.6 Semana de cierre", level=3)
    add_body(
        doc,
        "Del 19 al 25 de octubre se reservan 12 horas conjuntas para congelar el alcance, corregir documentación, ejecutar una instalación limpia, preparar los datos de demostración y distribuir la exposición. No se incorporan funciones nuevas; cualquier defecto no crítico se registra como trabajo futuro.",
    )


def add_sprint_execution(doc):
    doc.add_heading("3.5 Sprint: ejecución, seguimiento y cierre", level=2)
    add_body(
        doc,
        "El Sprint es el periodo de trabajo en el que el equipo transforma los elementos seleccionados en un incremento utilizable. La adaptación conserva transparencia, inspección y ajuste, pero sustituye el Daily Scrum diario por una coordinación semanal breve debido a la dedicación parcial del equipo.",
    )
    events = [
        ("Sprint Planning", "Inicio", "60 minutos", "Definir objetivo, backlog, tareas, responsables, horas y evidencia."),
        ("Coordinación semanal", "Una vez por semana", "15 minutos", "Revisar avances, bloqueos, dependencias y ajustes sin ampliar alcance."),
        ("Trabajo de desarrollo", "Durante el Sprint", "30 h conjuntas", "Analizar, diseñar, programar, probar, integrar y documentar."),
        ("Sprint Review", "Cierre", "45 minutos", "Demostrar el incremento y comprobar criterios de aceptación."),
        ("Retrospectiva", "Después de la revisión", "30 minutos", "Identificar qué mantener, corregir y experimentar en el siguiente Sprint."),
    ]
    make_table(doc, ["Evento", "Momento", "Duración", "Resultado"], events, font_size=9)

    doc.add_heading("3.5.1 Artefactos y compromisos", level=3)
    add_bullet(doc, "Product Backlog: lista priorizada y actualizable de necesidades del producto.")
    add_bullet(doc, "Sprint Backlog: objetivo, historias seleccionadas y plan de trabajo de la iteración.")
    add_bullet(doc, "Incremento: resultado integrado, probado y demostrable al cierre del Sprint.")
    add_bullet(doc, "Objetivo del Producto: prototipo que centraliza la gestión turística y mejora trazabilidad, atención y personalización.")
    add_bullet(doc, "Objetivo del Sprint: propósito concreto que guía decisiones y protege el alcance de la iteración.")
    add_bullet(doc, "Definition of Done: estándar común para declarar terminado un elemento.")

    doc.add_heading("3.5.2 Definition of Ready", level=3)
    add_body(
        doc,
        "Una historia está preparada cuando tiene actor y valor definidos, criterios comprobables, dependencias identificadas, datos de prueba disponibles, tamaño compatible con la capacidad y una responsable principal. Una historia ambigua no se incorpora hasta aclarar su alcance.",
    )
    doc.add_heading("3.5.3 Definition of Done", level=3)
    for item in (
        "Código integrado y revisado por otra integrante.",
        "Pruebas funcionales y técnicas aprobadas para el comportamiento implementado.",
        "Autenticación, autorización y validación ejecutadas en el servidor cuando corresponda.",
        "Datos de demostración identificados como sintéticos y sin información personal real.",
        "Documentación, diagrama o manual actualizado cuando el cambio lo exige.",
        "Sin secretos en archivos compartidos y sin defectos conocidos que bloqueen el recorrido crítico.",
        "Incremento reproducible desde una instalación limpia y demostrable en la Sprint Review.",
    ):
        add_bullet(doc, item)


def add_use_cases(doc):
    doc.add_heading("3.6 Casos de uso del sistema", level=2)
    add_body(
        doc,
        "El diagrama aprobado establece los límites funcionales del prototipo y sirve como fuente principal para priorizar el Product Backlog. Las relaciones «include» indican que el caso principal requiere la función incluida para completarse.",
    )
    add_picture(doc, USE_CASE_IMAGE, "Figura 1. Diagrama de casos de uso aprobado por el equipo.", width=Inches(6.4))
    actors = [
        ("Cliente / Viajero", "Registrarse e iniciar sesión; gestionar perfil y preferencias; buscar y comparar; consultar recomendaciones; gestionar reservas; consultar itinerario; pagar; cancelar; solicitar reembolso; consultar estados y registrar reclamos."),
        ("Administrador", "Gestionar usuarios, proveedores, servicios, políticas comerciales y reportes."),
        ("Proveedor turístico", "Gestionar la información de los servicios turísticos publicados en el prototipo."),
        ("Sistema de IA", "Generar recomendaciones personalizadas a partir de preferencias y atributos del catálogo."),
        ("Pasarela de pagos", "Registrar y verificar transacciones simuladas y participar en el flujo de reembolso."),
        ("Personal de atención", "Atender reclamos y gestionar cancelaciones/reembolsos según las reglas establecidas."),
    ]
    make_table(doc, ["Actor", "Casos de uso asociados"], actors, font_size=9)
    add_body(
        doc,
        "Para el prototipo, Sistema de IA y Pasarela de pagos se modelan como componentes simulados o internos. El proveedor se conserva como actor del negocio, aunque la primera versión de autenticación prioriza Administrador, Agente, Cliente y Soporte. Esta decisión evita atribuir una integración externa que todavía no existe.",
    )


def add_models(doc):
    doc.add_heading("3.7 Modelos del sistema", level=2)

    doc.add_heading("3.7.1 Modelo conceptual UML", level=3)
    add_body(
        doc,
        "El modelo conceptual representa las clases principales, sus atributos, operaciones y relaciones. Usuario y Rol controlan el acceso; PerfilCliente concentra preferencias; Proveedor, ServicioTuristico y Destino describen la oferta; Reserva y DetalleReserva estructuran la operación; Pago, Cancelacion, Reembolso y Reclamo cubren la trazabilidad posterior; RegistroAuditoria conserva las acciones relevantes.",
    )
    add_picture(doc, ASSETS / "modelo-conceptual.png", "Figura 2. Modelo conceptual de clases.", width=Inches(6.4))
    classes = [
        ("Identidad", "Rol, Usuario y PerfilCliente", "Autenticación, autorización y preferencias."),
        ("Catálogo", "Proveedor, ServicioTuristico y Destino", "Oferta turística y disponibilidad demostrativa."),
        ("Operación", "Reserva, DetalleReserva y Pago", "Reserva, itinerario e importe trazable."),
        ("Postventa", "Cancelacion, Reembolso y Reclamo", "Atención, resolución y devolución simulada."),
        ("Control", "RegistroAuditoria", "Registro de accesos y cambios sensibles."),
    ]
    make_table(doc, ["Dominio", "Clases", "Responsabilidad"], classes, font_size=9)

    doc.add_heading("3.7.2 Modelo de navegación", level=3)
    add_body(
        doc,
        "La navegación inicia en una superficie común de acceso y se divide según el rol autenticado. El viajero sigue el recorrido de búsqueda, detalle, reserva y seguimiento; el administrador accede a usuarios, catálogo, políticas y reportes; proveedor y soporte utilizan un panel operativo para servicios, transacciones y postventa.",
    )
    add_picture(doc, ASSETS / "modelo-navegacion.png", "Figura 3. Modelo de navegación por roles.", width=Inches(6.4))

    doc.add_heading("3.7.3 Modelo de presentación", level=3)
    add_body(
        doc,
        "El modelo de presentación define los elementos visibles y su organización. Se prioriza una interfaz web responsiva con mensajes claros, precios en bolivianos, estados explícitos y advertencias de que las operaciones son demostrativas.",
    )
    screens = [
        ("Acceso", "Logotipo/título; correo; contraseña; botón Iniciar sesión; enlace Registrarse; mensaje de error accesible."),
        ("Búsqueda", "Destino; fechas; categoría; presupuesto; duración; intereses; botón Buscar; lista de resultados; comparar."),
        ("Detalle y recomendación", "Descripción; proveedor; duración; precio; disponibilidad; intereses coincidentes; explicación; botón Reservar."),
        ("Reserva y pago", "Resumen; datos del viajero; servicios; total; método simulado; aceptación; botón Confirmar; código de operación."),
        ("Estado y postventa", "Estado de reserva/pago; itinerario; botón Cancelar; Solicitar reembolso; Registrar reclamo; historial."),
        ("Administración", "Menú lateral; usuarios; proveedores; servicios; políticas; reportes; auditoría; filtros y tablas."),
        ("Dashboard", "Periodo, destino y categoría; tarjetas KPI; línea semanal; barras por destino; estados; predicción y métricas IA."),
    ]
    make_table(doc, ["Pantalla", "Componentes de presentación"], screens, font_size=9)

    doc.add_heading("3.7.4 Modelo de procesos", level=3)
    add_body(
        doc,
        "El proceso principal comienza con la búsqueda y la recomendación. Antes de reservar se validan precio, disponibilidad y autorización. El pago es simulado; si la verificación es aprobada se confirma la reserva y se genera el itinerario, y si es rechazada se informa sin confirmar. Desde el seguimiento se habilitan cancelación, reembolso y reclamo.",
    )
    add_picture(doc, ASSETS / "modelo-procesos.png", "Figura 4. Proceso de reserva y postventa.", width=Inches(6.4))

    doc.add_heading("3.7.5 Modelo de implementación", level=3)
    add_body(
        doc,
        "La arquitectura propuesta separa presentación, API, lógica de dominio, inteligencia artificial y persistencia. React consume una API REST NestJS. Los módulos de autenticación, catálogo, reservas y reportes acceden a MySQL mediante una capa ORM. El motor de IA local recibe candidatos y devuelve hasta cinco recomendaciones explicables. Docker Compose reproduce el entorno de demostración.",
    )
    add_picture(doc, ASSETS / "modelo-implementacion.png", "Figura 5. Arquitectura de implementación propuesta.", width=Inches(6.4))

    doc.add_heading("3.7.6 Diseño de base de datos", level=3)
    add_body(
        doc,
        "El diseño físico se organiza en tres dominios: identidad y preferencias, catálogo y operaciones. El esquema inicial contiene 17 tablas y 22 claves foráneas. Las restricciones CHECK protegen precios, cantidades, capacidad, presupuesto y duración; los índices apoyan búsquedas por servicio, cliente, estado y fecha.",
    )
    add_picture(
        doc,
        ASSETS / "modelo-entidad-relacion-completo.png",
        "Figura 6. Modelo entidad–relación físico completo.",
        height=Inches(8.6),
    )
    dictionary = [
        ("Identidad", "roles, app_users", "Usuarios, credenciales hash, rol y estado."),
        ("Preferencias", "customer_profiles, interests, customer_interests", "Presupuesto, días e intereses ponderados."),
        ("Catálogo", "providers, destinations, service_categories, tourist_services, service_interests", "Oferta, ubicación, categoría, precio, capacidad y etiquetas."),
        ("Reserva", "bookings, booking_items", "Cabecera, estado, total, servicios, cantidad, precio y fecha."),
        ("Pago y postventa", "payments, cancellations, refunds, complaints", "Transacciones, solicitudes, devoluciones y atención."),
        ("Auditoría", "audit_logs", "Actor, acción, entidad, detalle, IP y fecha."),
    ]
    make_table(doc, ["Dominio", "Tablas", "Información principal"], dictionary, font_size=8)


def add_implementation(doc):
    doc.add_heading("3.8 Primera implementación realizada", level=2)
    add_body(
        doc,
        "Como incremento inicial se implementó la base de datos MySQL 8.4 en Docker. La configuración se encuentra en compose.yaml y utiliza un volumen persistente, healthcheck y publicación local en 127.0.0.1:3307. Los scripts de database/init crean el esquema y cargan roles, intereses, categorías, destinos, proveedores y dos servicios demostrativos.",
    )
    results = [
        ("Tablas físicas", "17", "Creación correcta."),
        ("Claves foráneas", "22", "Integridad referencial activa."),
        ("Roles iniciales", "4", "ADMIN, AGENT, CUSTOMER y SUPPORT."),
        ("Intereses", "6", "Cultura, naturaleza, aventura, gastronomía, historia y descanso."),
        ("Servicios semilla", "2", "Datos sintéticos de La Paz y Copacabana."),
        ("Prueba de restricción", "Aprobada", "Un precio negativo fue rechazado por chk_service_price."),
        ("Imagen Docker", "≈ 227 MB", "No requiere instalación local de MySQL."),
    ]
    make_table(doc, ["Verificación", "Resultado", "Evidencia"], results, font_size=9)
    add_body(doc, "Comandos principales:", bold_lead="Comandos principales:")
    for command in (
        "docker compose up -d db",
        "docker compose ps",
        "docker compose stop",
        "docker compose start",
    ):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(1)
        r = p.add_run(command)
        r.font.name = "Consolas"
        r.font.size = Pt(10)


def add_security_and_tests(doc):
    doc.add_heading("3.9 Seguridad y pruebas", level=2)
    controls = [
        ("Autenticación", "Hash seguro de contraseñas, expiración de sesión/token y bloqueo de intentos repetidos."),
        ("Autorización", "Control por rol en backend y verificación de propiedad de reservas/reclamos."),
        ("Validación", "Formatos, tamaños, estados, precios y transiciones verificados en servidor."),
        ("Base de datos", "Usuario de aplicación sin privilegios de superusuario; restricciones, transacciones y puerto local."),
        ("Trazabilidad", "Auditoría de accesos fallidos y cambios relevantes sin registrar contraseñas."),
        ("Respaldo", "Copia con mysqldump al finalizar sesiones con cambios y restauración en una base separada."),
        ("Datos", "Información sintética, sin tarjetas, clientes reales ni ofertas vigentes."),
    ]
    make_table(doc, ["Área", "Control propuesto"], controls, font_size=9)
    tests = [
        ("Unitarias", "Filtros, cálculo de total, restricciones del recomendador y transiciones de estado."),
        ("Integración", "Preferencias → búsqueda/recomendación → reserva → pago → consulta."),
        ("Seguridad", "Acceso a objetos ajenos, modificación de precios, entradas inválidas y permisos administrativos."),
        ("IA", "Precision@5, NDCG@5, cobertura, cumplimiento de restricciones y p95 de respuesta."),
        ("Respaldo", "Generación de copia y restauración en base distinta al cierre de la iteración."),
        ("Usabilidad", "Recorridos de tareas; si no hay participantes externos, reportar inspección interna."),
    ]
    make_table(doc, ["Tipo de prueba", "Alcance"], tests, font_size=9)


def add_conclusions(doc):
    doc.add_heading("3.10 Resultados esperados y cierre", level=2)
    add_body(
        doc,
        "La primera parte del marco aplicativo deja definido el trabajo completo y aporta un incremento verificable: la base de datos dockerizada. La planificación mantiene como núcleo el catálogo, las reservas simuladas, el recomendador y su evaluación. Las funciones de dashboard, predicción y postventa se desarrollan sin desplazar los controles de acceso, integridad y respaldo.",
    )
    add_body(
        doc,
        "El siguiente paso técnico es iniciar Sprint 2 con autenticación por roles, CRUD de catálogo y búsqueda. Antes de programar el backend, el equipo debe corregir en el documento principal todas las referencias a Django/PostgreSQL si se mantiene NestJS/MySQL, además de actualizar el cronograma para reflejar si las fechas corresponden a ejecución real o a una nueva reprogramación.",
    )
    doc.add_heading("Fuentes internas utilizadas", level=2)
    sources = [
        "PrimeraPresentacionTaller (1).docx: objetivos, alcance, metodología, tecnologías, cronograma, IA y seguridad.",
        "Distribucion_Tareas_Diagrama_Casos_de_Uso_Booking.pdf: actores, casos de uso y distribución de responsabilidades.",
        "Marco_Aplicativo.txt: estructura requerida del capítulo, Scrum y modelos UML.",
        "database/init/001_schema.sql y 002_seed.sql: diseño físico y datos sintéticos implementados.",
    ]
    for source in sources:
        add_bullet(doc, source)


def build_document():
    extract_use_case_image()
    doc = Document()
    style_document(doc)
    doc.core_properties.title = "Capítulo III: Marco Aplicativo"
    doc.core_properties.subject = "Sistema prototipo de gestión turística inspirado en Booking.com"
    doc.core_properties.author = "Condori Alcazar Sheyla Micaela; Masco Vargas Melani; Salazar Gisberth Alexandra Cristal"
    doc.core_properties.keywords = "Scrum, Sprint, UML, Booking, turismo, MySQL, Docker"

    add_cover(doc)
    doc.add_heading("ÍNDICE", level=1)
    add_toc(doc.add_paragraph())
    doc.add_page_break()

    add_introduction(doc)
    add_backlog(doc)
    add_scrum_roles(doc)
    add_sprint_planning(doc)
    add_sprint_execution(doc)
    add_use_cases(doc)
    add_models(doc)
    add_implementation(doc)
    add_security_and_tests(doc)
    add_conclusions(doc)

    doc.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    print(build_document())
