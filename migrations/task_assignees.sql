-- Tasks get any number of assignees: project_tasks.assignee_ids uuid[].
-- Additive and idempotent. The old single column assignee_id stays and is
-- kept in step by a trigger, so code that still reads or writes it keeps
-- working:
--   assignee_ids written  → assignee_id = the first one (null when empty)
--   assignee_id written   → assignee_ids follows it (old clients)
-- New code writes assignee_ids only. Run before deploying that code.
--
-- Notices, now per assignee (same texts as before):
--   task_assigned  each newly added assignee, never the actor
--   task_status    each assignee who was on it already, never the mover
--   task_comment   every assignee + the creator (minus author, mentioned,
--                  the person replied to)
--   task_due       one row per assignee

ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS assignee_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS project_tasks_assignee_ids
  ON public.project_tasks USING gin (assignee_ids);

-- Backfill. Here, before the notice trigger below starts watching
-- assignee_ids: the current one fires on assignee_id only, so the backfill
-- sends no "Tugas baru". Re-runs match nothing (the sync trigger keeps the
-- two in step).
UPDATE public.project_tasks
SET assignee_ids = ARRAY[assignee_id]
WHERE assignee_id IS NOT NULL
  AND cardinality(assignee_ids) = 0;

-- The array without nulls or repeats, first occurrence kept (order is
-- the order people were added; the first is the one assignee_id shows).
CREATE OR REPLACE FUNCTION public.uuid_array_clean(p uuid[])
RETURNS uuid[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(array_agg(id ORDER BY first), '{}')
  FROM (
    SELECT id, min(n) AS first
    FROM unnest(coalesce(p, '{}')) WITH ORDINALITY AS u(id, n)
    WHERE id IS NOT NULL
    GROUP BY id
  ) s;
$$;

-- ---------------------------------------------------------------------------
-- Sync assignee_id <-> assignee_ids
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_project_tasks_sync_assignees()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF cardinality(coalesce(NEW.assignee_ids, '{}')) = 0
       AND NEW.assignee_id IS NOT NULL THEN
      -- An old client: only the single column.
      NEW.assignee_ids := ARRAY[NEW.assignee_id];
    END IF;
    NEW.assignee_ids := uuid_array_clean(NEW.assignee_ids);
    NEW.assignee_id := NEW.assignee_ids[1];
    RETURN NEW;
  END IF;

  IF NEW.assignee_ids IS DISTINCT FROM OLD.assignee_ids THEN
    NEW.assignee_ids := uuid_array_clean(NEW.assignee_ids);
    NEW.assignee_id := NEW.assignee_ids[1];
  ELSIF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    IF OLD.assignee_id IS NOT NULL AND OLD.assignee_id = ANY (OLD.assignee_ids) THEN
      -- Swap or drop that one person in place, so the others stay: an old
      -- client changing its "PIC", ON DELETE SET NULL from profiles, or
      -- merge_profile_into moving the reference to the new profile.
      NEW.assignee_ids := uuid_array_clean(
        CASE WHEN NEW.assignee_id IS NULL
          THEN array_remove(OLD.assignee_ids, OLD.assignee_id)
          ELSE array_replace(OLD.assignee_ids, OLD.assignee_id, NEW.assignee_id)
        END);
    ELSE
      NEW.assignee_ids := CASE WHEN NEW.assignee_id IS NULL
        THEN '{}'::uuid[] ELSE ARRAY[NEW.assignee_id] END;
    END IF;
    NEW.assignee_id := NEW.assignee_ids[1];
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_tasks_sync_assignees ON public.project_tasks;
CREATE TRIGGER project_tasks_sync_assignees
  BEFORE INSERT OR UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_tasks_sync_assignees();

-- The array has no foreign key: a deleted profile leaves every task's
-- list (assignee_id is cleared by its own ON DELETE SET NULL).
CREATE OR REPLACE FUNCTION public.trg_profiles_drop_task_assignee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE project_tasks
  SET assignee_ids = array_remove(assignee_ids, OLD.id)
  WHERE OLD.id = ANY (assignee_ids);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS profiles_drop_task_assignee ON public.profiles;
CREATE TRIGGER profiles_drop_task_assignee
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_drop_task_assignee();

-- merge_profile_into (profile_merge_on_signin.sql) moves foreign keys
-- only; move the old id in the arrays too, before it runs. Same function
-- with one extra statement at the top.
CREATE OR REPLACE FUNCTION public.merge_profile_into(old_id uuid, new_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r record;
  row_id tid;
BEGIN
  IF old_id IS NULL OR new_id IS NULL OR old_id = new_id THEN RETURN; END IF;
  BEGIN
    UPDATE public.project_tasks
    SET assignee_ids = array_replace(assignee_ids, old_id, new_id)
    WHERE old_id = ANY (assignee_ids);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'merge_profile_into: project_tasks.assignee_ids left as is (%)', SQLERRM;
  END;
  FOR r IN
    SELECT kcu.table_schema s, kcu.table_name t, kcu.column_name c
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = rc.constraint_name
     AND kcu.constraint_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
     AND ccu.constraint_schema = rc.unique_constraint_schema
    WHERE ccu.table_schema = 'public' AND ccu.table_name = 'profiles'
      AND ccu.column_name = 'id'
  LOOP
    BEGIN
      EXECUTE format('UPDATE %I.%I SET %I = $1 WHERE %I = $2', r.s, r.t, r.c, r.c)
        USING new_id, old_id;
    EXCEPTION WHEN unique_violation THEN
      -- Some rows clash with ones the new profile already has (e.g. the
      -- same page access): row by row, move the rest and drop the clashes.
      FOR row_id IN EXECUTE format(
        'SELECT ctid FROM %I.%I WHERE %I = $1', r.s, r.t, r.c) USING old_id
      LOOP
        BEGIN
          EXECUTE format('UPDATE %I.%I SET %I = $1 WHERE ctid = $2', r.s, r.t, r.c)
            USING new_id, row_id;
        EXCEPTION WHEN unique_violation THEN
          EXECUTE format('DELETE FROM %I.%I WHERE ctid = $1', r.s, r.t)
            USING row_id;
        END;
      END LOOP;
    WHEN others THEN
      RAISE WARNING 'merge_profile_into: % .% left as is (%)', r.t, r.c, SQLERRM;
    END;
  END LOOP;
  BEGIN
    DELETE FROM public.profiles WHERE id = old_id;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'merge_profile_into: old profile % kept (%)', old_id, SQLERRM;
  END;
END;
$fn$;

REVOKE ALL ON FUNCTION public.merge_profile_into(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- task_assigned: each newly added assignee
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_project_tasks_notify_assignee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_project text;
  v_id uuid;
BEGIN
  IF cardinality(NEW.assignee_ids) = 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.assignee_ids IS NOT DISTINCT FROM OLD.assignee_ids THEN
    RETURN NEW;
  END IF;
  IF NEW.done THEN RETURN NEW; END IF;

  v_actor := coalesce(auth.uid(), CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by END);

  FOR v_id IN
    SELECT a.id
    FROM unnest(NEW.assignee_ids) AS a(id)
    JOIN profiles p ON p.id = a.id
    WHERE a.id IS DISTINCT FROM v_actor
      AND (TG_OP = 'INSERT' OR NOT (a.id = ANY (OLD.assignee_ids)))
  LOOP
    IF v_project IS NULL THEN
      SELECT name INTO v_project FROM projects WHERE id = NEW.project_id;
    END IF;
    PERFORM create_notification(
      v_id,
      'Tugas baru untukmu',
      left(
        NEW.title || ' · ' || coalesce(v_project, 'Project') ||
          CASE WHEN NEW.due_date IS NOT NULL THEN ' · tenggat ' || tgl_id(NEW.due_date) ELSE '' END,
        140),
      'task_assigned',
      '/projects/' || NEW.project_id || '/tasks?task=' || NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Both columns: a column trigger fires only for columns in the UPDATE's
-- SET list (not ones a BEFORE trigger filled), and old clients set
-- assignee_id.
DROP TRIGGER IF EXISTS project_tasks_notify_assignee ON public.project_tasks;
CREATE TRIGGER project_tasks_notify_assignee
  AFTER INSERT OR UPDATE OF assignee_id, assignee_ids ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_tasks_notify_assignee();

-- ---------------------------------------------------------------------------
-- task_status: someone else moved a task you're on (notify_more.sql)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_project_tasks_notify_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_by text;
  v_project text;
BEGIN
  IF cardinality(NEW.assignee_ids) = 0
     OR NEW.status IS NOT DISTINCT FROM OLD.status
     -- Server jobs (no session) tell nobody.
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(nullif(split_part(btrim(full_name), ' ', 1), ''), 'Seseorang')
    INTO v_by FROM profiles WHERE id = auth.uid();
  SELECT name INTO v_project FROM projects WHERE id = NEW.project_id;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT a.id,
    left(coalesce(v_by, 'Seseorang') || ' mindahin tugasmu ke ' || task_status_label(NEW.status), 120),
    left(NEW.title || ' · ' || coalesce(v_project, 'project') || ' · dari ' || task_status_label(OLD.status), 140),
    'task_status',
    '/projects/' || NEW.project_id || '/tasks?task=' || NEW.id
  FROM unnest(NEW.assignee_ids) AS a(id)
  JOIN profiles p ON p.id = a.id
  -- Your own move tells you nothing.
  WHERE a.id <> auth.uid()
    -- Added in the same save: they get "Tugas baru" instead.
    AND a.id = ANY (OLD.assignee_ids);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_tasks_notify_status ON public.project_tasks;
CREATE TRIGGER project_tasks_notify_status
  AFTER UPDATE OF status ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_tasks_notify_status();

-- ---------------------------------------------------------------------------
-- task_comment: every assignee + the creator (task_comment_replies.sql)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_project_task_comments_notify_followers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task project_tasks%ROWTYPE;
  v_author text;
  v_replied_to uuid;
BEGIN
  SELECT * INTO v_task FROM project_tasks WHERE id = NEW.task_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT coalesce(nullif(btrim(full_name), ''), 'Seseorang') INTO v_author
  FROM profiles WHERE id = NEW.author_id;
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO v_replied_to
    FROM project_task_comments WHERE id = NEW.parent_id;
  END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT DISTINCT p.id,
    left(coalesce(v_author, 'Seseorang'), 28) || ' berkomentar',
    left(v_task.title || ' · ' || regexp_replace(btrim(NEW.body), '\s+', ' ', 'g'), 140),
    'task_comment',
    '/projects/' || v_task.project_id || '/tasks?task=' || v_task.id
  FROM unnest(coalesce(v_task.assignee_ids, '{}') || v_task.created_by) AS r(id)
  JOIN profiles p ON p.id = r.id
  WHERE p.id <> NEW.author_id
    -- @mentioned people already get the "mention" notice for this comment.
    AND NOT (p.id = ANY (coalesce(NEW.mentions, '{}')))
    AND p.id IS DISTINCT FROM v_replied_to;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- task_due: one row per assignee (notify_more.sql; same schedule)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_task_due_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_count integer;
BEGIN
  WITH due AS (
    SELECT t.id, t.project_id, t.title, t.due_date, a.id AS assignee_id, pr.name AS project,
      CASE
        WHEN t.due_date = v_today + 1 THEN 'Tenggat besok'
        WHEN t.due_date = v_today THEN 'Tenggat hari ini'
        ELSE 'Lewat tenggat'
      END AS kind
    FROM project_tasks t
    JOIN projects pr ON pr.id = t.project_id
    CROSS JOIN LATERAL unnest(t.assignee_ids) AS a(id)
    WHERE NOT t.done
      AND t.due_date IN (v_today + 1, v_today, v_today - 1)
  )
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT d.assignee_id,
    d.kind,
    left(d.title || ' · ' || d.project || ' · tenggat ' || tgl_id(d.due_date), 140),
    'task_due',
    '/projects/' || d.project_id || '/tasks?task=' || d.id
  FROM due d
  JOIN profiles p ON p.id = d.assignee_id
  -- Once per task per kind per person (and so a re-run the same day sends nothing).
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = d.assignee_id
      AND n.type = 'task_due'
      AND n.title = d.kind
      AND n.link = '/projects/' || d.project_id || '/tasks?task=' || d.id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.run_task_due_reminders() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
