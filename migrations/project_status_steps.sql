-- Project kanban steps: Belum mulai (Planned) → Berjalan (Active) → Review
-- → Selesai (Completed); Archived stays outside the board. Values are only
-- added (no rename), so code that knows the old three keeps working.
-- ADD VALUE cannot run inside a transaction block with its first use, so this
-- file is applied without -1.
ALTER TYPE public.project_status_enum ADD VALUE IF NOT EXISTS 'Planned' BEFORE 'Active';
ALTER TYPE public.project_status_enum ADD VALUE IF NOT EXISTS 'Review' AFTER 'Active';

-- New projects seed their phases as done only once they are finished.
CREATE OR REPLACE FUNCTION public.trg_projects_seed_phases()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM seed_project_phases(
    NEW.id,
    NEW.status::text NOT IN ('Planned', 'Active', 'Review')
  );
  RETURN NEW;
END $function$;
