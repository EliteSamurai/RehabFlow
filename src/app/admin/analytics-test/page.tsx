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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface AnalyticsResult {
  clinic_id: string;
  date: string;
  success: boolean;
  data?: {
    total_appointments: number;
    completed_appointments: number;
    no_shows: number;
    cancellations: number;
    sms_sent: number;
    sms_delivered: number;
    sms_responded: number;
    exercise_completions: number;
    patient_check_ins: number;
    avg_appointment_compliance: number;
    avg_exercise_compliance: number;
    avg_communication_response: number;
  };
  error?: string;
}

interface AnalyticsResponse {
  success: boolean;
  message: string;
  results: AnalyticsResult[];
  timestamp: string;
}

export default function AnalyticsTestPage() {
  const [token, setToken] = useState("");
  const [testDate, setTestDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestAnalytics = async (endpoint: "GET" | "POST") => {
    if (!token) {
      setError("Please enter a cron token");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = new URL("/api/cron/analytics", window.location.origin);
      url.searchParams.set("token", token);

      if (endpoint === "GET" && testDate) {
        url.searchParams.set("date", testDate);
      }

      const response = await fetch(url, {
        method: endpoint,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const response = await fetch("/api/cron/analytics", {
        method: "HEAD",
      });

      if (response.ok) {
        setError(null);
        setResponse({
          success: true,
          message: "Health check passed",
          results: [],
          timestamp: new Date().toISOString(),
        });
      } else {
        setError(`Health check failed: HTTP ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed");
    }
  };

  const formatMetric = (value: number) => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return "N/A";
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Success
        </Badge>
      );
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Cron Test</h1>
          <p className="text-muted-foreground">
            Test the nightly analytics aggregation endpoint
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Runs nightly at 2:00 AM
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Configuration</span>
            </CardTitle>
            <CardDescription>
              Set up your cron token and test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Cron Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your CRON_SECRET"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This should match your CRON_SECRET environment variable
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testDate">Test Date (Optional)</Label>
              <Input
                id="testDate"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use yesterday&apos;s date
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Setup for cron-job.org:</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>URL:</strong>{" "}
                  <code className="bg-muted px-1 rounded">
                    https://your-app.vercel.app/api/cron/analytics?token=YOUR_CRON_SECRET
                  </code>
                </p>
                <p>
                  <strong>Schedule:</strong>{" "}
                  <code className="bg-muted px-1 rounded">0 2 * * *</code>{" "}
                  (daily at 2:00 AM)
                </p>
                <p>
                  <strong>Method:</strong> POST
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Test Actions</span>
            </CardTitle>
            <CardDescription>
              Test different endpoints and scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleHealthCheck()}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Health Check (HEAD)
              </Button>

              <Button
                onClick={() => handleTestAnalytics("GET")}
                variant="outline"
                className="w-full"
                disabled={isLoading || !token}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Test Analytics (GET)
              </Button>

              <Button
                onClick={() => handleTestAnalytics("POST")}
                className="w-full"
                disabled={isLoading || !token}
              >
                <Activity className="h-4 w-4 mr-2" />
                Run Nightly Analytics (POST)
              </Button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Processing...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Panel */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-4 text-green-500" />
              <span>Results</span>
            </CardTitle>
            <CardDescription>
              Analytics aggregation results for {response.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={response.success ? "default" : "destructive"}>
                  {response.success ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {response.timestamp}
                </span>
              </div>

              {response.results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Clinic Results:</h4>
                  {response.results.map((result, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.success)}
                          <span className="font-medium">
                            Clinic: {result.clinic_id.slice(0, 8)}...
                          </span>
                        </div>
                        {getStatusBadge(result.success)}
                      </div>

                      {result.success && result.data && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">
                              Appointments
                            </p>
                            <p className="font-medium">
                              {formatMetric(result.data.total_appointments)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMetric(result.data.completed_appointments)}{" "}
                              completed
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-muted-foreground">SMS</p>
                            <p className="font-medium">
                              {formatMetric(result.data.sms_sent)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMetric(result.data.sms_delivered)}{" "}
                              delivered
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-muted-foreground">Exercise</p>
                            <p className="font-medium">
                              {formatMetric(result.data.exercise_completions)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMetric(result.data.patient_check_ins)}{" "}
                              check-ins
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-muted-foreground">Compliance</p>
                            <p className="font-medium">
                              {result.data.avg_appointment_compliance}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.data.avg_exercise_compliance}% exercise
                            </p>
                          </div>
                        </div>
                      )}

                      {!result.success && result.error && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">{result.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
