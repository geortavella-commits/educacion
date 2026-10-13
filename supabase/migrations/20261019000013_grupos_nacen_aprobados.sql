-- Los grupos que arma la docente nacen APROBADOS: ella ya los revisó en el formulario antes de crearlos, y el estado "borrador" no
-- protegía nada hoy (la pantalla del alumno todavía no muestra grupos). La regla de seguridad se mantiene: un alumno solo ve un grupo
-- aprobado del que es miembro (grupos_select), así que el estado "borrador" sigue disponible para el futuro.
alter table public.grupos alter column estado set default 'aprobado';
update public.grupos set estado = 'aprobado' where estado = 'borrador';
