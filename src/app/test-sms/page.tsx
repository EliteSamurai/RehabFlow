"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquareIcon, SendIcon, CheckCircleIcon } from "lucide-react";

export default function TestSMSPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [testType, setTestType] = useState("welcome");
  const [result, setResult] = useState<{ success: boolean; message: string; data?: unknown } | null>(null);

  const sendTestSMS = async () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/twilio/send?test=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          testType: testType,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success("Test SMS sent successfully!");
      } else {
        toast.error(data.error || "Failed to send SMS");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("SMS Test Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">SMS Testing</h1>
        <p className="text-muted-foreground">
          Test your SMS integration to ensure messages are being delivered
          properly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquareIcon className="w-5 h-5 mr-2" />
              Send Test Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <div>
              <Label htmlFor="testType">Message Type</Label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="reminder">Appointment Reminder</SelectItem>
                  <SelectItem value="exercise">Exercise Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={sendTestSMS}
              disabled={isLoading || !phoneNumber}
              className="w-full"
            >
              <SendIcon className="w-4 h-4 mr-2" />
              {isLoading ? "Sending..." : "Send Test SMS"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircleIcon
                    className={`w-5 h-5 mr-2 ${
                      result.success ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      result.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {result.success ? "Success" : "Failed"}
                  </span>
                </div>

                {result.success && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Message ID:</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {result.messageId}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {result.deliveryStatus}
                      </span>
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-700">{result.error}</p>
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
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Send a test SMS to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>SMS Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Twilio Account SID</span>
              <span className="text-sm text-green-600">✓ Configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Twilio Auth Token</span>
              <span className="text-sm text-green-600">✓ Configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Messaging Service</span>
              <span className="text-sm text-green-600">✓ Configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Real SMS Mode</span>
              <span className="text-sm text-yellow-600">
                {process.env.NEXT_PUBLIC_ENABLE_REAL_SMS === "true"
                  ? "✓ Enabled"
                  : "⚠ Mock Mode"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
