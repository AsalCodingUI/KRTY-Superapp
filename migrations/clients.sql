-- Clients as their own records (stakeholders only). Projects link with
-- client_id; the old projects.client_* text columns stay and are kept in sync
-- by triggers, so deployed code and employees (who read project rows, not
-- clients) keep seeing the client's name and contact.

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 120),
  contact_name text CHECK (length(contact_name) <= 120),
  email text CHECK (length(email) <= 200),
  phone text CHECK (length(phone) <= 60),
  website text CHECK (length(website) <= 200),
  country text CHECK (length(country) <= 80),
  -- Billing currency for new invoices (ISO code).
  currency text NOT NULL DEFAULT 'IDR' CHECK (currency ~ '^[A-Z]{3}$'),
  notes text CHECK (length(notes) <= 2000),
  archived_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS clients_name_unique ON public.clients (lower(btrim(name)));

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients stakeholders" ON public.clients;
CREATE POLICY "Clients stakeholders" ON public.clients
  FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_clients()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS clients_touch ON public.clients;
CREATE TRIGGER clients_touch BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION touch_clients();

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON public.projects (client_id);

-- Linking (or unlinking) a project copies the client's details onto it.
CREATE OR REPLACE FUNCTION public.sync_project_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c clients%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.client_id IS NOT DISTINCT FROM OLD.client_id THEN
    RETURN NEW;
  END IF;
  IF NEW.client_id IS NULL THEN
    IF TG_OP = 'UPDATE' AND OLD.client_id IS NOT NULL THEN
      NEW.client_name := NULL; NEW.client_contact := NULL;
      NEW.client_email := NULL; NEW.client_phone := NULL;
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO c FROM clients WHERE id = NEW.client_id;
  NEW.client_name := c.name;
  NEW.client_contact := c.contact_name;
  NEW.client_email := c.email;
  NEW.client_phone := c.phone;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS projects_sync_client ON public.projects;
CREATE TRIGGER projects_sync_client BEFORE INSERT OR UPDATE OF client_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION sync_project_client();

-- Editing a client updates every linked project.
CREATE OR REPLACE FUNCTION public.propagate_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE projects SET
    client_name = NEW.name,
    client_contact = NEW.contact_name,
    client_email = NEW.email,
    client_phone = NEW.phone
  WHERE client_id = NEW.id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS clients_propagate ON public.clients;
CREATE TRIGGER clients_propagate AFTER UPDATE OF name, contact_name, email, phone ON public.clients
  FOR EACH ROW EXECUTE FUNCTION propagate_client();

-- Deleting a client clears the copied text too (FK only nulls client_id).
CREATE OR REPLACE FUNCTION public.clear_client_on_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE projects SET client_id = NULL WHERE client_id = OLD.id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS clients_clear ON public.clients;
CREATE TRIGGER clients_clear BEFORE DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION clear_client_on_delete();
