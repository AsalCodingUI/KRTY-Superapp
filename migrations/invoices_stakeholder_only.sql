-- Invoices are stakeholder-only, like the project's Invoice section
-- (STAKEHOLDER_PROJECT_SECTIONS in shared/config/access.ts). Project members
-- could still read their projects' invoices straight from the API or the
-- print page; now only stakeholders can. Idempotent.
DROP POLICY IF EXISTS "Project invoices read" ON public.project_invoices;
CREATE POLICY "Project invoices read" ON public.project_invoices
  FOR SELECT TO authenticated
  USING (is_stakeholder());

-- Finance settings (yearly goal, FX rates) are read on stakeholder pages
-- only; other settings stay readable by everyone signed in.
DROP POLICY IF EXISTS "Anyone signed in can read app settings" ON public.app_settings;
CREATE POLICY "Anyone signed in can read app settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (key NOT LIKE 'finance\_%' OR is_stakeholder());
