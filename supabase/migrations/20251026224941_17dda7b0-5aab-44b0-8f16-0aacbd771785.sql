-- Create table to track smoke test runs
CREATE TABLE IF NOT EXISTS public.refactor_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('running', 'passed', 'failed')),
  total_tests int NOT NULL DEFAULT 0,
  passed_tests int NOT NULL DEFAULT 0,
  failed_tests int NOT NULL DEFAULT 0,
  duration_ms int,
  results jsonb,
  triggered_by uuid,
  git_branch text,
  git_commit text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refactor_runs_created ON public.refactor_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refactor_runs_status ON public.refactor_runs(status);

-- Enable RLS
ALTER TABLE public.refactor_runs ENABLE ROW LEVEL SECURITY;

-- Platform admins can read refactor runs
CREATE POLICY "Platform admins can read refactor runs"
  ON public.refactor_runs
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- System can insert refactor runs
CREATE POLICY "System can insert refactor runs"
  ON public.refactor_runs
  FOR INSERT
  WITH CHECK (true);

GRANT SELECT ON public.refactor_runs TO authenticated;