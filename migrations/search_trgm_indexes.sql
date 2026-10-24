-- ⌘K global search: trigram indexes for the ILIKE '%term%' filters in
-- src/widgets/global-search/model/useGlobalSearch.ts. A plain btree can't
-- serve a leading-wildcard ILIKE; a GIN trigram index can, so each search
-- stops scanning whole tables as they grow.
--
-- Additive and optional: the app works the same without it (just slower
-- searches on large tables). Safe to re-run.
--
-- On Supabase pg_trgm usually lives in the `extensions` schema, which is on
-- the SQL editor's search_path; if it isn't on yours, qualify the operator
-- class as extensions.gin_trgm_ops.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- projects: name OR client_name
CREATE INDEX IF NOT EXISTS projects_name_trgm_idx
  ON public.projects USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS projects_client_name_trgm_idx
  ON public.projects USING gin (client_name gin_trgm_ops);

-- project_tasks: title
CREATE INDEX IF NOT EXISTS project_tasks_title_trgm_idx
  ON public.project_tasks USING gin (title gin_trgm_ops);

-- project_documents: title
CREATE INDEX IF NOT EXISTS project_documents_title_trgm_idx
  ON public.project_documents USING gin (title gin_trgm_ops);

-- project_files: name
CREATE INDEX IF NOT EXISTS project_files_name_trgm_idx
  ON public.project_files USING gin (name gin_trgm_ops);

-- policy_documents: title
CREATE INDEX IF NOT EXISTS policy_documents_title_trgm_idx
  ON public.policy_documents USING gin (title gin_trgm_ops);

-- profiles: full_name OR email
CREATE INDEX IF NOT EXISTS profiles_full_name_trgm_idx
  ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_email_trgm_idx
  ON public.profiles USING gin (email gin_trgm_ops);
