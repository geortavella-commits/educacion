-- Migración 2: helpers, RLS activado en todas las tablas y políticas por rol.
-- Criterio: denegar por defecto. Las escrituras sensibles (tutor_mensajes,
-- tutor_resumenes, senales_alumno al crearse, consentimientos, codigos_clase,
-- solicitudes_ingreso, progreso_misiones, membresias, inscripciones,
-- familias_vinculos, audit_log) NO tienen política de escritura: solo las hace
-- una Edge Function con service_role.

-- ─── Helpers (security definer, search_path fijo) ───────────────────────────
-- Justificación: las políticas consultan tablas que a su vez tienen RLS
-- (membresias, inscripciones...). Sin security definer habría recursión
-- infinita. Todos devuelven solo booleanos/uuid del propio usuario.

create or replace function public.es_miembro(p_escuela uuid, p_rol public.rol_escuela default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membresias m
    where m.usuario_id = (select auth.uid())
      and m.escuela_id = p_escuela
      and m.activa
      and (p_rol is null or m.rol = p_rol)
  );
$$;

create or replace function public.tiene_membresia()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membresias m
    where m.usuario_id = (select auth.uid()) and m.activa
  );
$$;

create or replace function public.escuela_del_curso(p_curso uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select c.escuela_id from public.cursos c where c.id = p_curso;
$$;

create or replace function public.es_docente_del_curso(p_curso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.curso_docentes d
    where d.curso_id = p_curso and d.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_directivo_del_curso(p_curso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cursos c
    join public.membresias m on m.escuela_id = c.escuela_id
    where c.id = p_curso
      and m.usuario_id = (select auth.uid())
      and m.rol = 'directivo' and m.activa
  );
$$;

create or replace function public.esta_inscripto(p_curso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.inscripciones i
    where i.curso_id = p_curso and i.alumno_id = (select auth.uid())
  );
$$;

create or replace function public.es_docente_de_alumno(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.inscripciones i
    join public.curso_docentes d on d.curso_id = i.curso_id
    where i.alumno_id = p_alumno and d.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_familia_de(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.familias_vinculos f
    where f.alumno_id = p_alumno and f.familia_id = (select auth.uid())
  );
$$;

create or replace function public.familia_en_curso(p_curso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.familias_vinculos f
    join public.inscripciones i on i.alumno_id = f.alumno_id
    where i.curso_id = p_curso and f.familia_id = (select auth.uid())
  );
$$;

create or replace function public.puede_ver_alumno(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_alumno = (select auth.uid())
      or public.es_docente_de_alumno(p_alumno)
      or public.es_familia_de(p_alumno);
$$;

-- El directivo ve a los docentes de su escuela (alta de docentes), no a los alumnos.
create or replace function public.es_directivo_de_docente(p_usuario uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membresias md
    join public.membresias mdir on mdir.escuela_id = md.escuela_id
    where md.usuario_id = p_usuario and md.rol = 'docente' and md.activa
      and mdir.usuario_id = (select auth.uid()) and mdir.rol = 'directivo' and mdir.activa
  );
$$;

-- Compañeros de equipo de proyecto o de grupo aprobado (el alumno ve su nombre visible).
create or replace function public.es_companero(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.proyecto_miembros a
    join public.proyecto_miembros b on b.proyecto_id = a.proyecto_id
    where a.alumno_id = (select auth.uid()) and b.alumno_id = p_alumno
  ) or exists (
    select 1 from public.grupo_miembros a
    join public.grupo_miembros b on b.grupo_id = a.grupo_id
    join public.grupos g on g.id = a.grupo_id and g.estado = 'aprobado'
    where a.alumno_id = (select auth.uid()) and b.alumno_id = p_alumno
  );
$$;

create or replace function public.es_miembro_de_grupo(p_grupo uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.grupo_miembros gm
    where gm.grupo_id = p_grupo and gm.alumno_id = (select auth.uid())
  );
$$;

create or replace function public.curso_del_grupo(p_grupo uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select g.curso_id from public.grupos g where g.id = p_grupo;
$$;

create or replace function public.puede_editar_proyecto(p_proyecto uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.proyectos p
    where p.id = p_proyecto
      and (p.creado_por = (select auth.uid()) or public.es_docente_del_curso(p.curso_id))
  );
$$;

-- ─── Resumen para el directivo (agregados, sin datos de alumnos) ────────────
-- security definer justificado: el directivo no puede leer inscripciones,
-- consentimientos ni sesiones; solo recibe conteos de su propia escuela.
create or replace function public.resumen_escuela(p_escuela uuid)
returns table (
  cursos_activos integer,
  docentes_activos integer,
  alumnos_total integer,
  alumnos_activos_semana integer,
  consentimientos_pendientes integer
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_miembro(p_escuela, 'directivo') then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return query
  select
    (select count(*)::int from public.cursos c where c.escuela_id = p_escuela),
    (select count(*)::int from public.membresias m
       where m.escuela_id = p_escuela and m.rol = 'docente' and m.activa),
    (select count(distinct i.alumno_id)::int from public.inscripciones i
       join public.cursos c on c.id = i.curso_id where c.escuela_id = p_escuela),
    (select count(distinct s.alumno_id)::int from public.tutor_sesiones s
       where s.escuela_id = p_escuela and s.created_at > now() - interval '7 days'),
    (select count(*)::int from public.consentimientos k
       where k.escuela_id = p_escuela and k.estado = 'pendiente');
end $$;

-- ─── RLS activado en todas las tablas ───────────────────────────────────────
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- ─── Organización ───────────────────────────────────────────────────────────
create policy jurisdicciones_select on public.jurisdicciones for select to authenticated
  using (public.tiene_membresia());

create policy escuelas_select on public.escuelas for select to authenticated
  using (public.es_miembro(id));

create policy perfiles_select on public.perfiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.puede_ver_alumno(id)
    or public.es_directivo_de_docente(id)
    or public.es_companero(id)
  );

create policy perfiles_update_propio on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy membresias_select on public.membresias for select to authenticated
  using (usuario_id = (select auth.uid()) or public.es_miembro(escuela_id, 'directivo'));

create policy cursos_select on public.cursos for select to authenticated
  using (
    public.es_docente_del_curso(id)
    or public.esta_inscripto(id)
    or public.es_miembro(escuela_id, 'directivo')
    or public.familia_en_curso(id)
  );
create policy cursos_insert on public.cursos for insert to authenticated
  with check (public.es_miembro(escuela_id, 'directivo'));
create policy cursos_update on public.cursos for update to authenticated
  using (public.es_miembro(escuela_id, 'directivo'))
  with check (public.es_miembro(escuela_id, 'directivo'));

create policy curso_docentes_select on public.curso_docentes for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or public.es_directivo_del_curso(curso_id)
    or public.esta_inscripto(curso_id)
  );
create policy curso_docentes_insert on public.curso_docentes for insert to authenticated
  with check (public.es_directivo_del_curso(curso_id));
create policy curso_docentes_delete on public.curso_docentes for delete to authenticated
  using (public.es_directivo_del_curso(curso_id));

create policy inscripciones_select on public.inscripciones for select to authenticated
  using (alumno_id = (select auth.uid()) or public.es_docente_del_curso(curso_id));

create policy codigos_clase_select on public.codigos_clase for select to authenticated
  using (public.es_docente_del_curso(curso_id));

create policy solicitudes_ingreso_select on public.solicitudes_ingreso for select to authenticated
  using (public.es_docente_del_curso(curso_id));

create policy familias_vinculos_select on public.familias_vinculos for select to authenticated
  using (familia_id = (select auth.uid()) or public.es_docente_de_alumno(alumno_id));

create policy consentimientos_select on public.consentimientos for select to authenticated
  using (
    otorgado_por = (select auth.uid())
    or public.es_familia_de(alumno_id)
    or public.es_docente_de_alumno(alumno_id)
  );

-- ─── Grupos ─────────────────────────────────────────────────────────────────
create policy grupos_select on public.grupos for select to authenticated
  using (
    public.es_docente_del_curso(curso_id)
    or (estado = 'aprobado' and public.es_miembro_de_grupo(id))
  );
create policy grupos_insert on public.grupos for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.es_docente_del_curso(curso_id));
create policy grupos_update on public.grupos for update to authenticated
  using (public.es_docente_del_curso(curso_id))
  with check (public.es_docente_del_curso(curso_id));
create policy grupos_delete on public.grupos for delete to authenticated
  using (public.es_docente_del_curso(curso_id));

-- La etiqueta interna la ve y la edita solo el docente
create policy grupos_internos_select on public.grupos_internos for select to authenticated
  using (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)));
create policy grupos_internos_insert on public.grupos_internos for insert to authenticated
  with check (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)));
create policy grupos_internos_update on public.grupos_internos for update to authenticated
  using (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)))
  with check (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)));
create policy grupos_internos_delete on public.grupos_internos for delete to authenticated
  using (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)));

create policy grupo_miembros_select on public.grupo_miembros for select to authenticated
  using (
    public.es_docente_del_curso(public.curso_del_grupo(grupo_id))
    or alumno_id = (select auth.uid())
  );
create policy grupo_miembros_insert on public.grupo_miembros for insert to authenticated
  with check (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)));
create policy grupo_miembros_delete on public.grupo_miembros for delete to authenticated
  using (public.es_docente_del_curso(public.curso_del_grupo(grupo_id)));

-- ─── Currículo (solo lectura para el cliente; la carga la hace el equipo) ───
create policy curriculo_versiones_select on public.curriculo_versiones for select to authenticated
  using (public.tiene_membresia());
create policy areas_select on public.areas for select to authenticated
  using (public.tiene_membresia());

create policy curriculo_contenidos_select on public.curriculo_contenidos for select to authenticated
  using (
    public.tiene_membresia()
    and (escuela_id is null or public.es_miembro(escuela_id))
  );
-- Contenido propio del docente (escuela_id obligatorio; lo oficial no se toca)
create policy curriculo_contenidos_insert on public.curriculo_contenidos for insert to authenticated
  with check (escuela_id is not null and public.es_miembro(escuela_id, 'docente'));
create policy curriculo_contenidos_update on public.curriculo_contenidos for update to authenticated
  using (escuela_id is not null and public.es_miembro(escuela_id, 'docente'))
  with check (escuela_id is not null and public.es_miembro(escuela_id, 'docente'));
create policy curriculo_contenidos_delete on public.curriculo_contenidos for delete to authenticated
  using (escuela_id is not null and public.es_miembro(escuela_id, 'docente'));

-- ─── Proyectos ──────────────────────────────────────────────────────────────
-- Los alumnos no ven proyectos en borrador.
create policy proyectos_select on public.proyectos for select to authenticated
  using (
    creado_por = (select auth.uid())
    or public.es_docente_del_curso(curso_id)
    or (estado <> 'borrador' and public.esta_inscripto(curso_id))
    or (estado <> 'borrador' and visibilidad in ('escuela','publico') and public.es_miembro(escuela_id))
  );
create policy proyectos_insert on public.proyectos for insert to authenticated
  with check (
    creado_por = (select auth.uid())
    and public.es_miembro(escuela_id, 'docente')
    and (curso_id is null
         or (public.escuela_del_curso(curso_id) = escuela_id and public.es_docente_del_curso(curso_id)))
  );
create policy proyectos_update on public.proyectos for update to authenticated
  using (creado_por = (select auth.uid()) or public.es_docente_del_curso(curso_id))
  with check (
    public.es_miembro(escuela_id, 'docente')
    and (curso_id is null
         or (public.escuela_del_curso(curso_id) = escuela_id and public.es_docente_del_curso(curso_id)))
  );
create policy proyectos_delete on public.proyectos for delete to authenticated
  using (creado_por = (select auth.uid()));

-- Las tablas hijas heredan la visibilidad del proyecto (el subselect pasa por la RLS de proyectos)
create policy proyecto_contenidos_select on public.proyecto_contenidos for select to authenticated
  using (exists (select 1 from public.proyectos p where p.id = proyecto_id));
create policy proyecto_contenidos_insert on public.proyecto_contenidos for insert to authenticated
  with check (public.puede_editar_proyecto(proyecto_id));
create policy proyecto_contenidos_delete on public.proyecto_contenidos for delete to authenticated
  using (public.puede_editar_proyecto(proyecto_id));

create policy misiones_select on public.misiones for select to authenticated
  using (exists (select 1 from public.proyectos p where p.id = proyecto_id));
create policy misiones_insert on public.misiones for insert to authenticated
  with check (public.puede_editar_proyecto(proyecto_id));
create policy misiones_update on public.misiones for update to authenticated
  using (public.puede_editar_proyecto(proyecto_id))
  with check (public.puede_editar_proyecto(proyecto_id));
create policy misiones_delete on public.misiones for delete to authenticated
  using (public.puede_editar_proyecto(proyecto_id));

create policy proyecto_miembros_select on public.proyecto_miembros for select to authenticated
  using (alumno_id = (select auth.uid()) or public.puede_editar_proyecto(proyecto_id)
         or exists (select 1 from public.proyectos p where p.id = proyecto_id));
create policy proyecto_miembros_insert on public.proyecto_miembros for insert to authenticated
  with check (public.puede_editar_proyecto(proyecto_id));
create policy proyecto_miembros_update on public.proyecto_miembros for update to authenticated
  using (public.puede_editar_proyecto(proyecto_id))
  with check (public.puede_editar_proyecto(proyecto_id));
create policy proyecto_miembros_delete on public.proyecto_miembros for delete to authenticated
  using (public.puede_editar_proyecto(proyecto_id));

-- ─── Alumno y tutor ─────────────────────────────────────────────────────────
create policy progreso_misiones_select on public.progreso_misiones for select to authenticated
  using (alumno_id = (select auth.uid()) or public.es_docente_de_alumno(alumno_id) or public.es_familia_de(alumno_id));

create policy intereses_select on public.intereses_alumno for select to authenticated
  using (public.puede_ver_alumno(alumno_id));
-- El alumno solo declara sus intereses; los "observados" los escribe el servidor.
create policy intereses_insert on public.intereses_alumno for insert to authenticated
  with check (alumno_id = (select auth.uid()) and origen = 'declarado');
create policy intereses_delete on public.intereses_alumno for delete to authenticated
  using (alumno_id = (select auth.uid()) and origen = 'declarado');

-- Señales: nacen como hipótesis (las crea el servidor); el docente las revisa.
create policy senales_select on public.senales_alumno for select to authenticated
  using (public.es_docente_de_alumno(alumno_id));
create policy senales_update on public.senales_alumno for update to authenticated
  using (public.es_docente_de_alumno(alumno_id))
  with check (public.es_docente_de_alumno(alumno_id) and revisada_por = (select auth.uid()));

create policy tutor_sesiones_select on public.tutor_sesiones for select to authenticated
  using (alumno_id = (select auth.uid()) or public.es_docente_de_alumno(alumno_id));

-- Decisión: el docente ve la conversación completa. El directivo NO.
create policy tutor_mensajes_select on public.tutor_mensajes for select to authenticated
  using (exists (
    select 1 from public.tutor_sesiones s
    where s.id = sesion_id
      and (s.alumno_id = (select auth.uid()) or public.es_docente_de_alumno(s.alumno_id))
  ));

-- Decisión: el directivo ve solo el resumen.
create policy tutor_resumenes_select on public.tutor_resumenes for select to authenticated
  using (public.es_docente_de_alumno(alumno_id) or public.es_miembro(escuela_id, 'directivo'));

create policy audit_log_select on public.audit_log for select to authenticated
  using (escuela_id is not null and public.es_miembro(escuela_id, 'directivo'));

-- ─── Permisos de tabla (defensa en profundidad) ─────────────────────────────
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

-- El cliente nunca escribe en estas tablas, aunque alguien agregue una política por error.
revoke insert, update, delete on
  public.tutor_mensajes, public.tutor_sesiones, public.tutor_resumenes,
  public.consentimientos, public.codigos_clase, public.solicitudes_ingreso,
  public.progreso_misiones, public.membresias, public.inscripciones,
  public.familias_vinculos, public.audit_log, public.escuelas, public.jurisdicciones,
  public.curriculo_versiones, public.areas
from authenticated;

-- Señales: el docente solo puede cambiar estado, descripción y quién revisó.
revoke insert, delete, update on public.senales_alumno from authenticated;
grant update (estado, descripcion, revisada_por) on public.senales_alumno to authenticated;

-- Perfil propio: solo nombre visible y avatar.
revoke insert, delete, update on public.perfiles from authenticated;
grant update (nombre_visible, avatar) on public.perfiles to authenticated;

-- ─── Índices sobre columnas usadas en políticas ─────────────────────────────
create index on public.membresias (usuario_id, escuela_id);
create index on public.membresias (escuela_id, rol);
create index on public.cursos (escuela_id);
create index on public.inscripciones (alumno_id);
create index on public.inscripciones (curso_id);
create index on public.curso_docentes (usuario_id);
create index on public.familias_vinculos (alumno_id);
create index on public.consentimientos (alumno_id);
create index on public.consentimientos (escuela_id, estado);
create index on public.grupos (curso_id);
create index on public.grupo_miembros (alumno_id);
create index on public.proyectos (escuela_id, curso_id);
create index on public.proyecto_miembros (alumno_id);
create index on public.misiones (proyecto_id);
create index on public.progreso_misiones (alumno_id);
create index on public.senales_alumno (alumno_id);
create index on public.tutor_sesiones (alumno_id);
create index on public.tutor_sesiones (escuela_id, created_at);
create index on public.tutor_mensajes (sesion_id);
create index on public.tutor_resumenes (alumno_id);
create index on public.audit_log (escuela_id);
