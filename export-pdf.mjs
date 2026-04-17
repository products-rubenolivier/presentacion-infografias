import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOTAL_SLIDES = 8;
const WIDTH  = 1920;
const HEIGHT = 1080;
const URL    = 'http://localhost:3100';

console.log('Iniciando exportación PDF...');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

console.log(`Abriendo ${URL}...`);
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

// Esperar a que las fuentes carguen
await new Promise(r => setTimeout(r, 2000));

const pdfPages = [];

for (let i = 0; i < TOTAL_SLIDES; i++) {
  // Navegar al slide i (manipular JS directamente)
  await page.evaluate((slideIndex) => {
    const track  = document.getElementById('track');
    const slides = document.querySelectorAll('.slide');
    const scaler = document.getElementById('scaler');

    // Forzar escala 1:1 sin transformaciones de viewport
    scaler.style.transform = 'none';

    // Ir al slide indicado sin animación
    track.style.transition = 'none';
    track.style.transform  = `translateX(${-1920 * slideIndex}px)`;

    // Activar el slide (añadir clase active y disparar animaciones)
    slides.forEach((s, idx) => {
      s.classList.remove('active');
      if (idx === slideIndex) s.classList.add('active');
    });

    // Asegurarse de que los stat-nums muestren el valor final
    document.querySelectorAll('[data-target]').forEach(el => {
      el.textContent = Number(el.dataset.target).toLocaleString('es-MX');
    });

    // Activar animaciones de barras y gráficas
    document.querySelectorAll('.vbar-anim, .hbar-anim').forEach(el => {
      el.style.transform = 'scaleY(1)';
      el.style.transformOrigin = 'bottom';
    });
    document.querySelectorAll('.pie-seg').forEach(el => {
      el.style.strokeDashoffset = '0';
    });
    document.querySelectorAll('.line-path').forEach(el => {
      el.style.strokeDashoffset = '0';
    });
    document.querySelectorAll('.fade-up').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.line-dot').forEach(el => {
      el.style.opacity = '1';
    });
  }, i);

  await new Promise(r => setTimeout(r, 600));

  const screenshot = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });

  pdfPages.push(screenshot);
  console.log(`  ✓ Slide ${i + 1}/${TOTAL_SLIDES} capturado`);
}

await browser.close();

// Generar PDF usando jsPDF-like approach con html via puppeteer PDF
// En lugar de combinar imágenes manualmente, abrimos una página HTML con todas las imágenes
const browser2 = await puppeteer.launch({ headless: true });
const pdfPage  = await browser2.newPage();

// Convertir screenshots a base64
const base64Images = pdfPages.map(buf => `data:image/png;base64,${buf.toString('base64')}`);

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; }
  .page {
    width: 1920px;
    height: 1080px;
    page-break-after: always;
    overflow: hidden;
  }
  .page:last-child { page-break-after: avoid; }
  img { width: 1920px; height: 1080px; display: block; }
</style>
</head>
<body>
${base64Images.map(src => `<div class="page"><img src="${src}"/></div>`).join('\n')}
</body>
</html>`;

await pdfPage.setContent(html, { waitUntil: 'networkidle0' });

const outputPath = join(__dirname, '100-Dias-Tuxpan.pdf');
await pdfPage.pdf({
  path: outputPath,
  width:  '1920px',
  height: '1080px',
  printBackground: true,
  pageRanges: '',
});

await browser2.close();

console.log(`\n✅ PDF generado: ${outputPath}`);
