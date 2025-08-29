"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import {
  UsersIcon,
  MessageSquareIcon,
  CalendarIcon,
  TrendingUpIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPatientStats } from "@/lib/actions/patients";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    optInSmsCount: 0,
    optInEmailCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getPatientStats();
        setStats(result);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const quickActions = [
    {
      title: "Add New Patient",
      description: "Start managing a new patient",
      icon: UsersIcon,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
      href: "/patients",
      action: "create",
    },
    {
      title: "Send Test SMS",
      description: "Test your SMS integration",
      icon: MessageSquareIcon,
      color: "bg-green-50 hover:bg-green-100 text-green-700",
      href: "/test-sms",
      action: "test-sms",
    },
    {
      title: "View All Patients",
      description: "Manage patient records",
      icon: CalendarIcon,
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
      href: "/patients",
      action: "view",
    },
  ];

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getWelcomeMessage()}
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your practice today
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/patients">
              <UsersIcon className="w-4 h-4 mr-2" />
              View Patients
            </Link>
          </Button>
          <Button asChild>
            <Link href="/patients">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Patient
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalPatients}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activePatients} active in last 90 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Opt-ins</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.optInSmsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPatients > 0
                ? `${Math.round((stats.optInSmsCount / stats.totalPatients) * 100)}% of patients`
                : "No patients yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Opt-ins</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.optInEmailCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPatients > 0
                ? `${Math.round((stats.optInEmailCount / stats.totalPatients) * 100)}% of patients`
                : "No patients yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Messages Today
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Ready to send reminders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all ${action.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <action.icon className="w-8 h-8 mr-3" />
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm opacity-75">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 opacity-50" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {stats.totalPatients === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <ClockIcon className="w-5 h-5 mr-2" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-800">
              Welcome to RehabFlow! Let&apos;s get you started with your first
              patient.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-700">
                <Badge variant="outline" className="mr-2">
                  1
                </Badge>
                Add your first patient to start managing communications
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <Badge variant="outline" className="mr-2">
                  2
                </Badge>
                Test SMS functionality to ensure delivery
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <Badge variant="outline" className="mr-2">
                  3
                </Badge>
                Set up automated appointment reminders
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/patients">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Your First Patient
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-gray-500">
              <div className="text-center">
                <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent messages</p>
                <p className="text-sm">
                  Messages will appear here once you start sending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                <span>SMS Service</span>
              </div>
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100"
              >
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                <span>Database</span>
              </div>
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100"
              >
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                <span>Email Service</span>
              </div>
              <Badge
                variant="secondary"
                className="text-yellow-700 bg-yellow-100"
              >
                Setup Required
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
