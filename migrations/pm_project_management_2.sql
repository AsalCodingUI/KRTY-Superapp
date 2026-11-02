-- PMs get more (follows pm_project_management.sql). On projects they're on
-- (is_project_pm): delete the project and manage its invoices. Office-wide
-- for every PM (is_pm): clients (add, edit, archive; not delete), process
-- templates, payment methods (+ their QR images in finance-assets/qr/) and
-- the studio profile printed on invoices (app_settings 'invoice_agency').
--
-- Still stakeholder-only: Keuangan (/finance, other finance_* settings and
-- finance-assets outside qr/), deleting clients, and anything that erases
-- saved SLA / quality scores (removing a scored member, or deleting a
-- project that has scores).
--
-- Additive: new policies and helper functions; nothing existing replaced.

-- Helpers (definer: PMs can't see every row these look at). -----------------

CREATE OR REPLACE FUNCTION public.project_has_scores(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM project_assignments a
     WHERE a.project_id = p_project_id AND assignment_has_scores(a.id)
  )
$function$;

-- Invoice numbers are unique across all projects, but a PM only reads their
-- own projects' invoices: the next free number needs every used one.
CREATE OR REPLACE FUNCTION public.invoice_numbers_with_prefix(p_prefix text)
 RETURNS SETOF text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT invoice_number FROM project_invoices
   WHERE (is_stakeholder() OR is_pm())
     AND invoice_number LIKE replace(replace(p_prefix, '%', '\%'), '_', '\_') || '%'
$function$;

-- Whether any invoice (any project) still prints this QR.
CREATE OR REPLACE FUNCTION public.qr_path_in_use(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (is_stakeholder() OR is_pm()) AND EXISTS (
    SELECT 1 FROM project_invoices WHERE payment_snapshot->>'qr_path' = p_path
  )
$function$;

REVOKE ALL ON FUNCTION public.project_has_scores(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.invoice_numbers_with_prefix(text) FROM anon;
REVOKE ALL ON FUNCTION public.qr_path_in_use(text) FROM anon;

-- 1. Projects: a project PM deletes it (unless it has saved scores). --------

DROP POLICY IF EXISTS "Projects delete (project PMs)" ON public.projects;
CREATE POLICY "Projects delete (project PMs)" ON public.projects
  FOR DELETE TO authenticated
  USING (is_project_pm(id) AND NOT project_has_scores(id));

-- 2. Clients: PMs read, add and edit (archive is an edit); no delete. -------

DROP POLICY IF EXISTS "Clients read (PMs)" ON public.clients;
CREATE POLICY "Clients read (PMs)" ON public.clients
  FOR SELECT TO authenticated USING (is_pm());
DROP POLICY IF EXISTS "Clients insert (PMs)" ON public.clients;
CREATE POLICY "Clients insert (PMs)" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (is_pm());
DROP POLICY IF EXISTS "Clients update (PMs)" ON public.clients;
CREATE POLICY "Clients update (PMs)" ON public.clients
  FOR UPDATE TO authenticated USING (is_pm()) WITH CHECK (is_pm());

-- 3. Invoices: full manage on the PM's projects. ----------------------------

DROP POLICY IF EXISTS "Project invoices write (project PMs)" ON public.project_invoices;
CREATE POLICY "Project invoices write (project PMs)" ON public.project_invoices
  FOR ALL TO authenticated
  USING (is_project_pm(project_id))
  WITH CHECK (is_project_pm(project_id));

-- 4. Payment methods, their QR images and the studio profile. --------------

DROP POLICY IF EXISTS "Payment methods (PMs)" ON public.payment_methods;
CREATE POLICY "Payment methods (PMs)" ON public.payment_methods
  FOR ALL TO authenticated USING (is_pm()) WITH CHECK (is_pm());

DROP POLICY IF EXISTS "Finance assets QR (PMs)" ON storage.objects;
CREATE POLICY "Finance assets QR (PMs)" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'finance-assets' AND (storage.foldername(name))[1] = 'qr' AND is_pm())
  WITH CHECK (bucket_id = 'finance-assets' AND (storage.foldername(name))[1] = 'qr' AND is_pm());

DROP POLICY IF EXISTS "Invoice studio profile (PMs)" ON public.app_settings;
CREATE POLICY "Invoice studio profile (PMs)" ON public.app_settings
  FOR ALL TO authenticated
  USING (key = 'invoice_agency' AND is_pm())
  WITH CHECK (key = 'invoice_agency' AND is_pm());

-- 5. Process templates: PMs manage them like stakeholders. -----------------

DROP POLICY IF EXISTS "Processes (PMs)" ON public.processes;
CREATE POLICY "Processes (PMs)" ON public.processes
  FOR ALL TO authenticated USING (is_pm()) WITH CHECK (is_pm());
DROP POLICY IF EXISTS "Processes (PMs)" ON public.process_phases;
CREATE POLICY "Processes (PMs)" ON public.process_phases
  FOR ALL TO authenticated USING (is_pm()) WITH CHECK (is_pm());
DROP POLICY IF EXISTS "Processes (PMs)" ON public.process_steps;
CREATE POLICY "Processes (PMs)" ON public.process_steps
  FOR ALL TO authenticated USING (is_pm()) WITH CHECK (is_pm());
DROP POLICY IF EXISTS "Processes (PMs)" ON public.process_tasks;
CREATE POLICY "Processes (PMs)" ON public.process_tasks
  FOR ALL TO authenticated USING (is_pm()) WITH CHECK (is_pm());
