-- Kretya Wiki: who sees and edits a page, and locking (Notion's Share and
-- Lock page). Idempotent.
--
-- A page is open to everyone signed in (read and write) until someone
-- restricts it (`restricted`): then only its creator and the people listed
-- in wiki_page_members see it (can_edit: and edit it); for anyone else it
-- doesn't exist (hidden from lists, search, links). Subpages follow the
-- nearest restricted page above them (or themselves).
--
-- `locked`: nobody edits the page (title, body, icon, cover, columns,
-- values) until someone who may edit it unlocks it (an accidental-edit
-- guard, as Notion's Lock page). Pictures stay in the public buckets.

ALTER TABLE public.wiki_pages
  ADD COLUMN IF NOT EXISTS restricted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.wiki_page_members (
  page_id uuid NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (page_id, profile_id)
);

CREATE INDEX IF NOT EXISTS wiki_page_members_profile_idx
  ON public.wiki_page_members (profile_id);

-- What the signed-in person may do with a page: 'edit', 'view' or 'none'.
-- SECURITY DEFINER: it reads the pages and members past their own policies
-- (which call it).
CREATE OR REPLACE FUNCTION public.wiki_page_access(p_page uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE up AS (
    SELECT id, parent_id, restricted, created_by, 0 AS depth
    FROM wiki_pages WHERE id = p_page
    UNION ALL
    SELECT w.id, w.parent_id, w.restricted, w.created_by, up.depth + 1
    FROM wiki_pages w JOIN up ON w.id = up.parent_id
    WHERE NOT up.restricted AND up.depth < 50
  ),
  gate AS (
    SELECT id, created_by FROM up WHERE restricted
    ORDER BY depth LIMIT 1
  )
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 'none'
    WHEN NOT EXISTS (SELECT 1 FROM up) THEN 'none'
    WHEN NOT EXISTS (SELECT 1 FROM gate) THEN 'edit'
    WHEN (SELECT created_by FROM gate) = auth.uid() THEN 'edit'
    ELSE coalesce((
      SELECT CASE WHEN m.can_edit THEN 'edit' ELSE 'view' END
      FROM wiki_page_members m
      WHERE m.page_id = (SELECT id FROM gate) AND m.profile_id = auth.uid()
    ), 'none')
  END
$$;

-- The same, as a column of the row: select("..., my_access").
CREATE OR REPLACE FUNCTION public.my_access(page public.wiki_pages)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.wiki_page_access(page.id) $$;

REVOKE ALL ON FUNCTION public.wiki_page_access(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.wiki_page_access(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.my_access(public.wiki_pages) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_access(public.wiki_pages) TO authenticated;

DROP POLICY IF EXISTS "Wiki pages read" ON public.wiki_pages;
CREATE POLICY "Wiki pages read" ON public.wiki_pages
  FOR SELECT TO authenticated
  USING (public.wiki_page_access(id) <> 'none');

-- A new page goes at the top, or under a page you may edit.
DROP POLICY IF EXISTS "Wiki pages insert" ON public.wiki_pages;
CREATE POLICY "Wiki pages insert" ON public.wiki_pages
  FOR INSERT TO authenticated
  WITH CHECK (
    parent_id IS NULL OR public.wiki_page_access(parent_id) = 'edit'
  );

DROP POLICY IF EXISTS "Wiki pages update" ON public.wiki_pages;
CREATE POLICY "Wiki pages update" ON public.wiki_pages
  FOR UPDATE TO authenticated
  USING (public.wiki_page_access(id) = 'edit')
  WITH CHECK (
    parent_id IS NULL OR public.wiki_page_access(parent_id) = 'edit'
  );

DROP POLICY IF EXISTS "Wiki pages delete" ON public.wiki_pages;
CREATE POLICY "Wiki pages delete" ON public.wiki_pages
  FOR DELETE TO authenticated
  USING (public.wiki_page_access(id) = 'edit' AND NOT locked);

-- A locked page keeps its content: only `locked` itself (and where it sits:
-- position, parent) may change until it's unlocked.
CREATE OR REPLACE FUNCTION public.wiki_pages_lock_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.locked AND NEW.locked AND (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.body IS DISTINCT FROM OLD.body OR
    NEW.icon IS DISTINCT FROM OLD.icon OR
    NEW.cover IS DISTINCT FROM OLD.cover OR
    NEW.kind IS DISTINCT FROM OLD.kind OR
    NEW.schema IS DISTINCT FROM OLD.schema OR
    NEW.props IS DISTINCT FROM OLD.props
  ) THEN
    RAISE EXCEPTION 'wiki page is locked' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wiki_pages_lock_guard ON public.wiki_pages;
CREATE TRIGGER wiki_pages_lock_guard
  BEFORE UPDATE ON public.wiki_pages
  FOR EACH ROW EXECUTE FUNCTION public.wiki_pages_lock_guard();

-- Members: seen by whoever sees the page, changed by whoever edits it.
ALTER TABLE public.wiki_page_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wiki members read" ON public.wiki_page_members;
CREATE POLICY "Wiki members read" ON public.wiki_page_members
  FOR SELECT TO authenticated
  USING (public.wiki_page_access(page_id) <> 'none');

DROP POLICY IF EXISTS "Wiki members write" ON public.wiki_page_members;
CREATE POLICY "Wiki members write" ON public.wiki_page_members
  FOR ALL TO authenticated
  USING (public.wiki_page_access(page_id) = 'edit')
  WITH CHECK (public.wiki_page_access(page_id) = 'edit');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_page_members
  TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'wiki_page_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wiki_page_members;
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
