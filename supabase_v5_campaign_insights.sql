-- =============================================
-- V5: Campaign Insights — Automated AI monitoring
-- Stores periodic snapshots + AI analysis of Meta Ads campaigns
-- Uses pg_cron + pg_net to trigger the Next.js API every 6 hours
-- =============================================

-- 1. Table to store campaign snapshots and AI feedback
CREATE TABLE IF NOT EXISTS public.campaign_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Raw data from Meta API at the time of the snapshot
  campaigns_snapshot JSONB DEFAULT '[]'::jsonb,
  account_summary JSONB DEFAULT '{}'::jsonb,

  -- AI-generated analysis
  ai_feedback TEXT,           -- Full markdown analysis from Gemini
  ai_alerts JSONB DEFAULT '[]'::jsonb,  -- Structured alerts: [{type, severity, message}]
  
  -- Metadata
  period TEXT DEFAULT 'last_90d',
  total_spend NUMERIC(12,2) DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  active_campaigns INTEGER DEFAULT 0
);

-- 2. RLS
ALTER TABLE public.campaign_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaign insights"
  ON public.campaign_insights
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- The cron API uses service_role key, so it bypasses RLS for INSERT.
-- But we also allow authenticated users to insert (in case they trigger manually).
CREATE POLICY "Authenticated users can insert campaign insights"
  ON public.campaign_insights
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_insights_project ON public.campaign_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_campaign_insights_created ON public.campaign_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_insights_project_created ON public.campaign_insights(project_id, created_at DESC);

-- 4. Enable pg_cron and pg_net extensions (if not already enabled)
-- NOTE: You need to enable these from the Supabase Dashboard:
--   Database > Extensions > search "pg_cron" > Enable
--   Database > Extensions > search "pg_net" > Enable

-- 5. Create the cron job that calls the Next.js API every 6 hours
-- IMPORTANT: Replace YOUR_APP_URL with your actual deployed URL
-- IMPORTANT: Replace YOUR_CRON_SECRET with a secure random string
-- Then add CRON_SECRET=YOUR_CRON_SECRET to your .env.local and Vercel env vars

-- Run this AFTER enabling pg_cron and pg_net extensions:
SELECT cron.schedule(
  'campaign-monitor',          -- job name
  '0 0,6,12,18 * * *',         -- every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
  $$
  SELECT net.http_post(
    url := 'https://codeadesarrollos.com/api/cron/campaign-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer uco_cron_secret_2026'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To see job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- To delete the job:
-- SELECT cron.unschedule('campaign-monitor');
