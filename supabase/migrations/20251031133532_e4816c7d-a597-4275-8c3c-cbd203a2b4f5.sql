-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the square queue worker to run every minute
SELECT cron.schedule(
  'square-queue-worker',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/square-queue-worker',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eW90dHR2eWV4eHplYWV3eWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTU3NDEsImV4cCI6MjA2NzEzMTc0MX0.QDugoBTZMxFTB79_tD-6Ng4_DYZpSmuCzm3y8yLw34U"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);