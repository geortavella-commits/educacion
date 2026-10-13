#!/usr/bin/env python
"""
Prueba la planificación por semanas contra la base y las funciones locales (necesita `supabase start` y `functions serve`).
Crea un proyecto de prueba en 5º B con 3 etapas, mira qué ve cada rol según la semana y lo borra al terminar.
No toca nada más de la base.
"""
import json, re, subprocess, sys, urllib.request, urllib.error
from datetime import date, datetime, timedelta, timezone

ENV = open(r"c:/Users/dario/OneDrive/Escritorio/back antigravity/educacion/.env.local", encoding='utf8').read()
KEY = re.search(r'VITE_SUPABASE_PUBLISHABLE_KEY=(\S+)', ENV).group(1)
B = 'http://127.0.0.1:54321'
TITULO = 'PRUEBA planificacion por semanas (se borra sola)'


def http(m, u, c=None, t=None, x=None):
    h = {'apikey': KEY, 'Content-Type': 'application/json'}
    if t: h['Authorization'] = 'Bearer ' + t
    h.update(x or {})
    r = urllib.request.Request(B + u, data=None if c is None else json.dumps(c).encode(), headers=h, method=m)
    try:
        with urllib.request.urlopen(r, timeout=90) as f:
            b = f.read(); return f.status, (json.loads(b) if b else None)
    except urllib.error.HTTPError as e:
        b = e.read().decode('utf8', 'ignore')
        try: return e.code, json.loads(b)
        except Exception: return e.code, b


def sql(q): return subprocess.run(['docker', 'exec', 'supabase_db_educacion', 'psql', '-U', 'postgres', '-tAc', q], capture_output=True, text=True, encoding='utf8').stdout.strip()
def login(mail): return http('POST', '/auth/v1/token?grant_type=password', {'email': mail, 'password': 'educacion123'})[1]
def funcion(n, c, t): return http('POST', '/functions/v1/' + n, c, t)


ok = mal = 0
def chequear(nombre, cond, detalle=''):
    global ok, mal
    if cond: ok += 1; print('  OK   ', nombre)
    else: mal += 1; print('  FALLA', nombre, detalle)


# Hoy en Córdoba (UTC-3), igual que la base.
hoy = (datetime.now(timezone.utc) - timedelta(hours=3)).date()
sql(f"delete from proyectos where titulo='{TITULO}'")

d = login('docente.laura@ficticio.test'); laura = d['access_token']; laura_id = d['user']['id']
mateo = login('alumno.mateo@ficticio.test')['access_token']
mateo_id = sql("select id from auth.users where email='alumno.mateo@ficticio.test'")
familia = login('familia.mateo@ficticio.test')['access_token']
directivo = login('directivo@ficticio.test')['access_token']
curso = sql("select id from cursos where nombre='5º B'"); esc = sql(f"select escuela_id from cursos where id='{curso}'")

print('== Armo un proyecto de 3 semanas que empezó hoy ==')
s, p = http('POST', '/rest/v1/proyectos', {'escuela_id': esc, 'curso_id': curso, 'creado_por': laura_id, 'titulo': TITULO, 'estado': 'activo',
            'fecha_inicio': hoy.isoformat(), 'semanas': 3}, laura, {'Prefer': 'return=representation'})
chequear('la docente crea el proyecto con fecha de inicio y semanas', s == 201, (s, p))
pid = p[0]['id']
s, et = http('POST', '/rest/v1/etapas', [{'proyecto_id': pid, 'semana': i, 'titulo': f'Semana {i}', 'objetivo': f'Objetivo {i}'} for i in (1, 2, 3)], laura, {'Prefer': 'return=representation'})
chequear('crea 3 etapas (una por semana)', s == 201 and len(et) == 3, (s, et))
etapa = {e['semana']: e['id'] for e in et}
s, d2 = http('POST', '/rest/v1/etapas', {'proyecto_id': pid, 'semana': 2, 'titulo': 'Repetida'}, laura)
chequear('no se puede repetir la semana en un proyecto', s in (409, 400), (s, d2))
s, d2 = http('POST', '/rest/v1/etapas', {'proyecto_id': pid, 'semana': 7, 'titulo': 'Semana siete'}, laura)
chequear('la semana tiene que estar entre 1 y 6', s in (400, 409), (s, d2))

def mision(orden, semana, tipo='abierta'):
    fila = {'proyecto_id': pid, 'orden': orden, 'titulo': f'Misión {orden}', 'consigna': 'Contá lo que pensás.', 'tipo_respuesta': tipo, 'opciones': None, 'tiene_pista': False, 'etapa_id': etapa[semana]}
    s, m = http('POST', '/rest/v1/misiones', fila, laura, {'Prefer': 'return=representation'})
    return m[0]['id'] if s == 201 else None

m1, m2, m3 = mision(1, 1), mision(2, 2), mision(3, 3)
chequear('crea una misión por semana', all([m1, m2, m3]))
otro = sql("select id from proyectos where id<>'%s' limit 1" % pid)
otra_etapa = sql(f"select id from etapas where proyecto_id='{pid}' limit 1")
if otro:
    s, d2 = http('POST', '/rest/v1/misiones', {'proyecto_id': otro, 'orden': 99, 'titulo': 'Mal colgada', 'tipo_respuesta': 'abierta', 'opciones': None, 'tiene_pista': False, 'etapa_id': otra_etapa}, laura)
    chequear('una misión no puede colgar de la etapa de OTRO proyecto', s in (400, 403, 409), (s, d2))

def ids_de(token): return {m['id'] for m in (http('GET', f'/rest/v1/misiones?select=id&proyecto_id=eq.{pid}', t=token)[1] or [])}

print('== Hoy es el primer día: solo se habilita la semana 1 ==')
chequear('la docente ve todo el plan', ids_de(laura) == {m1, m2, m3})
chequear('el alumno ve solo la semana 1', ids_de(mateo) == {m1}, ids_de(mateo))
# La familia y la dirección no ven las misiones de un proyecto (la regla de proyectos solo deja a docentes e inscriptos): no cambió.
chequear('la familia sigue sin ver misiones del proyecto', ids_de(familia) == set(), ids_de(familia))
chequear('la dirección sigue sin ver misiones del proyecto', ids_de(directivo) == set(), ids_de(directivo))
s, d2 = funcion('verificar-respuesta', {'mision_id': m2, 'respuesta': 'hola'}, mateo)
chequear('responder una misión de la semana 2 es "no disponible" (404)', s == 404, (s, d2))
s, d2 = funcion('pedir-pista', {'mision_id': m3}, mateo)
chequear('pedir pista de la semana 3 es "no disponible" (404)', s == 404, (s, d2))
s, d2 = funcion('completar-mision', {'mision_id': m2}, mateo)
chequear('completar una de la semana 2 es "no disponible" (404)', s == 404, (s, d2))
s, d2 = funcion('verificar-respuesta', {'mision_id': m1, 'respuesta': 'Pienso que las plantas necesitan agua.'}, mateo)
chequear('la de la semana 1 se entrega bien', s == 200 and d2.get('completada') is True, (s, d2))
chequear('al terminarla NO lo manda a una misión de una semana futura', d2.get('siguiente') is None, d2)

print('== Pasó una semana: se habilita la semana 2 ==')
sql(f"update proyectos set fecha_inicio = '{(hoy - timedelta(days=7)).isoformat()}' where id='{pid}'")
chequear('el alumno ve las semanas 1 y 2', ids_de(mateo) == {m1, m2}, ids_de(mateo))
s, d2 = funcion('verificar-respuesta', {'mision_id': m2, 'respuesta': 'Ahora sí.'}, mateo)
chequear('ya puede entregar la de la semana 2', s == 200 and d2.get('completada') is True, (s, d2))
s, d2 = funcion('verificar-respuesta', {'mision_id': m3, 'respuesta': 'Todavía no.'}, mateo)
chequear('la de la semana 3 sigue sin estar disponible', s == 404, (s, d2))

print('== Pasaron dos semanas: todo habilitado ==')
sql(f"update proyectos set fecha_inicio = '{(hoy - timedelta(days=14)).isoformat()}' where id='{pid}'")
chequear('el alumno ve las 3 semanas', ids_de(mateo) == {m1, m2, m3})

print('== Compatibilidad: proyecto sin fecha de inicio ==')
sql(f"update proyectos set fecha_inicio = null where id='{pid}'")
chequear('sin fecha de inicio se ve todo desde el principio', ids_de(mateo) == {m1, m2, m3})
sql(f"update proyectos set fecha_inicio = '{(hoy + timedelta(days=30)).isoformat()}' where id='{pid}'")
chequear('con una fecha futura no se habilita nada de lo que tiene etapa', ids_de(mateo) == set(), ids_de(mateo))

print('== Permisos de las etapas ==')
s, d2 = http('POST', '/rest/v1/etapas', {'proyecto_id': pid, 'semana': 4, 'titulo': 'Colada por el alumno'}, mateo)
chequear('un alumno no puede crear etapas', s in (401, 403), (s, d2))
s, d2 = http('DELETE', f'/rest/v1/etapas?proyecto_id=eq.{pid}', t=mateo)
chequear('un alumno no puede borrar etapas', sql(f"select count(*) from etapas where proyecto_id='{pid}'") == '3', (s, d2))
s, d2 = http('GET', f'/rest/v1/etapas?select=id&proyecto_id=eq.{pid}', t=mateo)
chequear('un alumno puede leer las etapas de su proyecto (títulos, sin las misiones futuras)', s == 200 and len(d2) == 3, (s, d2))
s, d2 = http('GET', f'/rest/v1/etapas?select=id', t=None)
chequear('sin sesión no se ve nada', s in (401, 403) or d2 == [], (s, d2))

sql(f"delete from proyectos where id='{pid}'")
print('\n(se borró el proyecto de prueba)')
print(f'Total: {ok} bien, {mal} con falla')
sys.exit(1 if mal else 0)
