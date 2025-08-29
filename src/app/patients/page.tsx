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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const loadPatients = useCallback(
    async (params?: PatientSearchInput) => {
      try {
        setLoading(true);
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
        setLoading(false);
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

  const handleSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    const newParams = { ...searchParams, sortBy, sortOrder, page: 1 };
    setSearchParams(newParams);
    loadPatients(newParams);
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

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const firstName = row.getValue("first_name") as string;
        const lastName = row.original.last_name;
        return (
          <div className="font-medium">
            {firstName} {lastName}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const phone = row.original.phone;
        return (
          <div className="space-y-1">
            <div className="text-sm">{email || "No email"}</div>
            <div className="text-xs text-muted-foreground">{phone}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "primary_condition",
      header: "Condition",
      cell: ({ row }) => {
        const condition = row.getValue("primary_condition") as string;
        return condition ? (
          <Badge variant="secondary" className="text-xs">
            {condition}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No condition</span>
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
          <div className="flex space-x-1">
            <Badge
              variant={smsOptIn ? "default" : "outline"}
              className="text-xs"
            >
              SMS {smsOptIn ? "✓" : "✗"}
            </Badge>
            <Badge
              variant={emailOptIn ? "default" : "outline"}
              className="text-xs"
            >
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
          >
            Added
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const patient = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(patient)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(patient)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Manage your clinic&apos;s patient records
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold">{stats.totalPatients}</div>
          <p className="text-xs text-muted-foreground">Total Patients</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold">{stats.activePatients}</div>
          <p className="text-xs text-muted-foreground">Active (90 days)</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold">{stats.optInSmsCount}</div>
          <p className="text-xs text-muted-foreground">SMS Opted In</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold">{stats.optInEmailCount}</div>
          <p className="text-xs text-muted-foreground">Email Opted In</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData.patients}
        searchPlaceholder="Search patients by name, email, phone, or condition..."
        onSearchChange={handleSearch}
        onSortChange={handleSort}
        onFilterChange={handleFilter}
        totalCount={paginatedData.totalCount}
        pageSize={paginatedData.pageSize}
        currentPage={paginatedData.page}
        onPageChange={handlePageChange}
        isLoading={loading}
        filters={filters}
      />

      <PatientDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        patient={selectedPatient}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patientToDelete?.first_name}{" "}
              {patientToDelete?.last_name}
              and all associated records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
