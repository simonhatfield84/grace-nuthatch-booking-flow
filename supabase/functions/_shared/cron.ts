
// This file documents the cron job that should be set up to process payment reminders
// 
// To set up the cron job, you can use:
// 1. A service like GitHub Actions, Vercel Cron, or similar
// 2. A server cron job that calls the edge function
// 3. Supabase's upcoming cron job feature (when available)
//
// The function should be called every hour with a POST request to:
// https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/process-payment-reminders
//
// Example cron expression: "0 * * * *" (every hour)

export const PAYMENT_REMINDER_CRON_SCHEDULE = "0 * * * *"; // Every hour
export const PAYMENT_REMINDER_FUNCTION_URL = "https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/process-payment-reminders";
