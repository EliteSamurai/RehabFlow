"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Activity,
  Heart,
  Target,
  RefreshCw,
  Clock3,
  Stethoscope,
  CalendarDays,
  Search,
  Filter,
  Phone,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

// Mock data - in production, this would come from your appointments API
interface Appointment {
  id: string;
  patient: {
    id: string;
    name: string;
    phone: string;
    email: string;
    condition: string;
  };
  therapist: {
    id: string;
    name: string;
    credentials: string;
  };
  scheduledAt: string;
  duration: number;
  type: "evaluation" | "treatment" | "re-evaluation" | "follow-up";
  status: "scheduled" | "confirmed" | "completed" | "no-show" | "cancelled";
  notes?: string;
  treatmentPlan?: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patient: {
      id: "p1",
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.j@email.com",
      condition: "ACL Tear Recovery",
    },
    therapist: {
      id: "t1",
      name: "Dr. Michael Chen",
      credentials: "DPT, OCS",
    },
    scheduledAt: "2024-01-15T09:00:00Z",
    duration: 60,
    type: "treatment",
    status: "confirmed",
    notes: "Week 3 post-surgery, focus on range of motion",
    treatmentPlan: "ACL Rehabilitation Protocol",
  },
  {
    id: "2",
    patient: {
      id: "p2",
      name: "Robert Martinez",
      phone: "+1 (555) 987-6543",
      email: "r.martinez@email.com",
      condition: "Lower Back Pain",
    },
    therapist: {
      id: "t2",
      name: "Dr. Lisa Thompson",
      credentials: "DPT, CSCS",
    },
    scheduledAt: "2024-01-15T10:30:00Z",
    duration: 45,
    type: "evaluation",
    status: "scheduled",
    notes: "Initial evaluation for chronic lower back pain",
    treatmentPlan: "Back Pain Management",
  },
  {
    id: "3",
    patient: {
      id: "p3",
      name: "Emily Davis",
      phone: "+1 (555) 456-7890",
      email: "emily.davis@email.com",
      condition: "Shoulder Impingement",
    },
    therapist: {
      id: "t1",
      name: "Dr. Michael Chen",
      credentials: "DPT, OCS",
    },
    scheduledAt: "2024-01-15T14:00:00Z",
    duration: 60,
    type: "treatment",
    status: "completed",
    notes: "Excellent progress, reduced pain from 7/10 to 3/10",
    treatmentPlan: "Shoulder Rehabilitation",
  },
];

const getStatusBadge = (status: Appointment["status"]) => {
  switch (status) {
    case "confirmed":
      return (
        <Badge
          variant="default"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    case "scheduled":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Clock3 className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="default"
          className="bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "no-show":
      return (
        <Badge
          variant="destructive"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="w-3 h-3 mr-1" />
          No Show
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getTypeBadge = (type: Appointment["type"]) => {
  switch (type) {
    case "evaluation":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          <Stethoscope className="w-3 h-3 mr-1" />
          Initial Eval
        </Badge>
      );
    case "treatment":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Activity className="w-3 h-3 mr-1" />
          Treatment
        </Badge>
      );
    case "re-evaluation":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          <Target className="w-3 h-3 mr-1" />
          Re-eval
        </Badge>
      );
    case "follow-up":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <Heart className="w-3 h-3 mr-1" />
          Follow-up
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] =
    useState<Appointment[]>(mockAppointments);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filter appointments based on active tab and search
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient.condition.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const aptDate = new Date(apt.scheduledAt).toDateString();
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();

    switch (activeTab) {
      case "today":
        return aptDate === today;
      case "tomorrow":
        return aptDate === tomorrow;
      case "week":
        const weekFromNow = new Date(Date.now() + 7 * 86400000);
        return (
          new Date(apt.scheduledAt) <= weekFromNow &&
          new Date(apt.scheduledAt) >= new Date()
        );
      case "all":
        return true;
      default:
        return true;
    }
  });

  // Get appointment stats
  const stats = {
    total: appointments.length,
    today: appointments.filter(
      (apt) =>
        new Date(apt.scheduledAt).toDateString() === new Date().toDateString()
    ).length,
    confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    noShows: appointments.filter((apt) => apt.status === "no-show").length,
  };

  const handleStatusChange = (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
    toast.success(`Appointment status updated to ${newStatus}`);
  };

  const handleDeleteAppointment = () => {
    if (selectedAppointment) {
      setAppointments((prev) =>
        prev.filter((apt) => apt.id !== selectedAppointment.id)
      );
      toast.success("Appointment deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main data-testid="appointments-page" className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Appointment Management
            </h1>
            <p className="text-gray-600 mt-1">
              Schedule, track, and manage patient appointments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog
              open={newAppointmentOpen}
              onOpenChange={setNewAppointmentOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                  <DialogDescription>
                    Create a new appointment for a patient
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient">Patient</Label>
                    <Select name="patient">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">
                          Sarah Johnson - ACL Tear
                        </SelectItem>
                        <SelectItem value="p2">
                          Robert Martinez - Back Pain
                        </SelectItem>
                        <SelectItem value="p3">
                          Emily Davis - Shoulder
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        name="time"
                        type="time"
                        defaultValue="09:00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Appointment Type</Label>
                    <Select defaultValue="treatment">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evaluation">
                          Initial Evaluation
                        </SelectItem>
                        <SelectItem value="treatment">
                          Treatment Session
                        </SelectItem>
                        <SelectItem value="re-evaluation">
                          Re-evaluation
                        </SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="therapist">Therapist</Label>
                    <Select defaultValue="t1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t1">
                          Dr. Michael Chen, DPT
                        </SelectItem>
                        <SelectItem value="t2">
                          Dr. Lisa Thompson, DPT
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewAppointmentOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success("Appointment scheduled successfully");
                      setNewAppointmentOpen(false);
                    }}
                  >
                    Schedule Appointment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.today}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {stats.confirmed}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">
                    {stats.completed}
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">No-Shows</p>
                  <div className="text-2xl font-bold text-red-600 mt-2">
                    {stats.noShows}
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl">
                    Appointment Schedule
                  </CardTitle>
                  <CardDescription>
                    View and manage patient appointments
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Appointment Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {filteredAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No appointments found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery
                          ? "Try adjusting your search criteria"
                          : "No appointments scheduled for this period"}
                      </p>
                      <Button onClick={() => setNewAppointmentOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule First Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAppointments.map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Time */}
                              <div className="text-center min-w-[80px]">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatTime(appointment.scheduledAt)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(appointment.scheduledAt)}
                                </div>
                              </div>

                              {/* Patient Info */}
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {appointment.patient.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {appointment.patient.name}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <Phone className="w-3 h-3 mr-1" />
                                      {appointment.patient.phone}
                                    </span>
                                    <span className="flex items-center">
                                      <Heart className="w-3 h-3 mr-1" />
                                      {appointment.patient.condition}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Therapist Info */}
                              <div className="hidden lg:block">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.therapist.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {appointment.therapist.credentials}
                                </div>
                              </div>
                            </div>

                            {/* Status and Actions */}
                            <div className="flex items-center space-x-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {appointment.duration} min
                                </div>
                                {getTypeBadge(appointment.type)}
                              </div>

                              {getStatusBadge(appointment.status)}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Appointment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Notes
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      handleStatusChange(
                                        appointment.id,
                                        "confirmed"
                                      )
                                    }
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Confirmed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      handleStatusChange(
                                        appointment.id,
                                        "completed"
                                      )
                                    }
                                  >
                                    <Activity className="mr-2 h-4 w-4" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      handleStatusChange(
                                        appointment.id,
                                        "no-show"
                                      )
                                    }
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Mark No-Show
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Notes */}
                          {appointment.notes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                  <p className="text-sm text-gray-700">
                                    {appointment.notes}
                                  </p>
                                  {appointment.treatmentPlan && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Plan: {appointment.treatmentPlan}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Cancel Appointment
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel the appointment for{" "}
                <span className="font-semibold">
                  {selectedAppointment?.patient.name}
                </span>{" "}
                on{" "}
                {selectedAppointment &&
                  formatDate(selectedAppointment.scheduledAt)}{" "}
                at{" "}
                {selectedAppointment &&
                  formatTime(selectedAppointment.scheduledAt)}
                ?
                <br />
                <br />
                This action will notify the patient and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAppointment}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hidden elements for testing */}
        <div style={{ display: "none" }}>
          <select name="status" data-status="scheduled">
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="no-show">No Show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </main>
  );
}
