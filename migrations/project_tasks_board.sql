-- Project tasks as a Trello-style board, plus comments with @mentions.
--   project_tasks  + status (todo / in_progress / review / done), position
--                  (order inside a column), description
--   project_task_comments  a thread per task; `mentions` holds the profile
--                  ids that were @-mentioned, each gets a notification
-- `done` stays as it was (dashboards and processes.sql read it) and is kept
-- in sync with `status` by a trigger: write either one, the other follows.

-- tasks ----------------------------------------------------------------------
ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS position double precision,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.project_tasks DROP CONSTRAINT IF EXISTS project_tasks_status_check;
ALTER TABLE public.project_tasks ADD CONSTRAINT project_tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'review', 'done'));

-- Backfill: finished tasks go to Done; order each column by creation.
UPDATE public.project_tasks SET status = 'done' WHERE done AND status <> 'done';
UPDATE public.project_tasks t SET position = o.pos
FROM (
  SELECT id, row_number() OVER (
    PARTITION BY project_id, parent_id, status ORDER BY created_at, id
  ) * 1024.0 AS pos
  FROM public.project_tasks
) o
WHERE o.id = t.id AND t.position IS NULL;

CREATE INDEX IF NOT EXISTS project_tasks_board_idx
  ON public.project_tasks (project_id, status, position);

-- status <-> done, completed_at, and a default position at the column end.
CREATE OR REPLACE FUNCTION public.trg_project_tasks_board()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Older writers (processes.sql) insert done = true without a status.
    IF NEW.done AND NEW.status = 'todo' THEN NEW.status := 'done'; END IF;
    NEW.done := NEW.status = 'done';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.done := NEW.status = 'done';
  ELSIF NEW.done IS DISTINCT FROM OLD.done THEN
    NEW.status := CASE WHEN NEW.done THEN 'done' ELSE 'todo' END;
  END IF;

  IF NEW.done THEN
    NEW.completed_at := coalesce(NEW.completed_at, now());
  ELSE
    NEW.completed_at := NULL;
  END IF;

  IF NEW.position IS NULL THEN
    SELECT coalesce(max(position), 0) + 1024 INTO NEW.position
    FROM project_tasks
    WHERE project_id = NEW.project_id
      AND parent_id IS NOT DISTINCT FROM NEW.parent_id
      AND status = NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_tasks_board ON public.project_tasks;
CREATE TRIGGER project_tasks_board
  BEFORE INSERT OR UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_tasks_board();

-- comments -------------------------------------------------------------------
-- project_id is copied from the task (by trigger, never trusted from the
-- client) so RLS and the per-project comment counts need no join.
CREATE TABLE IF NOT EXISTS public.project_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) > 0),
  mentions uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_task_comments_task_idx
  ON public.project_task_comments (task_id, created_at);
CREATE INDEX IF NOT EXISTS project_task_comments_project_idx
  ON public.project_task_comments (project_id);

CREATE OR REPLACE FUNCTION public.trg_project_task_comments_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT project_id INTO NEW.project_id FROM project_tasks WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_task_comments_project ON public.project_task_comments;
CREATE TRIGGER project_task_comments_project
  BEFORE INSERT ON public.project_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_task_comments_project();

-- Same access as the tasks: the project team reads and writes; you post as
-- yourself, and only you (or a stakeholder) can remove your comment.
ALTER TABLE public.project_task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project team reads" ON public.project_task_comments;
CREATE POLICY "Project team reads" ON public.project_task_comments
  FOR SELECT TO authenticated USING (can_access_project(project_id));

DROP POLICY IF EXISTS "Project team comments" ON public.project_task_comments;
CREATE POLICY "Project team comments" ON public.project_task_comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND can_access_project(project_id));

DROP POLICY IF EXISTS "Authors edit comments" ON public.project_task_comments;
CREATE POLICY "Authors edit comments" ON public.project_task_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid() AND can_access_project(project_id));

DROP POLICY IF EXISTS "Authors delete comments" ON public.project_task_comments;
CREATE POLICY "Authors delete comments" ON public.project_task_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_stakeholder());

-- @mention notifications: one per mentioned person, never the author.
CREATE OR REPLACE FUNCTION public.trg_project_task_comments_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_task project_tasks%ROWTYPE;
  v_author text;
BEGIN
  IF coalesce(array_length(NEW.mentions, 1), 0) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_task FROM project_tasks WHERE id = NEW.task_id;
  SELECT coalesce(nullif(btrim(full_name), ''), 'Seseorang') INTO v_author
  FROM profiles WHERE id = NEW.author_id;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT DISTINCT p.id,
    coalesce(v_author, 'Seseorang') || ' menyebut kamu',
    v_task.title || ' · ' || left(NEW.body, 140),
    'mention',
    '/projects/' || v_task.project_id || '/tasks?task=' || v_task.id
  FROM unnest(NEW.mentions) AS m(id)
  JOIN profiles p ON p.id = m.id
  WHERE p.id <> NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_task_comments_notify ON public.project_task_comments;
CREATE TRIGGER project_task_comments_notify
  AFTER INSERT ON public.project_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_task_comments_notify();

REVOKE ALL ON FUNCTION public.trg_project_task_comments_notify() FROM public, anon;
REVOKE ALL ON FUNCTION public.trg_project_task_comments_project() FROM public, anon;
