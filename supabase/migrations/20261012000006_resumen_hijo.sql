-- Migración 6: resumen del hijo/a para la familia ("formato resumen", sin acceso a misiones ni proyectos).
-- security definer JUSTIFICADO: la familia no puede leer misiones ni proyectos (la RLS no se lo permite),
-- pero sí debe ver cuánto avanzó su hijo/a por materia. Cada función verifica ANTES que quien llama esté
-- vinculado a ese alumno (es_familia_de) y solo devuelve conteos agregados, nunca texto de las misiones.

create or replace function public.resumen_hijo(p_alumno uuid)
returns table (area text, completadas integer, total integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_familia_de(p_alumno) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return query
  with ms as (
    select m.id, coalesce(a.nombre, 'General') as area
    from public.inscripciones i
    join public.proyectos p on p.curso_id = i.curso_id and p.estado = 'activo'
    join public.misiones m on m.proyecto_id = p.id
    left join public.curriculo_contenidos k on k.id = m.contenido_id
    left join public.areas a on a.id = k.area_id
    where i.alumno_id = p_alumno
  )
  select ms.area,
         (count(pm.mision_id) filter (where pm.estado = 'completada'))::integer,
         count(*)::integer
  from ms
  left join public.progreso_misiones pm on pm.mision_id = ms.id and pm.alumno_id = p_alumno
  group by ms.area
  order by ms.area;
end $$;

create or replace function public.actividad_semana_hijo(p_alumno uuid)
returns table (dias_activos integer, misiones_completadas integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_familia_de(p_alumno) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return query
  select (count(distinct (pm.completada_en at time zone 'America/Argentina/Cordoba')::date))::integer,
         (count(*))::integer
  from public.progreso_misiones pm
  where pm.alumno_id = p_alumno and pm.estado = 'completada'
    and pm.completada_en > now() - interval '7 days';
end $$;

revoke execute on function public.resumen_hijo(uuid), public.actividad_semana_hijo(uuid) from public, anon;
grant execute on function public.resumen_hijo(uuid), public.actividad_semana_hijo(uuid) to authenticated;
