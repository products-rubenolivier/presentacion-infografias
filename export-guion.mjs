// export-guion.mjs — Genera GUION-SINCRONIZADO.pdf desde el .txt
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TXT = path.join(__dirname, 'GUION-SINCRONIZADO.txt');
const OUT = path.join(__dirname, 'GUION-SINCRONIZADO.pdf');

// ── Colores del sistema ──────────────────────────────────────────────
const BURGUNDY = '#6B1D2B';
const GOLD     = '#C8A84B';
const LIGHT    = '#F9F4EF';
const GRAY     = '#6B6B6B';

// ── Leer texto fuente ────────────────────────────────────────────────
const raw = fs.readFileSync(TXT, 'utf8');
const lines = raw.split('\n');

// ── Parsear en secciones ─────────────────────────────────────────────
// Identificar bloques: líneas de cabecera ━━ y contenido
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Mapa de slides (líneas 10-47 del txt) ────────────────────────────
const mapaLines = [];
for (const line of lines) {
  if (/^\s+\d{2}\s+B\d/.test(line)) mapaLines.push(line.trim());
}

// ── Secciones del guion (PARTE 1) ────────────────────────────────────
// Dividir en bloques por separador ━━━
const sections = [];
let currentSection = null;

for (const line of lines) {
  // Detectar título de bloque (línea ━━━ seguida de BLOQUE N)
  if (/^━{10,}/.test(line)) {
    if (currentSection) sections.push(currentSection);
    currentSection = { title: '', subtitle: '', lines: [] };
    continue;
  }
  if (currentSection && !currentSection.title && line.startsWith('BLOQUE ')) {
    currentSection.title = line;
    continue;
  }
  if (currentSection && currentSection.title && !currentSection.subtitle && line.trim().startsWith('"')) {
    currentSection.subtitle = line.trim();
    continue;
  }
  if (currentSection && /^[╔╚║]/.test(line)) {
    // Inicio PARTE 2 — detener
    if (currentSection) sections.push(currentSection);
    currentSection = null;
    break;
  }
  if (currentSection) {
    currentSection.lines.push(line);
  }
}

// ── Tabla resumen (PARTE 2) ───────────────────────────────────────────
const tableRows = [];
for (const line of lines) {
  const m = line.match(/^\s+(\d+)\s+│(.+?)│(.+?)│(.+?)│(.+)$/);
  if (m) {
    tableRows.push({
      num: m[1].trim(),
      desc: m[2].trim(),
      frag: m[3].trim(),
      momento: m[4].trim(),
      obs: m[5].trim(),
    });
  }
}

// ── Notas finales ─────────────────────────────────────────────────────
const notasStart = lines.findIndex(l => l.includes('NOTAS FINALES DE OPERACIÓN'));
const notasEnd   = lines.findIndex((l, i) => i > notasStart && /^═{10,}/.test(l) && i > notasStart + 2);
const notasLines = (notasStart > -1 && notasEnd > -1)
  ? lines.slice(notasStart + 1, notasEnd).filter(l => !l.startsWith('═'))
  : [];

// ── Renderizar una sección del guion a HTML ───────────────────────────
function renderSectionLines(slines) {
  const out = [];
  for (const line of slines) {
    const trimmed = line.trim();
    if (!trimmed) { out.push('<div class="spacer"></div>'); continue; }

    // Marcador CAMBIAR
    if (/^►/.test(trimmed)) {
      const text = escapeHtml(trimmed.replace(/^►\s*/, ''));
      out.push(`<div class="cue-cambiar"><span class="cue-icon">▶</span> ${text}</div>`);
      continue;
    }
    // Sub-instrucción del cue (entre paréntesis o "Cue exacto")
    if (/^\(/.test(trimmed) || /^Cue exacto/.test(trimmed)) {
      out.push(`<div class="cue-sub">${escapeHtml(trimmed)}</div>`);
      continue;
    }
    // Marcador MANTENER
    if (/^·/.test(trimmed)) {
      out.push(`<div class="cue-mantener">${escapeHtml(trimmed)}</div>`);
      continue;
    }
    // Marcador SIN SLIDE
    if (/^⚠/.test(trimmed)) {
      out.push(`<div class="cue-warning">${escapeHtml(trimmed)}</div>`);
      continue;
    }
    // Línea de fin de bloque o nota entre []
    if (/^\[FIN/.test(trimmed) || /^\[Referencia/.test(trimmed) || /^\[Cue del/.test(trimmed)) {
      out.push(`<div class="note">${escapeHtml(trimmed)}</div>`);
      continue;
    }
    // Texto normal del discurso
    out.push(`<p>${escapeHtml(trimmed)}</p>`);
  }
  return out.join('\n');
}

// ── Mapa HTML ─────────────────────────────────────────────────────────
function renderMapa() {
  // Agrupar por bloque
  const bloques = {};
  for (const line of mapaLines) {
    const m = line.match(/^(\d{2})\s+(B\d{2})/);
    if (m) {
      const bnum = m[2].substring(0,3);
      if (!bloques[bnum]) bloques[bnum] = [];
      bloques[bnum].push(line);
    }
  }
  let html = '<div class="mapa-grid">';
  for (const [bnum, rows] of Object.entries(bloques)) {
    html += `<div class="mapa-bloque">`;
    for (const row of rows) {
      const isPortada = /B\d{2} · Portada/.test(row) || /B\d{2} · Portada/.test(row);
      const numMatch = row.match(/^(\d{2})/);
      const num = numMatch ? numMatch[1] : '';
      const rest = row.replace(/^\d{2}\s+/, '');
      if (rest.includes('Portada') || !rest.includes('·')) {
        html += `<div class="mapa-row portada"><span class="mapa-num">${num}</span><span class="mapa-desc">${escapeHtml(rest)}</span></div>`;
      } else {
        html += `<div class="mapa-row data"><span class="mapa-num">${num}</span><span class="mapa-desc">${escapeHtml(rest)}</span></div>`;
      }
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ── Secciones del guion HTML ──────────────────────────────────────────
function renderGuionSections() {
  let html = '';
  for (const sec of sections) {
    if (!sec.title) continue;
    const isB7 = sec.title.includes('BLOQUE 7');
    html += `
      <div class="bloque-section${isB7 ? ' b7-warning' : ''}">
        <div class="bloque-header">
          <div class="bloque-title">${escapeHtml(sec.title)}</div>
          ${sec.subtitle ? `<div class="bloque-subtitle">${escapeHtml(sec.subtitle)}</div>` : ''}
        </div>
        <div class="bloque-body">
          ${renderSectionLines(sec.lines)}
        </div>
      </div>
    `;
  }
  return html;
}

// ── Tabla HTML ────────────────────────────────────────────────────────
function renderTabla() {
  let html = `
    <table class="tabla-resumen">
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-desc">Slide / Descripción</th>
          <th class="col-frag">Fragmento del discurso</th>
          <th class="col-momento">Momento exacto del cambio</th>
          <th class="col-obs">Observaciones</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (const row of tableRows) {
    const isPortada = row.desc.includes('Portada') || row.desc.startsWith('B0') && !row.desc.includes('S1') && !row.desc.includes('S2') && !row.desc.includes('S3') && !row.desc.includes('S4') && !row.desc.includes('S5');
    const isB7 = row.obs.includes('⚠');
    const rowClass = isPortada ? 'row-portada' : (isB7 ? 'row-warning' : '');
    html += `
      <tr class="${rowClass}">
        <td class="col-num">${escapeHtml(row.num)}</td>
        <td class="col-desc">${escapeHtml(row.desc)}</td>
        <td class="col-frag">${escapeHtml(row.frag)}</td>
        <td class="col-momento">${escapeHtml(row.momento)}</td>
        <td class="col-obs">${escapeHtml(row.obs)}</td>
      </tr>
    `;
  }
  html += '</tbody></table>';
  return html;
}

// ── HTML completo ─────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.55;
  }

  /* ── PORTADA ── */
  .cover {
    width: 100%;
    min-height: 297mm;
    background: ${BURGUNDY};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover-eyebrow {
    font-size: 9pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${GOLD};
    margin-bottom: 20px;
  }
  .cover-title {
    font-size: 36pt;
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
    margin-bottom: 16px;
  }
  .cover-subtitle {
    font-size: 14pt;
    color: rgba(255,255,255,0.75);
    margin-bottom: 40px;
    font-weight: 400;
  }
  .cover-rule {
    width: 60px;
    height: 3px;
    background: ${GOLD};
    margin: 0 auto 40px;
  }
  .cover-meta {
    font-size: 9pt;
    color: rgba(255,255,255,0.55);
    line-height: 1.8;
  }

  /* ── LEYENDA ── */
  .leyenda-box {
    background: ${LIGHT};
    border-left: 4px solid ${BURGUNDY};
    padding: 18px 22px;
    margin: 28px 0;
    border-radius: 4px;
  }
  .leyenda-title {
    font-size: 9pt;
    font-weight: 700;
    color: ${BURGUNDY};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
  .leyenda-items { display: flex; flex-direction: column; gap: 6px; }
  .leyenda-item { display: flex; align-items: flex-start; gap: 10px; font-size: 9pt; }
  .leyenda-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 8pt;
    font-weight: 600;
    white-space: nowrap;
    min-width: 90px;
    justify-content: center;
  }
  .badge-cambiar  { background: ${BURGUNDY}; color: #fff; }
  .badge-mantener { background: #E8E8E8; color: #555; }
  .badge-warning  { background: #F5A623; color: #fff; }
  .leyenda-desc { color: #555; }

  /* ── MAPA DE SLIDES ── */
  .section-title {
    font-size: 14pt;
    font-weight: 700;
    color: ${BURGUNDY};
    margin: 36px 0 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid ${GOLD};
  }
  .section-sub {
    font-size: 9pt;
    color: ${GRAY};
    margin-bottom: 18px;
  }
  .mapa-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }
  .mapa-bloque { background: ${LIGHT}; border-radius: 4px; overflow: hidden; }
  .mapa-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 12px;
    font-size: 8.5pt;
  }
  .mapa-row.portada {
    background: ${BURGUNDY};
    color: #fff;
    font-weight: 600;
  }
  .mapa-row.data { border-bottom: 1px solid #E8E0D5; }
  .mapa-num {
    font-size: 10pt;
    font-weight: 700;
    min-width: 24px;
    text-align: right;
  }
  .mapa-row.portada .mapa-num { color: ${GOLD}; }
  .mapa-row.data    .mapa-num { color: ${BURGUNDY}; }

  /* ── GUION ANOTADO ── */
  .parte-break { page-break-before: always; }

  .bloque-section {
    margin-bottom: 36px;
    page-break-inside: avoid;
  }
  .bloque-header {
    background: ${BURGUNDY};
    color: #fff;
    padding: 10px 16px;
    border-radius: 4px 4px 0 0;
    margin-bottom: 0;
  }
  .bloque-title {
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .bloque-subtitle {
    font-size: 8.5pt;
    color: rgba(255,255,255,0.7);
    margin-top: 2px;
    font-style: italic;
  }
  .b7-warning .bloque-header {
    background: #9A6200;
  }
  .bloque-body {
    border: 1px solid #DDD;
    border-top: none;
    border-radius: 0 0 4px 4px;
    padding: 14px 18px;
    background: #fff;
  }

  .bloque-body p {
    font-size: 9.5pt;
    color: #333;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .bloque-body .spacer { height: 6px; }

  /* Marcador CAMBIAR — destacado */
  .cue-cambiar {
    background: ${BURGUNDY};
    color: #fff;
    border-radius: 4px;
    padding: 7px 12px;
    font-size: 9pt;
    font-weight: 600;
    margin: 12px 0 2px;
    display: flex;
    align-items: center;
    gap: 8px;
    page-break-inside: avoid;
  }
  .cue-icon { color: ${GOLD}; font-size: 10pt; }
  .cue-sub {
    font-size: 8pt;
    color: ${GRAY};
    font-style: italic;
    margin: 0 0 8px 28px;
    padding: 2px 0;
  }

  /* Marcador MANTENER — sutil */
  .cue-mantener {
    background: #F0F0F0;
    color: #666;
    border-radius: 3px;
    padding: 5px 10px;
    font-size: 8.5pt;
    font-style: italic;
    margin: 8px 0;
    border-left: 3px solid #CCC;
  }

  /* Marcador SIN SLIDE */
  .cue-warning {
    background: #FFF3CD;
    color: #856404;
    border-radius: 3px;
    padding: 6px 10px;
    font-size: 9pt;
    font-weight: 600;
    margin: 8px 0;
    border-left: 3px solid #F5A623;
  }

  /* Notas entre corchetes */
  .note {
    font-size: 8pt;
    color: ${GRAY};
    font-style: italic;
    padding: 4px 0 4px 10px;
    border-left: 2px solid ${GOLD};
    margin: 6px 0;
  }

  /* ── TABLA RESUMEN ── */
  .tabla-resumen {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin-top: 12px;
  }
  .tabla-resumen thead tr {
    background: ${BURGUNDY};
    color: #fff;
  }
  .tabla-resumen th {
    padding: 7px 8px;
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .tabla-resumen td {
    padding: 5px 8px;
    border-bottom: 1px solid #E8E0D5;
    vertical-align: top;
    line-height: 1.45;
  }
  .tabla-resumen tr.row-portada td {
    background: #F2EAE0;
    font-weight: 600;
    color: ${BURGUNDY};
  }
  .tabla-resumen tr.row-warning td {
    background: #FFF8EC;
    color: #7A5200;
  }
  .tabla-resumen tbody tr:hover td { background: #FAF5EF; }
  .col-num     { width: 28px; text-align: center; }
  .col-desc    { width: 19%; }
  .col-frag    { width: 25%; }
  .col-momento { width: 22%; }
  .col-obs     { width: 18%; }

  /* ── NOTAS FINALES ── */
  .notas-box {
    margin-top: 36px;
    background: ${LIGHT};
    border: 1px solid #D4C6B0;
    border-radius: 4px;
    padding: 18px 22px;
  }
  .notas-box .nota-item {
    font-size: 9pt;
    margin-bottom: 10px;
    padding-left: 20px;
    position: relative;
    color: #333;
  }
  .notas-box .nota-item::before {
    content: attr(data-n);
    position: absolute;
    left: 0;
    font-weight: 700;
    color: ${BURGUNDY};
  }

  /* ── HEADER / FOOTER ── */
  @page {
    margin: 15mm 15mm 18mm 15mm;
    size: A4;
  }
  .page-header {
    font-size: 7.5pt;
    color: #AAA;
    border-bottom: 1px solid #E0E0E0;
    padding-bottom: 6px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
  }
  .page-wrap {
    padding: 0 8px;
  }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <div class="cover-eyebrow">H. Ayuntamiento de Tuxpan, Veracruz &nbsp;·&nbsp; 2026–2029</div>
  <div class="cover-title">GUION SINCRONIZADO<br>100 DÍAS DE ACCIÓN</div>
  <div class="cover-rule"></div>
  <div class="cover-subtitle">Guía completa de operación de la presentación</div>
  <div class="cover-meta">
    35 slides activos &nbsp;·&nbsp; 10 bloques &nbsp;·&nbsp; Operación manual<br>
    Fuente: carpeta BLOQUES (9 PDFs) + sitio web<br>
    17 de abril de 2026
  </div>
</div>

<!-- CONTENIDO -->
<div class="page-wrap">

  <!-- Header interior -->
  <div class="page-header">
    <span>GUION SINCRONIZADO — 100 DÍAS DE ACCIÓN</span>
    <span>H. Ayuntamiento de Tuxpan, Veracruz 2026–2029</span>
  </div>

  <!-- LEYENDA -->
  <div class="leyenda-box">
    <div class="leyenda-title">Cómo leer este documento</div>
    <div class="leyenda-items">
      <div class="leyenda-item">
        <span class="leyenda-badge badge-cambiar">▶ CAMBIAR</span>
        <span class="leyenda-desc"><strong>Hacer clic aquí.</strong> Avanzar al siguiente slide en el momento indicado. El número de slide y su nombre aparecen dentro del marcador.</span>
      </div>
      <div class="leyenda-item">
        <span class="leyenda-badge badge-mantener">· MANTENER</span>
        <span class="leyenda-desc"><strong>No hacer nada.</strong> El orador continúa en el mismo slide. Esperar al siguiente marcador de cambio.</span>
      </div>
      <div class="leyenda-item">
        <span class="leyenda-badge badge-warning">⚠ SIN SLIDE</span>
        <span class="leyenda-desc"><strong>Avance libre.</strong> No hay discurso asignado. El operador avanza manualmente según el conductor del evento.</span>
      </div>
    </div>
  </div>

  <!-- MAPA DE SLIDES -->
  <div class="section-title">Mapa de Slides — Referencia Rápida</div>
  <div class="section-sub">Los 35 slides de la presentación, agrupados por bloque. Número en dorado = portada de bloque.</div>
  ${renderMapa()}

  <!-- PARTE 1: GUION ANOTADO -->
  <div class="section-title parte-break">Parte 1 — Guion Anotado</div>
  <div class="section-sub">Texto completo del discurso con marcadores de avance exactos para el operador.</div>
  ${renderGuionSections()}

  <!-- PARTE 2: TABLA RESUMEN -->
  <div class="section-title parte-break">Parte 2 — Tabla Resumen de Cambios</div>
  <div class="section-sub">Los 35 slides en orden: fragmento clave del discurso, momento exacto del cambio y observaciones para el operador.</div>
  ${renderTabla()}

  <!-- NOTAS FINALES -->
  <div class="notas-box">
    <div class="leyenda-title" style="margin-bottom:12px">Notas Finales de Operación</div>
    <div class="nota-item" data-n="1.">Bloque 7 no tiene discurso en PDF. Los slides 24–27 se presentan visualmente. El conductor del evento decide el ritmo de avance.</div>
    <div class="nota-item" data-n="2.">Bloque 5 (Seguridad) tiene una introducción larga (~6 párrafos) antes de la primera cifra. Mantener portada B05 (Slide 18) durante toda esa sección.</div>
    <div class="nota-item" data-n="3.">Videos externos: "Entra Video 4" y "Entra Video 6" son reproducciones fuera del sitio web. Mantener Slides 17 y 23 respectivamente mientras dura cada video.</div>
    <div class="nota-item" data-n="4.">Total de cambios manuales: 35. De éstos, 5 tienen cue explícito en el discurso ("Entra Infografía X") y 4 son avance libre (Bloque 7, sin narración).</div>
  </div>

</div>

</body>
</html>`;

// ── Generar PDF ───────────────────────────────────────────────────────
const tmpPath = path.join(__dirname, '_guion_tmp.html');
fs.writeFileSync(tmpPath, html, 'utf8');

const browser = await puppeteer.launch({ headless: 'new' });
const page    = await browser.newPage();
await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', right: '15mm', bottom: '18mm', left: '15mm' },
});
await browser.close();
fs.unlinkSync(tmpPath);

console.log(`PDF generado: ${OUT}`);
