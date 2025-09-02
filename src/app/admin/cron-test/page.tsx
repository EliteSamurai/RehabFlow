"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  Send,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CronTestResult {
  success: boolean;
  timestamp: string;
  execution_time_ms: number;
  engine_status: {
    status: string;
    database_connected: boolean;
    pending_appointment_reminders: number;
    pending_campaign_messages: number;
    total_pending: number;
    last_check: string;
  };
  no_show_result?: {
    marked: number;
    errors: Array<{ appointment_id: string; error: string }>;
  };
  dispatch_result?: {
    success: boolean;
    processed: number;
    errors: Array<{ reminder_id: string; error: string }>;
  };
  message: string;
  error?: string;
}

export default function CronTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CronTestResult | null>(null);

  const testCronJob = async (dryRun: boolean = false) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/cron/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dry_run: dryRun }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Test failed");
      }
    } catch (error) {
      toast.error("Failed to run test");
      console.error("Cron test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEngineStatus = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/cron/dispatch", {
        method: "HEAD",
      });

      const status = response.headers.get("X-Engine-Status");
      const pendingMessages = response.headers.get("X-Pending-Messages");

      toast.success(`Engine Status: ${status}, Pending: ${pendingMessages}`);
    } catch {
      toast.error("Failed to check engine status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoShowDetection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cron/dispatch?token=test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testNoShowDetection: true }),
      });

      const data = await response.json();
      setResult(data);
      toast.success("No-show detection test completed");
    } catch (error) {
      console.error("Error testing no-show detection:", error);
      toast.error("Failed to test no-show detection");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cron Job Testing</h1>
        <p className="text-muted-foreground">
          Test the automated message dispatch system and check engine status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Dry Run
            </CardTitle>
            <CardDescription>
              Test the cron job without sending actual messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => testCronJob(true)}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? "Running..." : "Run Dry Run"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Actual Dispatch
            </CardTitle>
            <CardDescription>
              Run the actual message dispatch (sends real SMS)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => testCronJob(false)}
              disabled={isLoading}
              className="w-full"
              variant="destructive"
            >
              {isLoading ? "Running..." : "Run Actual Dispatch"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Health Check
            </CardTitle>
            <CardDescription>Check the message engine status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={checkEngineStatus}
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              {isLoading ? "Checking..." : "Check Health"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              No-Show Detection
            </CardTitle>
            <CardDescription>
              Test the no-show detection job specifically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleNoShowDetection}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? "Running..." : "Test No-Show Detection"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>
            Real-time status of the message engine and dispatch system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Engine Status</span>
            <Badge
              variant={
                result?.engine_status?.status === "healthy"
                  ? "default"
                  : "destructive"
              }
            >
              {result?.engine_status?.status || "Unknown"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Database</span>
            <Badge
              variant={
                result?.engine_status?.database_connected
                  ? "default"
                  : "destructive"
              }
            >
              {result?.engine_status?.database_connected
                ? "Connected"
                : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending Reminders</span>
            <span className="text-sm font-semibold">
              {result?.engine_status?.pending_appointment_reminders || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Campaign Messages</span>
            <span className="text-sm font-semibold">
              {result?.engine_status?.pending_campaign_messages || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Pending</span>
            <Badge
              variant={
                result?.engine_status?.total_pending ? "default" : "secondary"
              }
            >
              {result?.engine_status?.total_pending || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {result.success ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 text-red-500" />
              )}
              Test Results
            </CardTitle>
            <CardDescription>
              Execution completed at{" "}
              {new Date(result.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Execution Time</span>
              <span className="text-sm">{result.execution_time_ms}ms</span>
            </div>

            {result.no_show_result && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">No-Shows Marked</span>
                  <Badge variant="default">
                    {result.no_show_result.marked}
                  </Badge>
                </div>

                {result.no_show_result.errors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-red-600">
                      No-Show Errors:
                    </span>
                    <div className="mt-2 space-y-1">
                      {result.no_show_result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-xs text-red-600 bg-red-50 p-2 rounded"
                        >
                          <strong>{error.appointment_id}:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {result.dispatch_result && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Messages Processed
                  </span>
                  <Badge variant="default">
                    {result.dispatch_result.processed}
                  </Badge>
                </div>

                {result.dispatch_result.errors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-red-600">
                      Errors:
                    </span>
                    <div className="mt-2 space-y-1">
                      {result.dispatch_result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-xs text-red-600 bg-red-50 p-2 rounded"
                        >
                          <strong>{error.reminder_id}:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700 mb-2">Message:</p>
              <p className="text-sm text-gray-600">{result.message}</p>
            </div>

            {result.error && (
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm font-medium text-red-700 mb-2">Error:</p>
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            )}

            <div className="bg-gray-50 border rounded p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Raw Response:
              </p>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Environment Variables Required:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • <code>CRON_SECRET</code> - Secret for authenticating cron
                requests
              </li>
              <li>
                • <code>SUPABASE_SERVICE_ROLE_KEY</code> - Service role key for
                cross-tenant access
              </li>
              <li>
                • <code>TWILIO_*</code> - Twilio credentials for SMS sending
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Vercel Cron Configuration:</h4>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-xs">
                {JSON.stringify(
                  {
                    crons: [
                      {
                        path: "/api/cron/dispatch",
                        schedule: "*/5 * * * *",
                      },
                    ],
                  },
                  null,
                  2
                )}
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Manual Testing:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Use &quot;Dry Run&quot; to check for pending messages without
                sending
              </li>
              <li>
                • Use &quot;Run Actual Dispatch&quot; to send real messages
              </li>
              <li>• Check engine health to verify database connectivity</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
