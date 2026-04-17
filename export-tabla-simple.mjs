// export-tabla-simple.mjs — Guion lineal: discurso + marcadores de slide
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'TABLA-CUES.pdf');

const BURGUNDY = '#7A1028';
const GOLD     = '#C4905A';

// ── Datos: flujo del discurso ─────────────────────────────────────────
// Tipos de fila:
//   'bloque'   → cabecera de sección
//   'cambio'   → fila de cambio de slide (resaltada, con número)
//   'parrafo'  → texto del discurso (slide continúa)
//   'manual'   → bloque sin discurso, avance libre

const guion = [

  { t: 'bloque',  text: 'BLOQUE 1 — APERTURA' },
  { t: 'cambio',  num: 1,  tema: 'LO QUE ENCONTRAMOS' },
  { t: 'parrafo', text: 'Hace cien días llegamos a este Ayuntamiento con una promesa clara: ¡Hacer las cosas BIEN!' },
  { t: 'parrafo', text: 'Hoy estamos aquí para rendir cuentas, con la frente en alto.' },
  { t: 'parrafo', text: 'Implementamos controles más estrictos, fortalecimos la rendición de cuentas y promovimos un gasto ordenado y con sentido social.' },
  { t: 'parrafo', text: 'El dinero público o se gasta bien, O NO SE GASTA.' },

  { t: 'bloque',  text: 'BLOQUE 2 — ASISTENCIA SOCIAL' },
  { t: 'cambio',  num: 2,  tema: 'Portada — ASISTENCIA SOCIAL' },
  { t: 'parrafo', text: 'En este gobierno entendemos algo muy simple: servir es estar cerca de quienes más lo necesitan.' },
  { t: 'parrafo', text: 'Hemos sacado los servicios a las calles, colonias y comunidades, donde realmente hacen falta.' },
  { t: 'parrafo', text: 'Ya atendimos a más de 2,152 personas con Salud en Casa y las Brigadas Médicas.' },
  { t: 'cambio',  num: 3,  tema: 'SALUD EN CASA  —  +2,500 · 2,100 · 395',  cue: '"Entra Infografía 2A."' },
  { t: 'parrafo', text: 'Desde el 6 de enero el DIF llegó a 45 comunidades para el Día de Reyes con 4,000 niñas y niños.' },
  { t: 'parrafo', text: 'Formalizamos la unión de 157 parejas en bodas colectivas.' },
  { t: 'cambio',  num: 4,  tema: 'ATENCIÓN COMUNITARIA  —  4,000 · 45 · 157', cue: '"45 comunidades" / "157 parejas"' },
  { t: 'parrafo', text: '50 talleres de capacitación: 1,289 personas beneficiadas. Apoyos invernales a 382 familias.' },
  { t: 'parrafo', text: 'A través de Trabajo Social: más de 2,500 apoyos directos — medicamentos, estudios, funerarios.' },
  { t: 'cambio',  num: 5,  tema: 'CAPACITACIÓN Y APOYOS  —  50 · 1,289 · +2,500', cue: '"50 talleres" / "1,289 personas"' },
  { t: 'parrafo', text: 'Mil Días: 700 canastas básicas a 143 madres.' },
  { t: 'parrafo', text: '646,162 desayunos calientes en 131 escuelas — 36 urbanas y 95 rurales — llegando a 6,034 niñas y niños.' },
  { t: 'cambio',  num: 6,  tema: 'DESAYUNOS ESCOLARES  —  646,162 · 131 · 6,034', cue: '"646,162 desayunos"' },
  { t: 'parrafo', text: 'Centro de Rehabilitación: 4,300 atenciones. Procuraduría de Niñas y Niños: 1,400 servicios.' },
  { t: 'cambio',  num: 7,  tema: 'ATENCIÓN A LA MUJER  —  4,300 · 1,400 · 524 · 181', cue: '"Entra Infografía 2B."' },
  { t: 'parrafo', text: '524 mujeres acompañadas en autoestima, depresión y conflicto familiar.' },
  { t: 'parrafo', text: '181 atenciones jurídicas del Instituto Municipal de la Mujer.' },

  { t: 'bloque',  text: 'BLOQUE 3 — TU CIUDAD, MEJOR' },
  { t: 'cambio',  num: 8,  tema: 'Portada — TU CIUDAD, MEJOR' },
  { t: 'parrafo', text: 'Hoy podemos decirlo con la frente en alto: ¡Tuxpan ya está iluminado!' },
  { t: 'cambio',  num: 9,  tema: 'ALUMBRADO PÚBLICO  —  3,282 · 1/5 · 630', cue: '"3,282 luminarias"' },
  { t: 'parrafo', text: 'En solo tres meses reparamos 3,282 luminarias — una quinta parte del total.' },
  { t: 'parrafo', text: '630 nuevas luminarias en 42 colonias y 37 comunidades, incluyendo 100 en zona de playas.' },
  { t: 'parrafo', text: 'El boulevard más importante de Tuxpan: 2 años en la oscuridad. Día 12 de la administración: 400 luminarias encendidas.' },
  { t: 'cambio',  num: 10, tema: 'ELECTRIFICACIÓN RURAL  —  400 · 67 · 75', cue: '"400 luminarias del boulevard" / "67 comunidades"' },
  { t: 'parrafo', text: 'Alumbrado a 67 comunidades olvidadas. El Sacrificio: instalación eléctrica completa — 550 personas, 68 familias.' },
  { t: 'parrafo', text: '1.5 km de acceso a playa iluminado. Cableado subterráneo en el boulevard.' },
  { t: 'cambio',  num: 11, tema: 'INFRAESTRUCTURA Y RECOLECCIÓN  —  550 · 1.5 KM · 17 · 84', cue: '"1.5 kilómetros" / "17 camiones"' },
  { t: 'parrafo', text: 'Recibimos 3 camiones de basura. Hoy: 17 en operación. 84 rutas activas cubren 162 colonias y comunidades.' },
  { t: 'parrafo', text: '90 contenedores instalados. Rastro municipal saneado.' },
  { t: 'cambio',  num: 12, tema: 'ESPACIOS PÚBLICOS  —  90 · 105 KM · 29', cue: '"Entra Infografía 3."' },
  { t: 'parrafo', text: '105 km de camellones podados. 15 parques recuperados. 9 jardineras estratégicas. 29 espacios públicos intervenidos.' },

  { t: 'bloque',  text: 'BLOQUE 4 — IDENTIDAD Y FUTURO' },
  { t: 'cambio',  num: 13, tema: 'Portada — IDENTIDAD Y FUTURO' },
  { t: 'parrafo', text: 'Un municipio se mide también por lo que le ofrece a su gente para crecer, para crear y para soñar.' },
  { t: 'parrafo', text: 'En educación comenzamos por lo esencial: la base legal. Sin ella, las escuelas no reciben inversión estatal.' },
  { t: 'cambio',  num: 14, tema: 'INFRAESTRUCTURA EDUCATIVA  —  29 · 12 · 560', cue: '"29 planteles" / "12 escrituración"' },
  { t: 'parrafo', text: '29 planteles apoyados en cédulas catastrales. 12 en trámites de escrituración. 560 alumnos en talleres.' },
  { t: 'parrafo', text: '5 actos cívicos: 918 alumnos, 82 profesores. Primera Expo Profesiográfica: 540 estudiantes orientados.' },
  { t: 'parrafo', text: 'Noches Bohemias en Parque Reforma: 900 personas. Domingos Culturales semana a semana.' },
  { t: 'cambio',  num: 15, tema: 'EDUCACIÓN Y CULTURA  —  918 · 82 · 540 · 900', cue: '"918 alumnos" / "82 profesores"' },
  { t: 'parrafo', text: 'Talleres municipales gratuitos: 133 alumnos en danza folklórica, baile moderno, dibujo y teatro.' },
  { t: 'parrafo', text: '1,200 acervos bibliográficos donados. 1,038 visitantes a museos y bibliotecas.' },
  { t: 'cambio',  num: 16, tema: 'JUVENTUD  —  133 · 120 Tarjeta JUVENTUX', cue: '"Entra Infografía 4."' },
  { t: 'parrafo', text: 'La Tarjeta JUVENTUX: 120 jóvenes inscritos en el primer mes, 25 comercios afiliados.' },
  { t: 'parrafo', text: 'Primera Feria de Emprendedores: 85 jóvenes. Foro Hablemos a Tiempo: +350 jóvenes.' },
  { t: 'cambio',  num: 17, tema: 'ECONOMÍA LOCAL  —  25 · 85 · +350', cue: '"25 comercios" / "85 jóvenes"' },
  { t: 'parrafo', text: '1,315 jóvenes tuxpeños alcanzados en estos cien días.' },
  { t: 'parrafo', text: '⚡ "Entra Video 4." → mantener Slide 17 mientras dura el video.' },

  { t: 'bloque',  text: 'BLOQUE 5 — SEGURIDAD Y CONFIANZA' },
  { t: 'cambio',  num: 18, tema: 'Portada — SEGURIDAD Y CONFIANZA' },
  { t: 'parrafo', text: 'En materia de seguridad hay que hablar con claridad. Asumimos nuestra responsabilidad.' },
  { t: 'parrafo', text: 'Nos toca prevenir, fortalecer la policía, vigilar colonias, atender reportes y proteger a la población.' },
  { t: 'parrafo', text: 'Una seguridad que previene antes de tener que reaccionar.' },
  { t: 'cambio',  num: 19, tema: 'PREVENCIÓN ESCOLAR  —  35 · 2,431 · 14', cue: '"35 planteles" / "2,431 alumnos"' },
  { t: 'parrafo', text: 'Pláticas en 35 planteles: 2,431 alumnos, 147 docentes, 254 padres. Proximidad social en 14 colonias.' },
  { t: 'parrafo', text: 'Recibimos 3 patrullas. Hoy contamos con 11.' },
  { t: 'cambio',  num: 20, tema: 'PATRULLAJE Y RESPUESTA  —  11 · 214 · 1,694', cue: '"11 patrullas" / "214 detenciones"' },
  { t: 'parrafo', text: '214 detenciones por faltas administrativas. 1,694 reportes de auxilio atendidos.' },
  { t: 'parrafo', text: '11 personas extraviadas localizadas. Rescates en playa y comunidades.' },
  { t: 'parrafo', text: 'Convenio con Secretaría de Marina. Cámaras corporales a todo el personal operativo.' },
  { t: 'cambio',  num: 21, tema: 'OPERATIVOS Y CULTURA VIAL  —  65 · 743 · 4,300', cue: '"743 operativos" / "4,300 estudiantes"' },
  { t: 'parrafo', text: '65 medidas de protección a mujeres. 743 operativos interinstitucionales.' },
  { t: 'parrafo', text: 'Saldo blanco en Semana Santa. Tránsito capacitó a 4,300 estudiantes en cultura vial.' },

  { t: 'bloque',  text: 'BLOQUE 6 — TUXPAN COMPITE, DEPORTE' },
  { t: 'cambio',  num: 22, tema: 'Portada — TUXPAN COMPITE' },
  { t: 'parrafo', text: 'El deporte no es un lujo. Es una herramienta de transformación.' },
  { t: 'parrafo', text: 'Recuperamos la Unidad Deportiva Enrique Valdéz Constantino en cuestión de días.' },
  { t: 'parrafo', text: '375 atletas en 15 disciplinas. Olimpiada CONADE 2026.' },
  { t: 'cambio',  num: 23, tema: 'DEPORTE COMPETITIVO  —  375 · 15 · 44 medallas', cue: '"Entra Infografía 6."' },
  { t: 'parrafo', text: '44 medallas de oro: ¡Récord histórico en Veracruz!' },
  { t: 'parrafo', text: 'Mayte García (MVP en Panamá). Said Aguilar (New York Yankees). Diego Jacobo (Mundial Juvenil Canadá).' },
  { t: 'parrafo', text: '⚡ "Entra Video 6." → mantener Slide 23 mientras dura el video.' },

  { t: 'bloque',  text: 'BLOQUE 7 — TUXPAN AL MUNDO  ⚠ sin discurso' },
  { t: 'manual',  num: 24, tema: 'Portada — TUXPAN AL MUNDO' },
  { t: 'manual',  num: 25, tema: 'SECTOR TURÍSTICO  —  60+ · 5 · 12' },
  { t: 'manual',  num: 26, tema: 'PROMOCIÓN TURÍSTICA  —  80 · 1' },
  { t: 'manual',  num: 27, tema: 'OCUPACIÓN HOTELERA  —  98% · 2,573' },

  { t: 'bloque',  text: 'BLOQUE 8 — GOBIERNO CERCANO, INCLUYENTE' },
  { t: 'cambio',  num: 28, tema: 'Portada — GOBIERNO CERCANO' },
  { t: 'parrafo', text: 'No venimos a hacer por la gente. Venimos a hacer con la gente.' },
  { t: 'parrafo', text: 'Creamos la Dirección de Bienestar para las Comunidades — a solo cien días, ya está en el territorio.' },
  { t: 'cambio',  num: 29, tema: 'PARTICIPACIÓN CIUDADANA  —  45 · 60 · 1,200 · 44 · 6 · 1,675', cue: '"45 jornadas" / "60 Jefes de Manzana"' },
  { t: 'parrafo', text: '45 jornadas comunitarias. 60 Jefes de Manzana y Gestores Vecinales.' },
  { t: 'parrafo', text: 'Primera Consulta Pública Indígena: 1,200 personas de 44 comunidades.' },
  { t: 'parrafo', text: '6 foros de consulta ciudadana. Ventanilla Única: 1,675 solicitudes procesadas, 88% ya atendidas.' },

  { t: 'bloque',  text: 'BLOQUE 9 — OBRA PÚBLICA E INFRAESTRUCTURA' },
  { t: 'cambio',  num: 30, tema: 'Portada — OBRA PÚBLICA' },
  { t: 'parrafo', text: 'Al llegar: 1,200 baches, 400 fugas, 66% del drenaje colapsado, 15 de 16 cárcamos sin funcionar.' },
  { t: 'parrafo', text: 'No vinimos a culpar al pasado. Vinimos a actuar.' },
  { t: 'cambio',  num: 31, tema: 'AGUA Y SANEAMIENTO  —  59 · 27 · 125', cue: '"59 fugas" / "27 colonias"' },
  { t: 'parrafo', text: '59 fugas de agua atendidas en 27 colonias. 125 trabajos de desazolve.' },
  { t: 'cambio',  num: 32, tema: 'DRENAJE Y BACHEO  —  19,000 M · 141', cue: '"19,000 metros" / "141 acciones"' },
  { t: 'parrafo', text: 'Con apoyo de Marina y SEDENA: 19,000 m de tubería de drenaje. 141 acciones de bacheo.' },
  { t: 'cambio',  num: 33, tema: 'OBRAS E INVERSIÓN  —  30 · 12,000 m² · $1.2 MDP', cue: '"30 presas" / "$1,200,000"' },
  { t: 'parrafo', text: '30 presas con excavadora de SEDARPA. 12,000 m² de pintura (Fundación Corazón Urbano). $1.2 MDP en donaciones KIMEX.' },

  { t: 'bloque',  text: 'BLOQUE 10 — EMBELLECIMIENTO Y ORDEN URBANO' },
  { t: 'cambio',  num: 34, tema: 'Portada — EMBELLECIMIENTO' },
  { t: 'parrafo', text: 'Una ciudad que se ve bien, se vive mejor.' },
  { t: 'parrafo', text: 'Semana Santa: reubicamos vendedores, regularizamos el Mercado Ambulante, coordinamos el FaroFest 2026.' },
  { t: 'cambio',  num: 35, tema: 'ORDEN URBANO  —  14 KM · +70,630 ML · 1 · 18', cue: '"18 carpas" / "70,630 metros"' },
  { t: 'parrafo', text: '18 carpas exclusivas. Nuevo Mercado Ambulante inaugurado.' },
  { t: 'parrafo', text: '+70,630 metros lineales balizados en Av. Juárez y Boulevard.' },
  { t: 'parrafo', text: 'Letras monumentales de Tuxpan. Fuente del Parque Reforma rehabilitada.' },
];

// ── Construir filas HTML ──────────────────────────────────────────────
function buildRows() {
  let html = '';
  for (const row of guion) {

    if (row.t === 'bloque') {
      html += `<tr><td colspan="2" class="row-bloque">${row.text}</td></tr>`;

    } else if (row.t === 'cambio') {
      const cueHtml = row.cue
        ? `<span class="cue-badge">${row.cue}</span>`
        : `<span class="cue-inicio">Al iniciar el bloque</span>`;
      html += `
        <tr class="row-cambio">
          <td class="num-cambio">▶ ${row.num}</td>
          <td class="tema-cambio">${row.tema} &nbsp; ${cueHtml}</td>
        </tr>`;

    } else if (row.t === 'parrafo') {
      html += `
        <tr class="row-parrafo">
          <td class="num-cont"></td>
          <td class="texto-parrafo">${row.text}</td>
        </tr>`;

    } else if (row.t === 'manual') {
      html += `
        <tr class="row-manual">
          <td class="num-manual">⚠ ${row.num}</td>
          <td class="tema-manual">${row.tema}</td>
        </tr>`;
    }
  }
  return html;
}

// ── HTML ──────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    font-size: 9.5pt;
    color: #1a1a1a;
    background: #fff;
    padding: 13mm 13mm 11mm;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 3px solid ${BURGUNDY};
  }
  .h-title { font-size: 14pt; font-weight: 800; color: ${BURGUNDY}; text-transform: uppercase; }
  .h-sub   { font-size: 7.5pt; color: #999; text-align: right; line-height: 1.7; }

  /* ── Leyenda ── */
  .legend {
    display: flex; gap: 20px; margin-bottom: 10px;
    font-size: 7.5pt; color: #555; align-items: center; flex-wrap: wrap;
  }
  .leg { display: flex; align-items: center; gap: 5px; }
  .swatch { width: 12px; height: 12px; border-radius: 2px; }

  /* ── Tabla ── */
  table { width: 100%; border-collapse: collapse; }

  /* Cabecera de bloque */
  .row-bloque td {
    background: #3A0D18;
    color: #fff;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    padding: 4px 10px;
  }

  /* Fila de cambio de slide */
  .row-cambio { background: ${BURGUNDY}; }
  .num-cambio {
    width: 52px; padding: 6px 8px;
    color: ${GOLD}; font-weight: 800; font-size: 11pt;
    text-align: center; vertical-align: middle;
    white-space: nowrap;
  }
  .tema-cambio {
    padding: 6px 10px;
    color: #fff; font-weight: 700; font-size: 9pt;
    vertical-align: middle;
    line-height: 1.4;
  }
  .cue-badge {
    display: inline-block;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 3px;
    padding: 1px 7px;
    font-size: 8pt;
    font-weight: 400;
    font-style: italic;
    color: rgba(255,255,255,0.88);
    margin-left: 6px;
  }
  .cue-inicio {
    font-size: 8pt; font-weight: 400;
    color: rgba(255,255,255,0.6);
    font-style: italic;
    margin-left: 6px;
  }

  /* Párrafos del discurso */
  .row-parrafo { }
  .row-parrafo:nth-child(even) td { background: #fafafa; }
  .num-cont {
    width: 52px;
    border-right: 2px solid #EAD5B0;
    background: #FAF5EE;
  }
  .texto-parrafo {
    padding: 5px 10px;
    color: #333;
    font-size: 9pt;
    line-height: 1.45;
    border-bottom: 1px solid #f0f0f0;
  }

  /* Manual / sin discurso */
  .row-manual { background: #FFF8E1; }
  .num-manual {
    width: 52px; padding: 5px 6px;
    color: #9A6200; font-weight: 700; font-size: 9pt;
    text-align: center; vertical-align: middle;
    white-space: nowrap;
  }
  .tema-manual {
    padding: 5px 10px;
    color: #9A6200; font-size: 9pt;
    font-style: italic;
    border-bottom: 1px solid #f0e0a0;
  }

  .footnote { margin-top: 9px; font-size: 7pt; color: #bbb; text-align: center; }

  @page { size: A4 portrait; margin: 0; }
</style>
</head>
<body>

<div class="header">
  <div class="h-title">Guion de Operación — 100 Días de Acción</div>
  <div class="h-sub">H. Ayuntamiento de Tuxpan, Veracruz 2026–2029 · 35 slides · 17 abr 2026</div>
</div>

<div class="legend">
  <strong>LEYENDA:</strong>
  <div class="leg"><div class="swatch" style="background:${BURGUNDY}"></div> <strong>▶ N</strong> = hacer clic aquí y avanzar a ese slide</div>
  <div class="leg"><div class="swatch" style="background:#FAF5EE; border:1px solid #EAD5B0"></div> Párrafo del discurso — mantener slide actual</div>
  <div class="leg"><div class="swatch" style="background:#FFF8E1; border:1px solid #e0c060"></div> ⚠ Bloque 7 sin discurso — avance libre</div>
  <div class="leg">Las frases entre comillas = cue exacto para hacer clic</div>
</div>

<table>
  <tbody>
    ${buildRows()}
  </tbody>
</table>

<div class="footnote">
  Lee de arriba a abajo siguiendo el discurso. Cada vez que aparezca una fila oscura ▶ N, haz clic para avanzar al número de slide indicado.
</div>

</body>
</html>`;

// ── Generar PDF ───────────────────────────────────────────────────────
const tmpPath = path.join(__dirname, '_tabla_tmp.html');
fs.writeFileSync(tmpPath, html, 'utf8');

const browser = await puppeteer.launch({ headless: 'new' });
const page    = await browser.newPage();
await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});
await browser.close();
fs.unlinkSync(tmpPath);

console.log(`PDF generado: ${OUT}`);
