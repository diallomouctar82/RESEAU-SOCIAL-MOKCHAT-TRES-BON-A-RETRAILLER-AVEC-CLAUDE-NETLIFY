
create or replace function public.validate_task_dependency()
returns trigger
language plpgsql
set search_path = public
as $func$
begin
  if new.depends_on_task_id is not null then
    if new.depends_on_task_id = new.id then
      raise exception 'a task cannot depend on itself';
    end if;
    if not exists (
      select 1 from public.tasks
      where id = new.depends_on_task_id and user_id = new.user_id
    ) then
      raise exception 'dependency task not found or belongs to another user';
    end if;
  end if;
  return new;
end;
$func$;
