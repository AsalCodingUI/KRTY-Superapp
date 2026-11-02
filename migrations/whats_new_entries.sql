-- Yang baru (/whats-new): release notes with step-by-step guides, written
-- by stakeholders in the app. Everyone signed in reads the published ones
-- (who an entry is for, `audience`, is filtered in the app, like the rest
-- of the menu); stakeholders read drafts too and write.
--
-- `id` is the entry's slug: its URL (/whats-new/<id>) and the "seen" marker
-- the sidebar keeps per viewer, so it never changes once published.
-- `body` is Markdown from the document editor; its top headings are the
-- guide's sections ("(khusus stakeholder)" / "(PM & stakeholder)" at the
-- end of a heading narrows that section).
--
-- Pictures (thumbnail and in the body) go to the public report-images
-- bucket under the nil-UUID folder, which stakeholders already write
-- (policy_doc_files.sql). The seed's pictures are files in public/whats-new.
--
-- Additive: creates the table if missing and (re)creates only its own
-- policies and trigger.

CREATE TABLE IF NOT EXISTS public.whats_new_entries (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(id) <= 80),
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 400),
  tags text[] NOT NULL DEFAULT '{new}'
    CHECK (tags <@ ARRAY['new', 'improved', 'fixed']::text[]),
  area text NOT NULL DEFAULT 'general' CHECK (area IN (
    'general', 'projects', 'tasks', 'editor', 'ai', 'reports', 'calendar',
    'santuy', 'leave', 'profile', 'desktop'
  )),
  audience text NOT NULL DEFAULT 'everyone'
    CHECK (audience IN ('everyone', 'pm', 'stakeholder')),
  surface text NOT NULL DEFAULT 'app' CHECK (surface IN ('app', 'mac', 'client')),
  thumbnail_url text CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^(https://|/)'),
  body text NOT NULL DEFAULT '' CHECK (length(body) <= 200000),
  published boolean NOT NULL DEFAULT false,
  -- Order within a day (lower first).
  sort integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whats_new_entries_order_idx
  ON public.whats_new_entries (date DESC, sort);

DROP TRIGGER IF EXISTS whats_new_entries_updated_at ON public.whats_new_entries;
CREATE TRIGGER whats_new_entries_updated_at
  BEFORE UPDATE ON public.whats_new_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.whats_new_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Whats new read" ON public.whats_new_entries;
CREATE POLICY "Whats new read" ON public.whats_new_entries
  FOR SELECT TO authenticated
  USING (published OR public.is_stakeholder());

DROP POLICY IF EXISTS "Whats new insert" ON public.whats_new_entries;
CREATE POLICY "Whats new insert" ON public.whats_new_entries
  FOR INSERT TO authenticated
  WITH CHECK (public.is_stakeholder());

DROP POLICY IF EXISTS "Whats new update" ON public.whats_new_entries;
CREATE POLICY "Whats new update" ON public.whats_new_entries
  FOR UPDATE TO authenticated
  USING (public.is_stakeholder())
  WITH CHECK (public.is_stakeholder());

DROP POLICY IF EXISTS "Whats new delete" ON public.whats_new_entries;
CREATE POLICY "Whats new delete" ON public.whats_new_entries
  FOR DELETE TO authenticated
  USING (public.is_stakeholder());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whats_new_entries TO authenticated;
