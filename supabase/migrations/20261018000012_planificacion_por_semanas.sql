-- Planificación de un proyecto en semanas (3 a 4 en el piloto, hasta 6): cada semana es una ETAPA con su objetivo, los aprendizajes
-- que cubre y sus misiones. Las misiones de una etapa se habilitan para los alumnos cuando empieza esa semana.
-- Compatibilidad: un proyecto sin fecha de inicio, o una misión sin etapa, se ve completo desde el primer día (como hasta ahora).

alter table public.proyectos
  add column fecha_inicio date,
  add column semanas smallint check (semanas is null or semanas between 1 and 6);

create table public.etapas (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  semana      smallint not null check (semana between 1 and 6),
  titulo      text not null check (char_length(btrim(titulo)) between 3 and 80),
  objetivo    text check (objetivo is null or char_length(objetivo) <= 400),
  unique (proyecto_id, semana)
);

create table public.etapa_contenidos (
  etapa_id     uuid not null references public.etapas(id) on delete cascade,
  contenido_id uuid not null references public.curriculo_contenidos(id),
  primary key (etapa_id, contenido_id)
);

alter table public.misiones add column etapa_id uuid references public.etapas(id) on delete set null;
create index misiones_etapa_idx on public.misiones (etapa_id);

-- Una misión solo puede colgar de una etapa de SU proyecto.
create function public.misiones_etapa_valida() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.etapa_id is not null
     and not exists (select 1 from public.etapas e where e.id = new.etapa_id and e.proyecto_id = new.proyecto_id) then
    raise exception 'la etapa no es de este proyecto' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger misiones_etapa_valida before insert or update of etapa_id, proyecto_id on public.misiones
  for each row execute function public.misiones_etapa_valida();

-- ¿Ya se habilitó esta misión? Sin etapa o sin fecha de inicio: sí. Con etapa: desde el primer día de su semana (hora de Córdoba).
create function public.mision_habilitada(p_mision uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select m.etapa_id is null
        or p.fecha_inicio is null
        or (now() at time zone 'America/Argentina/Cordoba')::date >= p.fecha_inicio + ((e.semana - 1) * 7)
    from public.misiones m
    join public.proyectos p on p.id = m.proyecto_id
    left join public.etapas e on e.id = m.etapa_id
    where m.id = p_mision
  ), false);
$$;
grant execute on function public.mision_habilitada(uuid) to authenticated;
revoke execute on function public.mision_habilitada(uuid) from public, anon;

-- Quienes editan el proyecto (y la dirección del curso) ven todo el plan; alumnos y familias solo lo ya habilitado.
drop policy misiones_select on public.misiones;
create policy misiones_select on public.misiones for select to authenticated using (
  exists (select 1 from public.proyectos p where p.id = misiones.proyecto_id)
  and (
    public.puede_editar_proyecto(misiones.proyecto_id)
    or exists (select 1 from public.proyectos p where p.id = misiones.proyecto_id and public.es_directivo_del_curso(p.curso_id))
    or public.mision_habilitada(misiones.id)
  )
);

alter table public.etapas enable row level security;
alter table public.etapa_contenidos enable row level security;

create policy etapas_select on public.etapas for select to authenticated using (
  exists (select 1 from public.proyectos p where p.id = etapas.proyecto_id)
);
create policy etapas_insert on public.etapas for insert to authenticated with check (public.puede_editar_proyecto(proyecto_id));
create policy etapas_update on public.etapas for update to authenticated using (public.puede_editar_proyecto(proyecto_id)) with check (public.puede_editar_proyecto(proyecto_id));
create policy etapas_delete on public.etapas for delete to authenticated using (public.puede_editar_proyecto(proyecto_id));

create policy etapa_contenidos_select on public.etapa_contenidos for select to authenticated using (
  exists (select 1 from public.etapas e where e.id = etapa_contenidos.etapa_id)
);
create policy etapa_contenidos_insert on public.etapa_contenidos for insert to authenticated with check (
  exists (select 1 from public.etapas e where e.id = etapa_id and public.puede_editar_proyecto(e.proyecto_id))
);
create policy etapa_contenidos_delete on public.etapa_contenidos for delete to authenticated using (
  exists (select 1 from public.etapas e where e.id = etapa_id and public.puede_editar_proyecto(e.proyecto_id))
);

revoke all on public.etapas, public.etapa_contenidos from anon;
grant select, insert, update, delete on public.etapas to authenticated;
grant select, insert, delete on public.etapa_contenidos to authenticated;

-- La docente puede fijar la fecha de inicio y la cantidad de semanas del proyecto que edita.
-- (La política de update de proyectos ya limita quién puede editar; acá solo se amplía a las columnas nuevas si hace falta.)
