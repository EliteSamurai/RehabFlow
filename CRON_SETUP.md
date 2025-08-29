# RehabFlow Cron Job Setup

## Overview

The RehabFlow reminder engine automatically sends appointment reminders and campaign messages using a scheduled cron job. This system uses Vercel Cron to trigger message processing every 5 minutes.

## Architecture

```
Vercel Cron (every 5 min) → /api/cron/dispatch → Message Engine → Twilio SMS
```

### Components

1. **Message Engine** (`src/server/message-engine.ts`)
   - Queries for due appointment reminders (24h, 4h, 1h before)
   - Queries for due campaign messages
   - Processes and sends messages via Twilio

2. **Cron Dispatcher** (`src/app/api/cron/dispatch/route.ts`)
   - Secured API endpoint for automated message dispatch
   - Verifies cron authentication
   - Executes message processing and logs results

3. **Vercel Cron** (`vercel.json`)
   - Configured to run every 5 minutes
   - Calls the dispatch endpoint automatically

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` and Vercel project settings:

```bash
# Cron authentication secret (generate a secure random string)
CRON_SECRET=your-secure-random-secret-here

# Required for SMS functionality
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid

# Enable real SMS sending
ENABLE_REAL_SMS=true
```

### 2. Generate CRON_SECRET

```bash
# Generate a secure random secret
openssl rand -hex 32
```

### 3. Vercel Configuration

The `vercel.json` file is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/dispatch",
      "schedule": "*/5 * * * *"
    }
  ],
  "functions": {
    "src/app/api/cron/dispatch/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 4. Deploy to Vercel

1. Deploy your application to Vercel
2. Add the environment variables in the Vercel dashboard
3. The cron job will automatically start running

## Testing

### Manual Testing (Development)

Visit `/admin/cron-test` to manually test the cron functionality:

- **Dry Run**: Check for pending messages without sending
- **Run Dispatch**: Actually send pending messages
- **Health Check**: Verify engine status and database connectivity

### API Testing

```bash
# Health check
curl -I https://your-app.vercel.app/api/cron/dispatch

# Manual dispatch (requires CRON_SECRET)
curl -X POST https://your-app.vercel.app/api/cron/dispatch \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

## Message Windows

The system sends appointment reminders in three windows:

- **24h reminder**: 23-25 hours before appointment
- **4h reminder**: 3.5-4.5 hours before appointment
- **1h reminder**: 0.5-1.5 hours before appointment

Each reminder is only sent once per appointment.

## Monitoring

### Logs

Check Vercel function logs for cron execution:

```bash
vercel logs --function=/api/cron/dispatch
```

### Database

Monitor message logs in the `message_logs` table:

```sql
SELECT
  content,
  recipient,
  status,
  sent_at,
  clinic_id
FROM message_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Message Flow

1. **Appointment Scheduling**: When appointments are created in the database
2. **Cron Trigger**: Vercel cron calls `/api/cron/dispatch` every 5 minutes
3. **Query Due Messages**: System finds appointments in reminder windows
4. **Check Duplicates**: Verifies reminder hasn't been sent already
5. **Send SMS**: Dispatches message via Twilio
6. **Log Result**: Records success/failure in `message_logs` table

## Security

- **Authentication**: Cron endpoint requires `CRON_SECRET` for access
- **Service Role**: Uses Supabase service role for cross-tenant database access
- **Rate Limiting**: Built-in delays between messages to respect Twilio limits
- **Opt-in Verification**: Only sends to patients who opted in to SMS

## Troubleshooting

### Common Issues

1. **No messages being sent**
   - Check `ENABLE_REAL_SMS=true` is set
   - Verify Twilio credentials are correct
   - Ensure patients have `opt_in_sms=true`

2. **Cron not triggering**
   - Verify `CRON_SECRET` is set in Vercel
   - Check function logs for authentication errors
   - Ensure `vercel.json` is deployed

3. **Database connection errors**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Check Supabase project settings
   - Ensure RLS policies allow service role access

### Debug Mode

Set these environment variables for enhanced debugging:

```bash
# Enable detailed logging
DEBUG=true

# Test mode with mock SMS
ENABLE_REAL_SMS=false
```

## Performance

- **Execution Time**: Typically 100-500ms for small message batches
- **Timeout**: Functions have 60-second timeout limit
- **Batch Size**: No hard limit, but respects Twilio rate limits
- **Frequency**: Runs every 5 minutes (300 seconds)

## Next Steps

1. **Campaign Messages**: Implement due campaign message queries
2. **Smart Scheduling**: Add timezone-aware scheduling
3. **Delivery Tracking**: Enhanced webhook processing
4. **Analytics**: Message performance metrics
5. **A/B Testing**: Template optimization
