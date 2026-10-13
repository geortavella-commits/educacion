-- Hoja imprimible de misiones para la familia.
-- Hasta ahora la familia solo veía conteos (resumen_hijo): no podía leer misiones ni proyectos. Para poder imprimir la hoja de la semana
-- necesita el TEXTO de las misiones de su hijo/a, así que se agrega una función security definer MUY acotada:
--   · verifica antes que quien llama sea familia vinculada a ese alumno (es_familia_de);
--   · devuelve solo misiones de proyectos EN CURSO del curso del alumno y ya HABILITADAS (semana que empezó);
--   · nunca devuelve respuestas correctas, pistas ni explicaciones (esas viven en misiones_claves y no se tocan).

create or replace function public.hoja_misiones_hijo(p_alumno uuid)
returns table (
  proyecto_id uuid,
  proyecto_titulo text,
  semana smallint,
  etapa_titulo text,
  etapa_objetivo text,
  mision_id uuid,
  orden smallint,
  titulo text,
  consigna text,
  tipo_respuesta text,
  opciones jsonb,
  curso_nombre text,
  escuela_nombre text,
  alumno_nombre text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_familia_de(p_alumno) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return query
  select p.id, p.titulo, e.semana, e.titulo, e.objetivo,
         m.id, m.orden, m.titulo, m.consigna, m.tipo_respuesta, m.opciones,
         c.nombre, es.nombre, pe.nombre_visible
  from public.inscripciones i
  join public.cursos c on c.id = i.curso_id
  join public.escuelas es on es.id = c.escuela_id
  join public.proyectos p on p.curso_id = i.curso_id and p.estado = 'activo'
  join public.misiones m on m.proyecto_id = p.id
  left join public.etapas e on e.id = m.etapa_id
  join public.perfiles pe on pe.id = p_alumno
  where i.alumno_id = p_alumno
    and public.mision_habilitada(m.id)
  order by p.created_at, e.semana nulls last, m.orden;
end $$;

revoke execute on function public.hoja_misiones_hijo(uuid) from public, anon;
grant execute on function public.hoja_misiones_hijo(uuid) to authenticated;
