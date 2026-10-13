"""Prueba de punta a punta de las misiones con respuesta (verificar-respuesta, pedir-pista y el cierre del atajo en completar-mision).

Requisitos: Supabase local y `supabase functions serve` andando; la base con la docente de 5º B (docente.laura@), Mateo con
permiso familiar otorgado y un alumno SIN permiso (alumno.lucia.5b@, de scripts/../supabase/seeds/alumnos-extra.sql).
Crea un proyecto descartable "BORRAR prueba de respuestas" en 5º B y lo BORRA al terminar (aunque falle). No toca nada más.
Uso:  PYTHONIOENCODING=utf8 python scripts/prueba-misiones.py
"""
import json, os, re, subprocess, sys, urllib.request, urllib.error

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = open(os.path.join(RAIZ, '.env.local'), encoding='utf8').read()
KEY = re.search(r'VITE_SUPABASE_PUBLISHABLE_KEY=(\S+)', ENV).group(1)
BASE = 'http://127.0.0.1:54321'


def http(metodo, url, cuerpo=None, token=None, extra=None):
    h = {'apikey': KEY, 'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = f'Bearer {token}'
    h.update(extra or {})
    req = urllib.request.Request(url, data=None if cuerpo is None else json.dumps(cuerpo).encode(), headers=h, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            t = r.read()
            return r.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        t = e.read()
        try:
            return e.code, json.loads(t)
        except Exception:
            return e.code, {'raw': t.decode('utf8', 'ignore')}


def login(mail):
    s, d = http('POST', f'{BASE}/auth/v1/token?grant_type=password', {'email': mail, 'password': 'educacion123'})
    assert s == 200, f'no pude entrar como {mail}'
    return d['access_token'], d['user']['id']


def sql(q):
    r = subprocess.run(['docker', 'exec', 'supabase_db_educacion', 'psql', '-U', 'postgres', '-tAc', q], capture_output=True, text=True, encoding='utf8')
    return r.stdout.strip()


def funcion(nombre, cuerpo, token=None):
    return http('POST', f'{BASE}/functions/v1/{nombre}', cuerpo, token)


ok = fallos = 0


def chequear(nombre, condicion, detalle=''):
    global ok, fallos
    ok, fallos = (ok + 1, fallos) if condicion else (ok, fallos + 1)
    print(('  OK    ' if condicion else '  FALLA ') + nombre + ('' if condicion else f'   {detalle}'))


laura, laura_id = login('docente.laura@ficticio.test')
mateo, mateo_id = login('alumno.mateo@ficticio.test')
lucia, _ = login('alumno.lucia.5b@ficticio.test')
familia, _ = login('familia.mateo@ficticio.test')
curso = sql("select id from cursos where nombre='5º B'")
escuela = sql(f"select escuela_id from cursos where id='{curso}'")
proyecto = None

try:
    print('\n== Armado (como la docente, con sus permisos) ==')
    s, d = http('POST', f'{BASE}/rest/v1/proyectos', {'escuela_id': escuela, 'curso_id': curso, 'creado_por': laura_id, 'titulo': 'BORRAR prueba de respuestas', 'estado': 'activo'}, laura, {'Prefer': 'return=representation'})
    chequear('la docente crea el proyecto', s == 201, (s, d))
    proyecto = d[0]['id']
    sin_opciones = {'opciones': None}
    misiones = [
        {'proyecto_id': proyecto, 'orden': 1, 'titulo': 'Numérica', 'consigna': '¿Cuánto es 7 dividido 2?', 'tipo_respuesta': 'numero', 'tiene_pista': True, **sin_opciones},
        {'proyecto_id': proyecto, 'orden': 2, 'titulo': 'Opción', 'consigna': '¿Cuál es la capital de Córdoba?', 'tipo_respuesta': 'opcion', 'tiene_pista': False, 'opciones': [{'id': 'a', 'texto': 'Rosario'}, {'id': 'b', 'texto': 'Córdoba'}, {'id': 'c', 'texto': 'Salta'}]},
        {'proyecto_id': proyecto, 'orden': 3, 'titulo': 'Texto', 'consigna': '¿En qué provincia estamos?', 'tipo_respuesta': 'texto', 'tiene_pista': False, **sin_opciones},
        {'proyecto_id': proyecto, 'orden': 4, 'titulo': 'Abierta', 'consigna': 'Contá tu idea.', 'tipo_respuesta': 'abierta', 'tiene_pista': False, **sin_opciones},
    ]
    s, d = http('POST', f'{BASE}/rest/v1/misiones', misiones, laura, {'Prefer': 'return=representation'})
    chequear('la docente crea 4 misiones con tipo', s == 201 and len(d) == 4, (s, d))
    # Una misión "de las de antes": sin indicar tipo (como se creaban hasta ahora)
    s5, d5 = http('POST', f'{BASE}/rest/v1/misiones', {'proyecto_id': proyecto, 'orden': 5, 'titulo': 'Abierta vieja', 'consigna': 'Misión de las de antes.'}, laura, {'Prefer': 'return=representation'})
    chequear('la que no trae tipo queda como "abierta"', s5 == 201 and d5[0]['tipo_respuesta'] == 'abierta', (s5, d5))
    ids = {m['orden']: m['id'] for m in d + d5}

    claves = [
        {'mision_id': ids[1], 'respuestas': ['7/2'], 'tolerancia': 0, 'pista': 'Pensá en cuántas veces entra el 2 en el 7.', 'explicacion': '7 dividido 2 da 3,5.'},
        {'mision_id': ids[2], 'respuestas': ['b'], 'explicacion': 'Córdoba es la capital de su provincia.'},
        {'mision_id': ids[3], 'respuestas': ['Córdoba', 'Provincia de Córdoba']},
    ]
    estados = [http('POST', f'{BASE}/rest/v1/misiones_claves', c, laura)[0] for c in claves]
    chequear('la docente carga las respuestas correctas', estados == [201, 201, 201], estados)
    s, d = http('POST', f'{BASE}/rest/v1/misiones_claves', {'mision_id': ids[2], 'respuestas': ['z']}, laura)
    chequear('la base rechaza una opción correcta que no es una de las opciones', s >= 400, (s, d))
    s, d = http('POST', f'{BASE}/rest/v1/misiones', {'proyecto_id': proyecto, 'orden': 9, 'titulo': 'Mal', 'tipo_respuesta': 'opcion', 'opciones': [{'id': 'a', 'texto': 'Sola'}]}, laura)
    chequear('la base rechaza una misión de opción con menos de 2 opciones', s >= 400, (s, d))

    print('\n== El alumno NO puede ver las respuestas ==')
    s, d = http('GET', f'{BASE}/rest/v1/misiones_claves?select=*', None, mateo)
    chequear('un alumno no lee las claves', s == 200 and d == [], (s, d))
    s, d = http('GET', f'{BASE}/rest/v1/misiones?select=*&proyecto_id=eq.{proyecto}', None, mateo)
    texto = json.dumps(d, ensure_ascii=False)
    chequear('el alumno ve las misiones (enunciado, tipo y opciones)', s == 200 and len(d) == 5 and 'Rosario' in texto, (s, d))
    chequear('lo que ve el alumno no trae ninguna respuesta, pista ni explicación', not any(x in texto for x in ['7/2', 'Pensá en cuántas', 'da 3,5', 'respuestas']), texto[:300])
    s, d = http('POST', f'{BASE}/rest/v1/misiones_claves', {'mision_id': ids[1], 'respuestas': ['999']}, mateo)
    chequear('un alumno no puede escribir claves', s >= 400, (s, d))
    s, d = http('GET', f'{BASE}/rest/v1/misiones_claves?select=*', None, laura)
    chequear('la docente sí lee las claves de su proyecto', s == 200 and len(d) >= 3, (s, d))

    print('\n== Permisos ==')
    for nombre, tok, esperado in [('sin sesión', None, (401,)), ('una familia', familia, (404,)), ('un alumno sin permiso de su familia', lucia, (403,))]:
        s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': '3,5'}, tok)
        chequear(f'{nombre} no puede responder', s in esperado, (s, d))
    s, d = funcion('pedir-pista', {'mision_id': ids[1]}, lucia)
    chequear('sin permiso de la familia tampoco se puede pedir la pista', s == 403, (s, d))

    print('\n== Misión numérica ==')
    s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': 'tres'}, mateo)
    chequear('una respuesta que no es número se pide de nuevo (422) y NO cuenta como intento', s == 422 and sql(f"select count(*) from progreso_misiones where mision_id='{ids[1]}' and alumno_id='{mateo_id}'") == '0', (s, d))
    s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': '3,6'}, mateo)
    chequear('una respuesta incorrecta dice "no" sin completar', s == 200 and d == {'ok': True, 'correcta': False, 'completada': False}, (s, d))
    chequear('la respuesta incorrecta NO revela la correcta ni los intentos', '3,5' not in json.dumps(d) and 'intentos' not in d)
    chequear('queda 1 intento y la misión en curso', sql(f"select intentos||'/'||estado from progreso_misiones where mision_id='{ids[1]}' and alumno_id='{mateo_id}'") == '1/en_curso')
    s, d = funcion('completar-mision', {'mision_id': ids[1]}, mateo)
    chequear('el atajo viejo está cerrado: no se puede marcar como hecha sin acertar (409)', s == 409 and d.get('error') == 'requiere_respuesta', (s, d))
    s, d = funcion('pedir-pista', {'mision_id': ids[1]}, mateo)
    chequear('la pista se entrega cuando se pide', s == 200 and 'Pensá en cuántas' in d.get('pista', ''), (s, d))
    s, d2 = funcion('pedir-pista', {'mision_id': ids[1]}, mateo)
    chequear('pedirla de nuevo devuelve la misma sin sumar', d2.get('pista') == d.get('pista') and sql(f"select pistas_usadas from progreso_misiones where mision_id='{ids[1]}' and alumno_id='{mateo_id}'") == '1')
    s, d = funcion('pedir-pista', {'mision_id': ids[2]}, mateo)
    chequear('una misión sin pista responde "sin pista"', s == 404 and d.get('error') == 'sin_pista', (s, d))
    s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': '3,5'}, mateo)
    chequear('la respuesta correcta completa la misión', s == 200 and d.get('correcta') is True and d.get('completada') is True, (s, d))
    chequear('devuelve la explicación y cuál es la próxima misión', d.get('explicacion') == '7 dividido 2 da 3,5.' and d.get('siguiente', {}).get('id') == ids[2], d)
    chequear('quedó completada con 2 intentos y 1 pista', sql(f"select estado||'/'||intentos||'/'||pistas_usadas from progreso_misiones where mision_id='{ids[1]}' and alumno_id='{mateo_id}'") == 'completada/2/1')
    s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': '999'}, mateo)
    chequear('repasar una completada y equivocarse: se corrige ("todavía no") y no pierde lo hecho', s == 200 and d.get('correcta') is False and sql(f"select estado from progreso_misiones where mision_id='{ids[1]}' and alumno_id='{mateo_id}'") == 'completada', (s, d))
    s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': '7/2'}, mateo)
    chequear('también se acepta como fracción (7/2 = 3,5)', d.get('correcta') is True)

    print('\n== Opción múltiple y texto ==')
    s, d = funcion('verificar-respuesta', {'mision_id': ids[2], 'respuesta': 'z'}, mateo)
    chequear('una opción que no existe se rechaza (422)', s == 422, (s, d))
    s, d = funcion('verificar-respuesta', {'mision_id': ids[2], 'respuesta': 'a'}, mateo)
    chequear('opción incorrecta: "no"', d.get('correcta') is False and d.get('completada') is False, (s, d))
    s, d = funcion('verificar-respuesta', {'mision_id': ids[2], 'respuesta': 'b'}, mateo)
    chequear('opción correcta: completa y sigue la de texto', d.get('correcta') is True and d.get('siguiente', {}).get('id') == ids[3], d)
    s, d = funcion('verificar-respuesta', {'mision_id': ids[3], 'respuesta': '  CORDOBA!  '}, mateo)
    chequear('texto: ignora mayúsculas, tildes y puntuación', d.get('correcta') is True, (s, d))

    print('\n== Misiones abiertas ==')
    s, d = funcion('verificar-respuesta', {'mision_id': ids[4], 'respuesta': 'Mi idea es armar una huerta.'}, mateo)
    chequear('la abierta se entrega y queda completada, sin "correcta"', s == 200 and d.get('correcta') is None and d.get('completada') is True, (s, d))
    chequear('se guardó lo que escribió', sql(f"select texto from respuestas_abiertas where mision_id='{ids[4]}' and alumno_id='{mateo_id}'") == 'Mi idea es armar una huerta.')
    s, d = http('GET', f'{BASE}/rest/v1/respuestas_abiertas?select=texto&mision_id=eq.{ids[4]}', None, laura)
    chequear('la docente puede leer la respuesta de su alumno', s == 200 and len(d) == 1, (s, d))
    s, d = http('GET', f'{BASE}/rest/v1/respuestas_abiertas?select=texto', None, familia)
    chequear('la familia no lee las respuestas escritas', s == 200 and d == [], (s, d))
    s, d = funcion('completar-mision', {'mision_id': ids[5]}, mateo)
    chequear('las misiones de siempre (abiertas) se siguen pudiendo completar como antes', s == 200 and d.get('progreso', {}).get('estado') == 'completada', (s, d))
    s, d = funcion('verificar-respuesta', {'mision_id': ids[4], 'respuesta': 'Otra versión'}, mateo)
    chequear('al completar todas, ya no hay "siguiente"', d.get('siguiente') is None, (s, d))

    print('\n== Tope de intentos (contra quien prueba respuestas a lo bruto) ==')
    sql(f"delete from progreso_misiones where mision_id='{ids[1]}' and alumno_id='{mateo_id}'")
    sql(f"delete from ingreso_intentos where clave='resp:{mateo_id}:{ids[1]}'")
    cortes = None
    for i in range(1, 26):
        s, d = funcion('verificar-respuesta', {'mision_id': ids[1], 'respuesta': str(100 + i)}, mateo)
        if s == 429:
            cortes = i
            break
    chequear('después de 20 intentos incorrectos en poco tiempo, pide esperar (429)', cortes == 21, cortes)
    chequear('el aviso no revela nada', d == {'ok': False, 'error': 'demasiados_intentos', 'segundosEspera': 60}, d)
finally:
    if proyecto:
        sql(f"delete from proyectos where id='{proyecto}'")
        sql(f"delete from ingreso_intentos where clave like 'resp:{mateo_id}:%'")
        sql("delete from audit_log where accion='mision_completada' and entidad_id not in (select id from misiones)")
        print('\n(se borró el proyecto de prueba)')

print(f'\nTotal: {ok} bien, {fallos} con falla')
sys.exit(1 if fallos else 0)
