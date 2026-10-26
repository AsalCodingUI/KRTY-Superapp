-- My notes: private notes with a to-do list, one owner each (Project →
-- My notes). Nobody else reads them, stakeholders included.
--   todos: [{ "id": text, "text": text, "done": boolean }] in list order.

CREATE TABLE IF NOT EXISTS public.personal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  todos jsonb NOT NULL DEFAULT '[]'::jsonb,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_notes_user_updated_idx
  ON public.personal_notes (user_id, updated_at DESC);

ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own notes" ON public.personal_notes;
CREATE POLICY "Own notes" ON public.personal_notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS personal_notes_updated_at ON public.personal_notes;
CREATE TRIGGER personal_notes_updated_at
  BEFORE UPDATE ON public.personal_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_notes TO authenticated;
