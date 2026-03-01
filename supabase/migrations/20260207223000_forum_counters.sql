-- Forum counters helpers used by the app.
-- The client updates vote/answer counters via RPC to avoid relying on PostgREST "computed updates".

create or replace function public.increment_forum_question_answer_count(question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_questions
  set answer_count = coalesce(answer_count, 0) + 1
  where id = question_id;
end;
$$;

create or replace function public.adjust_forum_question_upvote_count(question_id uuid, delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_questions
  set upvote_count = coalesce(upvote_count, 0) + coalesce(delta, 0)
  where id = question_id;
end;
$$;

create or replace function public.adjust_forum_answer_upvote_count(answer_id uuid, delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_answers
  set upvote_count = coalesce(upvote_count, 0) + coalesce(delta, 0)
  where id = answer_id;
end;
$$;

revoke all on function public.increment_forum_question_answer_count(uuid) from public;
revoke all on function public.adjust_forum_question_upvote_count(uuid, integer) from public;
revoke all on function public.adjust_forum_answer_upvote_count(uuid, integer) from public;

grant execute on function public.increment_forum_question_answer_count(uuid) to authenticated;
grant execute on function public.adjust_forum_question_upvote_count(uuid, integer) to authenticated;
grant execute on function public.adjust_forum_answer_upvote_count(uuid, integer) to authenticated;

