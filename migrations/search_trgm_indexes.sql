-- ⌘K global search: trigram indexes for the ILIKE '%term%' filters in
-- src/widgets/global-search/model/useGlobalSearch.ts. A plain btree can't
-- serve a leading-wildcard ILIKE; a GIN trigram index can, so each search
-- stops scanning whole tables as they grow.
--
-- Additive and optional: the app works the same without it (just slower
-- searches on large tables). Safe to re-run.
--
-- pg_trgm goes in the `extensions` schema (Supabase convention), so the
-- operator class is qualified. CONCURRENTLY: no write lock while building;
-- run it outside a transaction (not with psql -1).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- projects: name OR client_name
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_name_trgm_idx
  ON public.projects USING gin (name extensions.gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_client_name_trgm_idx
  ON public.projects USING gin (client_name extensions.gin_trgm_ops);

-- project_tasks: title
CREATE INDEX CONCURRENTLY IF NOT EXISTS project_tasks_title_trgm_idx
  ON public.project_tasks USING gin (title extensions.gin_trgm_ops);

-- project_documents: title
CREATE INDEX CONCURRENTLY IF NOT EXISTS project_documents_title_trgm_idx
  ON public.project_documents USING gin (title extensions.gin_trgm_ops);

-- project_files: name
CREATE INDEX CONCURRENTLY IF NOT EXISTS project_files_name_trgm_idx
  ON public.project_files USING gin (name extensions.gin_trgm_ops);

-- policy_documents: title
CREATE INDEX CONCURRENTLY IF NOT EXISTS policy_documents_title_trgm_idx
  ON public.policy_documents USING gin (title extensions.gin_trgm_ops);

-- profiles: full_name OR email
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_full_name_trgm_idx
  ON public.profiles USING gin (full_name extensions.gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_email_trgm_idx
  ON public.profiles USING gin (email extensions.gin_trgm_ops);
