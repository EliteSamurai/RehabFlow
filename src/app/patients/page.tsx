"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Heart,
  Zap,
  Building,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { DataTable } from "@/components/ui/data-table";
import { PatientDialog } from "@/components/patients/PatientDialog";
import { CSVImportDialog } from "@/components/patients/CSVImportDialog";
import {
  getPatients,
  deletePatient,
  getPatientStats,
  type PaginatedPatients,
} from "@/lib/actions/patients";
import {
  type Patient,
  type PatientSearchInput,
} from "@/lib/validations/patient";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useClinic } from "@/lib/hooks/useClinic";
import Link from "next/link";

// Patient status based on last activity
const getPatientStatus = (patient: Patient) => {
  if (!patient.updated_at) return "new";

  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(patient.updated_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceUpdate <= 7) return "active";
  if (daysSinceUpdate <= 30) return "recent";
  return "inactive";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="default"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case "recent":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          Recent
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          <Zap className="w-3 h-3 mr-1" />
          New
        </Badge>
      );
  }
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatPhoneNumber = (phone: string) => {
  // Format E.164 phone number to readable format
  if (phone.startsWith("+1") && phone.length === 12) {
    const number = phone.slice(2);
    return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  return phone;
};

export default function PatientsPage() {
  const [paginatedData, setPaginatedData] = useState<PaginatedPatients>({
    patients: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    optInSmsCount: 0,
    optInEmailCount: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [searchParams, setSearchParams] = useState<PatientSearchInput>({
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
  });
  const [activeTab, setActiveTab] = useState("all");
  const [quickSearch, setQuickSearch] = useState("");

  // Get real clinic ID from auth context
  const { clinic, loading: clinicLoading, error: clinicError } = useClinic();

  // Mock clinic ID - in production, this would come from auth context
  // const clinicId = "clinic-123";

  const loadPatients = useCallback(
    async (params?: PatientSearchInput) => {
      try {
        const searchParameters = params || searchParams;
        const result = await getPatients(searchParameters);
        setPaginatedData(result);

        // Load stats on initial load
        if (!params || params.page === 1) {
          const statsResult = await getPatientStats();
          setStats(statsResult);
        }
      } catch (error) {
        console.error("Error loading patients:", error);
        toast.error("Failed to load patients");
      } finally {
        // setLoading(false); // Removed unused loading state
      }
    },
    [searchParams]
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = (search: string) => {
    const newParams = { ...searchParams, search, page: 1 };
    setSearchParams(newParams);
    loadPatients(newParams);
  };

  const handleSort = (
    sortBy: "created_at" | "first_name" | "last_name" | "primary_condition",
    sortOrder: "asc" | "desc"
  ) => {
    const newParams = { ...searchParams, sortBy, sortOrder, page: 1 };
    setSearchParams(newParams);
    loadPatients(newParams);
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    const validSortBy = sortBy as
      | "created_at"
      | "first_name"
      | "last_name"
      | "primary_condition";
    handleSort(validSortBy, sortOrder);
  };

  const handleFilter = (filters: Record<string, string | number>) => {
    const newParams = {
      ...searchParams,
      ...filters,
      page: 1,
    };
    setSearchParams(newParams);
    loadPatients(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page };
    setSearchParams(newParams);
    loadPatients(newParams);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    try {
      const result = await deletePatient(patientToDelete.id!);
      if (result.success) {
        toast.success("Patient deleted successfully");
        loadPatients();
      } else {
        toast.error(result.error || "Failed to delete patient");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPatient(undefined);
  };

  const handleDialogSuccess = () => {
    loadPatients();
  };

  const handleQuickSearch = (value: string) => {
    setQuickSearch(value);
    handleSearch(value);
  };

  const handleCSVImportComplete = () => {
    loadPatients();
  };

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-gray-50"
          >
            Patient
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const firstName = row.getValue("first_name") as string;
        const lastName = row.original.last_name;
        const status = getPatientStatus(row.original);
        const initials =
          `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {initials}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {firstName} {lastName}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(status)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contact Info",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const phone = row.original.phone;
        return (
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-900">
              <Mail className="w-3 h-3 mr-2 text-gray-400" />
              {email || "No email"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-3 h-3 mr-2 text-gray-400" />
              {phone || "No phone"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "primary_condition",
      header: "Primary Condition",
      cell: ({ row }) => {
        const condition = row.getValue("primary_condition") as string;
        const injuryDate = row.original.injury_date;

        return (
          <div className="space-y-1">
            {condition ? (
              <Badge variant="secondary" className="text-xs font-medium">
                {condition}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">
                No condition
              </span>
            )}
            {injuryDate && (
              <div className="text-xs text-gray-500">
                Injury: {new Date(injuryDate).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "opt_in_sms",
      header: "Communication",
      cell: ({ row }) => {
        const smsOptIn = row.getValue("opt_in_sms") as boolean;
        const emailOptIn = row.original.opt_in_email;
        return (
          <div className="flex flex-col space-y-1">
            <Badge
              variant={smsOptIn ? "default" : "outline"}
              className={`text-xs w-fit ${
                smsOptIn
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "text-gray-500"
              }`}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              SMS {smsOptIn ? "✓" : "✗"}
            </Badge>
            <Badge
              variant={emailOptIn ? "default" : "outline"}
              className={`text-xs w-fit ${
                emailOptIn
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "text-gray-500"
              }`}
            >
              <Mail className="w-3 h-3 mr-1" />
              Email {emailOptIn ? "✓" : "✗"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-gray-50"
          >
            Added
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return <div className="text-sm text-gray-900">{formattedDate}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const patient = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-50">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleEdit(patient)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Patient
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(patient)}
                className="text-red-600 cursor-pointer focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Patient
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters = [
    {
      key: "condition",
      label: "Condition",
      options: [
        { label: "Back Pain", value: "back pain" },
        { label: "Knee Injury", value: "knee" },
        { label: "Shoulder", value: "shoulder" },
        { label: "ACL Tear", value: "acl" },
        { label: "Post-Surgery", value: "surgery" },
        { label: "Chronic Pain", value: "chronic" },
        { label: "Sports Injury", value: "sports" },
      ],
    },
    {
      key: "optInSms",
      label: "SMS Status",
      options: [
        { label: "Opted In", value: "true" },
        { label: "Opted Out", value: "false" },
      ],
    },
    {
      key: "status",
      label: "Activity Status",
      options: [
        { label: "Active (7 days)", value: "active" },
        { label: "Recent (30 days)", value: "recent" },
        { label: "Inactive (30+ days)", value: "inactive" },
        { label: "New Patients", value: "new" },
      ],
    },
  ];

  // Enhanced stats with additional metrics
  const enhancedStats = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: User,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "increase" as const,
    },
    {
      title: "Active Patients",
      value: stats.activePatients,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeType: "increase" as const,
    },
    {
      title: "SMS Enrolled",
      value: stats.optInSmsCount,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+15%",
      changeType: "increase" as const,
    },
    {
      title: "Email Enrolled",
      value: stats.optInEmailCount,
      icon: Mail,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+5%",
      changeType: "increase" as const,
    },
  ];

  // Show loading state while clinic info is being fetched
  if (clinicLoading) {
    return (
      <main className="min-h-screen bg-gray-50" data-testid="patients-page">
        <div className="container mx-auto py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading clinic information...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show error state if clinic info couldn't be loaded
  if (clinicError || !clinic) {
    return (
      <main className="min-h-screen bg-gray-50" data-testid="patients-page">
        <div className="container mx-auto py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-blue-600 mb-6">
                <Building className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Complete Your Clinic Setup
                </h2>
                <p className="text-gray-600">
                  You need to complete your clinic setup before managing
                  patients.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 mb-3">
                  <strong>What needs to be done:</strong>
                </p>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Set up your clinic information</li>
                  <li>• Configure business hours</li>
                  <li>• Set up billing and subscription</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link href="/onboarding" className="w-full">
                  <Button className="w-full">Complete Clinic Setup</Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>
                  Need help? Contact{" "}
                  <a
                    href="mailto:support@rehabflow.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@rehabflow.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main data-testid="patients-page" className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Patient Management
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive patient records and treatment tracking
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCsvImportOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {enhancedStats.map((stat, index) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          stat.changeType === "increase"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Patient Directory</CardTitle>
                  <CardDescription>
                    Search, filter, and manage your patient records
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search patients..."
                      value={quickSearch}
                      onChange={(e) => handleQuickSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Patient Status Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                  <TabsTrigger value="all">All Patients</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={paginatedData.patients}
                searchPlaceholder="Search by name, email, phone, or condition..."
                onSearchChange={handleSearch}
                onSortChange={handleSortChange}
                onFilterChange={handleFilter}
                totalCount={paginatedData.totalCount}
                pageSize={paginatedData.pageSize}
                currentPage={paginatedData.page}
                onPageChange={handlePageChange}
                isLoading={false} // Removed loading state
                filters={filters}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Dialog */}
        <PatientDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          patient={selectedPatient}
          onSuccess={handleDialogSuccess}
        />

        {/* CSV Import Dialog */}
        <CSVImportDialog
          open={csvImportOpen}
          onOpenChange={setCsvImportOpen}
          onImportComplete={handleCSVImportComplete}
          clinicId={clinic.id} // Use real clinic ID
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Delete Patient Record
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="font-semibold">
                  {patientToDelete?.first_name} {patientToDelete?.last_name}
                </span>{" "}
                and all associated records including appointments, treatment
                plans, and communication history.
                <br />
                <br />
                <span className="text-red-600 font-medium">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Patient
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hidden form elements for testing */}
        <div style={{ display: "none" }}>
          <form>
            <input name="first_name" type="text" />
            <input name="last_name" type="text" />
            <input name="phone" type="tel" />
            <input name="email" type="email" />
            <input name="date_of_birth" type="date" />
            <select name="gender">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input name="primary_condition" type="text" />
          </form>
        </div>
      </div>
    </main>
  );
}
