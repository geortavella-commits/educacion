-- Hasta 3 pistas por misión, de menos a más ayuda. El alumno las pide de a una y la base cuenta cuántas usó (pistas_usadas).
-- Las pistas viven en misiones_claves (el alumno no las lee): salen solo por la función pedir-pista, de a una.
-- `pista` (la única de antes) queda como columna heredada y se mantiene en sincronía con pistas[0] para no romper lo que ya la usa.

alter table public.misiones_claves
  add column pistas jsonb not null default '[]'::jsonb
  check (jsonb_typeof(pistas) = 'array' and jsonb_array_length(pistas) <= 3);

update public.misiones_claves set pistas = jsonb_build_array(pista) where pista is not null and pistas = '[]'::jsonb;

-- Cuántas pistas tiene la misión: el alumno lo ve (sabe si queda otra para pedir), pero no su contenido.
alter table public.misiones
  add column cantidad_pistas smallint not null default 0 check (cantidad_pistas between 0 and 3);
update public.misiones set cantidad_pistas = 1 where tiene_pista;

-- Misma validación de siempre + normaliza las pistas y mantiene en sincronía `pista`, `tiene_pista` y `cantidad_pistas`.
create or replace function public.misiones_claves_valida()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  t text;
  o jsonb;
  p jsonb;
  texto text;
begin
  select tipo_respuesta, opciones into t, o from public.misiones where id = new.mision_id;
  if t is null then
    raise exception 'la misión no existe' using errcode = '23503';
  end if;

  -- Quien todavía escribe la columna heredada `pista` (sin pistas nuevas) sigue funcionando.
  if (new.pistas is null or new.pistas = '[]'::jsonb) and new.pista is not null then
    new.pistas := jsonb_build_array(new.pista);
  end if;
  p := '[]'::jsonb;
  for texto in select btrim(x) from jsonb_array_elements_text(coalesce(new.pistas, '[]'::jsonb)) x loop
    if char_length(texto) < 3 or char_length(texto) > 400 then
      raise exception 'cada pista tiene que tener entre 3 y 400 letras' using errcode = '23514';
    end if;
    p := p || to_jsonb(texto);
  end loop;
  if jsonb_array_length(p) > 3 then
    raise exception 'una misión tiene hasta 3 pistas' using errcode = '23514';
  end if;
  new.pistas := p;
  new.pista := p ->> 0;

  update public.misiones
    set cantidad_pistas = jsonb_array_length(p), tiene_pista = jsonb_array_length(p) > 0
    where id = new.mision_id;

  if t = 'abierta' then
    new.respuestas := '[]'::jsonb;
    return new;
  end if;
  if jsonb_typeof(new.respuestas) <> 'array' or jsonb_array_length(new.respuestas) not between 1 and 10 then
    raise exception 'la misión necesita entre 1 y 10 respuestas correctas' using errcode = '23514';
  end if;
  if t = 'opcion' and not (
    jsonb_array_length(new.respuestas) = 1
    and exists (select 1 from jsonb_array_elements(o) x where x ->> 'id' = new.respuestas ->> 0)
  ) then
    raise exception 'la respuesta correcta debe ser una de las opciones' using errcode = '23514';
  end if;
  return new;
end;
$$;
