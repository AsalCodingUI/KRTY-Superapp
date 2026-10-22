-- 360 review (decision 22 Oct 2026): every employee reviews every other
-- employee; admins (stakeholders) neither review nor get reviewed.
-- Replaces the same-project rule. p_quarter stays for callers/validation.
CREATE OR REPLACE FUNCTION public.review_pairs(p_quarter text)
RETURNS TABLE (reviewer_id uuid, reviewee_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, b.id
  FROM profiles a
  JOIN profiles b ON b.id <> a.id AND b.role = 'employee'
  WHERE a.role = 'employee'
    AND p_quarter ~ '^\d{4}-Q[1-4]$'
    AND (auth.uid() IS NULL OR is_stakeholder() OR a.id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.trg_review_cycles_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(NEW.is_active, false) THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT id,
           '360 review dibuka',
           'Periode 360 review ' || coalesce(NEW.quarter, NEW.name) ||
             ' sudah dibuka sampai ' || to_char(NEW.end_date AT TIME ZONE 'Asia/Jakarta', 'DD/MM') ||
             '. Nilai rekan kerjamu.',
           'review_cycle',
           '/performance/360-review'
    FROM profiles WHERE role = 'employee';
  END IF;
  RETURN NEW;
END;
$$;
