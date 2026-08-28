-- Upgrade bridge for environments that already applied the first reconciliation.
-- This migration remains deliberately limited to the partially implemented
-- profile, trust and social domains.

begin;

-- The live baseline already owns equivalent indexes through UNIQUE constraints
-- and idx_posts_created_at. Drop the redundant reconciliation indexes without
-- touching their backing constraints.
drop index if exists public.uq_conversation_participant;
drop index if exists public.uq_post_reaction;
drop index if exists public.idx_posts_created;

-- Foreign-key indexes keep moderation/reporting queries and cascades bounded.
create index if not exists idx_abuse_reports_reporter
  on public.abuse_reports(reporter_id, created_at desc);
create index if not exists idx_abuse_reports_target_user
  on public.abuse_reports(target_user_id, created_at desc)
  where target_user_id is not null;
create index if not exists idx_abuse_reports_assigned_to
  on public.abuse_reports(assigned_to, created_at desc)
  where assigned_to is not null;
create index if not exists idx_abuse_reports_conversation
  on public.abuse_reports(conversation_id, created_at desc)
  where conversation_id is not null;
create index if not exists idx_abuse_reports_message
  on public.abuse_reports(message_id, created_at desc)
  where message_id is not null;
create index if not exists idx_abuse_reports_post
  on public.abuse_reports(post_id, created_at desc)
  where post_id is not null;

-- Profile mutations use update_my_profile(jsonb), whose allow-list and
-- current-user binding are enforced server-side. Direct table UPDATE is not
-- needed by the browser and would unnecessarily widen the attack surface.
revoke update on table public.profiles from authenticated;

commit;
