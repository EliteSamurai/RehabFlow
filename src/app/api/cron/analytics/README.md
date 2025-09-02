# Analytics Cron Job

## Overview

The Analytics Cron Job is a nightly automated system that aggregates daily metrics from your RehabFlow database and stores them in the `analytics_daily` table for reporting and dashboard purposes.

## Features

### 📊 **Metrics Aggregated**

- **Appointment Metrics**
  - Total appointments per day
  - Completed appointments
  - No-shows
  - Cancellations

- **SMS Metrics**
  - Total SMS sent
  - SMS delivered
  - SMS responded to

- **Exercise Compliance**
  - Exercise completions
  - Patient check-ins

- **Patient Compliance**
  - Average appointment compliance rate
  - Average exercise compliance rate
  - Average communication response rate

### 🕐 **Schedule**

- **Runs**: Daily at 2:00 AM
- **Timezone**: UTC
- **Frequency**: Once per day
- **Data**: Aggregates previous day's metrics

## API Endpoints

### POST `/api/cron/analytics`

**Main cron endpoint** - Runs nightly analytics aggregation

**Query Parameters:**

- `token` (required): Your CRON_SECRET for authentication

**Response:**

```json
{
  "success": true,
  "message": "Nightly analytics completed for 2025-01-14",
  "results": [
    {
      "clinic_id": "uuid",
      "date": "2025-01-14",
      "success": true,
      "data": {
        "total_appointments": 25,
        "completed_appointments": 22,
        "no_shows": 2,
        "cancellations": 1,
        "sms_sent": 45,
        "sms_delivered": 42,
        "sms_responded": 15,
        "exercise_completions": 18,
        "patient_check_ins": 12,
        "avg_appointment_compliance": 0.88,
        "avg_exercise_compliance": 0.72,
        "avg_communication_response": 0.33
      }
    }
  ],
  "timestamp": "2025-01-15T02:00:00.000Z"
}
```

### GET `/api/cron/analytics`

**Test endpoint** - Run analytics for a specific date

**Query Parameters:**

- `token` (required): Your CRON_SECRET for authentication
- `date` (optional): Specific date (YYYY-MM-DD), defaults to yesterday

### HEAD `/api/cron/analytics`

**Health check** - Verify endpoint is accessible (no token required)

## Setup Instructions

### 1. Environment Variables

Ensure you have these in your `.env.local`:

```bash
CRON_SECRET=your-secure-random-string-here
SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Cron Job Setup

#### Using cron-job.org (Recommended)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a new cron job
3. **URL**: `https://your-app.vercel.app/api/cron/analytics?token=YOUR_CRON_SECRET`
4. **Schedule**: `0 2 * * *` (daily at 2:00 AM UTC)
5. **Method**: POST
6. **Retry on failure**: 3 attempts
7. **Timeout**: 300 seconds

#### Using Vercel Cron (Paid Plans Only)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/analytics?token=YOUR_CRON_SECRET",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 3. Database Schema

The system expects these tables to exist:

- `analytics_daily` - Stores aggregated metrics
- `appointments` - Appointment data
- `message_logs` - SMS/email logs
- `exercise_completions` - Exercise tracking
- `patient_progress` - Patient updates
- `patient_compliance` - Compliance metrics
- `clinics` - Clinic information

## Testing

### Manual Testing

Visit `/admin/analytics-test` to test the endpoint manually:

1. Enter your CRON_SECRET
2. Choose a test date (optional)
3. Test different endpoints
4. View results and metrics

### Unit Tests

Run the test suite:

```bash
# Run all tests
pnpm test:run

# Run specific test file
pnpm test:run tests/unit/cron.analytics.test.ts

# Watch mode
pnpm test
```

## Architecture

### Function Structure

```
aggregateDailyAnalytics()
├── aggregateAppointmentMetrics()
├── aggregateSMSMetrics()
├── aggregateExerciseMetrics()
└── aggregateComplianceMetrics()
```

### Data Flow

1. **Cron Trigger** → POST to `/api/cron/analytics`
2. **Authentication** → Verify CRON_SECRET token
3. **Clinic Discovery** → Find all active clinics
4. **Parallel Processing** → Aggregate metrics for each clinic
5. **Database Upsert** → Store results in `analytics_daily`
6. **Response** → Return success/failure for each clinic

### Error Handling

- **Database Errors**: Gracefully handle connection issues
- **Missing Data**: Return zero values for missing metrics
- **Partial Failures**: Continue processing other clinics
- **Authentication**: Return 401 for invalid tokens

## Monitoring & Debugging

### Logs

Check your application logs for:

- `"Analytics cron error:"` - General errors
- `"Error fetching appointments:"` - Database query issues
- `"Error upserting analytics:"` - Storage problems

### Health Checks

- **HEAD endpoint**: Verify service is running
- **Response times**: Monitor aggregation performance
- **Success rates**: Track clinic processing success

### Common Issues

1. **Authentication Failures**
   - Verify CRON_SECRET matches environment variable
   - Check token in cron job URL

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity

3. **Missing Tables**
   - Ensure all required tables exist
   - Verify table schemas match expectations

## Performance Considerations

### Optimization

- **Parallel Processing**: Metrics aggregated concurrently
- **Efficient Queries**: Minimal data fetched from database
- **Batch Upserts**: Single database operation per clinic
- **Index Usage**: Leverages existing database indexes

### Scalability

- **Multi-tenant**: Processes all clinics automatically
- **Date-based**: Only processes relevant time periods
- **Idempotent**: Safe to run multiple times
- **Resource Efficient**: Minimal memory and CPU usage

## Security

### Authentication

- **Token-based**: Uses CRON_SECRET for access control
- **No User Context**: Runs with service-level permissions
- **Rate Limiting**: Consider implementing if needed

### Data Access

- **Row Level Security**: Respects existing RLS policies
- **Clinic Isolation**: Only accesses authorized clinic data
- **Audit Trail**: All operations logged for compliance

## Future Enhancements

### Planned Features

- **Real-time Metrics**: WebSocket updates for live dashboards
- **Custom Aggregations**: Configurable metric calculations
- **Export Options**: CSV/JSON data export
- **Alerting**: Notifications for metric anomalies

### Integration Points

- **Dashboard**: Real-time analytics display
- **Reporting**: Automated report generation
- **BI Tools**: Connect to external analytics platforms
- **Webhooks**: Notify external systems of completion

## Support

For issues or questions:

1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Test manually using the test page
4. Review database schema and permissions
5. Check cron job configuration and timing

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: RehabFlow Development Team
