
-- ═══════════════════════════════════════════════════════════
-- Index manquants sur foreign keys (détectés par l'advisor perf)
-- ═══════════════════════════════════════════════════════════
create index idx_agent_chat_sessions_agent on public.agent_chat_sessions(agent_id);
create index idx_career_opportunity_feedback_user on public.career_opportunity_feedback(user_id);
create index idx_certificates_course on public.certificates(course_id);
create index idx_certificates_enrollment on public.certificates(enrollment_id);
create index idx_comments_author on public.comments(author_id);
create index idx_conversations_created_by on public.conversations(created_by);
create index idx_dossier_tasks_step on public.dossier_tasks(step_id);
create index idx_dossiers_lead_agent on public.dossiers(lead_agent_id);
create index idx_live_attendance_participant on public.live_attendance(participant_id);
create index idx_live_gifts_sent_gift on public.live_gifts_sent(gift_id);
create index idx_live_gifts_sent_sender on public.live_gifts_sent(sender_id);
create index idx_live_personal_notes_session on public.live_personal_notes(session_id);
create index idx_live_poll_votes_option on public.live_poll_votes(option_id);
create index idx_live_poll_votes_user on public.live_poll_votes(user_id);
create index idx_live_question_upvotes_user on public.live_question_upvotes(user_id);
create index idx_live_questions_author on public.live_questions(author_id);
create index idx_live_sessions_ai_assistant on public.live_sessions(ai_assistant_id);
create index idx_live_sessions_dossier on public.live_sessions(dossier_id);
create index idx_live_sessions_expert on public.live_sessions(expert_id);
create index idx_live_speakers_agent on public.live_speakers(agent_id);
create index idx_live_speakers_user on public.live_speakers(user_id);
create index idx_live_whiteboard_author on public.live_whiteboard_strokes(author_id);
create index idx_messages_sender on public.messages(sender_id);
create index idx_order_items_product on public.order_items(product_id);
create index idx_post_reactions_user on public.post_reactions(user_id);
create index idx_products_linked_live on public.products(linked_live_id);

-- ═══════════════════════════════════════════════════════════
-- Fix sécurité : get_wallet_balance() n'imposait aucune
-- vérification d'autorisation sur p_user_id — n'importe quel
-- utilisateur connecté pouvait lire le solde de n'importe qui.
-- ═══════════════════════════════════════════════════════════
create or replace function public.get_wallet_balance(p_user_id uuid, p_currency text default 'Credits')
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select case
    when p_user_id = auth.uid() or public.is_admin() then
      coalesce((
        select sum(case when type in ('credit','escrow_release') then amount
                         when type in ('debit','escrow_hold') then -amount
                         else 0 end)
        from public.wallet_transactions
        where user_id = p_user_id and currency = p_currency
      ), 0)
    else null
  end;
$$;
