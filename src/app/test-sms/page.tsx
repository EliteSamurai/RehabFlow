"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface SMSResult {
  success: boolean;
  message: string;
  data?: {
    messageId?: string;
    deliveryStatus?: string;
    error?: string;
  };
}

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [testType, setTestType] = useState<"welcome" | "reminder" | "exercise">(
    "welcome"
  );
  const [result, setResult] = useState<SMSResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testMessages = {
    welcome: "Welcome to RehabFlow! You're all set to reduce no-shows 🚀",
    reminder:
      "Reminder: You have an appointment tomorrow at 2:00 PM. Reply CONFIRM to confirm.",
    exercise:
      "Time for your daily exercises! Complete your routine and reply DONE when finished.",
  };

  const handleSend = async () => {
    if (!phoneNumber || !message) {
      alert("Please enter both phone number and message");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/twilio/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          isTest: true,
          testType,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to send SMS",
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async (type: "welcome" | "reminder" | "exercise") => {
    setTestType(type);
    setMessage(testMessages[type]);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/twilio/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: testMessages[type],
          isTest: true,
          testType: type,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to send test SMS",
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-testid="sms-test-page" className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS Test</h1>
        <p className="text-gray-600">Test SMS functionality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Send Test SMS
            </CardTitle>
            <CardDescription>
              Test your SMS integration with custom or predefined messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select
                value={testType}
                onValueChange={(value: "welcome" | "reminder" | "exercise") =>
                  setTestType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="reminder">Appointment Reminder</SelectItem>
                  <SelectItem value="exercise">Exercise Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={loading || !phoneNumber || !message}
              className="w-full"
            >
              {loading ? "Sending..." : "Send SMS"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Quick Tests
            </CardTitle>
            <CardDescription>
              Send predefined test messages to verify your integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleQuickTest("welcome")}
                disabled={loading || !phoneNumber}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Welcome Message
              </Button>

              <Button
                variant="outline"
                onClick={() => handleQuickTest("reminder")}
                disabled={loading || !phoneNumber}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Appointment Reminder
              </Button>

              <Button
                variant="outline"
                onClick={() => handleQuickTest("exercise")}
                disabled={loading || !phoneNumber}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Exercise Reminder
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Make sure to enter a valid phone number before running quick
                tests.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              SMS Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              <p className="text-sm">{result.message}</p>

              {result.data?.messageId && (
                <div className="text-sm">
                  <strong>Message ID:</strong> {result.data.messageId}
                </div>
              )}

              {result.data?.deliveryStatus && (
                <div className="text-sm">
                  <strong>Status:</strong> {result.data.deliveryStatus}
                </div>
              )}

              {result.data?.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">{result.data.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
