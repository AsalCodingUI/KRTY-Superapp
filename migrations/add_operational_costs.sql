-- Create enums for operational costs
DO $$ BEGIN
  CREATE TYPE operational_cost_category AS ENUM ('tools', 'facility', 'marketing', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE currency_original_enum AS ENUM ('IDR', 'USD', 'EUR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS public.operational_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  amount_idr numeric NOT NULL DEFAULT 0,
  category operational_cost_category NOT NULL DEFAULT 'other',
  currency_original currency_original_enum NOT NULL DEFAULT 'IDR',
  amount_original numeric NOT NULL DEFAULT 0,
  exchange_rate_assumed numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed data
INSERT INTO public.operational_costs (
  item_name,
  amount_idr,
  category,
  currency_original,
  amount_original,
  exchange_rate_assumed,
  is_active
) VALUES
  ('Figma Design Platform', 720000, 'tools', 'IDR', 720000, 1, true),
  ('Webflow Primary Site', 464000, 'tools', 'IDR', 464000, 1, true),
  ('Webflow Secondary Site', 464000, 'tools', 'IDR', 464000, 1, true),
  ('Mobbin Team License', 1600000, 'tools', 'IDR', 1600000, 1, true),
  ('Freepik Premium', 160000, 'tools', 'IDR', 160000, 1, true),
  ('Lottielab Animation', 480000, 'tools', 'IDR', 480000, 1, true),
  ('Studio Rent', 2916667, 'facility', 'IDR', 2916667, 1, true),
  ('Framer', 320000, 'tools', 'IDR', 320000, 1, true),
  ('Domain & Hosting', 241667, 'tools', 'IDR', 241667, 1, true),
  ('Notion Team', 160000, 'tools', 'IDR', 160000, 1, true),
  ('VPS Zeabur', 320000, 'tools', 'IDR', 320000, 1, true),
  ('Slack Workspace', 128000, 'tools', 'IDR', 128000, 1, true),
  ('Google One Storage', 48000, 'tools', 'IDR', 48000, 1, true),
  ('Dribbble Team', 80000, 'marketing', 'IDR', 80000, 1, true),
  ('Instagram Badge', 192000, 'marketing', 'IDR', 192000, 1, true),
  ('X Premium', 128000, 'marketing', 'IDR', 128000, 1, true)
ON CONFLICT DO NOTHING;
