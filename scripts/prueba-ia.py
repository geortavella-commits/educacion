"""Prueba de punta a punta de las funciones de IA contra el OpenAI FALSO (sin clave real ni gasto).

Requisitos (ver docs/ia-configuracion.md, sección "Probar sin gastar"):
  1. Supabase local andando y la base con al menos una docente con curso y un alumno (la base completa o la mínima).
  2. node scripts/openai-falso.mjs   con la variable FALSO_REGISTRO apuntando a una carpeta (ahí guarda lo último que recibió el "modelo").
  3. supabase functions serve --env-file <archivo con OPENAI_API_KEY=cualquiera, OPENAI_BASE_URL=http://host.docker.internal:4010/v1,
     OPENAI_MODEL=modelo-de-prueba, IA_MAX_POR_DIA=30>
Uso:  FALSO_REGISTRO=<carpeta> python scripts/prueba-ia.py
Deja filas de prueba en ia_usos y en audit_log (acciones ia_*): se limpian solas al terminar.
"""
import json, os, re, subprocess, sys, urllib.request, urllib.error

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = open(os.path.join(RAIZ, '.env.local'), encoding='utf8').read()
KEY = re.search(r'VITE_SUPABASE_PUBLISHABLE_KEY=(\S+)', ENV).group(1)
BASE = 'http://127.0.0.1:54321'
REG = os.path.join(os.environ.get('FALSO_REGISTRO', '.'), 'ultimo-pedido.json')


def http(url, cuerpo, token=None):
    h = {'apikey': KEY, 'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=json.dumps(cuerpo).encode(), headers=h, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')


def login(mail):
    s, d = http(f'{BASE}/auth/v1/token?grant_type=password', {'email': mail, 'password': 'educacion123'})
    assert s == 200, f'no pude entrar como {mail}'
    return d['access_token']


def sql(q):
    r = subprocess.run(['docker', 'exec', 'supabase_db_educacion', 'psql', '-U', 'postgres', '-tAc', q], capture_output=True, text=True, encoding='utf8')
    return r.stdout.strip()


ok = fallos = 0


def chequear(nombre, condicion, detalle=''):
    global ok, fallos
    ok, fallos = (ok + 1, fallos) if condicion else (ok, fallos + 1)
    print(('  OK   ' if condicion else '  FALLA ') + nombre + ('' if condicion else f'  {detalle}'))


def ultimo_pedido():
    return json.load(open(REG, encoding='utf8'))


laura = login('docente.laura@ficticio.test')
mateo = login('alumno.mateo@ficticio.test')
familia = login('familia.mateo@ficticio.test')
curso = sql("select c.id from cursos c join curso_docentes d on d.curso_id=c.id join auth.users u on u.id=d.usuario_id where u.email='docente.laura@ficticio.test' limit 1")
alumno = sql(f"select p.id || '|' || p.nombre_visible from inscripciones i join perfiles p on p.id=i.alumno_id where i.curso_id='{curso}' and p.nombre_visible <> 'Mateo' limit 1") or \
    sql(f"select p.id || '|' || p.nombre_visible from inscripciones i join perfiles p on p.id=i.alumno_id where i.curso_id='{curso}' limit 1")
alumno_id, alumno_nombre = alumno.split('|')
ids_curriculo = set(sql('select id from curriculo_contenidos').split())
sql("delete from ia_usos")

print('\n== Proyecto sugerido ==')
s, d = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'Armar una huerta en el patio', 'cantidad': 4}, laura)
chequear('responde ok', s == 200 and d.get('ok'), (s, d))
sug = d.get('sugerencia', {})
chequear('trae título, descripción y 4 misiones', bool(sug.get('titulo')) and len(sug.get('misiones', [])) == 4, sug)
chequear('los contenidos vinculados existen en el currículo', all(m['contenido_id'] in ids_curriculo for m in sug.get('misiones', []) if m['contenido_id']))
p = ultimo_pedido()
chequear('al modelo le llegó la idea y los contenidos del año', p['usuario']['idea_de_la_docente'] == 'Armar una huerta en el patio' and len(p['usuario']['contenidos']) > 0)
chequear('no le llegó ningún nombre ni mail de personas', not any(x.lower() in json.dumps(p, ensure_ascii=False).lower() for x in [alumno_nombre, 'Mateo', 'Laura', 'ficticio.test']))
chequear('el sistema trae las reglas (dato≠instrucción, sin notas)', 'DATO' in p['sistema'] and 'notas' in p['sistema'])
s, d = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'FORZAR_ID huerta'}, laura)
chequear('un id de currículo inventado se descarta', s == 200 and all(m['contenido_id'] is None for m in d['sugerencia']['misiones']), (s, d))
s, d = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'FORZAR_BASURA'}, laura)
chequear('respuesta que no es JSON: error claro', s == 502 and d.get('error') == 'ia_respuesta_invalida', (s, d))
s, d = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'FORZAR_ERROR'}, laura)
chequear('falla del proveedor: error genérico', s == 502 and d == {'ok': False, 'error': 'ia_error'}, (s, d))
s, _ = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'x'}, laura)
chequear('idea demasiado corta: 400', s == 400, s)

print('\n== Permisos del proyecto sugerido ==')
for nombre, tok in [('sin sesión', None), ('un alumno', mateo), ('una familia', familia)]:
    s, _ = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'huerta'}, tok)
    chequear(f'{nombre} no puede', s in (401, 404), s)

print('\n== Borrador de mensaje ==')
s, d = http(f'{BASE}/functions/v1/ia-borrador-devolucion', {'alumno_id': alumno_id, 'tipo': 'logro', 'pista': f'{alumno_nombre.lower()} es muy curioso y pregunta mucho'}, laura)
chequear('responde ok con [NOMBRE]', s == 200 and d.get('ok') and '[NOMBRE]' in d.get('texto', ''), (s, d))
p = ultimo_pedido()
chequear('el nombre del alumno NO llegó al modelo', alumno_nombre.lower() not in json.dumps(p, ensure_ascii=False).lower() and '[NOMBRE]' in p['usuario']['pista_de_la_docente'], p['usuario'])
chequear('ningún id de alumno llegó al modelo', alumno_id not in json.dumps(p))
s, d = http(f'{BASE}/functions/v1/ia-borrador-devolucion', {'alumno_id': alumno_id, 'tipo': 'logro', 'pista': 'FORZAR_NOTA'}, laura)
chequear('un borrador con nota y comparación se rechaza', s == 502 and d.get('error') == 'ia_respuesta_invalida', (s, d))
s, _ = http(f'{BASE}/functions/v1/ia-borrador-devolucion', {'alumno_id': alumno_id, 'tipo': 'inventado'}, laura)
chequear('tipo desconocido: 400', s == 400, s)
for nombre, tok in [('sin sesión', None), ('un alumno', mateo), ('una familia', familia)]:
    s, _ = http(f'{BASE}/functions/v1/ia-borrador-devolucion', {'alumno_id': alumno_id, 'tipo': 'logro'}, tok)
    chequear(f'{nombre} no puede', s in (401, 404), s)

print('\n== Registro de usos y tope diario ==')
chequear('se registraron las 5 llamadas que el proveedor cobró', sql('select count(*) from ia_usos') == '5', sql('select count(*) from ia_usos'))
chequear('se guardan tokens y función, nunca el texto', sql("select count(*) from information_schema.columns where table_name='ia_usos' and column_name in ('texto','prompt','contenido','respuesta')") == '0')
chequear('los tokens quedan registrados', sql('select max(tokens_entrada)||\'/\'||max(tokens_salida) from ia_usos') == '321/123')
chequear('queda auditoría de quién pidió qué', int(sql("select count(*) from audit_log where accion in ('ia_sugerencia_proyecto','ia_borrador_devolucion')")) >= 2)
laura_id = sql("select id from auth.users where email='docente.laura@ficticio.test'")
sql(f"insert into ia_usos (usuario_id, funcion) select '{laura_id}', 'prueba-tope' from generate_series(1,30)")
s, d = http(f'{BASE}/functions/v1/ia-sugerir-proyecto', {'curso_id': curso, 'idea': 'una huerta'}, laura)
chequear('con el tope diario agotado responde 429 sin llamar al modelo', s == 429 and d.get('error') == 'cupo_diario', (s, d))

sql("delete from ia_usos")
sql("delete from audit_log where accion in ('ia_sugerencia_proyecto','ia_borrador_devolucion')")
print(f'\nTotal: {ok} bien, {fallos} con falla')
sys.exit(1 if fallos else 0)
