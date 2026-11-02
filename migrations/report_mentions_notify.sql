-- @mentions in project reports → a "mention" notification for each person
-- newly mentioned. Additive and idempotent.
--
-- A person mention in a report body is a Markdown link
--   [@Farah Intan](mention://person/<profile-uuid>)
-- (src/shared/lib/mentions.ts). On insert every mentioned person is told;
-- on a body update only the people not in the previous body. Someone who was
-- already told about this report (the mention was removed and added back)
-- isn't told again. The link opens the report in the app.

CREATE OR REPLACE FUNCTION public.mentioned_people(p_body text)
RETURNS uuid[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(array_agg(DISTINCT lower(m[1])::uuid), '{}')
  FROM regexp_matches(
    coalesce(p_body, ''),
    '\]\(mention://person/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)',
    'g'
  ) AS m;
$$;

CREATE OR REPLACE FUNCTION public.trg_project_reports_notify_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new uuid[];
  v_actor uuid;
  v_actor_name text;
  v_project text;
  v_link text;
BEGIN
  v_new := mentioned_people(NEW.body);
  IF TG_OP = 'UPDATE' THEN
    v_new := ARRAY(SELECT unnest(v_new) EXCEPT SELECT unnest(mentioned_people(OLD.body)));
  END IF;
  IF coalesce(array_length(v_new, 1), 0) = 0 THEN RETURN NEW; END IF;

  v_actor := coalesce(auth.uid(), NEW.author_id);
  SELECT coalesce(nullif(split_part(btrim(full_name), ' ', 1), ''), 'Seseorang')
    INTO v_actor_name FROM profiles WHERE id = v_actor;
  SELECT name INTO v_project FROM projects WHERE id = NEW.project_id;
  v_link := '/projects/' || NEW.project_id || '/reports?report=' || NEW.id;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id,
    left(coalesce(v_actor_name, 'Seseorang') || ' nyebut kamu di report ' ||
      coalesce(v_project, 'project'), 120),
    left(NEW.title, 140),
    'mention',
    v_link
  FROM profiles p
  WHERE p.id = ANY (v_new)
    -- Like comment mentions: naming yourself doesn't notify you.
    AND p.id <> v_actor
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = p.id AND n.type = 'mention' AND n.link = v_link
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_reports_notify_mentions ON public.project_reports;
CREATE TRIGGER project_reports_notify_mentions
  AFTER INSERT OR UPDATE OF body ON public.project_reports
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_reports_notify_mentions();

REVOKE ALL ON FUNCTION public.trg_project_reports_notify_mentions() FROM public, anon;
