-- AI connections (Setelan → API & MCP → AI): OpenAI-compatible routers or
-- providers (9router, OpenRouter, …) stakeholders add and remove; the one
-- marked default writes for the editors' AI (/api/ai/rewrite). The API key
-- is stored encrypted by the server (AES-GCM, shared/api/ai-config.ts).
-- No policies: only the server (service key) reads or writes it. Idempotent.

CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  base_url text NOT NULL CHECK (base_url ~ '^https?://'),
  api_key_enc text NOT NULL,
  model text NOT NULL CHECK (length(model) BETWEEN 1 AND 200),
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- At most one default.
CREATE UNIQUE INDEX IF NOT EXISTS ai_providers_one_default
  ON public.ai_providers (is_default) WHERE is_default;

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_providers FROM authenticated, anon;
