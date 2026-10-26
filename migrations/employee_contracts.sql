-- Employee contracts ("Kontrak"). HR drafts in Word and signs + stamps the
-- PDF (e-Meterai) with an official provider outside the app; the app only
-- stores and distributes it. Employees see their own contracts (never
-- drafts) and acknowledge them by typing their name; stakeholders manage all.
--
-- Files live in the private "employee-contracts" bucket under
-- "<name-slug>--<user-uuid>/<title-slug>.pdf" (same readable-path scheme as
-- project files; the owner id is read from the end of the first folder).

CREATE TABLE IF NOT EXISTS public.employee_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (btrim(title) <> '' AND length(title) <= 160),
  kind text NOT NULL DEFAULT 'pkwt'
    CHECK (kind IN ('pkwt', 'pkwtt', 'freelance', 'nda', 'addendum', 'other')),
  start_date date NOT NULL,
  end_date date CHECK (end_date IS NULL OR end_date >= start_date),
  file_path text NOT NULL CHECK (length(file_path) <= 500),
  has_ematerai boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'sent', 'acknowledged')),
  acknowledged_at timestamptz,
  acknowledged_name text CHECK (length(acknowledged_name) <= 160),
  notes text CHECK (length(notes) <= 2000),
  created_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employee_contracts_user_idx
  ON public.employee_contracts (user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS employee_contracts_end_idx
  ON public.employee_contracts (end_date) WHERE end_date IS NOT NULL;

-- RLS: stakeholders everything; employees read their own sent/acknowledged
-- rows. Acknowledging goes through acknowledge_contract() (no update policy).
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contracts stakeholders" ON public.employee_contracts;
CREATE POLICY "Contracts stakeholders" ON public.employee_contracts
  FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());

DROP POLICY IF EXISTS "Contracts own read" ON public.employee_contracts;
CREATE POLICY "Contracts own read" ON public.employee_contracts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND status <> 'draft');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_contracts TO authenticated;

-- updated_at, and a replaced file needs a fresh acknowledgement.
CREATE OR REPLACE FUNCTION public.touch_employee_contracts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.file_path IS DISTINCT FROM OLD.file_path
     AND OLD.status = 'acknowledged' AND NEW.status = 'acknowledged' THEN
    NEW.status := 'sent';
    NEW.acknowledged_at := NULL;
    NEW.acknowledged_name := NULL;
  END IF;
  IF NEW.status <> 'acknowledged' THEN
    NEW.acknowledged_at := NULL;
    NEW.acknowledged_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS employee_contracts_touch ON public.employee_contracts;
CREATE TRIGGER employee_contracts_touch BEFORE UPDATE ON public.employee_contracts
  FOR EACH ROW EXECUTE FUNCTION touch_employee_contracts();

-- Notify the employee whenever a contract becomes visible to them as "sent"
-- (created as sent, a draft published, or a replaced file to re-read).
CREATE OR REPLACE FUNCTION public.trg_employee_contracts_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'sent'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'sent') THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE WHEN TG_OP = 'INSERT' OR OLD.status = 'draft'
           THEN 'Kontrak baru' ELSE 'Kontrak diperbarui' END,
      NEW.title || ' · mohon dibaca dan disetujui',
      'contract',
      '/contracts?contract=' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS employee_contracts_notify ON public.employee_contracts;
CREATE TRIGGER employee_contracts_notify
  -- Every update, not "OF status": a replaced file flips the status in the
  -- BEFORE trigger, which a column list wouldn't see.
  AFTER INSERT OR UPDATE ON public.employee_contracts
  FOR EACH ROW EXECUTE FUNCTION trg_employee_contracts_notify();

-- The employee's "Saya sudah membaca dan menyetujui": only their own sent
-- contract, only the acknowledgement fields. Tells whoever uploaded it.
CREATE OR REPLACE FUNCTION public.acknowledge_contract(
  contract_id uuid,
  typed_name text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c employee_contracts%ROWTYPE;
  v_name text := btrim(coalesce(typed_name, ''));
BEGIN
  IF v_name = '' OR length(v_name) > 160 THEN
    RAISE EXCEPTION 'name required' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO c FROM employee_contracts WHERE id = contract_id FOR UPDATE;
  IF NOT FOUND OR c.user_id IS DISTINCT FROM auth.uid() OR c.status = 'draft' THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF c.status = 'acknowledged' THEN
    RETURN;
  END IF;

  UPDATE employee_contracts
     SET status = 'acknowledged',
         acknowledged_at = now(),
         acknowledged_name = v_name
   WHERE id = contract_id;

  IF c.created_by IS NOT NULL AND c.created_by <> c.user_id THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT c.created_by,
           'Kontrak disetujui',
           coalesce(p.full_name, v_name) || ' · ' || c.title,
           'contract',
           '/contracts?contract=' || c.id
      FROM profiles p WHERE p.id = c.user_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.acknowledge_contract(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.acknowledge_contract(uuid, text) TO authenticated;

-- Storage ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('employee-contracts', 'employee-contracts', false, 26214400,
        ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- storage_project_id() (storage_organized_paths.sql) just reads the uuid at
-- the end of the first folder, so it gives the owner id here too.
DROP POLICY IF EXISTS "Contracts files stakeholders" ON storage.objects;
CREATE POLICY "Contracts files stakeholders" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'employee-contracts' AND is_stakeholder())
  WITH CHECK (bucket_id = 'employee-contracts' AND is_stakeholder());

-- Employees: their own folder, and only files of contracts they can see
-- (a draft's PDF stays hidden until it is sent).
DROP POLICY IF EXISTS "Contracts files own read" ON storage.objects;
CREATE POLICY "Contracts files own read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'employee-contracts'
    AND public.storage_project_id(name) = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.employee_contracts c
       WHERE c.file_path = storage.objects.name
         AND c.user_id = auth.uid()
         AND c.status <> 'draft'
    )
  );
