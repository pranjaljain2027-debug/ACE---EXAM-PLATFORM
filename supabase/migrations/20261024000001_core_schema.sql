-- Heir of Wisdom: core schema
-- Parent owns account, consent, billing and reports. Child uses a restricted Studio
-- inside the parent's authenticated session; parent-only data is protected by a
-- server-side "parent gate" (PIN or fresh password login).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Parents
-- ---------------------------------------------------------------------------
create table public.parent_users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  pin_hash text,
  gate_unlocked_until timestamptz,
  failed_pin_attempts int not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_users (id) on delete cascade,
  consent_type text not null check (consent_type in ('terms', 'privacy', 'coppa_parental_consent', 'reminder_emails')),
  document_version text not null,
  granted boolean not null,
  method text not null default 'email_plus_checkbox',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Children (minimal data: nickname, age, grade, avatar; no legal name or DOB)
-- ---------------------------------------------------------------------------
create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  age int not null check (age between 6 and 12),
  grade text not null check (grade in ('K', '1', '2', '3', '4', '5', '6', '7')),
  avatar text not null default 'owl' check (avatar in ('owl', 'fox', 'turtle', 'whale', 'falcon', 'lion', 'bear', 'otter')),
  avatar_color text not null default '#B98E4C' check (avatar_color ~ '^#[0-9A-Fa-f]{6}$'),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.child_profiles (parent_id);

create table public.learning_goals (
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  goal text not null check (goal in ('general', 'cogat', 'olsat', 'nnat')),
  created_at timestamptz not null default now(),
  primary key (child_id, goal)
);

create table public.learning_schedules (
  child_id uuid primary key references public.child_profiles (id) on delete cascade,
  session_minutes int not null default 15 check (session_minutes in (10, 15, 20)),
  preferred_days text[] not null default '{}',
  reminders_opt_in boolean not null default false,
  audio_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Skills and versioned content
-- ---------------------------------------------------------------------------
create table public.skills (
  id text primary key,
  domain text not null,
  title text not null,
  description text not null default '',
  prerequisites text[] not null default '{}',
  assessment_tags text[] not null default '{}',
  sort_order int not null default 0
);

create table public.activities (
  id text not null,
  content_version int not null default 1 check (content_version > 0),
  title text not null,
  domain text not null,
  skill_id text not null references public.skills (id),
  subskills text[] not null default '{}',
  assessment_tags text[] not null default '{}',
  mode text not null check (mode in ('lesson', 'baseline', 'practice')),
  activity_type text not null check (activity_type in ('sequence', 'matrix', 'analogy', 'classification', 'transformation')),
  age_min int not null default 8,
  age_max int not null default 10,
  prerequisites text[] not null default '{}',
  difficulty jsonb not null default '{"rule_count":1,"reasoning_steps":1,"distractor_complexity":1}'::jsonb,
  payload jsonb not null,        -- public content (no answers)
  answer_key jsonb not null,     -- server-only: correct ids, feedback, misconception tags
  accessibility_metadata jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft' check (review_status in ('draft', 'in_review', 'approved', 'published', 'retired')),
  reviewed_by text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (id, content_version)
);
create index on public.activities (mode, review_status);

-- ---------------------------------------------------------------------------
-- Sessions, attempts, events
-- ---------------------------------------------------------------------------
create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  mode text not null check (mode in ('lesson', 'baseline', 'practice')),
  activity_id text,
  content_version int,
  item_refs jsonb not null default '[]'::jsonb,   -- [{id, version}] for baseline/practice
  state text not null,
  timed boolean not null default false,
  time_limit_seconds int,
  checkpoint jsonb not null default '{}'::jsonb,
  summary jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (state in ('OBSERVE', 'EXPERIMENT', 'DISCOVER', 'APPLY', 'REMEDIATION', 'REFLECT', 'IN_PROGRESS', 'COMPLETE', 'ABANDONED'))
);
create index on public.learning_sessions (child_id, started_at desc);

create table public.activity_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions (id) on delete cascade,
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  activity_id text not null,
  content_version int not null,
  stage text not null check (stage in ('observe', 'discover', 'apply', 'practice', 'baseline')),
  item_id text not null,
  client_event_id uuid not null unique,
  answer jsonb,                 -- null = skipped
  is_correct boolean,
  is_first_attempt boolean not null,
  hint_level int not null default 0,
  assisted boolean not null,
  misconception text,
  time_ms int,
  created_at timestamptz not null default now()
);
create index on public.activity_attempts (session_id, stage, item_id);
create index on public.activity_attempts (child_id, created_at desc);

create table public.interaction_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions (id) on delete cascade,
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  client_event_id uuid not null unique,
  event_type text not null check (event_type in ('shape_action', 'hint', 'stage_view')),
  stage text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.interaction_events (session_id, event_type);

create table public.skill_estimates (
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  skill_id text not null references public.skills (id),
  independent_transfers int not null default 0,
  assisted_transfers int not null default 0,
  failed_transfers int not null default 0,
  discover_with_hints int not null default 0,
  discover_independent int not null default 0,
  practice_correct int not null default 0,
  practice_total int not null default 0,
  first_evidence_at timestamptz,
  last_evidence_at timestamptz,
  status text not null default 'insufficient_evidence',
  updated_at timestamptz not null default now(),
  primary key (child_id, skill_id)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  source_session_id uuid references public.learning_sessions (id) on delete set null,
  kind text not null check (kind in ('remediate', 'new_transfer', 'advance', 'review', 'break', 'continue', 'baseline')),
  activity_id text,
  skill_id text,
  reason text not null,
  created_at timestamptz not null default now()
);
create index on public.recommendations (child_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Billing, privacy, audit
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  parent_id uuid primary key references public.parent_users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'family_monthly')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parent_users (id) on delete set null,
  scope text not null check (scope in ('child', 'account')),
  child_ref uuid,
  status text not null default 'requested' check (status in ('requested', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (actor_id, created_at desc);
