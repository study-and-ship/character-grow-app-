-- Reward-bearing state can only be changed through the audited SECURITY DEFINER RPCs.
revoke insert, update, delete on table public.profiles from authenticated;
revoke insert, update, delete on table public.characters from authenticated;
revoke insert, update, delete on table public.quiz_sessions from authenticated;
revoke insert, update, delete on table public.quiz_session_questions from authenticated;
revoke insert, update, delete on table public.user_question_answers from authenticated;
revoke insert, update, delete on table public.user_items from authenticated;
revoke insert, update, delete on table public.character_equipment from authenticated;
revoke insert, update, delete on table public.user_streaks from authenticated;

-- Published question text/choice policies exposed answer metadata on the base tables.
-- Quiz delivery remains available only through get_quiz_session/start_today_quiz RPCs.
drop policy if exists "questions_select_published_user" on public.questions;
drop policy if exists "read published questions" on public.questions;
drop policy if exists "read choices of published questions" on public.question_choices;
revoke select on table public.questions from authenticated;
revoke select on table public.question_choices from authenticated;
