-- Sends due reminders every minute (api/push/tick.js). GitHub's scheduler
-- turned out to run hours apart, which is useless for "remind me at 18:30".
-- Run once in Supabase → SQL Editor. Safe to re-run: it replaces the job.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('push-tick') where exists (select 1 from cron.job where jobname = 'push-tick');
select cron.schedule(
  'push-tick',
  '* * * * *',
  $$ select net.http_get('https://fingoal-tan.vercel.app/api/push/tick', timeout_milliseconds := 30000) $$
);
