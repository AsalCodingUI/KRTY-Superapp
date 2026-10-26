-- New projects start as "Belum mulai" (Planned), like the form says.
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'Planned';
