-- "Hecha en papel": la docente cierra una misión que el alumno resolvió en la hoja impresa (lo escrito en papel no vuelve al sistema).
-- progreso_misiones no tiene política de escritura para usuarios: se hace con funciones security definer acotadas,
-- que verifican que quien llama sea docente de ese alumno y que la misión sea de un proyecto de su curso.

alter table public.progreso_misiones add column en_papel boolean not null default false;

create or replace function public.marcar_mision_en_papel(p_mision uuid, p_alumno uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_escuela uuid;
begin
  if not public.es_docente_de_alumno(p_alumno) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;

  select p.escuela_id into v_escuela
  from public.misiones m
  join public.proyectos p on p.id = m.proyecto_id
  join public.inscripciones i on i.curso_id = p.curso_id
  where m.id = p_mision and i.alumno_id = p_alumno;
  if v_escuela is null then
    raise exception 'la misión no es del curso del alumno' using errcode = '23514';
  end if;

  -- Si ya la completó en pantalla no se toca: no se le quita nada ni se la rotula "en papel".
  insert into public.progreso_misiones (mision_id, alumno_id, escuela_id, estado, completada_en, en_papel)
  values (p_mision, p_alumno, v_escuela, 'completada', now(), true)
  on conflict (mision_id, alumno_id) do update
    set estado = 'completada', completada_en = now(), en_papel = true
    where public.progreso_misiones.estado <> 'completada';

  insert into public.audit_log (escuela_id, usuario_id, accion, entidad, entidad_id)
  values (v_escuela, (select auth.uid()), 'mision_en_papel', 'misiones', p_mision);
end;
$$;

-- Deshacer: solo lo que se marcó en papel (nunca borra lo que el alumno hizo en pantalla).
create or replace function public.desmarcar_mision_en_papel(p_mision uuid, p_alumno uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_docente_de_alumno(p_alumno) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  update public.progreso_misiones
    set estado = case when intentos > 0 or pistas_usadas > 0 then 'en_curso' else 'pendiente' end,
        completada_en = null, en_papel = false
    where mision_id = p_mision and alumno_id = p_alumno and en_papel;
end;
$$;

revoke all on function public.marcar_mision_en_papel(uuid, uuid) from public, anon;
revoke all on function public.desmarcar_mision_en_papel(uuid, uuid) from public, anon;
grant execute on function public.marcar_mision_en_papel(uuid, uuid) to authenticated;
grant execute on function public.desmarcar_mision_en_papel(uuid, uuid) to authenticated;
