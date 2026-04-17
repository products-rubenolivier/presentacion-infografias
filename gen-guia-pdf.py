# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import PageBreak

OUTPUT = "GUIA-OPERACION-SLIDES.pdf"

# ── Colores corporativos ──────────────────────────────────────────
BURGUNDY  = colors.HexColor("#6B1C2A")
GOLD      = colors.HexColor("#C9A84C")
DARK_GRAY = colors.HexColor("#2E2E2E")
MID_GRAY  = colors.HexColor("#555555")
LIGHT_BG  = colors.HexColor("#F7F4F0")
WHITE     = colors.white
CUE_STAR  = colors.HexColor("#8B1A27")   # explícito
CUE_CIRC  = colors.HexColor("#1A5276")   # implícito
CUE_WARN  = colors.HexColor("#7D6608")   # manual

# ── Documento ─────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title="Guía de Operación de Slides – 100 Días de Acción",
    author="H. Ayuntamiento de Tuxpan, Veracruz 2026–2029",
)

# ── Estilos ───────────────────────────────────────────────────────
base = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

cover_title = S("cover_title",
    fontName="Helvetica-Bold", fontSize=22,
    textColor=WHITE, alignment=TA_CENTER,
    spaceAfter=6, leading=28)

cover_sub = S("cover_sub",
    fontName="Helvetica", fontSize=11,
    textColor=GOLD, alignment=TA_CENTER,
    spaceAfter=4, leading=16)

section_hdr = S("section_hdr",
    fontName="Helvetica-Bold", fontSize=10,
    textColor=WHITE, alignment=TA_LEFT,
    spaceBefore=14, spaceAfter=4, leading=13,
    leftIndent=0)

slide_label = S("slide_label",
    fontName="Helvetica-Bold", fontSize=9.5,
    textColor=BURGUNDY, spaceBefore=8, spaceAfter=1)

cue_text = S("cue_text",
    fontName="Helvetica-BoldOblique", fontSize=8.5,
    textColor=CUE_STAR, spaceBefore=0, spaceAfter=1, leftIndent=12)

speech_text = S("speech_text",
    fontName="Helvetica-Oblique", fontSize=8,
    textColor=MID_GRAY, spaceBefore=1, spaceAfter=0,
    leftIndent=12, leading=12)

note_text = S("note_text",
    fontName="Helvetica", fontSize=7.5,
    textColor=MID_GRAY, spaceBefore=0, spaceAfter=0,
    leftIndent=12, leading=11)

warning_text = S("warning_text",
    fontName="Helvetica-Bold", fontSize=8,
    textColor=CUE_WARN, spaceBefore=2, spaceAfter=2, leftIndent=12)

body = S("body",
    fontName="Helvetica", fontSize=8.5,
    textColor=DARK_GRAY, spaceBefore=2, spaceAfter=2, leading=12)

footer_s = S("footer_s",
    fontName="Helvetica", fontSize=7,
    textColor=colors.HexColor("#999999"), alignment=TA_CENTER)

# ── Helper: cabecera de sección ───────────────────────────────────
def section_header(bloque_num, titulo, subtitulo=""):
    t_data = [[Paragraph(f"BLOQUE {bloque_num} — {titulo}", section_hdr)]]
    t = Table(t_data, colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BURGUNDY),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[BURGUNDY]),
    ]))
    items = [t]
    if subtitulo:
        items.append(Paragraph(
            f'<i>"{subtitulo}"</i>',
            S("sub2", fontName="Helvetica-Oblique", fontSize=8,
              textColor=MID_GRAY, spaceBefore=2, spaceAfter=4, leftIndent=4)
        ))
    return items

# ── Helper: bloque de slide ───────────────────────────────────────
def slide_block(num, name, cue_type, cue_phrase, speech_lines=None, note=None):
    """
    cue_type: 'star'|'circle'|'warn'|'start'
    """
    icons = {"star":"★ CUE EXPLÍCITO", "circle":"○ CUE IMPLÍCITO",
             "warn":"⚠  SIN DISCURSO — AVANCE MANUAL",
             "start":"→  Al iniciar este bloque"}
    icon_colors = {"star":CUE_STAR, "circle":CUE_CIRC,
                   "warn":CUE_WARN, "start":DARK_GRAY}

    items = []
    # Slide number badge + name
    badge_data = [[
        Paragraph(f"SLIDE {num}", S("badge",
            fontName="Helvetica-Bold", fontSize=9,
            textColor=WHITE)),
        Paragraph(name, S("sname",
            fontName="Helvetica-Bold", fontSize=9,
            textColor=DARK_GRAY, leading=12)),
    ]]
    badge_t = Table(badge_data, colWidths=[1.8*cm, 15.2*cm])
    badge_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(0,0), BURGUNDY),
        ("BACKGROUND",   (1,0),(1,0), LIGHT_BG),
        ("LEFTPADDING",  (0,0),(-1,-1), 6),
        ("RIGHTPADDING", (0,0),(-1,-1), 6),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
    ]))
    items.append(badge_t)

    # Cue
    cue_label = icons.get(cue_type, "")
    cue_col   = icon_colors.get(cue_type, DARK_GRAY)
    if cue_phrase:
        cue_full = f'{cue_label}:  <b>"{cue_phrase}"</b>'
    else:
        cue_full = cue_label
    items.append(Paragraph(cue_full, S("cuep",
        fontName="Helvetica-Bold", fontSize=8,
        textColor=cue_col, spaceBefore=3, spaceAfter=1, leftIndent=10)))

    # Speech lines
    if speech_lines:
        for line in speech_lines:
            items.append(Paragraph(f"  {line}", S("sp",
                fontName="Helvetica-Oblique", fontSize=7.8,
                textColor=MID_GRAY, spaceBefore=0, spaceAfter=0,
                leftIndent=14, leading=11)))

    # Note
    if note:
        items.append(Paragraph(note, S("nt",
            fontName="Helvetica", fontSize=7.5,
            textColor=CUE_WARN, spaceBefore=2, spaceAfter=0,
            leftIndent=10)))

    items.append(Spacer(1, 4))
    return items


# ══════════════════════════════════════════════════════════════════
# CONSTRUIR CONTENIDO
# ══════════════════════════════════════════════════════════════════
story = []

# ── PORTADA ───────────────────────────────────────────────────────
cover_data = [[
    Paragraph("GUÍA DE OPERACIÓN DE SLIDES", cover_title),
    Spacer(1, 6),
    Paragraph("100 DÍAS DE ACCIÓN", S("ct2",
        fontName="Helvetica-Bold", fontSize=17,
        textColor=GOLD, alignment=TA_CENTER, leading=22)),
    Spacer(1, 4),
    Paragraph("H. Ayuntamiento de Tuxpan, Veracruz  ·  2026 – 2029", cover_sub),
    Spacer(1, 10),
    Paragraph("31 slides  ·  8 bloques de discurso  ·  Presentación web", S("ct3",
        fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#DDBB88"), alignment=TA_CENTER)),
]]
cover_t = Table([[x] for x in cover_data[0]], colWidths=[17*cm])
cover_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,-1), BURGUNDY),
    ("LEFTPADDING",  (0,0),(-1,-1), 20),
    ("RIGHTPADDING", (0,0),(-1,-1), 20),
    ("TOPPADDING",   (0,0),(0,0),   18),
    ("BOTTOMPADDING",(0,-1),(-1,-1),18),
]))
story.append(cover_t)
story.append(Spacer(1, 14))

# Instrucciones
inst_rows = [
    ["★  CUE EXPLÍCITO", "El orador dice la frase marcada. Avanza de inmediato."],
    ["○  CUE IMPLÍCITO", "El orador menciona las cifras del slide. Avanza al escucharlas."],
    ["⚠   SIN DISCURSO", "Bloque 7: sin PDF de discurso. Avance manual al ritmo del evento."],
]
inst_t = Table(inst_rows, colWidths=[4.5*cm, 12.5*cm])
inst_t.setStyle(TableStyle([
    ("FONTNAME",     (0,0),(0,-1), "Helvetica-Bold"),
    ("FONTNAME",     (1,0),(1,-1), "Helvetica"),
    ("FONTSIZE",     (0,0),(-1,-1), 8),
    ("TEXTCOLOR",    (0,0),(0,0), CUE_STAR),
    ("TEXTCOLOR",    (0,1),(0,1), CUE_CIRC),
    ("TEXTCOLOR",    (0,2),(0,2), CUE_WARN),
    ("TEXTCOLOR",    (1,0),(1,-1), DARK_GRAY),
    ("TOPPADDING",   (0,0),(-1,-1), 3),
    ("BOTTOMPADDING",(0,0),(-1,-1), 3),
    ("LEFTPADDING",  (0,0),(-1,-1), 6),
    ("BACKGROUND",   (0,0),(-1,-1), LIGHT_BG),
    ("LINEABOVE",    (0,0),(-1,0), 0.5, GOLD),
    ("LINEBELOW",    (0,-1),(-1,-1), 0.5, GOLD),
    ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT_BG, colors.HexColor("#EDE8E0"), LIGHT_BG]),
]))
story.append(inst_t)
story.append(Spacer(1, 18))

# ═══════════════════ BLOQUE 1 ═════════════════════════════════════
story += section_header("1", "APERTURA", "Lo que encontramos. Lo que decidimos.")
story += slide_block(1, "B01 · Portada  "LO QUE ENCONTRAMOS · LO QUE CONSTRUIMOS"",
    "start", "",
    ['"Hace cien días llegamos a este Ayuntamiento con una promesa clara y de corazón: ¡Hacer las cosas BIEN!…"',
     '"…administrar bien para servir mejor a cada tuxpeño y a cada tuxpeña."'],
    '★ El discurso continúa luego de "Entra Infografía 1" — ya estás en Slide 1, no avances.')

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 2 ═════════════════════════════════════
story += section_header("2", "ASISTENCIA SOCIAL Y ATENCIÓN A GRUPOS VULNERABLES",
                        "Servir es estar cerca de quienes más lo necesitan")
story += slide_block(2, "B02 · Portada  "ASISTENCIA SOCIAL"",
    "start", "",
    ['"…a través de la Dirección de Salud, del Sistema DIF Municipal…"',
     '"Ya atendimos a más de 2,152 personas con el programa La Salud Inicia en Casa…"',
     '"…El DIF no se quedó esperando en la oficina. Salió."'])
story += slide_block(3, "B02-S1 · SALUD EN CASA  (+2,500 · 2,100 · 395)",
    "star", "Entra Infografía 2A.",
    ['"Desde el 6 de enero, el DIF ya había llegado a 45 comunidades y colonias…"',
     '"…3,800 niñas y niños [Día de Reyes]… 157 parejas en bodas colectivas…"'])
story += slide_block(4, "B02-S2 · ATENCIÓN COMUNITARIA  (4,000 · 45 · 157)",
    "circle", "Al mencionar 45 comunidades / 3,800 niños / 157 parejas",
    ['"Pusimos en marcha 50 talleres de capacitación… 1,289 personas…"',
     '"…más de 2,500 apoyos adicionales: medicamentos, apoyos funerarios…"'])
story += slide_block(5, "B02-S3 · CAPACITACIÓN Y APOYOS  (50 · 1,289 · +2,500)",
    "circle", "Al mencionar 50 talleres / 1,289 personas",
    ['"…646,162 desayunos calientes en 131 escuelas… llegando a 6,034 niñas y niños…"'])
story += slide_block(6, "B02-S4 · DESAYUNOS ESCOLARES  (646,162 · 131 · 6,034)",
    "circle", "Al mencionar 646,162 desayunos",
    ['"…4,300 atenciones [CRRI]… 1,400 servicios [Procuraduría]…"'])
story += slide_block(7, "B02-S5 · ATENCIÓN A LA MUJER  (4,300 · 1,400 · 524 · 181)",
    "star", "Entra Infografía 2B.",
    ['"524 mujeres fueron atendidas directamente…"',
     '"…181 atenciones jurídicas… Eso es hacer las cosas BIEN."'])

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 3 ═════════════════════════════════════
story += section_header("3", "TU CIUDAD, MEJOR", "Servicios públicos municipales")
story += slide_block(8, "B03 · Portada  "TU CIUDAD, MEJOR"",
    "start", "",
    ['"Tuxpan ya está iluminado."  ← avanza al siguiente slide de inmediato'])
story += slide_block(9, "B03-S1 · ALUMBRADO PÚBLICO  (3,282 · 1/5 del total · 630)",
    "circle", "Al decir \"reparamos 3,282 luminarias / 630 nuevas\"",
    ['"…el día 12 de la administración se encendieron 400 luminarias del boulevard…"',
     '"…llevamos alumbrado público a 67 comunidades que estuvieron olvidadas…"'])
story += slide_block(10, "B03-S2 · ELECTRIFICACIÓN RURAL  (400 · 67 · 75)",
    "circle", "Al mencionar 400 luminarias / 67 comunidades / El Sacrificio / 75 luminarias",
    ['"…1.5 kilómetros completamente iluminados [acceso a la playa]…"',
     '"…17 camiones en operación… 84 rutas de recolección activas…"'])
story += slide_block(11, "B03-S3 · INFRAESTRUCTURA Y RECOLECCIÓN  (550 · 1.5 KM · 17 · 84)",
    "circle", "Al mencionar 1.5 km / 17 camiones / 84 rutas",
    ['"Se adquirieron 90 contenedores de basura…"',
     '"La imagen de Tuxpan es muy importante…"'])
story += slide_block(12, "B03-S4 · ESPACIOS PÚBLICOS  (90 · 105 KM · 29 espacios)",
    "star", "Entra Infografía 3.",
    ['"…poda de 105 kilómetros de camellones… 15 parques… 9 jardineras…"',
     '"Siéntanse orgullosos de ser tuxpeños."'])

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 4 ═════════════════════════════════════
story += section_header("4", "IDENTIDAD Y FUTURO", "Educación, Cultura y Juventud")
story += slide_block(13, "B04 · Portada  "IDENTIDAD Y FUTURO"",
    "start", "",
    ['"Un municipio no se mide solo por sus calles iluminadas o sus parques limpios."'])
story += slide_block(14, "B04-S1 · INFRAESTRUCTURA EDUCATIVA  (29 · 12 · 560)",
    "circle", "Al mencionar 29 planteles / 12 escrituración / 560 alumnos",
    ['"Realizamos 5 actos cívicos… 918 alumnos, 82 profesores…"',
     '"…540 estudiantes [Expo Profesiográfica]… más de 900 personas [Noches Bohemias]…"'])
story += slide_block(15, "B04-S2 · EDUCACIÓN Y CULTURA  (918 · 82 · 540 · 900)",
    "circle", "Al mencionar 918 alumnos / 82 profesores / 540 / 900",
    ['"…133 alumnas y alumnos en talleres de danza, baile, dibujo y teatro…"',
     '"…más de 1,200 acervos bibliográficos…"'])
story += slide_block(16, "B04-S3 · JUVENTUD  (133 talleres · 120 Tarjeta Juventux)",
    "star", "Entra Infografía 4.",
    ['"La Tarjeta Juventux… más de 120 jóvenes inscritos… 25 comercios afiliados…"',
     '"…Feria de Emprendedores Juveniles, con 85 jóvenes…"',
     '"…foro Hablemos a Tiempo… más de 350 jóvenes…"'])
story += slide_block(17, "B04-S4 · ECONOMÍA LOCAL  (25 comercios · 85 jóvenes · +350)",
    "circle", "Al mencionar 25 comercios / 85 jóvenes / +350 foro",
    ['"En cien días estas acciones llegaron a 1,315 jóvenes tuxpeños."'],
    '★ "Entra Video 4." — video externo. Mantén Slide 17 hasta que el video termine.')

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 6 ═════════════════════════════════════
story += section_header("6", "TUXPAN COMPITE", "Deporte")
story += slide_block(18, "B06 · Portada  "TUXPAN COMPITE, DEPORTE"",
    "start", "",
    ['"el deporte no es un lujo. Es una herramienta de transformación."',
     '"375 atletas tuxpeños de 15 disciplinas… 44 medallas de oro. ¡Récord histórico!"'])
story += slide_block(19, "B06-S1 · DEPORTE COMPETITIVO  (375 atletas · 15 disciplinas · 44 oros)",
    "star", "Entra Infografía 6.",
    ['"Hay tres historias que quiero contarles…"',
     '"Mayte Madison García — Panamá, campeona y MVP."',
     '"Said Manuel Aguilar "Chay" — firmó con los New York Yankees."',
     '"Diego Jacobo Escudero — Campeonato Mundial Juvenil en Canadá."'],
    '★ "Entra Video 6." — video externo. Mantén Slide 19 hasta que el video termine.')

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 7 ═════════════════════════════════════
story += section_header("7", "TUXPAN AL MUNDO", "")

# Warning box
warn_data = [["⚠  NO HAY ARCHIVO DE DISCURSO PARA EL BLOQUE 7"],
             ["Los 4 slides se presentan visualmente (pausa musical o improvisación)."],
             ["Avanza manualmente al ritmo que indique el conductor del evento."]]
warn_t = Table(warn_data, colWidths=[17*cm])
warn_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(0,0), colors.HexColor("#FFF3CD")),
    ("BACKGROUND",   (0,1),(-1,-1), colors.HexColor("#FFFBEE")),
    ("FONTNAME",     (0,0),(0,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(0,-1), "Helvetica"),
    ("FONTSIZE",     (0,0),(-1,-1), 8.5),
    ("TEXTCOLOR",    (0,0),(-1,-1), CUE_WARN),
    ("LEFTPADDING",  (0,0),(-1,-1), 10),
    ("TOPPADDING",   (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ("BOX",          (0,0),(-1,-1), 1, GOLD),
]))
story.append(warn_t)
story.append(Spacer(1, 6))

for num, name in [
    (20, "B07 · Portada  "TUXPAN AL MUNDO""),
    (21, "B07-S1 · SECTOR TURÍSTICO  (60+ Empresas · 5 Módulos · 12 Acciones)"),
    (22, "B07-S2 · PROMOCIÓN TURÍSTICA  (80 Actores Fam Trip · 1 Stand Cumbre Tajín)"),
    (23, "B07-S3 · OCUPACIÓN HOTELERA  (98% Ocupación · 2,573 Habitaciones)"),
]:
    story += slide_block(num, name, "warn", "Avance manual libre")

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 8 ═════════════════════════════════════
story += section_header("8", "GOBIERNO CERCANO, INCLUYENTE Y QUE DA RESPUESTA",
    "Desarrollo Social, Bienestar para las Comunidades y Participación Ciudadana")
story += slide_block(24, "B08 · Portada  "GOBIERNO CERCANO, INCLUYENTE…"",
    "start", "",
    ['"…crear la Dirección de Bienestar para las Comunidades."',
     '"Hemos realizado 45 jornadas comunitarias tipo tequio…"',
     '"…creamos una red de 60 Jefes de Manzana y Gestores Vecinales…"',
     '"…más de 1,200 personas de 44 comunidades [Consulta Indígenas]…"',
     '"…6 foros de consulta ciudadana… 1,675 solicitudes [Ventanilla Única]…"'])
story += slide_block(25, "B08-S1 · PARTICIPACIÓN CIUDADANA  (45 · 60 · 1,200 · 44 · 6 · 1,675)",
    "circle", "Al mencionar 45 jornadas / 60 Jefes de Manzana",
    ['"Menos vueltas, más respuestas."',
     '"Esto es un gobierno cercano, incluyente y que da respuesta."'])

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 9 ═════════════════════════════════════
story += section_header("9", "OBRA PÚBLICA, INFRAESTRUCTURA Y DESARROLLO",
    "Reconstruyendo los servicios básicos que Tuxpan se merece")
story += slide_block(26, "B09 · Portada  "OBRA PÚBLICA, INFRAESTRUCTURA Y DESARROLLO"",
    "start", "",
    ['"Prometimos modernizar la red de drenaje hidrosanitaria…"',
     '[Describe situación crítica: 1,200 baches, 400 fugas, 66% drenaje colapsado…]',
     '"Pero no vinimos a culpar a los del pasado. Vinimos a actuar."'])
story += slide_block(27, "B09-S1 · AGUA Y SANEAMIENTO  (59 fugas · 27 colonias · 125 desazolves)",
    "circle", "Al mencionar 59 fugas / 27 colonias / 125 trabajos",
    ['"…más de 19,000 metros de tubería de drenaje…"',
     '"…141 acciones de bacheo…"'])
story += slide_block(28, "B09-S2 · DRENAJE Y BACHEO  (19,000 M de tubería · 141 acciones)",
    "circle", "Al mencionar 19,000 metros / 141 acciones de bacheo",
    ['"…30 presas de captación de agua [con SEDARPA]…"',
     '"…12,000 m² de pintura en fachadas [Fundación Corazón Urbano]…"',
     '"…donaciones por $1,200,000 pesos [KIMEX]…"'])
story += slide_block(29, "B09-S3 · OBRAS E INVERSIÓN  (30 presas · 12,000 m² · $1.2 MDP)",
    "circle", "Al mencionar 30 presas / 12,000 m² / $1.2 MDP",
    ['"…y apenas viene la obra pública."'])

story.append(HRFlowable(width="100%", thickness=0.4, color=GOLD))
story.append(Spacer(1, 10))

# ═══════════════════ BLOQUE 10 ════════════════════════════════════
story += section_header("10", "EMBELLECIMIENTO Y ORDEN URBANO",
    "Una ciudad más limpia, ordenada y digna")
story += slide_block(30, "B10 · Portada  "EMBELLECIMIENTO Y ORDEN URBANO"",
    "start", "",
    ['"Una ciudad que se ve bien, se vive mejor."',
     '"…18 carpas exclusivas, Mercado Ambulante inaugurado…"',
     '"…más de 70,630 metros lineales pintados [balizamiento histórico]…"'])
story += slide_block(31, "B10-S1 · ORDEN URBANO  (14 KM bulevar · +70,630 ML · 1 Mercado · 18 Carpas)",
    "circle", "Al mencionar las carpas / metros lineales / mercado / km de bulevar",
    ['"…un Tuxpan más bello, más digno y donde las cosas se hacen BIEN."'])

story.append(Spacer(1, 20))
story.append(HRFlowable(width="100%", thickness=1, color=BURGUNDY))
story.append(Spacer(1, 8))

# ═══════════════════ PÁGINA RESUMEN ═══════════════════════════════
story.append(PageBreak())

# Header resumen
hdr_r = Table([[Paragraph("CUADRO RESUMEN RÁPIDO", S("rh",
    fontName="Helvetica-Bold", fontSize=13,
    textColor=WHITE, alignment=TA_CENTER))]],
    colWidths=[17*cm])
hdr_r.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,-1), BURGUNDY),
    ("TOPPADDING",   (0,0),(-1,-1), 8),
    ("BOTTOMPADDING",(0,0),(-1,-1), 8),
]))
story.append(hdr_r)
story.append(Spacer(1, 6))

# Sub-header
story.append(Paragraph(
    "Para tener a la vista durante el evento. Avanza cuando el orador llega al cue indicado.",
    S("rsub", fontName="Helvetica", fontSize=8,
      textColor=MID_GRAY, alignment=TA_CENTER, spaceAfter=8)))

# Tabla resumen
rows_data = [["SLIDE", "BLOQUE", "CONTENIDO", "CUE DE AVANCE"]]
rows = [
    ("1",  "B01", "Portada Apertura",                             "★ Al iniciar Bloque 1"),
    ("2",  "B02", "Portada Asistencia Social",                    "○ Al iniciar Bloque 2"),
    ("3",  "B02", "Salud en Casa  (+2,500 · 2,100 · 395)",        "★ "Entra Infografía 2A""),
    ("4",  "B02", "Atención Comunitaria  (4,000 · 45 · 157)",     "○ Al mencionar 45 comunidades"),
    ("5",  "B02", "Capacitación y Apoyos  (50 · 1,289 · +2,500)", "○ Al mencionar 50 talleres"),
    ("6",  "B02", "Desayunos Escolares  (646,162 · 131 · 6,034)", "○ Al mencionar 646,162 desayunos"),
    ("7",  "B02", "Atención a la Mujer  (4,300 · 1,400 · 524 · 181)","★ "Entra Infografía 2B""),
    ("8",  "B03", "Portada Tu Ciudad, Mejor",                     "○ Al iniciar Bloque 3"),
    ("9",  "B03", "Alumbrado Público  (3,282 · 1/5 · 630)",       "○ Al decir "3,282 luminarias""),
    ("10", "B03", "Electrificación Rural  (400 · 67 · 75)",       "○ Al decir "400 / 67 / 75""),
    ("11", "B03", "Infraestructura y Recolección  (550 · 1.5 KM · 17 · 84)","○ Al decir "1.5 km / 17 camiones""),
    ("12", "B03", "Espacios Públicos  (90 · 105 KM · 29 espacios)","★ "Entra Infografía 3""),
    ("13", "B04", "Portada Identidad y Futuro",                   "○ Al iniciar Bloque 4"),
    ("14", "B04", "Infraestructura Educativa  (29 · 12 · 560)",   "○ Al decir "29 planteles / 560""),
    ("15", "B04", "Educación y Cultura  (918 · 82 · 540 · 900)",  "○ Al decir "918 / 540 / 900""),
    ("16", "B04", "Juventud  (133 · 120 Tarjeta Juventux)",       "★ "Entra Infografía 4""),
    ("17", "B04", "Economía Local  (25 · 85 · +350)",             "○ Al decir "25 comercios / 85""),
    ("18", "B06", "Portada Tuxpan Compite",                       "○ Al iniciar Bloque 6"),
    ("19", "B06", "Deporte Competitivo  (375 · 15 · 44 oros)",    "★ "Entra Infografía 6""),
    ("20", "B07", "Portada Tuxpan al Mundo",                      "⚠ Avance manual libre"),
    ("21", "B07", "Sector Turístico  (60+ · 5 · 12)",             "⚠ Avance manual libre"),
    ("22", "B07", "Promoción Turística  (80 · 1 stand)",          "⚠ Avance manual libre"),
    ("23", "B07", "Ocupación Hotelera  (98% · 2,573 hab.)",       "⚠ Avance manual libre"),
    ("24", "B08", "Portada Gobierno Cercano",                     "○ Al iniciar Bloque 8"),
    ("25", "B08", "Participación Ciudadana  (45 · 60 · 1,200 · 44 · 6 · 1,675)","○ Al decir "45 jornadas / 60""),
    ("26", "B09", "Portada Obra Pública",                         "○ Al iniciar Bloque 9"),
    ("27", "B09", "Agua y Saneamiento  (59 · 27 · 125)",          "○ Al decir "59 fugas / 27 / 125""),
    ("28", "B09", "Drenaje y Bacheo  (19,000 M · 141)",           "○ Al decir "19,000 m / 141""),
    ("29", "B09", "Obras e Inversión  (30 · 12,000 m² · $1.2 MDP)","○ Al decir "30 presas / $1.2 MDP""),
    ("30", "B10", "Portada Embellecimiento",                      "○ Al iniciar Bloque 10"),
    ("31", "B10", "Orden Urbano  (14 KM · +70,630 ML · 1 · 18)", "○ Al decir "70,630 / 18 carpas""),
]

def row_style(cue):
    if cue.startswith("★"):
        return CUE_STAR
    if cue.startswith("○"):
        return CUE_CIRC
    if cue.startswith("⚠"):
        return CUE_WARN
    return DARK_GRAY

cell_style = S("cs", fontName="Helvetica", fontSize=7.5,
               textColor=DARK_GRAY, leading=10)
hdr_style  = S("hs", fontName="Helvetica-Bold", fontSize=8,
               textColor=WHITE, leading=10)

table_rows = [[
    Paragraph("SLIDE", hdr_style),
    Paragraph("BLOQUE", hdr_style),
    Paragraph("CONTENIDO", hdr_style),
    Paragraph("CUE DE AVANCE", hdr_style),
]]
for slide, bloque, contenido, cue in rows:
    c = row_style(cue)
    cue_s = S("cue_r", fontName="Helvetica-Bold", fontSize=7.5,
              textColor=c, leading=10)
    slide_s = S("slide_r", fontName="Helvetica-Bold", fontSize=8,
                textColor=BURGUNDY, alignment=TA_CENTER, leading=10)
    table_rows.append([
        Paragraph(slide, slide_s),
        Paragraph(bloque, cell_style),
        Paragraph(contenido, cell_style),
        Paragraph(cue, cue_s),
    ])

summary_t = Table(table_rows, colWidths=[1.2*cm, 1.5*cm, 8.3*cm, 6*cm])
row_bgs = []
for i, (_, _, _, cue) in enumerate(rows, start=1):
    bg = colors.HexColor("#FFF8F8") if cue.startswith("★") else \
         colors.HexColor("#F3F8FF") if cue.startswith("○") else \
         colors.HexColor("#FFFBEE") if cue.startswith("⚠") else WHITE
    row_bgs.append(("BACKGROUND", (0,i),(-1,i), bg))

summary_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), BURGUNDY),
    ("FONTSIZE",     (0,0),(-1,-1), 7.5),
    ("TOPPADDING",   (0,0),(-1,-1), 3),
    ("BOTTOMPADDING",(0,0),(-1,-1), 3),
    ("LEFTPADDING",  (0,0),(-1,-1), 5),
    ("GRID",         (0,0),(-1,-1), 0.3, colors.HexColor("#CCCCCC")),
    ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),
        [colors.HexColor("#FFF8F8") if rows[i][3].startswith("★")
         else colors.HexColor("#F3F8FF") if rows[i][3].startswith("○")
         else colors.HexColor("#FFFBEE") if rows[i][3].startswith("⚠")
         else WHITE
         for i in range(len(rows))]),
] + row_bgs))
story.append(summary_t)

story.append(Spacer(1, 12))
story.append(Paragraph(
    "★ cue explícito (orador dice la frase)  ·  ○ cue implícito (juzga por las cifras)  ·  ⚠ avance manual libre (sin discurso)",
    S("leg", fontName="Helvetica", fontSize=7,
      textColor=MID_GRAY, alignment=TA_CENTER)))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "H. Ayuntamiento de Tuxpan, Veracruz 2026–2029  ·  Generado: 16 de abril de 2026  ·  31 slides",
    footer_s))

# ── BUILD ─────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF generado: {OUTPUT}")
