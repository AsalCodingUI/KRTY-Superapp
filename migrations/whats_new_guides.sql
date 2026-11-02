-- Yang baru: "Panduan dasar". Guides to the core features live in
-- whats_new_entries too, tagged 'guide' (listed apart from the updates and
-- left out of the sidebar's "Ada yang baru"), with areas for the parts of
-- the app the first entries didn't cover.
--
-- Additive: widens the tag and area checks (every existing value stays
-- allowed). The guides themselves are rows, written from the app.

ALTER TABLE public.whats_new_entries
  DROP CONSTRAINT IF EXISTS whats_new_entries_tags_check;
ALTER TABLE public.whats_new_entries
  ADD CONSTRAINT whats_new_entries_tags_check
  CHECK (tags <@ ARRAY['new', 'improved', 'fixed', 'guide']::text[]);

ALTER TABLE public.whats_new_entries
  DROP CONSTRAINT IF EXISTS whats_new_entries_area_check;
ALTER TABLE public.whats_new_entries
  ADD CONSTRAINT whats_new_entries_area_check CHECK (area IN (
    'general', 'projects', 'tasks', 'editor', 'ai', 'reports', 'calendar',
    'santuy', 'leave', 'profile', 'desktop',
    'clients', 'processes', 'finance', 'performance', 'team', 'policies'
  ));
