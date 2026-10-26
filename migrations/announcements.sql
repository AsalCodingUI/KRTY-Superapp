-- Team announcements from an admin, as notifications: "announcement" in the
-- bell, or "announcement_urgent" which also shows as the app banner until
-- read. Audience: everyone, employees only, or picked people. The sender
-- doesn't get a copy. Returns how many people got it. Idempotent.

CREATE OR REPLACE FUNCTION public.send_announcement(
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_urgent boolean DEFAULT false,
  p_audience text DEFAULT 'all',
  p_user_ids uuid[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text := btrim(coalesce(p_title, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_link text := nullif(btrim(coalesce(p_link, '')), '');
  v_sent integer;
BEGIN
  IF NOT is_stakeholder() THEN
    RAISE EXCEPTION 'Hanya admin yang bisa mengirim pengumuman'
      USING ERRCODE = '42501';
  END IF;
  IF v_title = '' OR length(v_title) > 80 THEN
    RAISE EXCEPTION 'title' USING ERRCODE = '22023';
  END IF;
  IF length(v_message) > 500 THEN
    RAISE EXCEPTION 'message' USING ERRCODE = '22023';
  END IF;
  -- In-app paths or plain web links only.
  IF v_link IS NOT NULL AND v_link !~ '^(/|https?://)' THEN
    RAISE EXCEPTION 'link' USING ERRCODE = '22023';
  END IF;
  IF p_audience NOT IN ('all', 'employees', 'people') THEN
    RAISE EXCEPTION 'audience' USING ERRCODE = '22023';
  END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id, v_title, v_message,
         CASE WHEN p_urgent THEN 'announcement_urgent' ELSE 'announcement' END,
         v_link
  FROM profiles p
  WHERE p.id IS DISTINCT FROM auth.uid()
    AND CASE p_audience
      WHEN 'employees' THEN p.role = 'employee'
      WHEN 'people' THEN p.id = ANY (coalesce(p_user_ids, '{}'))
      ELSE true
    END;
  GET DIAGNOSTICS v_sent = ROW_COUNT;
  RETURN v_sent;
END;
$$;

REVOKE ALL ON FUNCTION public.send_announcement(text, text, text, boolean, text, uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_announcement(text, text, text, boolean, text, uuid[]) TO authenticated;
