-- Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule lock cleanup every 5 minutes
-- This cron job will call the locks-cleaner edge function to mark expired locks as released
select cron.schedule(
  'locks-cleaner-5m',
  '*/5 * * * *', -- Every 5 minutes
  $$
  select net.http_post(
    url:='https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/locks-cleaner',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eW90dHR2eWV4eHplYWV3eWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTU3NDEsImV4cCI6MjA2NzEzMTc0MX0.QDugoBTZMxFTB79_tD-6Ng4_DYZpSmuCzm3y8yLw34U"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Add comment
comment on extension pg_cron is 'PostgreSQL job scheduler for running periodic tasks';

-- Verify the cron job was created (optional - for debugging)
-- select * from cron.job where jobname = 'locks-cleaner-5m';