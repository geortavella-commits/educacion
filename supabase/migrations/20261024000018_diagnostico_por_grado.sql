-- Diagnóstico inicial según el año del alumno.
-- Hasta ahora eran las mismas 6 preguntas para todos y las respuestas no se guardaban. Ahora:
--   · las preguntas de contenido (matemática y lengua) salen del banco del AÑO en que está inscripto el alumno;
--   · la respuesta correcta vive en una tabla que el navegador no puede leer (se corrige en el servidor);
--   · se guarda solo un resumen por área (aciertos de total), que ve únicamente la docente del alumno.
-- No es una nota ni una comparación con otros chicos: es una foto de dónde empezar.

create table public.diagnostico_items (
  id uuid primary key default gen_random_uuid(),
  nivel text not null check (nivel in ('primaria', 'secundaria')),
  anio smallint not null check (anio between 1 and 7),
  area text not null check (area in ('matematica', 'lengua')),
  orden smallint not null,
  enunciado text not null check (char_length(enunciado) between 5 and 300),
  opciones jsonb not null check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) between 2 and 6),
  correcta text not null
);
alter table public.diagnostico_items enable row level security;
revoke all on public.diagnostico_items from anon, authenticated;

create table public.diagnostico_resultados (
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  area text not null check (area in ('matematica', 'lengua')),
  nivel text not null,
  anio smallint not null,
  aciertos smallint not null check (aciertos >= 0),
  total smallint not null check (total > 0),
  updated_at timestamptz not null default now(),
  primary key (alumno_id, area),
  check (aciertos <= total)
);
alter table public.diagnostico_resultados enable row level security;
create policy diagnostico_resultados_select on public.diagnostico_resultados for select to authenticated
  using (public.es_docente_de_alumno(alumno_id));
revoke all on public.diagnostico_resultados from anon;
grant select on public.diagnostico_resultados to authenticated;

-- Las preguntas del año del alumno que llama, SIN la respuesta correcta.
create or replace function public.diagnostico_preguntas()
returns table (id uuid, area text, orden smallint, enunciado text, opciones jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_nivel text;
  v_anio smallint;
begin
  select c.nivel, c.anio into v_nivel, v_anio
  from public.inscripciones i join public.cursos c on c.id = i.curso_id
  where i.alumno_id = (select auth.uid())
  limit 1;
  if v_nivel is null then
    return;
  end if;
  return query
    select d.id, d.area, d.orden, d.enunciado, d.opciones
    from public.diagnostico_items d
    where d.nivel = v_nivel and d.anio = v_anio
    order by d.area desc, d.orden;
end;
$$;

-- Recibe {id_de_pregunta: id_de_opción}, corrige en el servidor y guarda solo aciertos y total por área.
-- Lo que no se contesta cuenta como no acertado. Devuelve nada: el chico no ve cuántas acertó.
create or replace function public.diagnostico_enviar(p_respuestas jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_nivel text;
  v_anio smallint;
begin
  if v_uid is null or jsonb_typeof(p_respuestas) <> 'object' then
    raise exception 'datos inválidos' using errcode = '22023';
  end if;
  select c.nivel, c.anio into v_nivel, v_anio
  from public.inscripciones i join public.cursos c on c.id = i.curso_id
  where i.alumno_id = v_uid
  limit 1;
  if v_nivel is null then
    raise exception 'sin curso' using errcode = '42501';
  end if;

  insert into public.diagnostico_resultados (alumno_id, area, nivel, anio, aciertos, total, updated_at)
  select v_uid, d.area, v_nivel, v_anio,
         count(*) filter (where p_respuestas ->> d.id::text = d.correcta),
         count(*), now()
  from public.diagnostico_items d
  where d.nivel = v_nivel and d.anio = v_anio
  group by d.area
  on conflict (alumno_id, area) do update
    set nivel = excluded.nivel, anio = excluded.anio, aciertos = excluded.aciertos, total = excluded.total, updated_at = now();
end;
$$;

revoke all on function public.diagnostico_preguntas() from public, anon;
revoke all on function public.diagnostico_enviar(jsonb) from public, anon;
grant execute on function public.diagnostico_preguntas() to authenticated;
grant execute on function public.diagnostico_enviar(jsonb) to authenticated;

insert into public.diagnostico_items (nivel, anio, area, orden, enunciado, opciones, correcta) values
  ('primaria', 1, 'matematica', 1, 'Tenés 3 manzanas y te regalan 2 más. ¿Cuántas manzanas tenés?', '[{"id": "a", "texto": "4"}, {"id": "b", "texto": "5"}, {"id": "c", "texto": "6"}, {"id": "d", "texto": "1"}]'::jsonb, 'b'),
  ('primaria', 1, 'matematica', 2, '¿Qué número va justo después del 19?', '[{"id": "a", "texto": "18"}, {"id": "b", "texto": "29"}, {"id": "c", "texto": "20"}, {"id": "d", "texto": "21"}]'::jsonb, 'c'),
  ('primaria', 1, 'lengua', 3, '¿Qué palabra rima con "gato"?', '[{"id": "a", "texto": "perro"}, {"id": "b", "texto": "pato"}, {"id": "c", "texto": "luna"}, {"id": "d", "texto": "mesa"}]'::jsonb, 'b'),
  ('primaria', 2, 'matematica', 1, 'En el aula hay 14 sillas y se suman 6 más. ¿Cuántas sillas hay ahora?', '[{"id": "a", "texto": "8"}, {"id": "b", "texto": "18"}, {"id": "c", "texto": "20"}, {"id": "d", "texto": "22"}]'::jsonb, 'c'),
  ('primaria', 2, 'matematica', 2, 'Mateo tenía 25 figuritas y regaló 8. ¿Cuántas le quedan?', '[{"id": "a", "texto": "33"}, {"id": "b", "texto": "16"}, {"id": "c", "texto": "18"}, {"id": "d", "texto": "17"}]'::jsonb, 'd'),
  ('primaria', 2, 'lengua', 3, '¿Cuántas sílabas tiene la palabra "mariposa"?', '[{"id": "a", "texto": "2"}, {"id": "b", "texto": "3"}, {"id": "c", "texto": "4"}, {"id": "d", "texto": "5"}]'::jsonb, 'c'),
  ('primaria', 3, 'matematica', 1, 'En 4 bolsas hay 6 caramelos en cada una. ¿Cuántos caramelos hay en total?', '[{"id": "a", "texto": "10"}, {"id": "b", "texto": "24"}, {"id": "c", "texto": "20"}, {"id": "d", "texto": "64"}]'::jsonb, 'b'),
  ('primaria', 3, 'matematica', 2, 'Hay 12 figuritas. Las repartís en partes iguales entre 3 amigos. ¿Cuántas le tocan a cada uno?', '[{"id": "a", "texto": "3"}, {"id": "b", "texto": "4"}, {"id": "c", "texto": "6"}, {"id": "d", "texto": "9"}]'::jsonb, 'b'),
  ('primaria', 3, 'lengua', 3, '¿Cuál de estas palabras es un sustantivo (nombra a una persona, animal o cosa)?', '[{"id": "a", "texto": "correr"}, {"id": "b", "texto": "hermoso"}, {"id": "c", "texto": "rápido"}, {"id": "d", "texto": "perro"}]'::jsonb, 'd'),
  ('primaria', 4, 'matematica', 1, 'Un cuaderno cuesta $350. ¿Cuánto cuestan 3 cuadernos?', '[{"id": "a", "texto": "$650"}, {"id": "b", "texto": "$1.150"}, {"id": "c", "texto": "$1.050"}, {"id": "d", "texto": "$1.500"}]'::jsonb, 'c'),
  ('primaria', 4, 'matematica', 2, '¿Cuál de estas fracciones es la más grande?', '[{"id": "a", "texto": "1/4"}, {"id": "b", "texto": "1/2"}, {"id": "c", "texto": "1/8"}, {"id": "d", "texto": "1/5"}]'::jsonb, 'b'),
  ('primaria', 4, 'lengua', 3, 'En la oración "Los chicos corren en el patio", ¿cuál es el verbo?', '[{"id": "a", "texto": "chicos"}, {"id": "b", "texto": "patio"}, {"id": "c", "texto": "corren"}, {"id": "d", "texto": "los"}]'::jsonb, 'c'),
  ('primaria', 5, 'matematica', 1, 'Una pizza se divide en 8 porciones iguales y comés 3. ¿Qué fracción de la pizza comiste?', '[{"id": "a", "texto": "3/5"}, {"id": "b", "texto": "5/8"}, {"id": "c", "texto": "8/3"}, {"id": "d", "texto": "3/8"}]'::jsonb, 'd'),
  ('primaria', 5, 'matematica', 2, '¿Cuánto es 2,5 + 1,75?', '[{"id": "a", "texto": "3,25"}, {"id": "b", "texto": "4,25"}, {"id": "c", "texto": "3,80"}, {"id": "d", "texto": "4,30"}]'::jsonb, 'b'),
  ('primaria', 5, 'lengua', 3, 'En "Los recursos eran escasos", ¿qué significa "escasos"?', '[{"id": "a", "texto": "abundantes"}, {"id": "b", "texto": "caros"}, {"id": "c", "texto": "pocos"}, {"id": "d", "texto": "nuevos"}]'::jsonb, 'c'),
  ('primaria', 6, 'matematica', 1, 'Un rectángulo mide 8 cm de largo y 5 cm de ancho. ¿Cuál es su perímetro?', '[{"id": "a", "texto": "13 cm"}, {"id": "b", "texto": "40 cm"}, {"id": "c", "texto": "26 cm"}, {"id": "d", "texto": "30 cm"}]'::jsonb, 'c'),
  ('primaria', 6, 'matematica', 2, '¿Cuánto es el 25% de 80?', '[{"id": "a", "texto": "25"}, {"id": "b", "texto": "20"}, {"id": "c", "texto": "40"}, {"id": "d", "texto": "55"}]'::jsonb, 'b'),
  ('primaria', 6, 'lengua', 3, 'Un texto explica cómo viven los pingüinos y de qué se alimentan. ¿Qué tipo de texto es?', '[{"id": "a", "texto": "narrativo"}, {"id": "b", "texto": "poético"}, {"id": "c", "texto": "informativo"}, {"id": "d", "texto": "teatral"}]'::jsonb, 'c');
