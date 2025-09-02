"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MessageSquare,
  Activity,
  Heart,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  Award,
  Mail,
  PieChart,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";

// Mock data - in production, this would come from your analytics API
const mockAnalyticsData = {
  overview: {
    totalPatients: 247,
    activePatients: 189,
    messagesSent: 1543,
    responseRate: 78.5,
    noShowRate: 12.3,
    complianceRate: 73.2,
    satisfactionScore: 4.6,
    roi: 285,
  },
  trends: {
    patientsGrowth: 12.5,
    messagesGrowth: 23.1,
    responseGrowth: 8.7,
    noShowReduction: -34.2,
    complianceGrowth: 15.8,
    satisfactionGrowth: 18.3,
  },
  communication: {
    smsDelivered: 1456,
    smsOpened: 1142,
    smsResponded: 896,
    emailDelivered: 234,
    emailOpened: 167,
    emailClicked: 89,
  },
  appointments: {
    totalScheduled: 324,
    completed: 284,
    noShows: 40,
    cancelled: 15,
    rescheduled: 28,
  },
  compliance: {
    exerciseCompletion: 73.2,
    appointmentAttendance: 87.7,
    medicationAdherence: 82.1,
    homeExerciseStreak: 5.8,
  },
  outcomes: {
    painReduction: 68.5,
    functionalImprovement: 72.3,
    treatmentCompletion: 89.2,
    goalAchievement: 76.8,
  },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  format?: "number" | "percentage" | "currency" | "rating";
  description?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
  format = "number",
  description,
}: MetricCardProps) => {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;

    switch (format) {
      case "percentage":
        return `${val}%`;
      case "currency":
        return `$${val.toLocaleString()}`;
      case "rating":
        return `${val}/5.0`;
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = change ? change > 0 : null;
  const changeColor =
    isPositive === null ? "" : isPositive ? "text-green-600" : "text-red-600";
  const TrendIcon =
    isPositive === null ? null : isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-3xl font-bold text-gray-900">
                {formatValue(value)}
              </p>
              {change !== undefined && TrendIcon && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${changeColor} bg-opacity-10`}
                >
                  <TrendIcon className="w-3 h-3 mr-1" />
                  {Math.abs(change)}%
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
          <div
            className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProgressBarProps {
  label: string;
  value: number;
  target?: number;
  color: string;
  icon: React.ElementType;
}

const ProgressBar = ({
  label,
  value,
  target,
  color,
  icon: Icon,
}: ProgressBarProps) => {
  const percentage = Math.min(100, value);
  const targetMet = target ? value >= target : false;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-900">{value}%</span>
          {target && (
            <Badge
              variant={targetMet ? "default" : "secondary"}
              className={`text-xs ${
                targetMet
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              }`}
            >
              Target: {target}%
            </Badge>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            targetMet ? "bg-green-500" : color.replace("text-", "bg-")
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const overviewMetrics = [
    {
      title: "Total Patients",
      value: mockAnalyticsData.overview.totalPatients,
      change: mockAnalyticsData.trends.patientsGrowth,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Active patient records",
    },
    {
      title: "Messages Sent",
      value: mockAnalyticsData.overview.messagesSent,
      change: mockAnalyticsData.trends.messagesGrowth,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "SMS & Email combined",
    },
    {
      title: "Response Rate",
      value: mockAnalyticsData.overview.responseRate,
      change: mockAnalyticsData.trends.responseGrowth,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
      format: "percentage" as const,
      description: "Patient engagement",
    },
    {
      title: "No-Show Rate",
      value: mockAnalyticsData.overview.noShowRate,
      change: mockAnalyticsData.trends.noShowReduction,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      format: "percentage" as const,
      description: "Missed appointments",
    },
    {
      title: "Compliance Rate",
      value: mockAnalyticsData.overview.complianceRate,
      change: mockAnalyticsData.trends.complianceGrowth,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      format: "percentage" as const,
      description: "Treatment adherence",
    },
    {
      title: "Patient Satisfaction",
      value: mockAnalyticsData.overview.satisfactionScore,
      change: mockAnalyticsData.trends.satisfactionGrowth,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      format: "rating" as const,
      description: "Average rating",
    },
    {
      title: "ROI Impact",
      value: mockAnalyticsData.overview.roi,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      format: "percentage" as const,
      description: "Revenue improvement",
    },
    {
      title: "Active Patients",
      value: mockAnalyticsData.overview.activePatients,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Last 30 days",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Analytics & Insights
            </h1>
            <p className="text-gray-600 mt-1">
              Track performance, patient outcomes, and practice growth
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {overviewMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </motion.div>

        {/* Detailed Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* ROI Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-600" />
                    Return on Investment Dashboard
                  </CardTitle>
                  <CardDescription>
                    Measure the financial impact of your communication platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        $12,450
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Revenue Saved
                      </p>
                      <p className="text-xs text-gray-500">
                        From reduced no-shows
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        285%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">ROI</p>
                      <p className="text-xs text-gray-500">
                        Platform investment return
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        156
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Hours Saved</p>
                      <p className="text-xs text-gray-500">
                        Staff time automation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>
                    Key metrics performance over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Interactive charts coming soon
                      </p>
                      <p className="text-xs text-gray-400">
                        Line charts for trends over time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="space-y-6">
              {/* Communication Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      SMS Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivered</span>
                      <span className="font-semibold">
                        {mockAnalyticsData.communication.smsDelivered}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Opened</span>
                      <span className="font-semibold">
                        {mockAnalyticsData.communication.smsOpened}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Responded</span>
                      <span className="font-semibold">
                        {mockAnalyticsData.communication.smsResponded}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response Rate</span>
                        <span className="font-bold">
                          {(
                            (mockAnalyticsData.communication.smsResponded /
                              mockAnalyticsData.communication.smsDelivered) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(mockAnalyticsData.communication.smsResponded / mockAnalyticsData.communication.smsDelivered) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Email Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivered</span>
                      <span className="font-semibold">
                        {mockAnalyticsData.communication.emailDelivered}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Opened</span>
                      <span className="font-semibold">
                        {mockAnalyticsData.communication.emailOpened}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Clicked</span>
                      <span className="font-semibold">
                        {mockAnalyticsData.communication.emailClicked}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Open Rate</span>
                        <span className="font-bold">
                          {(
                            (mockAnalyticsData.communication.emailOpened /
                              mockAnalyticsData.communication.emailDelivered) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(mockAnalyticsData.communication.emailOpened / mockAnalyticsData.communication.emailDelivered) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Message Types Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Types Performance</CardTitle>
                  <CardDescription>
                    Response rates by message category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ProgressBar
                      label="Appointment Reminders"
                      value={82.5}
                      target={75}
                      color="text-blue-500"
                      icon={Calendar}
                    />
                    <ProgressBar
                      label="Exercise Reminders"
                      value={68.3}
                      target={70}
                      color="text-green-500"
                      icon={Activity}
                    />
                    <ProgressBar
                      label="Progress Check-ins"
                      value={74.8}
                      target={65}
                      color="text-purple-500"
                      icon={Target}
                    />
                    <ProgressBar
                      label="No-show Recovery"
                      value={56.2}
                      target={50}
                      color="text-orange-500"
                      icon={AlertCircle}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              {/* Appointment Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Appointment Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Scheduled
                        </span>
                        <span className="font-semibold">
                          {mockAnalyticsData.appointments.totalScheduled}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-semibold text-green-600">
                          {mockAnalyticsData.appointments.completed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">No-shows</span>
                        <span className="font-semibold text-red-600">
                          {mockAnalyticsData.appointments.noShows}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cancelled</span>
                        <span className="font-semibold text-orange-600">
                          {mockAnalyticsData.appointments.cancelled}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Rescheduled
                        </span>
                        <span className="font-semibold text-blue-600">
                          {mockAnalyticsData.appointments.rescheduled}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>No-Show Impact</CardTitle>
                    <CardDescription>
                      Before vs after implementing RehabFlow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium">
                          Before RehabFlow
                        </span>
                        <span className="font-bold text-red-600">18.7%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">
                          After RehabFlow
                        </span>
                        <span className="font-bold text-green-600">12.3%</span>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          34.2%
                        </div>
                        <p className="text-sm text-blue-700">
                          Reduction in no-shows
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Appointment Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Patterns</CardTitle>
                  <CardDescription>
                    Weekly and daily appointment trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Appointment pattern charts coming soon
                      </p>
                      <p className="text-xs text-gray-400">
                        Heatmaps and distribution analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              {/* Treatment Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Treatment Compliance Rates
                  </CardTitle>
                  <CardDescription>
                    Patient adherence to treatment plans and exercises
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressBar
                    label="Exercise Completion"
                    value={mockAnalyticsData.compliance.exerciseCompletion}
                    target={70}
                    color="text-green-500"
                    icon={Activity}
                  />
                  <ProgressBar
                    label="Appointment Attendance"
                    value={mockAnalyticsData.compliance.appointmentAttendance}
                    target={85}
                    color="text-blue-500"
                    icon={Calendar}
                  />
                  <ProgressBar
                    label="Medication Adherence"
                    value={mockAnalyticsData.compliance.medicationAdherence}
                    target={80}
                    color="text-purple-500"
                    icon={Heart}
                  />
                </CardContent>
              </Card>

              {/* Compliance Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Exercise Streak</CardTitle>
                    <CardDescription>
                      Consecutive days of completed exercises
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {mockAnalyticsData.compliance.homeExerciseStreak} days
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +2.3 days vs last month
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Score</CardTitle>
                    <CardDescription>
                      Overall treatment adherence rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        8.7/10
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Excellent compliance
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="outcomes" className="space-y-6">
              {/* Patient Outcomes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    Patient Outcomes & Satisfaction
                  </CardTitle>
                  <CardDescription>
                    Treatment effectiveness and patient satisfaction metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressBar
                    label="Pain Reduction"
                    value={mockAnalyticsData.outcomes.painReduction}
                    target={60}
                    color="text-red-500"
                    icon={Heart}
                  />
                  <ProgressBar
                    label="Functional Improvement"
                    value={mockAnalyticsData.outcomes.functionalImprovement}
                    target={65}
                    color="text-green-500"
                    icon={Activity}
                  />
                  <ProgressBar
                    label="Treatment Completion"
                    value={mockAnalyticsData.outcomes.treatmentCompletion}
                    target={85}
                    color="text-blue-500"
                    icon={CheckCircle}
                  />
                  <ProgressBar
                    label="Goal Achievement"
                    value={mockAnalyticsData.outcomes.goalAchievement}
                    target={70}
                    color="text-purple-500"
                    icon={Target}
                  />
                </CardContent>
              </Card>

              {/* Satisfaction Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Overall Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-pink-600 mb-2">
                        4.6/5.0
                      </div>
                      <div className="flex justify-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Heart
                            key={star}
                            className={`w-4 h-4 ${
                              star <= 4.6
                                ? "text-pink-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Based on 247 reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Communication Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        4.8/5.0
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Excellent
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Care Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        4.7/5.0
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Outstanding
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  );
}
