"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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

export default function CSVImport() {
  const [csvData, setCsvData] = useState<CSVPatient[]>([]);
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Validate E.164 phone format
  const validatePhone = (phone: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  // Validate required fields
  const validatePatient = useCallback((patient: CSVPatient): ValidationResult => {
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
  }, []);

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
            .map((h) => h.trim().toLowerCase());

          // Map expected columns
          const phoneIndex = headers.findIndex((h) => h.includes("phone"));
          const firstNameIndex = headers.findIndex(
            (h) => h.includes("first") || h.includes("name")
          );
          const lastNameIndex = headers.findIndex(
            (h) => h.includes("last") || h.includes("name")
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
                "CSV must contain phone, first_name, and last_name columns"
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
        setShowPreview(true);
        setImportResult(null);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        // You might want to show an error toast here
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
    setImportProgress(0);

    const validPatients = csvData.filter(
      (_, index) => validationResults[index]?.isValid
    );
    const failedPatients: Array<{ row: number; errors: string[] }> = [];

    let successCount = 0;

    // Get clinic ID from context or props - for now using a placeholder
    // TODO: Get this from your auth context or clinic context
    const clinicId = "your-clinic-id"; // Replace with actual clinic ID

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

        // Call the actual API endpoint
        const response = await fetch("/api/patients/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientData, clinicId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
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
        failedPatients.push({
          row: originalIndex + 1,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    }

    setImportResult({
      success: successCount,
      failed: failedPatients.length,
      errors: failedPatients,
    });

    setIsImporting(false);
  };

  const validCount = validationResults.filter((r) => r.isValid).length;
  const invalidCount = validationResults.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Patients from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file with patient information. The file must include
            phone, first_name, and last_name columns.
            <br />
            <a
              href="/sample-patients.csv"
              download
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Download sample CSV template
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <p className="text-sm text-gray-500">or click to select a file</p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: .csv files with phone, first_name, last_name columns
            </p>
          </div>
        </CardContent>
      </Card>

      {showPreview && csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview & Validation
            </CardTitle>
            <CardDescription>
              Review the data before importing. {validCount} valid,{" "}
              {invalidCount} invalid records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={validCount > 0 ? "default" : "secondary"}>
                  {validCount} Valid
                </Badge>
                <Badge variant={invalidCount > 0 ? "destructive" : "secondary"}>
                  {invalidCount} Invalid
                </Badge>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || validCount === 0}
                  className="ml-auto"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import ${validCount} Patients`}
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Importing patients...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
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
                          <TableCell className={!isValid ? "text-red-600" : ""}>
                            {patient.phone}
                          </TableCell>
                          <TableCell>{patient.first_name}</TableCell>
                          <TableCell>{patient.last_name}</TableCell>
                          <TableCell>{patient.email || "-"}</TableCell>
                          <TableCell>
                            {!isValid && validation?.errors && (
                              <div className="space-y-1">
                                {validation.errors.map((error, errorIndex) => (
                                  <div
                                    key={errorIndex}
                                    className="text-xs text-red-600"
                                  >
                                    {error}
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {importResult.success} patients.
                  {importResult.failed > 0 &&
                    ` ${importResult.failed} patients failed to import.`}
                </AlertDescription>
              </Alert>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Failed Imports:</h4>
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600">
                      Row {error.row}: {error.errors.join(", ")}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setShowPreview(false)} variant="outline">
                  Close
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Import Another File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
