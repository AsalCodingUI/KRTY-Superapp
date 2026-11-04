-- Replies to task comments (one level: a reply to a reply hangs off the
-- same top comment), and a notice to the person replied to. Idempotent.

ALTER TABLE public.project_task_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid
    REFERENCES public.project_task_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS project_task_comments_parent
  ON public.project_task_comments (parent_id);

-- A reply stays on its comment's task and one level deep.
CREATE OR REPLACE FUNCTION public.trg_project_task_comments_parent()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE v_parent project_task_comments%ROWTYPE;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO v_parent FROM project_task_comments WHERE id = NEW.parent_id;
  IF NOT FOUND OR v_parent.task_id <> NEW.task_id THEN
    NEW.parent_id := NULL;
  ELSIF v_parent.parent_id IS NOT NULL THEN
    NEW.parent_id := v_parent.parent_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_task_comments_parent ON public.project_task_comments;
CREATE TRIGGER project_task_comments_parent
  BEFORE INSERT ON public.project_task_comments
  FOR EACH ROW EXECUTE FUNCTION trg_project_task_comments_parent();

-- "X membalas komentarmu" to the author of the comment replied to (unless
-- they wrote the reply, or it mentions them: that notice already goes).
CREATE OR REPLACE FUNCTION public.trg_project_task_comments_notify_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_task project_tasks%ROWTYPE;
  v_to uuid;
  v_author text;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT author_id INTO v_to FROM project_task_comments WHERE id = NEW.parent_id;
  IF v_to IS NULL OR v_to = NEW.author_id
     OR v_to = ANY (coalesce(NEW.mentions, '{}')) THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_task FROM project_tasks WHERE id = NEW.task_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT coalesce(nullif(btrim(full_name), ''), 'Seseorang') INTO v_author
  FROM profiles WHERE id = NEW.author_id;
  INSERT INTO notifications (user_id, actor_id, title, message, type, link)
  VALUES (
    v_to, NEW.author_id,
    left(coalesce(v_author, 'Seseorang'), 28) || ' membalas komentarmu',
    left(v_task.title || ' · ' || regexp_replace(btrim(NEW.body), '\s+', ' ', 'g'), 140),
    'task_comment',
    '/projects/' || v_task.project_id || '/tasks?task=' || v_task.id
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_task_comments_notify_reply ON public.project_task_comments;
CREATE TRIGGER project_task_comments_notify_reply
  AFTER INSERT ON public.project_task_comments
  FOR EACH ROW EXECUTE FUNCTION trg_project_task_comments_notify_reply();

-- The usual "X berkomentar" skips the person replied to (they get the
-- reply notice instead).
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
  FROM unnest(ARRAY[v_task.assignee_id, v_task.created_by]) AS r(id)
  JOIN profiles p ON p.id = r.id
  WHERE p.id <> NEW.author_id
    -- @mentioned people already get the "mention" notice for this comment.
    AND NOT (p.id = ANY (coalesce(NEW.mentions, '{}')))
    AND p.id IS DISTINCT FROM v_replied_to;

  RETURN NEW;
END;
$function$;

NOTIFY pgrst, 'reload schema';
