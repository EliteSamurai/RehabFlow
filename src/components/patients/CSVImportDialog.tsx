"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Users,
  Info,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CSVPatient {
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  primary_condition?: string;
  referral_source?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; errors: string[] }>;
}

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
  clinicId: string;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export default function CSVImportDialog({
  open,
  onOpenChange,
  onImportComplete,
  clinicId,
}: CSVImportDialogProps) {
  const [csvData, setCsvData] = useState<CSVPatient[]>([]);
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate E.164 phone format
  const validatePhone = (phone: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  // Validate required fields
  const validatePatient = useCallback(
    (patient: CSVPatient): ValidationResult => {
      const errors: string[] = [];

      if (!patient.phone) {
        errors.push("Phone number is required");
      } else if (!validatePhone(patient.phone)) {
        errors.push("Phone must be in E.164 format (e.g., +1234567890)");
      }

      if (!patient.first_name?.trim()) {
        errors.push("First name is required");
      }

      if (!patient.last_name?.trim()) {
        errors.push("Last name is required");
      }

      if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
        errors.push("Invalid email format");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    []
  );

  // Parse CSV file
  const parseCSV = (file: File): Promise<CSVPatient[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n");
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

          // Map expected columns
          const phoneIndex = headers.findIndex((h) => h.includes("phone"));
          const firstNameIndex = headers.findIndex(
            (h) => h.includes("first") && h.includes("name")
          );
          const lastNameIndex = headers.findIndex(
            (h) => h.includes("last") && h.includes("name")
          );
          const emailIndex = headers.findIndex((h) => h.includes("email"));
          const dobIndex = headers.findIndex(
            (h) =>
              h.includes("dob") || h.includes("birth") || h.includes("date")
          );
          const genderIndex = headers.findIndex(
            (h) => h.includes("gender") || h.includes("sex")
          );
          const conditionIndex = headers.findIndex(
            (h) =>
              h.includes("condition") ||
              h.includes("injury") ||
              h.includes("diagnosis")
          );
          const referralIndex = headers.findIndex(
            (h) => h.includes("referral") || h.includes("source")
          );

          if (
            phoneIndex === -1 ||
            firstNameIndex === -1 ||
            lastNameIndex === -1
          ) {
            reject(
              new Error(
                "CSV must contain 'phone', 'first_name', and 'last_name' columns"
              )
            );
            return;
          }

          const patients: CSVPatient[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line
              .split(",")
              .map((v) => v.trim().replace(/"/g, ""));

            const patient: CSVPatient = {
              phone: values[phoneIndex] || "",
              first_name: values[firstNameIndex] || "",
              last_name: values[lastNameIndex] || "",
              email: emailIndex !== -1 ? values[emailIndex] : undefined,
              date_of_birth: dobIndex !== -1 ? values[dobIndex] : undefined,
              gender: genderIndex !== -1 ? values[genderIndex] : undefined,
              primary_condition:
                conditionIndex !== -1 ? values[conditionIndex] : undefined,
              referral_source:
                referralIndex !== -1 ? values[referralIndex] : undefined,
            };

            patients.push(patient);
          }

          resolve(patients);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        const file = acceptedFiles[0];
        const patients = await parseCSV(file);

        // Validate all patients
        const results = patients.map((patient) => validatePatient(patient));
        setValidationResults(results);
        setCsvData(patients);
        setCurrentStep("preview");
        setImportResult(null);
        toast.success(`Parsed ${patients.length} records from CSV`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to parse CSV file"
        );
      }
    },
    [validatePatient]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: false,
  });

  // Import patients to database
  const handleImport = async () => {
    if (csvData.length === 0) return;

    setIsImporting(true);
    setCurrentStep("importing");
    setImportProgress(0);

    const validPatients = csvData.filter(
      (_, index) => validationResults[index]?.isValid
    );
    const failedPatients: Array<{ row: number; errors: string[] }> = [];

    let successCount = 0;

    for (let i = 0; i < validPatients.length; i++) {
      try {
        const patient = validPatients[i];

        // Prepare patient data for upsert
        const patientData = {
          phone: patient.phone,
          first_name: patient.first_name.trim(),
          last_name: patient.last_name.trim(),
          email: patient.email?.trim() || null,
          date_of_birth: patient.date_of_birth
            ? new Date(patient.date_of_birth).toISOString()
            : null,
          gender: patient.gender?.trim() || null,
          primary_condition: patient.primary_condition?.trim() || null,
          referral_source: patient.referral_source?.trim() || null,
          opt_in_sms: true, // Default to true as per PRD
          opt_in_email: !!patient.email, // Only if email provided
        };

        // Call the upsert API endpoint
        const response = await fetch("/api/patients/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientData, clinicId }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Better error handling - get specific error message
          const errorMessage = responseData.error || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        // Check if the response indicates success
        if (!responseData.success) {
          throw new Error(responseData.error || "Unknown error occurred");
        }

        successCount++;
        setImportProgress((successCount / validPatients.length) * 100);
      } catch (error) {
        const originalIndex = csvData.findIndex(
          (p) =>
            p.phone === validPatients[i].phone &&
            p.first_name === validPatients[i].first_name &&
            p.last_name === validPatients[i].last_name
        );

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        failedPatients.push({
          row: originalIndex + 2, // +2 because of header row and 1-based indexing
          errors: [errorMessage],
        });

        console.error(
          `Failed to import patient at row ${originalIndex + 2}:`,
          error
        );
      }
    }

    const result = {
      success: successCount,
      failed: failedPatients.length,
      errors: failedPatients,
    };

    setImportResult(result);
    setIsImporting(false);
    setCurrentStep("complete");

    if (successCount > 0) {
      toast.success(
        `Successfully imported ${successCount} patient${successCount !== 1 ? "s" : ""}`
      );
      onImportComplete?.();
    }

    if (failedPatients.length > 0) {
      toast.error(
        `${failedPatients.length} patient${failedPatients.length !== 1 ? "s" : ""} failed to import`
      );
    }

    // If all patients failed, show a more specific error
    if (successCount === 0 && failedPatients.length > 0) {
      toast.error(
        "All patients failed to import. Please check the error details below."
      );
    }
  };

  const handleClose = () => {
    setCsvData([]);
    setValidationResults([]);
    setImportResult(null);
    setCurrentStep("upload");
    setImportProgress(0);
    onOpenChange(false);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      [
        "phone",
        "first_name",
        "last_name",
        "email",
        "date_of_birth",
        "gender",
        "primary_condition",
        "referral_source",
      ],
      [
        "+12345678901",
        "John",
        "Doe",
        "john.doe@email.com",
        "1985-06-15",
        "Male",
        "Lower back pain",
        "Dr. Smith",
      ],
      [
        "+12345678902",
        "Jane",
        "Smith",
        "jane.smith@email.com",
        "1990-03-22",
        "Female",
        "Knee injury",
        "Self-referral",
      ],
      [
        "+12345678903",
        "Bob",
        "Johnson",
        "",
        "1978-11-08",
        "Male",
        "Shoulder rehabilitation",
        "Physical therapy clinic",
      ],
    ];

    const csvContent = sampleData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-patients.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const validCount = validationResults.filter((r) => r.isValid).length;
  const invalidCount = validationResults.filter((r) => !r.isValid).length;

  // Add clinic ID validation
  if (!clinicId || clinicId === "clinic-123") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Configuration Error
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Unable to import patients: Invalid clinic configuration. Please
              contact support.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Patients from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with patient information to bulk import patients
            into your clinic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {currentStep === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Upload CSV File</h3>
                    <p className="text-sm text-gray-600">
                      File must include phone, first_name, and last_name columns
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCSV}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample
                  </Button>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive
                      ? "Drop the CSV file here"
                      : "Drag & drop a CSV file here"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to select a file
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports: .csv files with patient data
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Required columns:</strong> phone (E.164 format),
                    first_name, last_name
                    <br />
                    <strong>Optional columns:</strong> email, date_of_birth,
                    gender, primary_condition, referral_source
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {currentStep === "preview" && csvData.length > 0 && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Preview & Validation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review the data before importing. {validCount} valid,{" "}
                      {invalidCount} invalid records.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={validCount > 0 ? "default" : "secondary"}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {validCount} Valid
                    </Badge>
                    <Badge
                      variant={invalidCount > 0 ? "destructive" : "secondary"}
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {invalidCount} Invalid
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Status</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((patient, index) => {
                        const validation = validationResults[index];
                        const isValid = validation?.isValid;

                        return (
                          <TableRow
                            key={index}
                            className={!isValid ? "bg-red-50" : ""}
                          >
                            <TableCell>
                              {isValid ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell
                              className={!isValid ? "text-red-600" : ""}
                            >
                              {patient.phone}
                            </TableCell>
                            <TableCell>{patient.first_name}</TableCell>
                            <TableCell>{patient.last_name}</TableCell>
                            <TableCell>{patient.email || "-"}</TableCell>
                            <TableCell>
                              {!isValid && validation?.errors && (
                                <div className="space-y-1">
                                  {validation.errors.map(
                                    (error, errorIndex) => (
                                      <div
                                        key={errorIndex}
                                        className="text-xs text-red-600"
                                      >
                                        {error}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}

            {/* Step 3: Importing */}
            {currentStep === "importing" && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Importing Patients
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please wait while we import your patient data...
                  </p>
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === "complete" && importResult && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Import Complete
                  </h3>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully imported {importResult.success} patient
                    {importResult.success !== 1 ? "s" : ""}.
                    {importResult.failed > 0 &&
                      ` ${importResult.failed} patient${importResult.failed !== 1 ? "s" : ""} failed to import.`}
                  </AlertDescription>
                </Alert>

                {importResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-red-600">
                        Failed Imports ({importResult.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600">
                            <strong>Row {error.row}:</strong>{" "}
                            {error.errors.join(", ")}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {currentStep === "preview" && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("upload")}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                {currentStep === "complete" ? "Close" : "Cancel"}
              </Button>
              {currentStep === "preview" && (
                <Button onClick={handleImport} disabled={validCount === 0}>
                  Import {validCount} Patient{validCount !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
