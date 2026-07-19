-- =============================================================================
-- Elite Living Investment Partners — lead capture schema
-- -----------------------------------------------------------------------------
-- Run this in your NEW, DEDICATED Supabase project (SQL Editor → New query).
-- This is a fresh, standalone backend — do NOT reuse another project.
--
-- Security model:
--   * RLS is ON and there is NO public/anon insert policy.
--   * The public website NEVER writes to this table directly.
--   * Only the `submit-lead` edge function (using the service role key,
--     which bypasses RLS) inserts rows, after it validates + rate-limits.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text,
  vertical    text,          -- business / vertical the applicant selected
  message     text,
  source      text,          -- which page the form was submitted from
  user_agent  text,
  ip_hash     text           -- hashed IP (never store raw IP), for throttling/abuse
);

-- Helpful indexes
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_ip_hash_created_idx on public.leads (ip_hash, created_at desc);

-- Turn on Row Level Security. With RLS enabled and NO policies granting the
-- anon/authenticated roles insert access, client-side keys cannot write here.
-- The edge function uses the service role key, which bypasses RLS entirely.
alter table public.leads enable row level security;

-- (Intentionally) no policies are created for anon/authenticated roles.
-- If you later build an internal dashboard, add a SELECT policy scoped to
-- your authenticated admin users only.
