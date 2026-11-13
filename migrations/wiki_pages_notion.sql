-- Kretya Wiki, Notion-like: a page's icon (an emoji, or a picture's URL)
-- and cover (a picture's URL), and databases: a page of kind 'database'
-- holds rows (its subpages) and describes their properties in `schema`
-- ([{ id, name, type, options? }], type text | number | checkbox | date |
-- select | multi_select | url); each row keeps its values in `props`
-- ({ <property id>: value }). Idempotent.

ALTER TABLE public.wiki_pages
  ADD COLUMN IF NOT EXISTS icon text CHECK (length(icon) <= 2000),
  ADD COLUMN IF NOT EXISTS cover text CHECK (length(cover) <= 2000),
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'page',
  ADD COLUMN IF NOT EXISTS schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS props jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wiki_pages_kind_check'
  ) THEN
    ALTER TABLE public.wiki_pages
      ADD CONSTRAINT wiki_pages_kind_check CHECK (kind IN ('page', 'database'));
  END IF;
END
$$;
