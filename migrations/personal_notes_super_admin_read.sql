-- My notes: super admins may read anyone's notes (read-only), so "Lihat
-- sebagai" shows the person's own notes. Everyone else still only sees
-- their own (the "Own notes" policy). Run after personal_notes.sql.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
$$;

DROP POLICY IF EXISTS "Super admins read notes" ON public.personal_notes;
CREATE POLICY "Super admins read notes" ON public.personal_notes
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
