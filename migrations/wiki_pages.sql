-- Kretya Wiki: the studio's shared pages (how we work, guides, know-how),
-- nested (a page holds subpages). Everyone signed in reads and writes them,
-- like a wiki. The body is Markdown (the document editor's format).
-- Pictures and files go to the public report-images / doc-files buckets
-- under the wiki's folder (a fixed UUID, as their policies cast the first
-- folder to a uuid). Idempotent.

CREATE TABLE IF NOT EXISTS public.wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '' CHECK (length(title) <= 200),
  body text NOT NULL DEFAULT '' CHECK (length(body) <= 200000),
  position double precision NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
    DEFAULT auth.uid(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
    DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX IF NOT EXISTS wiki_pages_parent_idx
  ON public.wiki_pages (parent_id, position);

-- Who changed it last, and when.
CREATE OR REPLACE FUNCTION public.wiki_pages_touch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := coalesce(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wiki_pages_touch ON public.wiki_pages;
CREATE TRIGGER wiki_pages_touch
  BEFORE UPDATE ON public.wiki_pages
  FOR EACH ROW EXECUTE FUNCTION public.wiki_pages_touch();

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wiki pages read" ON public.wiki_pages;
CREATE POLICY "Wiki pages read" ON public.wiki_pages
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Wiki pages insert" ON public.wiki_pages;
CREATE POLICY "Wiki pages insert" ON public.wiki_pages
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Wiki pages update" ON public.wiki_pages;
CREATE POLICY "Wiki pages update" ON public.wiki_pages
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Wiki pages delete" ON public.wiki_pages;
CREATE POLICY "Wiki pages delete" ON public.wiki_pages
  FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_pages TO authenticated;

-- Pictures and attachments in wiki pages: everyone signed in writes them
-- (they edit the pages); everyone reads through the public URL.
DROP POLICY IF EXISTS "Wiki files write" ON storage.objects;
CREATE POLICY "Wiki files write" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('report-images', 'doc-files')
    AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-00000000a1c1'
  )
  WITH CHECK (
    bucket_id IN ('report-images', 'doc-files')
    AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-00000000a1c1'
  );

-- Live: a page someone else edits or adds shows up for everyone.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'wiki_pages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wiki_pages;
  END IF;
END
$$;
