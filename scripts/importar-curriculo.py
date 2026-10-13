#!/usr/bin/env python
"""
Importa las "Progresiones de Aprendizaje" del Ministerio de Córdoba (versión en consulta 2025) a la base local.

Qué hace:
  1. Lee el texto del PDF (extraído con `pdftotext -enc UTF-8`, SIN -layout).
  2. Recorre solo las páginas de Educación Primaria y arma: Meta del ciclo -> Aprendizaje y contenido (por grado) -> Indicadores de logro.
  3. Con --cargar escribe en la base (versión "Córdoba — Progresiones de Aprendizaje 2025 (versión en consulta, SIN VALIDAR)");
     sin --cargar solo muestra el resumen (modo prueba).

Es idempotente por materia: antes de cargar borra lo importado antes de ESA materia en ESA versión (no toca los contenidos de ejemplo).

Uso:
  python scripts/importar-curriculo.py <texto.txt> --area "Matemática" [--cargar]
"""
import argparse, json, re, subprocess, sys, uuid

VERSION_NOMBRE = 'Córdoba — Progresiones de Aprendizaje 2025 (versión en consulta, SIN VALIDAR)'
FUENTE = 'Progresiones de Aprendizaje 2025 (Ministerio de Educación de Córdoba, versión en consulta)'

RE_CICLO = re.compile(r'^Educación Primaria\s*·?\s*(\d)\.º y (\d)\.º grado$')
RE_GRADO = re.compile(r'^(\d)\.º grado$')
RUIDO = (
    re.compile(r'^DISEÑO CURRICULAR DE LA PROVINCIA DE CÓRDOBA$'),
    re.compile(r'^PdA\s*·'),
    re.compile(r'^\d{1,3}$'),
    re.compile(r'^Espacio curricular:'),
)


def limpiar(linea: str) -> str:
    return re.sub(r'\s+', ' ', linea.replace('­', '')).strip()


def parsear(texto: str):
    """Devuelve (metas, contenidos, avisos). Cada contenido: {anio, meta_idx, descripcion, indicadores[]}."""
    metas, contenidos, avisos = [], [], []
    ciclo = None            # (desde, hasta)
    meta_idx = None
    grado = None
    modo = None             # 'meta' | 'aprend' | 'indic'
    buffer = []
    actual = None

    def cerrar():
        nonlocal buffer, modo, actual
        if modo == 'meta' and buffer and ciclo:
            texto_meta = limpiar(' '.join(buffer))
            for i, m in enumerate(metas):
                if m['texto'] == texto_meta and m['ciclo'] == ciclo:
                    globals_set(i)
                    break
            else:
                metas.append({'ciclo': ciclo, 'texto': texto_meta, 'orden': len([m for m in metas if m['ciclo'] == ciclo]) + 1})
                globals_set(len(metas) - 1)
        elif modo == 'aprend' and buffer and ciclo and grado and meta_idx is not None:
            actual = {'anio': grado, 'meta_idx': meta_idx, 'descripcion': limpiar(' '.join(buffer)), 'indicadores': []}
            contenidos.append(actual)
        elif modo == 'indic' and actual is not None:
            actual['indicadores'] = [limpiar(x) for x in buffer if len(re.findall(r'[A-Za-zÁ-úÑñ]', x)) >= 3]   # descarta restos del PDF (puntos sueltos, números de página)
        buffer = []

    def globals_set(i):
        nonlocal meta_idx
        meta_idx = i

    for pagina in texto.split('\f'):
        lineas = [limpiar(l) for l in pagina.split('\n')]
        lineas = [l for l in lineas if l]
        if not lineas:
            continue
        m = next((x for x in (RE_CICLO.match(l) for l in lineas[:4]) if x), None)   # el encabezado de ciclo está entre las primeras líneas
        if not m:
            cerrar(); modo = None   # página de otro nivel (inicial, secundaria, introducción)
            continue
        nuevo_ciclo = (int(m.group(1)), int(m.group(2)))
        if nuevo_ciclo != ciclo:
            cerrar(); modo = None; ciclo = nuevo_ciclo; meta_idx = None; grado = None
            actual = None   # la leyenda de la página de introducción no debe pisar al último aprendizaje del ciclo anterior
        for l in lineas:
            if RE_CICLO.match(l) or any(r.match(l) for r in RUIDO):
                continue
            if l in ('Meta', 'Metas del ciclo'):
                cerrar(); modo = 'meta' if l == 'Meta' else None
                continue
            g = RE_GRADO.match(l)
            if g:
                cerrar(); modo = None; grado = int(g.group(1))
                continue
            for titulo, nuevo in (('Aprendizaje y contenido', 'aprend'), ('Indicadores de logro', 'indic')):
                if l == titulo or l.startswith(titulo + ' '):
                    cerrar(); modo = nuevo
                    resto = l[len(titulo):].strip()      # algunos PDFs traen el primer ítem en la misma línea del título
                    if resto:
                        buffer.append(resto)
                    break
            else:
                titulo = None
            if titulo:
                continue
            if modo:
                buffer.append(l)
    cerrar()
    return metas, contenidos, avisos


def q(s: str) -> str:
    """Literal SQL seguro con dollar-quoting."""
    tag = 'q'
    while f'${tag}$' in s:
        tag += 'x'
    return f'${tag}${s}${tag}$'


def sql(consulta: str, entrada: str | None = None) -> str:
    r = subprocess.run(['docker', 'exec', '-i', 'supabase_db_educacion', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq'] + (['-c', consulta] if entrada is None else []),
                       input=entrada, capture_output=True, text=True, encoding='utf8')
    if r.returncode != 0:
        sys.exit('Error en la base:\n' + r.stderr)
    return r.stdout.strip()


def cargar(area: str, metas, contenidos):
    ver = sql(f"select id from curriculo_versiones where nombre={q(VERSION_NOMBRE)}")
    if not ver:
        jur = sql("select jurisdiccion_id from curriculo_versiones order by created_at limit 1") or sql("select id from jurisdicciones limit 1")
        ver = sql(f"insert into curriculo_versiones (jurisdiccion_id, nombre, vigente) values ('{jur}', {q(VERSION_NOMBRE)}, false) returning id").splitlines()[0]
    area_id = sql(f"select id from areas where version_id='{ver}' and nombre={q(area)}")
    if not area_id:
        area_id = sql(f"insert into areas (version_id, nombre) values ('{ver}', {q(area)}) returning id").splitlines()[0]
    # idempotente: lo importado antes de esta materia se reemplaza (indicadores caen por cascada; misiones no se tocan porque solo apuntan a contenidos de ejemplo)
    en_uso = sql(f"select count(*) from curriculo_contenidos c where c.version_id='{ver}' and c.area_id='{area_id}' and (exists (select 1 from misiones m where m.contenido_id=c.id) or exists (select 1 from proyecto_contenidos p where p.contenido_id=c.id))")
    if en_uso != '0':
        sys.exit(f'No se reimporta: hay {en_uso} contenidos de esta materia ya usados en misiones o proyectos.')
    sql(f"delete from curriculo_contenidos where version_id='{ver}' and area_id='{area_id}'")
    sql(f"delete from curriculo_metas where version_id='{ver}' and area_id='{area_id}'")

    ids_meta = [str(uuid.uuid4()) for _ in metas]
    partes = ['begin;']
    for i, m in enumerate(metas):
        partes.append(f"insert into curriculo_metas (id, version_id, area_id, nivel, ciclo, anio_desde, anio_hasta, orden, texto) values "
                      f"('{ids_meta[i]}'::uuid, '{ver}', '{area_id}', 'primaria', {q(f'{m['ciclo'][0]}.º y {m['ciclo'][1]}.º grado')}, {m['ciclo'][0]}, {m['ciclo'][1]}, {m['orden']}, {q(m['texto'])});")
    for j, c in enumerate(contenidos):
        partes.append(
            f"with c as (insert into curriculo_contenidos (version_id, area_id, nivel, anio, descripcion, es_nap, meta_id, orden, fuente) values "
            f"('{ver}', '{area_id}', 'primaria', {c['anio']}, {q(c['descripcion'])}, false, '{ids_meta[c['meta_idx']]}'::uuid, {j + 1}, {q(FUENTE)}) returning id) "
            + ('insert into curriculo_indicadores (contenido_id, orden, texto) values ' + ', '.join(f"((select id from c), {k + 1}, {q(t)})" for k, t in enumerate(c['indicadores'])) + ';' if c['indicadores'] else 'select 1;'))
    partes.append("commit;")
    return '\n'.join(partes)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('texto')
    ap.add_argument('--area', required=True)
    ap.add_argument('--cargar', action='store_true')
    ap.add_argument('--muestra', type=int, default=3)
    a = ap.parse_args()
    metas, contenidos, _ = parsear(open(a.texto, encoding='utf8').read())

    print(f'{a.area}: {len(metas)} metas, {len(contenidos)} aprendizajes, {sum(len(c["indicadores"]) for c in contenidos)} indicadores')
    por_grado = {}
    for c in contenidos:
        por_grado.setdefault(c['anio'], []).append(c)
    for g in sorted(por_grado):
        print(f'  {g}.º grado: {len(por_grado[g])} aprendizajes, {sum(len(c["indicadores"]) for c in por_grado[g])} indicadores')
    sin_ind = [c for c in contenidos if not c['indicadores']]
    print(f'  aprendizajes sin indicadores: {len(sin_ind)}')
    for m in metas:
        print(f'  META {m["ciclo"][0]}-{m["ciclo"][1]}: {m["texto"][:110]}')
    for c in contenidos[:a.muestra]:
        print(json.dumps(c, ensure_ascii=False)[:400])
    if a.cargar:
        script = cargar(a.area, metas, contenidos)
        print(sql('', script)[:200] or 'cargado')


if __name__ == '__main__':
    main()
