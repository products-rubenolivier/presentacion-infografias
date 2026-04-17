# -*- coding: utf-8 -*-
import re

B5 = """
<!-- PORTADA BLOQUE 5 — SEGURIDAD Y CONFIANZA -->
<div class="slide s-block">
  <div class="block-eyebrow">BLOQUE 05</div>
  <div class="block-rule"></div>
  <div class="block-title fade-up">SEGURIDAD<br>Y CONFIANZA</div>
</div>


<!-- B5 · SLIDE 1 — PREVENCIÓN ESCOLAR -->
<div class="slide s-content">
  <span class="badge">100 DÍAS</span>
  <div class="topic fade-up">PREVENCIÓN ESCOLAR</div>
  <div class="data-row stats-3">
    <div class="stat fade-up" style="transition-delay:.10s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="35">0</div>
        <div class="stat-lbl">Planteles<br>Educativos.</div>
      </div>
    </div>
    <div class="stat fade-up" style="transition-delay:.20s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="2431">0</div>
        <div class="stat-lbl">Estudiantes<br>Alcanzados.</div>
      </div>
    </div>
    <div class="stat fade-up" style="transition-delay:.30s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="14">0</div>
        <div class="stat-lbl">Colonias<br>Beneficiadas.</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-title">Seguridad que empieza en las escuelas y las colonias.</div>
    <div class="footer-inst">H. Ayuntamiento de Tuxpan, Veracruz 2026\u20132029</div>
  </div>
</div>


<!-- B5 · SLIDE 2 — PATRULLAJE Y RESPUESTA -->
<div class="slide s-content">
  <span class="badge">100 DÍAS</span>
  <div class="topic fade-up">PATRULLAJE Y RESPUESTA</div>
  <div class="data-row stats-3">
    <div class="stat fade-up" style="transition-delay:.10s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="11">0</div>
        <div class="stat-lbl">Patrullas<br>Activas.</div>
      </div>
    </div>
    <div class="stat fade-up" style="transition-delay:.20s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="214">0</div>
        <div class="stat-lbl">Detenciones<br>Realizadas.</div>
      </div>
    </div>
    <div class="stat fade-up" style="transition-delay:.30s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="1694">0</div>
        <div class="stat-lbl">Reportes de Auxilio<br>Atendidos.</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-title">Presencia policial activa y respuesta inmediata al ciudadano.</div>
    <div class="footer-inst">H. Ayuntamiento de Tuxpan, Veracruz 2026\u20132029</div>
  </div>
</div>


<!-- B5 · SLIDE 3 — OPERATIVOS Y CULTURA VIAL -->
<div class="slide s-content">
  <span class="badge">100 DÍAS</span>
  <div class="topic fade-up">OPERATIVOS Y CULTURA VIAL</div>
  <div class="data-row stats-3">
    <div class="stat fade-up" style="transition-delay:.10s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="65">0</div>
        <div class="stat-lbl">Auxilios por<br>Violencia Familiar.</div>
      </div>
    </div>
    <div class="stat fade-up" style="transition-delay:.20s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="743">0</div>
        <div class="stat-lbl">Operativos<br>Realizados.</div>
      </div>
    </div>
    <div class="stat fade-up" style="transition-delay:.30s">
      <div class="stat-vbar"></div>
      <div class="stat-inner">
        <div class="stat-num" data-target="4300">0</div>
        <div class="stat-lbl">Estudiantes Capacitados<br>en Cultura Vial.</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-title">Orden, prevención y cultura vial para una Tuxpan más segura.</div>
    <div class="footer-inst">H. Ayuntamiento de Tuxpan, Veracruz 2026\u20132029</div>
  </div>
</div>
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

BEFORE_B6 = '<!-- PORTADA BLOQUE 6 — TUXPAN COMPITE, DEPORTE -->'
content = content.replace(BEFORE_B6, B5.strip() + '\n\n\n' + BEFORE_B6)

# Update TOTAL and track width
total = content.count('class="slide ')
content = re.sub(r'const TOTAL\s+=\s+\d+;', f'const TOTAL   = {total};', content)
content = re.sub(r'width: calc\(1920px \* \d+\);', f'width: calc(1920px * {total});', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Total slides: {total}')
print(f'B5 inserted: {"BLOQUE 05" in content}')
