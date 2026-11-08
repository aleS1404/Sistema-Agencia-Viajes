from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "final" / "informe-final.md"
TRACEABILITY = ROOT / "docs" / "final" / "trazabilidad" / "matriz-casos-pruebas.md"
SPRINTS = ROOT / "docs" / "final" / "sprints"
INTERFACE_EVIDENCE = ROOT / "docs" / "final" / "evidencias"
OUTPUT = ROOT / "Informe_Final_Sistema_Agencia_Viajes.docx"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_field(paragraph, instruction: str) -> None:
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instruction
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "Actualizar campo en Word"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, separate, text, end])


def configure_styles(doc: Document) -> None:
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Times New Roman"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    normal.font.size = Pt(12)
    fmt = normal.paragraph_format
    fmt.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    fmt.first_line_indent = Cm(1.27)
    fmt.space_after = Pt(0)

    for style_name in ("Heading 1", "Heading 2"):
        style = styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(14)
        style.font.bold = True
        style.paragraph_format.first_line_indent = Cm(0)
        style.paragraph_format.space_before = Pt(12)
        style.paragraph_format.space_after = Pt(6)
        style.paragraph_format.line_spacing = 1.0

    for style_name in ("Heading 3", "Heading 4"):
        style = styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(12)
        style.font.bold = True
        style.paragraph_format.first_line_indent = Cm(0)
        style.paragraph_format.space_before = Pt(8)
        style.paragraph_format.space_after = Pt(3)
        style.paragraph_format.line_spacing = 1.0

    for style_name in ("List Bullet", "List Number"):
        style = styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(12)
        style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        style.paragraph_format.first_line_indent = Cm(0)

    if "Caption Final" not in styles:
        caption = styles.add_style("Caption Final", WD_STYLE_TYPE.PARAGRAPH)
        caption.font.name = "Times New Roman"
        caption._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        caption.font.size = Pt(10)
        caption.font.italic = True
        caption.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        caption.paragraph_format.first_line_indent = Cm(0)


def configure_section(section) -> None:
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(2.54)
    section.right_margin = Cm(2.54)


def add_page_number(section) -> None:
    section.footer.is_linked_to_previous = False
    paragraph = section.footer.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.first_line_indent = Cm(0)
    add_field(paragraph, "PAGE")


def add_cover(doc: Document) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    for line, size, bold in [
        ("UNIVERSIDAD MAYOR DE SAN ANDRÉS", 14, True),
        ("FACULTAD DE CIENCIAS PURAS Y NATURALES", 13, True),
        ("CARRERA DE INFORMÁTICA", 13, True),
        ("TALLER DE PROYECTO", 13, True),
    ]:
        r = p.add_run(line)
        r.font.name = "Times New Roman"
        r.font.size = Pt(size)
        r.bold = bold
        r.add_break()

    p.add_run("\n")
    title = p.add_run(
        "SISTEMA PROTOTIPO DE GESTIÓN TURÍSTICA PARA UNA AGENCIA DE VIAJES DE LA PAZ, "
        "INSPIRADO EN BOOKING.COM"
    )
    title.bold = True
    title.font.name = "Times New Roman"
    title.font.size = Pt(16)
    title.add_break()
    p.add_run("\n")
    for line in [
        "Integrantes:",
        "Condori Alcazar Sheyla Micaela",
        "Masco Vargas Melani",
        "Salazar Gisberth Alexandra Cristal",
        "",
        "Docente: M.Sc. Grover Alex Rodriguez Ramirez",
        "Gestión: 2/2026",
        "",
        "LA PAZ - BOLIVIA",
        "2026",
    ]:
        r = p.add_run(line)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.add_break()


def clean_inline(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = text.replace("**", "").replace("`", "")
    text = re.sub(r"(?<!\*)\*(?!\*)", "", text)
    return text.strip()


def add_markdown_table(doc: Document, rows: list[list[str]]) -> None:
    if not rows:
        return
    column_count = max(len(row) for row in rows)
    table = doc.add_table(rows=0, cols=column_count)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for row_index, values in enumerate(rows):
        cells = table.add_row().cells
        for index in range(column_count):
            value = clean_inline(values[index]) if index < len(values) else ""
            cells[index].text = value
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for paragraph in cells[index].paragraphs:
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.line_spacing = 1.0
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    run.font.name = "Times New Roman"
                    run.font.size = Pt(9)
                    if row_index == 0:
                        run.bold = True
        if row_index == 0:
            for cell in cells:
                set_cell_shading(cell, "D9EAF7")
            set_repeat_table_header(table.rows[0])
    doc.add_paragraph()


def parse_markdown(doc: Document, path: Path, *, skip_title: bool = False) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    index = 0
    in_fence = False
    fence_lines: list[str] = []
    first_heading_skipped = False
    while index < len(lines):
        line = lines[index].rstrip()
        if line.startswith("~~~") or line.startswith("```"):
            if not in_fence:
                in_fence = True
                fence_lines = []
            else:
                in_fence = False
                if fence_lines:
                    p = doc.add_paragraph()
                    p.paragraph_format.first_line_indent = Cm(0)
                    p.paragraph_format.line_spacing = 1.0
                    run = p.add_run("\n".join(fence_lines))
                    run.font.name = "Consolas"
                    run.font.size = Pt(8)
            index += 1
            continue
        if in_fence:
            fence_lines.append(line)
            index += 1
            continue
        if not line.strip():
            index += 1
            continue
        if line.startswith("|") and index + 1 < len(lines) and re.match(r"^\|?\s*:?-+", lines[index + 1].strip()):
            rows: list[list[str]] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                raw = lines[index].strip().strip("|")
                values = [value.strip() for value in raw.split("|")]
                if not all(re.fullmatch(r":?-+:?", value.replace(" ", "")) for value in values):
                    rows.append(values)
                index += 1
            add_markdown_table(doc, rows)
            continue
        heading = re.match(r"^(#{1,4})\s+(.+)$", line)
        if heading:
            level = len(heading.group(1))
            text = clean_inline(heading.group(2))
            if skip_title and level == 1 and not first_heading_skipped:
                first_heading_skipped = True
                index += 1
                continue
            if level == 1 and text.startswith("CAPÍTULO"):
                doc.add_page_break()
            doc.add_heading(text, level=min(level, 4))
            index += 1
            continue
        numbered = re.match(r"^\d+\.\s+(.+)$", line)
        bullet = re.match(r"^-\s+(.+)$", line)
        if numbered:
            p = doc.add_paragraph(style="List Number")
            p.add_run(clean_inline(numbered.group(1)))
        elif bullet:
            p = doc.add_paragraph(style="List Bullet")
            p.add_run(clean_inline(bullet.group(1)))
        else:
            p = doc.add_paragraph()
            p.add_run(clean_inline(line))
        index += 1


def add_toc(doc: Document) -> None:
    heading = doc.add_heading("ÍNDICE", level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    add_field(p, 'TOC \\o "1-4" \\h \\z \\u')
    note = doc.add_paragraph("En Word: seleccionar el índice, hacer clic derecho y elegir Actualizar campo.")
    note.paragraph_format.first_line_indent = Cm(0)
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER


def build() -> Path:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    doc = Document()
    configure_styles(doc)
    configure_section(doc.sections[0])
    doc.sections[0].footer.is_linked_to_previous = False
    doc.sections[0].footer.paragraphs[0].clear()
    add_cover(doc)

    content_section = doc.add_section(WD_SECTION.NEW_PAGE)
    configure_section(content_section)
    add_page_number(content_section)
    add_toc(doc)
    parse_markdown(doc, SOURCE, skip_title=True)

    doc.add_page_break()
    doc.add_heading("ANEXO A — MATRIZ DE TRAZABILIDAD", level=1)
    parse_markdown(doc, TRACEABILITY, skip_title=True)

    doc.add_page_break()
    doc.add_heading("ANEXO B — EXPEDIENTES SCRUM", level=1)
    sprint_files = [
        "sprint-planning.md",
        "sprint-backlog.md",
        "sprint-review.md",
        "sprint-retrospective.md",
        "incremento.md",
        "pruebas/plan-pruebas.md",
    ]
    for sprint_dir in sorted(SPRINTS.glob("sprint-*")):
        doc.add_heading(sprint_dir.name.replace("sprint-", "Sprint "), level=2)
        for relative in sprint_files:
            path = sprint_dir / relative
            if path.exists():
                parse_markdown(doc, path, skip_title=True)
        image_dir = sprint_dir / "diagramas"
        images = sorted(list(image_dir.glob("*.png")) + list(image_dir.glob("*.jpg")))
        if images:
            doc.add_heading("Figuras del sprint", level=3)
            for image in images:
                doc.add_picture(str(image), width=Inches(6.2))
                cap = doc.add_paragraph(style="Caption Final")
                cap.add_run(image.stem.replace("-", " ").title())

    doc.add_page_break()
    doc.add_heading("ANEXO C — EVIDENCIA DE INTERFAZ", level=1)
    intro = doc.add_paragraph(
        "Las siguientes capturas corresponden a la aplicación integrada y documentan "
        "el acceso, la gestión de usuarios, los indicadores administrativos, el catálogo "
        "y las recomendaciones explicables del cliente."
    )
    intro.paragraph_format.first_line_indent = Cm(1.27)
    evidence = [
        ("pantalla-acceso.png", "Figura C.1. Pantalla de acceso del sistema.", Inches(6.2)),
        ("panel-administrador.png", "Figura C.2. Dashboard predictivo e indicador de riesgo.", Inches(6.2)),
        ("asistente-administrador.png", "Figura C.3. Asistente administrativo por intenciones.", Inches(6.2)),
        ("usuarios-administrador.png", "Figura C.4. Gestión administrativa de usuarios.", Inches(5.0)),
        ("catalogo-cliente.png", "Figura C.5. Catálogo con imágenes locales de destinos.", Inches(5.0)),
        ("recomendaciones-cliente.png", "Figura C.6. Recomendaciones explicables del cliente.", Inches(5.0)),
    ]
    for file_name, caption_text, width in evidence:
        image_path = INTERFACE_EVIDENCE / file_name
        if not image_path.exists():
            raise FileNotFoundError(
                f"Falta la evidencia de interfaz requerida: {image_path}"
            )
        doc.add_picture(str(image_path), width=width)
        cap = doc.add_paragraph(style="Caption Final")
        cap.add_run(caption_text)
        source = doc.add_paragraph(style="Caption Final")
        source.add_run("Fuente: elaboración propia, prototipo integrado, 8 de noviembre de 2026.")

    settings = doc.settings._element
    update_fields = OxmlElement("w:updateFields")
    update_fields.set(qn("w:val"), "true")
    settings.append(update_fields)

    doc.core_properties.title = "Informe final — Sistema de agencia de viajes"
    doc.core_properties.subject = "Segunda presentación y entrega final"
    doc.core_properties.author = (
        "Condori Alcazar Sheyla Micaela; Masco Vargas Melani; "
        "Salazar Gisberth Alexandra Cristal"
    )
    doc.core_properties.keywords = "Scrum, turismo, NestJS, React, MySQL, UML, Docker"
    try:
        doc.save(OUTPUT)
        return OUTPUT
    except PermissionError:
        fallback = OUTPUT.with_name(f"{OUTPUT.stem}_Actualizado{OUTPUT.suffix}")
        doc.save(fallback)
        return fallback


if __name__ == "__main__":
    result = build()
    print(result)
