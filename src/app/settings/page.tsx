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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Building,
  Bell,
  Shield,
  Users,
  MessageSquare,
  Clock,
  Key,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle,
  Activity,
  HelpCircle,
  Plus,
  Edit,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ClinicSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  businessHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  specialty: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "admin" | "therapist" | "assistant";
  specialization: string;
  licenseNumber: string;
  credentials: string;
}

interface NotificationSettings {
  emailNotifications: {
    appointments: boolean;
    reminders: boolean;
    noShows: boolean;
    newPatients: boolean;
    systemUpdates: boolean;
  };
  smsNotifications: {
    appointments: boolean;
    emergencies: boolean;
  };
  pushNotifications: {
    appointments: boolean;
    messages: boolean;
    reminders: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
  auditLogRetention: number;
  ipWhitelist: string[];
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Mock data - in production, this would come from your settings API
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    name: "RehabFlow Physical Therapy",
    email: "admin@rehabflow.com",
    phone: "+1 (555) 123-4567",
    address: "123 Health Street, Medical Center, CA 90210",
    website: "https://rehabflow.com",
    timezone: "America/Los_Angeles",
    businessHours: {
      monday: { start: "08:00", end: "18:00", enabled: true },
      tuesday: { start: "08:00", end: "18:00", enabled: true },
      wednesday: { start: "08:00", end: "18:00", enabled: true },
      thursday: { start: "08:00", end: "18:00", enabled: true },
      friday: { start: "08:00", end: "17:00", enabled: true },
      saturday: { start: "09:00", end: "15:00", enabled: true },
      sunday: { start: "09:00", end: "15:00", enabled: false },
    },
    specialty: "orthopedic",
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@rehabflow.com",
    phone: "+1 (555) 987-6543",
    role: "admin",
    specialization: "Orthopedic Physical Therapy",
    licenseNumber: "PT12345",
    credentials: "DPT, OCS",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: {
      appointments: true,
      reminders: true,
      noShows: true,
      newPatients: true,
      systemUpdates: false,
    },
    smsNotifications: {
      appointments: true,
      emergencies: true,
    },
    pushNotifications: {
      appointments: true,
      messages: true,
      reminders: false,
    },
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    sessionTimeout: 60,
    passwordLastChanged: "2024-01-01",
    auditLogRetention: 90,
    ipWhitelist: ["192.168.1.0/24"],
  });

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Profile settings saved successfully");
    }, 1000);
  };

  const handleSaveClinic = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Clinic settings saved successfully");
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Notification preferences saved successfully");
    }, 1000);
  };

  const handleSaveSecurity = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Security settings updated successfully");
    }, 1000);
  };

  const handleExportData = () => {
    toast.success("Data export initiated. You'll receive an email when ready.");
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion initiated. This action cannot be undone.");
    setDeleteAccountOpen(false);
  };

  const dayNames = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-6xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Settings & Preferences
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your account, clinic, and application settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
          </div>
        </motion.div>

        {/* Main Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="clinic" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Clinic
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and professional credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={userProfile.firstName}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={userProfile.lastName}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile.email}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={userProfile.phone}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={userProfile.role}
                        onValueChange={(value: string) =>
                          setUserProfile((prev) => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="therapist">
                            Physical Therapist
                          </SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={userProfile.specialization}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            specialization: e.target.value,
                          }))
                        }
                        placeholder="e.g., Orthopedic Physical Therapy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={userProfile.licenseNumber}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            licenseNumber: e.target.value,
                          }))
                        }
                        placeholder="PT12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credentials">Credentials</Label>
                      <Input
                        id="credentials"
                        value={userProfile.credentials}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            credentials: e.target.value,
                          }))
                        }
                        placeholder="DPT, OCS, CSCS"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Password & Security
                  </CardTitle>
                  <CardDescription>
                    Update your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={(checked) =>
                        setSecurity((prev) => ({
                          ...prev,
                          twoFactorEnabled: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline">
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clinic Settings */}
            <TabsContent value="clinic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Clinic Information
                  </CardTitle>
                  <CardDescription>
                    Update your clinic details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name</Label>
                      <Input
                        id="clinicName"
                        value={clinicSettings.name}
                        onChange={(e) =>
                          setClinicSettings((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinicEmail">Clinic Email</Label>
                      <Input
                        id="clinicEmail"
                        type="email"
                        value={clinicSettings.email}
                        onChange={(e) =>
                          setClinicSettings((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="clinicPhone">Phone Number</Label>
                      <Input
                        id="clinicPhone"
                        type="tel"
                        value={clinicSettings.phone}
                        onChange={(e) =>
                          setClinicSettings((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={clinicSettings.website}
                        onChange={(e) =>
                          setClinicSettings((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={clinicSettings.address}
                      onChange={(e) =>
                        setClinicSettings((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={clinicSettings.timezone}
                        onValueChange={(value) =>
                          setClinicSettings((prev) => ({
                            ...prev,
                            timezone: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time (PT)
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time (MT)
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time (CT)
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time (ET)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Specialty</Label>
                      <Select
                        value={clinicSettings.specialty}
                        onValueChange={(value) =>
                          setClinicSettings((prev) => ({
                            ...prev,
                            specialty: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="orthopedic">Orthopedic</SelectItem>
                          <SelectItem value="sports">
                            Sports Medicine
                          </SelectItem>
                          <SelectItem value="neurological">
                            Neurological
                          </SelectItem>
                          <SelectItem value="pediatric">Pediatric</SelectItem>
                          <SelectItem value="geriatric">Geriatric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Business Hours
                  </CardTitle>
                  <CardDescription>
                    Set your clinic&apos;s operating hours for each day of the
                    week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dayNames.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={
                            clinicSettings.businessHours[
                              key as keyof typeof clinicSettings.businessHours
                            ].enabled
                          }
                          onCheckedChange={(checked) =>
                            setClinicSettings((prev) => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                [key]: {
                                  ...prev.businessHours[
                                    key as keyof typeof prev.businessHours
                                  ],
                                  enabled: checked,
                                },
                              },
                            }))
                          }
                        />
                        <span className="font-medium min-w-[100px]">
                          {label}
                        </span>
                      </div>
                      {clinicSettings.businessHours[
                        key as keyof typeof clinicSettings.businessHours
                      ].enabled && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={
                              clinicSettings.businessHours[
                                key as keyof typeof clinicSettings.businessHours
                              ].start
                            }
                            onChange={(e) =>
                              setClinicSettings((prev) => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [key]: {
                                    ...prev.businessHours[
                                      key as keyof typeof prev.businessHours
                                    ],
                                    start: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={
                              clinicSettings.businessHours[
                                key as keyof typeof clinicSettings.businessHours
                              ].end
                            }
                            onChange={(e) =>
                              setClinicSettings((prev) => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [key]: {
                                    ...prev.businessHours[
                                      key as keyof typeof prev.businessHours
                                    ],
                                    end: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveClinic} disabled={loading}>
                      {loading ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose what email notifications you&apos;d like to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notifications.emailNotifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {key === "appointments" &&
                              "New appointments and changes"}
                            {key === "reminders" &&
                              "Appointment reminders and follow-ups"}
                            {key === "noShows" &&
                              "Patient no-show notifications"}
                            {key === "newPatients" &&
                              "New patient registrations"}
                            {key === "systemUpdates" &&
                              "System updates and maintenance"}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({
                              ...prev,
                              emailNotifications: {
                                ...prev.emailNotifications,
                                [key]: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    SMS Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure SMS notifications for urgent matters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notifications.smsNotifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {key === "appointments" &&
                              "Critical appointment changes"}
                            {key === "emergencies" &&
                              "Emergency patient situations"}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({
                              ...prev,
                              smsNotifications: {
                                ...prev.smsNotifications,
                                [key]: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security & Privacy
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">
                        Session Timeout (minutes)
                      </Label>
                      <Select
                        value={security.sessionTimeout.toString()}
                        onValueChange={(value) =>
                          setSecurity((prev) => ({
                            ...prev,
                            sessionTimeout: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auditRetention">
                        Audit Log Retention (days)
                      </Label>
                      <Select
                        value={security.auditLogRetention.toString()}
                        onValueChange={(value) =>
                          setSecurity((prev) => ({
                            ...prev,
                            auditLogRetention: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">6 months</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          HIPAA Compliance Active
                        </p>
                        <p className="text-sm text-green-700">
                          All data is encrypted and compliant with HIPAA
                          regulations
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Data Export</p>
                        <p className="text-sm text-gray-500">
                          Download all your clinic data
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleExportData}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSecurity} disabled={loading}>
                      {loading ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Security Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that will affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">
                          Delete Account
                        </p>
                        <p className="text-sm text-red-700">
                          Permanently delete your account and all associated
                          data
                        </p>
                      </div>
                      <AlertDialog
                        open={deleteAccountOpen}
                        onOpenChange={setDeleteAccountOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="w-5 h-5" />
                              Delete Account
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete your account and remove all
                              associated data including patients, appointments,
                              and communication history.
                              <br />
                              <br />
                              <span className="font-semibold text-red-600">
                                All patient data will be permanently lost.
                              </span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Management */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage staff access and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mock team members */}
                  {[
                    {
                      name: "Dr. Sarah Johnson",
                      email: "sarah.johnson@rehabflow.com",
                      role: "Administrator",
                      status: "Active",
                    },
                    {
                      name: "Dr. Michael Chen",
                      email: "michael.chen@rehabflow.com",
                      role: "Physical Therapist",
                      status: "Active",
                    },
                    {
                      name: "Lisa Thompson",
                      email: "lisa.thompson@rehabflow.com",
                      role: "Assistant",
                      status: "Active",
                    },
                  ].map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{member.role}</Badge>
                        <Badge
                          variant="default"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {member.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Invite Team Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your clinic team
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Email Address</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="colleague@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select defaultValue="therapist">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  Administrator
                                </SelectItem>
                                <SelectItem value="therapist">
                                  Physical Therapist
                                </SelectItem>
                                <SelectItem value="assistant">
                                  Assistant
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button
                            onClick={() =>
                              toast.success("Invitation sent successfully")
                            }
                          >
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  );
}
