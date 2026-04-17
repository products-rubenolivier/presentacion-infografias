import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const txt = readFileSync(join(__dirname, 'GUIA-OPERACION-SLIDES.txt'), 'utf-8');

// Convert plain text to styled HTML
const lines = txt.split('\n');

function classifyLine(line) {
  if (line.startsWith('═')) return 'hr-double';
  if (line.startsWith('───')) return 'hr-thin';
  if (/^BLOQUE \d/.test(line) && !line.startsWith('[')) return 'section-title';
  if (line.startsWith('[→ SLIDE')) return 'slide-label';
  if (line.includes('★ Cue explícito') || line.trim().startsWith('★')) return 'cue-star';
  if (line.includes('○ Cue implícito') || line.trim().startsWith('○')) return 'cue-circle';
  if (line.includes('⚠') ) return 'cue-warn';
  if (line.startsWith('  El orador') || line.trim().startsWith('"')) return 'speech';
  if (line.startsWith('  [') ) return 'speech';
  if (line.startsWith('INSTRUCCIONES') || line.startsWith('CÓMO USAR') || line.startsWith('  [→') ) return 'body';
  if (line.startsWith('  SLIDE') || line.startsWith('  ──')) return 'table-row';
  return 'body';
}

let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4; margin: 18mm 18mm 18mm 18mm; }
  body {
    font-family: 'Arial', sans-serif;
    font-size: 8.5pt;
    color: #2e2e2e;
    line-height: 1.45;
  }
  .cover {
    background: #6B1C2A;
    color: white;
    padding: 28px 24px;
    margin-bottom: 14px;
  }
  .cover h1 {
    font-size: 20pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 6px;
  }
  .cover h2 {
    font-size: 14pt;
    color: #C9A84C;
    text-align: center;
    margin-bottom: 4px;
  }
  .cover p {
    font-size: 9pt;
    text-align: center;
    color: #DDBB88;
  }
  .legend {
    background: #F7F4F0;
    border-top: 2px solid #C9A84C;
    border-bottom: 2px solid #C9A84C;
    padding: 6px 10px;
    margin-bottom: 12px;
    font-size: 8pt;
  }
  .legend table { width:100%; border-collapse: collapse; }
  .legend td { padding: 2px 6px; }
  .legend .star { color: #8B1A27; font-weight:bold; }
  .legend .circ { color: #1A5276; font-weight:bold; }
  .legend .warn { color: #7D6608; font-weight:bold; }

  .section-hdr {
    background: #6B1C2A;
    color: white;
    font-weight: bold;
    font-size: 9pt;
    padding: 5px 8px;
    margin-top: 14px;
    margin-bottom: 3px;
  }
  .section-sub {
    font-style: italic;
    color: #555;
    font-size: 7.5pt;
    margin-bottom: 4px;
    padding-left: 4px;
  }
  .slide-row {
    display: flex;
    align-items: stretch;
    margin-bottom: 5px;
    border: 0.5px solid #ddd;
  }
  .slide-num {
    background: #6B1C2A;
    color: white;
    font-weight: bold;
    font-size: 8.5pt;
    min-width: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }
  .slide-body {
    background: #F7F4F0;
    flex: 1;
    padding: 4px 8px;
  }
  .slide-name {
    font-weight: bold;
    font-size: 8.5pt;
    color: #2e2e2e;
    margin-bottom: 2px;
  }
  .cue-star { color: #8B1A27; font-weight:bold; font-size:8pt; margin-bottom:1px; }
  .cue-circ { color: #1A5276; font-weight:bold; font-size:8pt; margin-bottom:1px; }
  .cue-warn { color: #7D6608; font-weight:bold; font-size:8pt; margin-bottom:1px; }
  .speech-line { color: #555; font-style:italic; font-size:7.5pt; padding-left:6px; line-height:1.35; }
  .note-line { color: #7D6608; font-size:7.5pt; padding-left:6px; margin-top:2px; }

  .warn-box {
    background: #FFFBEE;
    border: 1px solid #C9A84C;
    padding: 6px 10px;
    margin: 6px 0;
    color: #7D6608;
    font-size: 8pt;
  }
  .warn-box strong { font-size: 8.5pt; }

  hr.thick { border: none; border-top: 1px solid #C9A84C; margin: 10px 0; }
  hr.thin  { border: none; border-top: 0.4px solid #ccc; margin: 4px 0; }

  /* Summary table */
  .summary-title {
    background: #6B1C2A;
    color: white;
    font-weight: bold;
    font-size: 11pt;
    text-align: center;
    padding: 8px;
    margin-top: 16px;
    margin-bottom: 6px;
  }
  .summary-sub {
    text-align:center; font-size:8pt; color:#555; margin-bottom:8px;
  }
  table.summary {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
  }
  table.summary th {
    background: #6B1C2A;
    color: white;
    padding: 4px 6px;
    text-align: left;
    font-size: 8pt;
  }
  table.summary td {
    padding: 3px 6px;
    border: 0.3px solid #ccc;
    vertical-align: middle;
  }
  table.summary .num { font-weight:bold; color:#6B1C2A; text-align:center; }
  .row-star { background: #FFF8F8; }
  .row-circ { background: #F3F8FF; }
  .row-warn { background: #FFFBEE; }
  .row-start{ background: #F9F9F9; }
  .cue-s { color:#8B1A27; font-weight:bold; }
  .cue-c { color:#1A5276; font-weight:bold; }
  .cue-w { color:#7D6608; font-weight:bold; }

  .footer {
    margin-top: 12px;
    text-align: center;
    font-size: 7pt;
    color: #999;
    border-top: 0.5px solid #ccc;
    padding-top: 6px;
  }
  .legend-foot {
    text-align:center; font-size:7pt; color:#666; margin-top:8px;
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>GUÍA DE OPERACIÓN DE SLIDES</h1>
  <h2>100 DÍAS DE ACCIÓN</h2>
  <p>H. Ayuntamiento de Tuxpan, Veracruz &nbsp;·&nbsp; 2026 – 2029</p>
  <p style="margin-top:8px;">31 slides &nbsp;·&nbsp; 8 bloques de discurso &nbsp;·&nbsp; Presentación web</p>
</div>

<!-- LEGEND -->
<div class="legend">
  <table>
    <tr>
      <td class="star">★ &nbsp;CUE EXPLÍCITO</td>
      <td>El orador dice la frase marcada. Avanza de inmediato.</td>
    </tr>
    <tr>
      <td class="circ">○ &nbsp;CUE IMPLÍCITO</td>
      <td>El orador menciona las cifras del slide. Avanza al escucharlas.</td>
    </tr>
    <tr>
      <td class="warn">⚠ &nbsp;SIN DISCURSO</td>
      <td>Bloque 7: sin PDF de discurso. Avance manual al ritmo del evento.</td>
    </tr>
  </table>
</div>
`;

// ─── SLIDE BLOCKS DATA ──────────────────────────────────────────────────────
const bloques = [
  {
    num: '1', title: 'APERTURA',
    sub: '"Lo que encontramos. Lo que decidimos."',
    slides: [
      {
        n: 1, name: 'B01 · Portada &mdash; "LO QUE ENCONTRAMOS · LO QUE CONSTRUIMOS"',
        type: 'start', cue: 'Al iniciar el Bloque 1, antes de que el orador empiece.',
        speech: [
          '"Hace cien días llegamos a este Ayuntamiento con una promesa clara y de corazón: ¡Hacer las cosas BIEN!…"',
          '"…administrar bien para servir mejor a cada tuxpeño y a cada tuxpeña."',
        ],
        note: '★ El discurso continúa luego de "Entra Infografía 1" — ya estás en Slide 1, no avances.',
      },
    ],
  },
  {
    num: '2', title: 'ASISTENCIA SOCIAL Y ATENCIÓN A GRUPOS VULNERABLES',
    sub: '"Servir es estar cerca de quienes más lo necesitan"',
    slides: [
      { n:2, name:'B02 · Portada', type:'start', cue:'Al iniciar el Bloque 2.',
        speech:['"…a través de la Dirección de Salud, del Sistema DIF Municipal…"',
                '"Ya atendimos a más de 2,152 personas con el programa La Salud Inicia en Casa…"',
                '"…El DIF no se quedó esperando en la oficina. Salió."'] },
      { n:3, name:'B02-S1 · SALUD EN CASA &nbsp;&nbsp;(+2,500 · 2,100 · 395)', type:'star',
        cue:'Entra Infografía 2A.',
        speech:['"Desde el 6 de enero, el DIF ya había llegado a 45 comunidades y colonias…"',
                '"…3,800 niñas y niños [Día de Reyes]… 157 parejas en bodas colectivas…"'] },
      { n:4, name:'B02-S2 · ATENCIÓN COMUNITARIA &nbsp;&nbsp;(4,000 · 45 · 157)', type:'circ',
        cue:'Al mencionar 45 comunidades / 3,800 niños / 157 parejas.',
        speech:['"Pusimos en marcha 50 talleres de capacitación… 1,289 personas…"',
                '"…más de 2,500 apoyos adicionales: medicamentos, apoyos funerarios…"'] },
      { n:5, name:'B02-S3 · CAPACITACIÓN Y APOYOS &nbsp;&nbsp;(50 · 1,289 · +2,500)', type:'circ',
        cue:'Al mencionar 50 talleres / 1,289 personas.',
        speech:['"…646,162 desayunos calientes en 131 escuelas… llegando a 6,034 niñas y niños…"'] },
      { n:6, name:'B02-S4 · DESAYUNOS ESCOLARES &nbsp;&nbsp;(646,162 · 131 · 6,034)', type:'circ',
        cue:'Al mencionar 646,162 desayunos.',
        speech:['"…4,300 atenciones [CRRI]… 1,400 servicios [Procuraduría]…"'] },
      { n:7, name:'B02-S5 · ATENCIÓN A LA MUJER &nbsp;&nbsp;(4,300 · 1,400 · 524 · 181)', type:'star',
        cue:'Entra Infografía 2B.',
        speech:['"524 mujeres fueron atendidas directamente…"',
                '"…181 atenciones jurídicas… Eso es hacer las cosas BIEN."'] },
    ],
  },
  {
    num: '3', title: 'TU CIUDAD, MEJOR',
    sub: '"Servicios públicos municipales"',
    slides: [
      { n:8, name:'B03 · Portada', type:'start', cue:'Al iniciar el Bloque 3.',
        speech:['"Tuxpan ya está iluminada." ← avanza al siguiente slide de inmediato.'] },
      { n:9, name:'B03-S1 · ALUMBRADO PÚBLICO &nbsp;&nbsp;(3,282 · 1/5 del total · 630)', type:'circ',
        cue:'Al decir "reparamos 3,282 luminarias / 630 nuevas luminarias".',
        speech:['"…el día 12 de la administración se encendieron 400 luminarias del boulevard…"',
                '"…llevamos alumbrado público a 67 comunidades…"'] },
      { n:10, name:'B03-S2 · ELECTRIFICACIÓN RURAL &nbsp;&nbsp;(400 · 67 · 75)', type:'circ',
        cue:'Al mencionar 400 luminarias del boulevard / 67 comunidades / El Sacrificio / 75 luminarias.',
        speech:['"…1.5 kilómetros completamente iluminados [acceso a la playa]…"',
                '"…17 camiones en operación… 84 rutas de recolección activas…"'] },
      { n:11, name:'B03-S3 · INFRAESTRUCTURA Y RECOLECCIÓN &nbsp;&nbsp;(550 · 1.5 KM · 17 · 84)', type:'circ',
        cue:'Al mencionar 1.5 km / 17 camiones / 84 rutas.',
        speech:['"Se adquirieron 90 contenedores de basura…"',
                '"La imagen de Tuxpan es muy importante…"'] },
      { n:12, name:'B03-S4 · ESPACIOS PÚBLICOS &nbsp;&nbsp;(90 contenedores · 105 KM · 29 espacios)', type:'star',
        cue:'Entra Infografía 3.',
        speech:['"…poda de 105 kilómetros de camellones… 15 parques… 9 jardineras…"',
                '"Siéntanse orgullosos de ser tuxpeños."'] },
    ],
  },
  {
    num: '4', title: 'IDENTIDAD Y FUTURO',
    sub: '"Educación, Cultura y Juventud"',
    slides: [
      { n:13, name:'B04 · Portada', type:'start', cue:'Al iniciar el Bloque 4.',
        speech:['"Un municipio no se mide solo por sus calles iluminadas o sus parques limpios."'] },
      { n:14, name:'B04-S1 · INFRAESTRUCTURA EDUCATIVA &nbsp;&nbsp;(29 · 12 · 560)', type:'circ',
        cue:'Al mencionar 29 planteles / 12 escrituración / 560 alumnos.',
        speech:['"…918 alumnos, 82 profesores [actos cívicos]…"',
                '"…540 estudiantes [Expo Profesiográfica]… más de 900 personas [Noches Bohemias]…"'] },
      { n:15, name:'B04-S2 · EDUCACIÓN Y CULTURA &nbsp;&nbsp;(918 · 82 · 540 · 900)', type:'circ',
        cue:'Al mencionar 918 alumnos / 82 profesores / 540 / 900.',
        speech:['"…133 alumnas y alumnos en talleres de danza, baile, dibujo y teatro…"',
                '"…más de 1,200 acervos bibliográficos…"'] },
      { n:16, name:'B04-S3 · JUVENTUD &nbsp;&nbsp;(133 talleres artísticos · 120 Tarjeta Juventux)', type:'star',
        cue:'Entra Infografía 4.',
        speech:['"La Tarjeta Juventux… más de 120 jóvenes inscritos… 25 comercios afiliados…"',
                '"…Feria de Emprendedores Juveniles, con 85 jóvenes…"',
                '"…foro Hablemos a Tiempo… más de 350 jóvenes…"'] },
      { n:17, name:'B04-S4 · ECONOMÍA LOCAL &nbsp;&nbsp;(25 comercios · 85 jóvenes · +350)', type:'circ',
        cue:'Al mencionar 25 comercios / 85 jóvenes / +350 foro.',
        speech:['"En cien días estas acciones llegaron a 1,315 jóvenes tuxpeños."'],
        note:'★ "Entra Video 4." — video externo. Mantén Slide 17 hasta que el video termine.' },
    ],
  },
  {
    num: '6', title: 'TUXPAN COMPITE',
    sub: '"Deporte"',
    slides: [
      { n:18, name:'B06 · Portada', type:'start', cue:'Al iniciar el Bloque 6.',
        speech:['"el deporte no es un lujo. Es una herramienta de transformación."',
                '"375 atletas tuxpeños de 15 disciplinas… 44 medallas de oro. ¡Récord histórico!"'] },
      { n:19, name:'B06-S1 · DEPORTE COMPETITIVO &nbsp;&nbsp;(375 atletas · 15 disciplinas · 44 oros)', type:'star',
        cue:'Entra Infografía 6.',
        speech:['Historias de Mayte Madison García (basquetbol — Panamá),',
                'Said Manuel "Chay" Aguilar (béisbol — New York Yankees),',
                'Diego Jacobo Escudero (canotaje — Mundial Juvenil Canadá).'],
        note:'★ "Entra Video 6." — video externo. Mantén Slide 19 hasta que el video termine.' },
    ],
  },
];

// Bloque 7 special
const b7 = {
  num: '7', title: 'TUXPAN AL MUNDO',
  sub: '',
  warn: true,
  slides: [
    { n:20, name:'B07 · Portada — "TUXPAN AL MUNDO"' },
    { n:21, name:'B07-S1 · SECTOR TURÍSTICO &nbsp;&nbsp;(60+ Empresas · 5 Módulos · 12 Acciones)' },
    { n:22, name:'B07-S2 · PROMOCIÓN TURÍSTICA &nbsp;&nbsp;(80 Actores Fam Trip · 1 Stand Cumbre Tajín)' },
    { n:23, name:'B07-S3 · OCUPACIÓN HOTELERA &nbsp;&nbsp;(98% Ocupación · 2,573 Habitaciones)' },
  ],
};

const bloquesB = [
  {
    num: '8', title: 'GOBIERNO CERCANO, INCLUYENTE Y QUE DA RESPUESTA',
    sub: '"Desarrollo Social, Bienestar para las Comunidades y Participación Ciudadana"',
    slides: [
      { n:24, name:'B08 · Portada', type:'start', cue:'Al iniciar el Bloque 8.',
        speech:['"…crear la Dirección de Bienestar para las Comunidades."',
                '"Hemos realizado 45 jornadas comunitarias tipo tequio…"',
                '"…creamos una red de 60 Jefes de Manzana y Gestores Vecinales…"',
                '"…más de 1,200 personas de 44 comunidades [Consulta a Pueblos Indígenas]…"',
                '"…6 foros de consulta ciudadana… 1,675 solicitudes [Ventanilla Única]…"'] },
      { n:25, name:'B08-S1 · PARTICIPACIÓN CIUDADANA &nbsp;&nbsp;(45 · 60 · 1,200 · 44 · 6 · 1,675)', type:'circ',
        cue:'Al mencionar 45 jornadas / 60 Jefes de Manzana.',
        speech:['"Menos vueltas, más respuestas."',
                '"Esto es un gobierno cercano, incluyente y que da respuesta."'] },
    ],
  },
  {
    num: '9', title: 'OBRA PÚBLICA, INFRAESTRUCTURA Y DESARROLLO',
    sub: '"Reconstruyendo los servicios básicos que Tuxpan se merece"',
    slides: [
      { n:26, name:'B09 · Portada', type:'start', cue:'Al iniciar el Bloque 9.',
        speech:['"Prometimos modernizar la red de drenaje hidrosanitaria…"',
                '[Describe la situación crítica: 1,200 baches, 400 fugas, 66% drenaje colapsado…]',
                '"Pero no vinimos a culpar a los del pasado. Vinimos a actuar."'] },
      { n:27, name:'B09-S1 · AGUA Y SANEAMIENTO &nbsp;&nbsp;(59 fugas · 27 colonias · 125 desazolves)', type:'circ',
        cue:'Al mencionar 59 fugas / 27 colonias / 125 trabajos.',
        speech:['"…más de 19,000 metros de tubería de drenaje…"',
                '"…141 acciones de bacheo…"'] },
      { n:28, name:'B09-S2 · DRENAJE Y BACHEO &nbsp;&nbsp;(19,000 M de tubería · 141 acciones)', type:'circ',
        cue:'Al mencionar 19,000 metros / 141 acciones de bacheo.',
        speech:['"…30 presas de captación de agua [con SEDARPA]…"',
                '"…12,000 m² de pintura en fachadas [Fundación Corazón Urbano]…"',
                '"…donaciones por $1,200,000 pesos [KIMEX]…"'] },
      { n:29, name:'B09-S3 · OBRAS E INVERSIÓN &nbsp;&nbsp;(30 presas · 12,000 m² · $1.2 MDP)', type:'circ',
        cue:'Al mencionar 30 presas / 12,000 m² / $1.2 MDP.',
        speech:['"…y apenas viene la obra pública."'] },
    ],
  },
  {
    num: '10', title: 'EMBELLECIMIENTO Y ORDEN URBANO',
    sub: '"Una ciudad más limpia, ordenada y digna"',
    slides: [
      { n:30, name:'B10 · Portada', type:'start', cue:'Al iniciar el Bloque 10.',
        speech:['"Una ciudad que se ve bien, se vive mejor."',
                '"…18 carpas exclusivas, Mercado Ambulante inaugurado…"',
                '"…más de 70,630 metros lineales pintados [balizamiento histórico]…"'] },
      { n:31, name:'B10-S1 · ORDEN URBANO &nbsp;&nbsp;(14 KM bulevar · +70,630 ML · 1 Mercado · 18 Carpas)', type:'circ',
        cue:'Al mencionar las carpas / metros lineales / mercado / km de bulevar.',
        speech:['"…un Tuxpan más bello, más digno y donde las cosas se hacen BIEN."'] },
    ],
  },
];

function renderSlide(s) {
  const typeMap = {
    star: ['cue-star', '★ CUE EXPLÍCITO: '],
    circ: ['cue-circ', '○ CUE IMPLÍCITO: '],
    warn: ['cue-warn', '⚠ AVANCE MANUAL LIBRE'],
    start:['cue-circ', '→ Al iniciar este bloque: '],
  };
  const [cls, prefix] = typeMap[s.type] || ['cue-circ',''];
  const cueHtml = s.cue
    ? `<div class="${cls}">${prefix}<strong>"${s.cue}"</strong></div>`
    : `<div class="${cls}">${prefix}</div>`;
  const speechHtml = (s.speech||[]).map(l =>
    `<div class="speech-line">${l}</div>`).join('');
  const noteHtml = s.note ? `<div class="note-line">${s.note}</div>` : '';
  return `
  <div class="slide-row">
    <div class="slide-num">SLIDE<br>${s.n}</div>
    <div class="slide-body">
      <div class="slide-name">${s.name}</div>
      ${cueHtml}${speechHtml}${noteHtml}
    </div>
  </div>`;
}

function renderBloque(b) {
  const subHtml = b.sub ? `<div class="section-sub">${b.sub}</div>` : '';
  const slides = b.slides.map(renderSlide).join('');
  return `
  <div class="section-hdr">BLOQUE ${b.num} — ${b.title}</div>
  ${subHtml}
  ${slides}
  <hr class="thick">`;
}

// Render bloques 1–6
[...bloques].forEach(b => { html += renderBloque(b); });

// Bloque 7 warning
html += `
<div class="section-hdr">BLOQUE 7 — TUXPAN AL MUNDO</div>
<div class="warn-box">
  <strong>⚠ NO HAY ARCHIVO DE DISCURSO PARA EL BLOQUE 7</strong><br>
  Los 4 slides se presentan visualmente (pausa musical o presentación libre).<br>
  Avanza manualmente al ritmo que indique el conductor del evento.
</div>`;
b7.slides.forEach(s => {
  html += `
  <div class="slide-row">
    <div class="slide-num">SLIDE<br>${s.n}</div>
    <div class="slide-body">
      <div class="slide-name">${s.name}</div>
      <div class="cue-warn">⚠ Avance manual libre — sin cue de discurso</div>
    </div>
  </div>`;
});
html += `<hr class="thick">`;

// Render bloques 8–10
bloquesB.forEach(b => { html += renderBloque(b); });

// ─── SUMMARY TABLE ──────────────────────────────────────────────
const rows = [
  [1,  'B01','Portada Apertura',                                        'start','Al iniciar Bloque 1'],
  [2,  'B02','Portada Asistencia Social',                               'start','Al iniciar Bloque 2'],
  [3,  'B02','Salud en Casa  (+2,500 · 2,100 · 395)',                   'star', '"Entra Infografía 2A"'],
  [4,  'B02','Atención Comunitaria  (4,000 · 45 · 157)',                'circ', 'Al mencionar 45 comunidades'],
  [5,  'B02','Capacitación y Apoyos  (50 · 1,289 · +2,500)',            'circ', 'Al mencionar 50 talleres'],
  [6,  'B02','Desayunos Escolares  (646,162 · 131 · 6,034)',            'circ', 'Al mencionar 646,162 desayunos'],
  [7,  'B02','Atención a la Mujer  (4,300 · 1,400 · 524 · 181)',        'star', '"Entra Infografía 2B"'],
  [8,  'B03','Portada Tu Ciudad, Mejor',                                'start','Al iniciar Bloque 3'],
  [9,  'B03','Alumbrado Público  (3,282 · 1/5 · 630)',                  'circ', 'Al decir "3,282 luminarias"'],
  [10, 'B03','Electrificación Rural  (400 · 67 · 75)',                  'circ', 'Al decir "400 / 67 / 75"'],
  [11, 'B03','Infraestructura y Recolección  (550 · 1.5 KM · 17 · 84)','circ', 'Al decir "1.5 km / 17 camiones"'],
  [12, 'B03','Espacios Públicos  (90 · 105 KM · 29)',                   'star', '"Entra Infografía 3"'],
  [13, 'B04','Portada Identidad y Futuro',                              'start','Al iniciar Bloque 4'],
  [14, 'B04','Infraestructura Educativa  (29 · 12 · 560)',              'circ', 'Al decir "29 planteles / 560"'],
  [15, 'B04','Educación y Cultura  (918 · 82 · 540 · 900)',             'circ', 'Al decir "918 / 540 / 900"'],
  [16, 'B04','Juventud  (133 talleres · 120 Tarjeta Juventux)',         'star', '"Entra Infografía 4"'],
  [17, 'B04','Economía Local  (25 · 85 · +350)',                        'circ', 'Al decir "25 comercios / 85"'],
  [18, 'B06','Portada Tuxpan Compite',                                  'start','Al iniciar Bloque 6'],
  [19, 'B06','Deporte Competitivo  (375 · 15 disciplinas · 44 oros)',   'star', '"Entra Infografía 6"'],
  [20, 'B07','Portada Tuxpan al Mundo',                                 'warn', 'Avance manual libre'],
  [21, 'B07','Sector Turístico  (60+ · 5 Módulos · 12 Acciones)',       'warn', 'Avance manual libre'],
  [22, 'B07','Promoción Turística  (80 Fam Trip · 1 Stand)',            'warn', 'Avance manual libre'],
  [23, 'B07','Ocupación Hotelera  (98% · 2,573 hab.)',                  'warn', 'Avance manual libre'],
  [24, 'B08','Portada Gobierno Cercano',                                'start','Al iniciar Bloque 8'],
  [25, 'B08','Participación Ciudadana  (45 · 60 · 1,200 · 44 · 6 · 1,675)','circ','Al decir "45 jornadas / 60"'],
  [26, 'B09','Portada Obra Pública',                                    'start','Al iniciar Bloque 9'],
  [27, 'B09','Agua y Saneamiento  (59 · 27 · 125)',                     'circ', 'Al decir "59 fugas / 27 / 125"'],
  [28, 'B09','Drenaje y Bacheo  (19,000 M · 141)',                      'circ', 'Al decir "19,000 m / 141"'],
  [29, 'B09','Obras e Inversión  (30 · 12,000 m² · $1.2 MDP)',          'circ', 'Al decir "30 presas / $1.2 MDP"'],
  [30, 'B10','Portada Embellecimiento',                                 'start','Al iniciar Bloque 10'],
  [31, 'B10','Orden Urbano  (14 KM · +70,630 ML · 1 Mercado · 18 Carpas)','circ','Al decir "70,630 ml / 18 carpas"'],
];

const rowClass = t => t==='star'?'row-star':t==='circ'?'row-circ':t==='warn'?'row-warn':'row-start';
const cueClass = t => t==='star'?'cue-s':t==='circ'?'cue-c':t==='warn'?'cue-w':'';
const cueIcon  = t => t==='star'?'★':t==='circ'?'○':t==='warn'?'⚠':'→';

html += `
<div style="page-break-before: always;"></div>
<div class="summary-title">CUADRO RESUMEN RÁPIDO</div>
<div class="summary-sub">Para tener a la vista durante el evento. Avanza cuando el orador llega al cue indicado.</div>
<table class="summary">
  <thead>
    <tr>
      <th style="width:40px;text-align:center;">SLIDE</th>
      <th style="width:46px;">BLOQUE</th>
      <th>CONTENIDO</th>
      <th style="width:190px;">CUE DE AVANCE</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(([n,bl,cont,type,cue]) => `
    <tr class="${rowClass(type)}">
      <td class="num">${n}</td>
      <td>${bl}</td>
      <td>${cont}</td>
      <td class="${cueClass(type)}">${cueIcon(type)} ${cue}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="legend-foot">
  ★ cue explícito (orador dice la frase) &nbsp;·&nbsp;
  ○ cue implícito (juzga por las cifras) &nbsp;·&nbsp;
  ⚠ avance manual libre (sin discurso)
</div>
<div class="footer">
  H. Ayuntamiento de Tuxpan, Veracruz 2026–2029 &nbsp;·&nbsp;
  16 de abril de 2026 &nbsp;·&nbsp; 31 slides totales
</div>

</body>
</html>`;

// Write HTML temp file
const htmlPath = join(__dirname, '_guia_tmp.html');
writeFileSync(htmlPath, html, 'utf-8');

// Launch Puppeteer and export PDF
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));

const pdfPath = join(__dirname, 'GUIA-OPERACION-SLIDES.pdf');
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
});

await browser.close();

// Clean up temp HTML
import { unlinkSync } from 'fs';
unlinkSync(htmlPath);

console.log('PDF generado: GUIA-OPERACION-SLIDES.pdf');
