-- Personal API tokens (Setelan → API & MCP): stakeholders connect Claude,
-- Cursor, n8n… to the app through /api/mcp. A token acts as its owner, with
-- exactly their access (the server signs a short-lived session for them, so
-- every RLS policy applies). Only a SHA-256 hash is kept; the token itself
-- is shown once. `scope`: 'read' or 'write'. Idempotent.

CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
    DEFAULT auth.uid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  token_hash text NOT NULL UNIQUE,
  -- The first characters, to tell tokens apart ("krty_ab12…").
  prefix text NOT NULL,
  scope text NOT NULL DEFAULT 'read' CHECK (scope IN ('read', 'write')),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_tokens_profile_idx
  ON public.api_tokens (profile_id);

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Your own tokens; only stakeholders make them. The server (service key)
-- looks a token up by its hash.
DROP POLICY IF EXISTS "API tokens read own" ON public.api_tokens;
CREATE POLICY "API tokens read own" ON public.api_tokens
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "API tokens create" ON public.api_tokens;
CREATE POLICY "API tokens create" ON public.api_tokens
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() AND public.is_stakeholder());

DROP POLICY IF EXISTS "API tokens revoke own" ON public.api_tokens;
CREATE POLICY "API tokens revoke own" ON public.api_tokens
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Made by the server (/api/tokens hashes it); the hash never leaves it.
REVOKE ALL ON public.api_tokens FROM authenticated, anon;
GRANT SELECT (id, profile_id, name, prefix, scope, expires_at, last_used_at,
  created_at) ON public.api_tokens TO authenticated;
GRANT INSERT, DELETE ON public.api_tokens TO authenticated;

NOTIFY pgrst, 'reload schema';
