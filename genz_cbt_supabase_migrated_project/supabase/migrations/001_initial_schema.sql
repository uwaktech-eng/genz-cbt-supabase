create extension if not exists pgcrypto;

create type public.app_role as enum ('principal_admin','subadmin','admin','student');
create type public.permission_code_status as enum ('active','used','revoked');
create type public.proctoring_kind as enum ('snapshot','audio','video','screen');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role public.app_role not null,
  full_name text not null default '',
  reg_id text unique,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_student_regid_check check ((role = 'student' and reg_id is not null) or role <> 'student' or reg_id is null)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  portal_locked boolean not null default false,
  portal_notice text not null default '',
  result_brand_name text not null default 'Genz EduTech Innovations',
  result_brand_logo_url text not null default '',
  result_signature_url text not null default '',
  site_favicon_url text not null default '',
  site_hero_title text not null default 'Genz CBT Pro',
  site_hero_subtitle text not null default 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
  site_hero_badge text not null default 'Trusted digital assessment experience',
  site_about_title text not null default 'About Genz CBT Pro',
  site_about_text text not null default '',
  ceo_name text not null default '',
  ceo_title text not null default '',
  ceo_image_url text not null default '',
  ceo_bio text not null default '',
  contributors jsonb not null default '[]'::jsonb,
  institutions jsonb not null default '[]'::jsonb,
  testimonials jsonb not null default '[]'::jsonb,
  tutorial_videos jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  contact_email text not null default '',
  contact_phone text not null default '',
  contact_address text not null default '',
  terms_content text not null default '',
  privacy_content text not null default '',
  cookies_content text not null default '',
  subadmin_token_hash text,
  subadmin_token_ttl_minutes integer not null default 60 check (subadmin_token_ttl_minutes between 5 and 1440),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  reg_id text not null unique,
  full_name text not null,
  passport_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  exam_code text not null unique,
  title text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  show_score_summary boolean not null default true,
  allow_review boolean not null default false,
  shuffle_questions boolean not null default false,
  pass_mark integer not null default 50 check (pass_mark between 0 and 100),
  result_message text not null default '',
  is_active boolean not null default false,
  is_current boolean not null default false,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  exam_locked boolean not null default false,
  lock_notice text not null default '',
  capture_snapshots boolean not null default true,
  record_audio boolean not null default false,
  record_video boolean not null default false,
  record_screen boolean not null default false,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  image_url text,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  display_order integer not null,
  is_deleted boolean not null default false,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, display_order)
);

create table if not exists public.permission_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  exam_id uuid not null references public.exams(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  student_user_id uuid references public.profiles(id) on delete set null,
  reason text not null default '',
  status public.permission_code_status not null default 'active',
  used_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.exam_progress (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  remaining_seconds integer not null default 0,
  answers_json jsonb not null default '[]'::jsonb,
  violation_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(exam_id, student_user_id)
);

create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  attempt_no integer not null check (attempt_no > 0),
  submitted_at timestamptz not null default now(),
  score integer not null default 0,
  total integer not null default 0,
  percentage numeric(5,2) not null default 0,
  pass_mark integer not null default 50 check (pass_mark between 0 and 100),
  show_score_summary boolean not null default true,
  allow_review boolean not null default false,
  pass_status text not null default '',
  ranking text not null default '',
  passed_nos text[] not null default '{}'::text[],
  failed_nos text[] not null default '{}'::text[],
  answers_json jsonb not null default '[]'::jsonb,
  review_json jsonb not null default '[]'::jsonb,
  status_message text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  published_by uuid references public.profiles(id),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

create table if not exists public.proctoring_files (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  kind public.proctoring_kind not null,
  storage_bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text not null default '',
  duration_seconds integer,
  segment_label text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

create table if not exists public.subadmin_action_sessions (
  id uuid primary key default gen_random_uuid(),
  subadmin_user_id uuid not null references public.profiles(id) on delete cascade,
  session_token_hash text not null,
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_reg_id on public.profiles(reg_id);
create index if not exists idx_candidates_reg_id on public.candidates(reg_id);
create index if not exists idx_exams_exam_code on public.exams(exam_code);
create index if not exists idx_exam_questions_exam on public.exam_questions(exam_id, display_order);
create index if not exists idx_permission_codes_exam_status on public.permission_codes(exam_id, status);
create index if not exists idx_exam_progress_student on public.exam_progress(student_user_id, updated_at desc);
create index if not exists idx_exam_results_exam on public.exam_results(exam_id, submitted_at desc);
create index if not exists idx_exam_results_student_published on public.exam_results(student_user_id, is_published) where deleted_at is null;
create index if not exists idx_proctoring_exam_student on public.proctoring_files(exam_id, student_user_id, kind);
create index if not exists idx_subadmin_action_sessions_active on public.subadmin_action_sessions(subadmin_user_id, is_active, expires_at);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_site_settings_set_updated_at on public.site_settings;
create trigger trg_site_settings_set_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists trg_candidates_set_updated_at on public.candidates;
create trigger trg_candidates_set_updated_at before update on public.candidates for each row execute function public.set_updated_at();
drop trigger if exists trg_exams_set_updated_at on public.exams;
create trigger trg_exams_set_updated_at before update on public.exams for each row execute function public.set_updated_at();
drop trigger if exists trg_exam_questions_set_updated_at on public.exam_questions;
create trigger trg_exam_questions_set_updated_at before update on public.exam_questions for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_app_role() in ('principal_admin','subadmin','admin'), false)
$$;

create or replace function public.is_principal_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_app_role() = 'principal_admin', false)
$$;

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.candidates enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.permission_codes enable row level security;
alter table public.exam_progress enable row level security;
alter table public.exam_results enable row level security;
alter table public.proctoring_files enable row level security;
alter table public.subadmin_action_sessions enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists site_settings_public_select on public.site_settings;
create policy site_settings_public_select on public.site_settings for select to anon, authenticated using (true);
drop policy if exists site_settings_principal_update on public.site_settings;
create policy site_settings_principal_update on public.site_settings for update to authenticated using (public.is_principal_admin()) with check (public.is_principal_admin());

drop policy if exists candidates_admin_all on public.candidates;
create policy candidates_admin_all on public.candidates for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists candidates_student_own_select on public.candidates;
create policy candidates_student_own_select on public.candidates for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.reg_id = candidates.reg_id and p.role = 'student' and p.deleted_at is null and p.is_active)
);

drop policy if exists exams_public_select on public.exams;
create policy exams_public_select on public.exams for select to anon, authenticated using (is_active = true and is_archived = false and is_deleted = false);
drop policy if exists exams_admin_all on public.exams;
create policy exams_admin_all on public.exams for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists exam_questions_admin_all on public.exam_questions;
create policy exam_questions_admin_all on public.exam_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists permission_codes_admin_all on public.permission_codes;
create policy permission_codes_admin_all on public.permission_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists exam_progress_student_select on public.exam_progress;
create policy exam_progress_student_select on public.exam_progress for select to authenticated using (student_user_id = auth.uid());
drop policy if exists exam_progress_student_insert on public.exam_progress;
create policy exam_progress_student_insert on public.exam_progress for insert to authenticated with check (student_user_id = auth.uid());
drop policy if exists exam_progress_student_update on public.exam_progress;
create policy exam_progress_student_update on public.exam_progress for update to authenticated using (student_user_id = auth.uid()) with check (student_user_id = auth.uid());
drop policy if exists exam_progress_admin_select on public.exam_progress;
create policy exam_progress_admin_select on public.exam_progress for select to authenticated using (public.is_admin());

drop policy if exists exam_results_student_published_select on public.exam_results;
create policy exam_results_student_published_select on public.exam_results for select to authenticated using (student_user_id = auth.uid() and is_published = true and deleted_at is null);
drop policy if exists exam_results_admin_select on public.exam_results;
create policy exam_results_admin_select on public.exam_results for select to authenticated using (public.is_admin());

drop policy if exists proctoring_files_student_select on public.proctoring_files;
create policy proctoring_files_student_select on public.proctoring_files for select to authenticated using (student_user_id = auth.uid() and deleted_at is null);
drop policy if exists proctoring_files_student_insert on public.proctoring_files;
create policy proctoring_files_student_insert on public.proctoring_files for insert to authenticated with check (student_user_id = auth.uid());
drop policy if exists proctoring_files_admin_select on public.proctoring_files;
create policy proctoring_files_admin_select on public.proctoring_files for select to authenticated using (public.is_admin());
drop policy if exists proctoring_files_admin_update on public.proctoring_files;
create policy proctoring_files_admin_update on public.proctoring_files for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists subadmin_action_sessions_self_select on public.subadmin_action_sessions;
create policy subadmin_action_sessions_self_select on public.subadmin_action_sessions for select to authenticated using (subadmin_user_id = auth.uid());
drop policy if exists subadmin_action_sessions_principal_select on public.subadmin_action_sessions;
create policy subadmin_action_sessions_principal_select on public.subadmin_action_sessions for select to authenticated using (public.is_principal_admin());

insert into public.site_settings default values on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('proctoring-private', 'proctoring-private', false)
on conflict (id) do nothing;

drop policy if exists "public assets are readable" on storage.objects;
create policy "public assets are readable" on storage.objects for select to public using (bucket_id = 'public-assets');
drop policy if exists "authenticated proctoring uploads" on storage.objects;
create policy "authenticated proctoring uploads" on storage.objects for insert to authenticated with check (bucket_id = 'proctoring-private');
drop policy if exists "admins read proctoring objects" on storage.objects;
create policy "admins read proctoring objects" on storage.objects for select to authenticated using (bucket_id = 'proctoring-private' and public.is_admin());
