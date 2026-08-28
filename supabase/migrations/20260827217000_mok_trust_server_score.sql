-- MokTrust community score: server-calculated, persisted and explainable.
-- This is deliberately not a KYC, KYB, payment or transaction certification.

begin;

create table if not exists public.mok_trust_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid not null unique references public.abuse_reports(id) on delete restrict,
  outcome text not null check (outcome in ('upheld','dismissed')),
  severity text not null check (severity in ('low','medium','high')),
  reason text not null check (char_length(trim(reason)) between 3 and 4000),
  decided_by uuid not null references public.profiles(id) on delete restrict,
  decided_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mok_trust_findings_user_outcome
  on public.mok_trust_findings(user_id, outcome, decided_at desc);

create table if not exists public.mok_trust_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  confidence smallint not null check (confidence between 0 and 100),
  status text not null check (status in ('insufficient_data','provisional','established')),
  account_age_days integer not null check (account_age_days >= 0),
  contributions_count integer not null check (contributions_count >= 0),
  reactions_received_count integer not null check (reactions_received_count >= 0),
  confirmed_findings_count integer not null check (confirmed_findings_count >= 0),
  components jsonb not null default '{}'::jsonb,
  algorithm_version text not null default 'community-v1',
  calculated_at timestamptz not null default now()
);

alter table public.mok_trust_findings enable row level security;
alter table public.mok_trust_scores enable row level security;

drop policy if exists mok_trust_findings_select_subject_or_moderator on public.mok_trust_findings;
create policy mok_trust_findings_select_subject_or_moderator
on public.mok_trust_findings
for select to authenticated
using (user_id = (select auth.uid()) or private.is_moderator());

drop policy if exists mok_trust_scores_select_self_or_moderator on public.mok_trust_scores;
create policy mok_trust_scores_select_self_or_moderator
on public.mok_trust_scores
for select to authenticated
using (user_id = (select auth.uid()) or private.is_moderator());

-- Only this trusted moderation RPC can turn a report into score evidence.
-- A report that is merely open/in review never affects MokTrust.
create or replace function public.record_mok_trust_finding(
  p_report_id uuid,
  p_outcome text,
  p_severity text,
  p_reason text
)
returns public.mok_trust_findings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_finding public.mok_trust_findings;
begin
  if auth.uid() is null or not private.is_moderator() then
    raise exception 'Moderator role required' using errcode = '42501';
  end if;
  if p_outcome not in ('upheld','dismissed') then
    raise exception 'Invalid finding outcome' using errcode = '22023';
  end if;
  if p_severity not in ('low','medium','high') then
    raise exception 'Invalid finding severity' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'A documented reason is required' using errcode = '22023';
  end if;

  select coalesce(r.target_user_id, p.author_id, m.sender_id)
  into v_user_id
  from public.abuse_reports r
  left join public.posts p on p.id = r.post_id
  left join public.messages m on m.id = r.message_id
  where r.id = p_report_id;

  if v_user_id is null then
    raise exception 'Report has no attributable user' using errcode = '22023';
  end if;

  insert into public.mok_trust_findings (
    user_id, report_id, outcome, severity, reason, decided_by
  ) values (
    v_user_id, p_report_id, p_outcome, p_severity,
    left(trim(p_reason), 4000), auth.uid()
  )
  on conflict (report_id) do update set
    user_id = excluded.user_id,
    outcome = excluded.outcome,
    severity = excluded.severity,
    reason = excluded.reason,
    decided_by = excluded.decided_by,
    decided_at = now(),
    updated_at = now()
  returning * into v_finding;

  update public.abuse_reports r
  set status = case when p_outcome = 'upheld' then 'resolved' else 'dismissed' end,
      resolution = left(trim(p_reason), 4000),
      assigned_to = auth.uid(),
      updated_at = now()
  where r.id = p_report_id;

  perform private.write_audit(
    'mok_trust.finding_recorded',
    'abuse_report',
    p_report_id::text,
    jsonb_build_object('outcome', p_outcome, 'severity', p_severity, 'subject_user_id', v_user_id)
  );

  return v_finding;
end;
$$;

-- Refreshes only the caller's score. The score is a bounded community signal:
-- 35 neutral base + account maturity + contributions + peer reactions
-- - explicit upheld moderation findings. Raw/open reports and blocks are excluded.
create or replace function public.refresh_my_mok_trust_score()
returns table (
  user_id uuid,
  score smallint,
  confidence smallint,
  status text,
  account_age_days integer,
  contributions_count integer,
  reactions_received_count integer,
  confirmed_findings_count integer,
  components jsonb,
  algorithm_version text,
  calculated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_age_days integer;
  v_contributions integer;
  v_reactions integer;
  v_findings integer;
  v_maturity_points integer;
  v_contribution_points integer;
  v_reaction_points integer;
  v_moderation_penalty integer;
  v_score integer;
  v_confidence integer;
  v_status text;
  v_calculated_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select greatest(
    0,
    floor(extract(epoch from (v_calculated_at - p.created_at)) / 86400)::integer
  )
  into v_account_age_days
  from public.profiles p
  where p.id = v_user_id;

  if v_account_age_days is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select
    (select count(*)::integer from public.posts p where p.author_id = v_user_id)
    +
    (select count(*)::integer from public.comments c where c.author_id = v_user_id)
  into v_contributions;

  select count(*)::integer
  into v_reactions
  from public.post_reactions pr
  join public.posts p on p.id = pr.post_id
  where p.author_id = v_user_id
    and pr.user_id <> v_user_id;

  select
    count(*)::integer,
    coalesce(sum(case f.severity when 'low' then 10 when 'medium' then 20 when 'high' then 35 else 0 end), 0)::integer
  into v_findings, v_moderation_penalty
  from public.mok_trust_findings f
  where f.user_id = v_user_id
    and f.outcome = 'upheld';

  v_maturity_points := least(20, v_account_age_days / 30);
  v_contribution_points := least(25, floor(sqrt(v_contributions::numeric) * 5)::integer);
  v_reaction_points := least(20, floor(sqrt(v_reactions::numeric) * 4)::integer);
  v_moderation_penalty := least(60, v_moderation_penalty);
  v_score := greatest(0, least(
    100,
    35 + v_maturity_points + v_contribution_points + v_reaction_points - v_moderation_penalty
  ));
  v_confidence := least(
    100,
    10
      + least(30, v_account_age_days / 10)
      + least(30, v_contributions * 2)
      + least(30, v_reactions * 3)
  );
  v_status := case
    when v_confidence < 30 then 'insufficient_data'
    when v_confidence < 60 then 'provisional'
    else 'established'
  end;

  insert into public.mok_trust_scores (
    user_id, score, confidence, status, account_age_days,
    contributions_count, reactions_received_count, confirmed_findings_count,
    components, algorithm_version, calculated_at
  ) values (
    v_user_id, v_score, v_confidence, v_status, v_account_age_days,
    v_contributions, v_reactions, v_findings,
    jsonb_build_object(
      'neutral_base', 35,
      'account_maturity', v_maturity_points,
      'community_contributions', v_contribution_points,
      'peer_feedback', v_reaction_points,
      'moderation_adjustment', -v_moderation_penalty
    ),
    'community-v1', v_calculated_at
  )
  on conflict (user_id) do update set
    score = excluded.score,
    confidence = excluded.confidence,
    status = excluded.status,
    account_age_days = excluded.account_age_days,
    contributions_count = excluded.contributions_count,
    reactions_received_count = excluded.reactions_received_count,
    confirmed_findings_count = excluded.confirmed_findings_count,
    components = excluded.components,
    algorithm_version = excluded.algorithm_version,
    calculated_at = excluded.calculated_at;

  return query
  select
    s.user_id, s.score, s.confidence, s.status, s.account_age_days,
    s.contributions_count, s.reactions_received_count, s.confirmed_findings_count,
    s.components, s.algorithm_version, s.calculated_at
  from public.mok_trust_scores s
  where s.user_id = v_user_id;
end;
$$;

revoke all on table public.mok_trust_findings from public, anon, authenticated;
revoke all on table public.mok_trust_scores from public, anon, authenticated;
grant select on table public.mok_trust_findings to authenticated;
grant select on table public.mok_trust_scores to authenticated;

revoke all on function public.record_mok_trust_finding(uuid,text,text,text) from public, anon;
revoke all on function public.refresh_my_mok_trust_score() from public, anon;
grant execute on function public.record_mok_trust_finding(uuid,text,text,text) to authenticated;
grant execute on function public.refresh_my_mok_trust_score() to authenticated;

commit;
