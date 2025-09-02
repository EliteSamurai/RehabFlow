"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Shield, FileText, MessageSquare, Mail, Users } from "lucide-react";

interface ConsentRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  clinic_id: string;
  consent_date: string;
  sms_consent: boolean;
  email_consent: boolean;
  data_processing_consent: boolean;
  third_party_sharing_consent: boolean;
  marketing_consent: boolean;
  age_confirmed: boolean;
  terms_accepted: boolean;
  consent_version: string;
  withdrawal_date?: string;
  withdrawal_reason?: string;
  last_updated: string;
}

interface ConsentStats {
  total_patients: number;
  sms_opted_in: number;
  email_opted_in: number;
  fully_consented: number;
  consent_withdrawn: number;
  consent_expired: number;
}

export default function ConsentTracker() {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [consentStats, setConsentStats] = useState<ConsentStats>({
    total_patients: 0,
    sms_opted_in: 0,
    email_opted_in: 0,
    fully_consented: 0,
    consent_withdrawn: 0,
    consent_expired: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from the database
    loadConsentData();
  }, []);

  const loadConsentData = async () => {
    // Mock data for demonstration
    const mockRecords: ConsentRecord[] = [
      {
        id: "1",
        patient_id: "patient-1",
        patient_name: "John Doe",
        clinic_id: "clinic-1",
        consent_date: "2024-01-15",
        sms_consent: true,
        email_consent: true,
        data_processing_consent: true,
        third_party_sharing_consent: true,
        marketing_consent: false,
        age_confirmed: true,
        terms_accepted: true,
        consent_version: "1.0",
        last_updated: "2024-01-15",
      },
      {
        id: "2",
        patient_id: "patient-2",
        patient_name: "Jane Smith",
        clinic_id: "clinic-1",
        consent_date: "2024-01-20",
        sms_consent: true,
        email_consent: false,
        data_processing_consent: true,
        third_party_sharing_consent: true,
        marketing_consent: false,
        age_confirmed: true,
        terms_accepted: true,
        consent_version: "1.0",
        last_updated: "2024-01-20",
      },
      {
        id: "3",
        patient_id: "patient-3",
        clinic_id: "clinic-1",
        patient_name: "Mike Johnson",
        consent_date: "2024-01-10",
        sms_consent: false,
        email_consent: false,
        data_processing_consent: true,
        third_party_sharing_consent: true,
        marketing_consent: false,
        age_confirmed: true,
        terms_accepted: true,
        consent_version: "1.0",
        withdrawal_date: "2024-01-25",
        withdrawal_reason: "Patient requested withdrawal",
        last_updated: "2024-01-25",
      },
    ];

    setConsentRecords(mockRecords);
    
    // Calculate stats
    const stats: ConsentStats = {
      total_patients: mockRecords.length,
      sms_opted_in: mockRecords.filter(r => r.sms_consent && !r.withdrawal_date).length,
      email_opted_in: mockRecords.filter(r => r.email_consent && !r.withdrawal_date).length,
      fully_consented: mockRecords.filter(r => 
        r.sms_consent && r.email_consent && r.data_processing_consent && 
        r.third_party_sharing_consent && r.age_confirmed && r.terms_accepted && 
        !r.withdrawal_date
      ).length,
      consent_withdrawn: mockRecords.filter(r => r.withdrawal_date).length,
      consent_expired: 0, // Would calculate based on consent expiration rules
    };
    
    setConsentStats(stats);
    setLoading(false);
  };

  const getConsentStatus = (record: ConsentRecord) => {
    if (record.withdrawal_date) {
      return { status: "withdrawn", color: "bg-red-100 text-red-800" };
    }
    
    const allConsents = record.sms_consent && record.email_consent && 
                       record.data_processing_consent && record.third_party_sharing_consent &&
                       record.age_confirmed && record.terms_accepted;
    
    if (allConsents) {
      return { status: "fully consented", color: "bg-green-100 text-green-800" };
    } else {
      return { status: "partially consented", color: "bg-yellow-100 text-yellow-800" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading consent data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consent Management</h1>
          <p className="text-gray-600 mt-2">
            Track and manage patient consent records for compliance and communication
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Export Consent Report
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentStats.total_patients}</div>
            <p className="text-xs text-muted-foreground">
              All patients in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Opt-ins</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentStats.sms_opted_in}</div>
            <p className="text-xs text-muted-foreground">
              {consentStats.total_patients > 0 
                ? `${Math.round((consentStats.sms_opted_in / consentStats.total_patients) * 100)}% opt-in rate`
                : "No patients"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Consented</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentStats.fully_consented}</div>
            <p className="text-xs text-muted-foreground">
              {consentStats.total_patients > 0 
                ? `${Math.round((consentStats.fully_consented / consentStats.total_patients) * 100)}% compliance rate`
                : "No patients"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Opt-ins</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentStats.email_opted_in}</div>
            <p className="text-xs text-muted-foreground">
              {consentStats.total_patients > 0 
                ? `${Math.round((consentStats.email_opted_in / consentStats.total_patients) * 100)}% opt-in rate`
                : "No patients"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consent Withdrawn</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentStats.consent_withdrawn}</div>
            <p className="text-xs text-muted-foreground">
              Patients who withdrew consent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consent Expired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentStats.consent_expired}</div>
            <p className="text-xs text-muted-foreground">
              Consents requiring renewal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Consent Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Consent Records</CardTitle>
          <CardDescription>
            Detailed view of all patient consent records and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Patient</th>
                  <th className="text-left p-2 font-medium">Consent Date</th>
                  <th className="text-left p-2 font-medium">SMS</th>
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">Data Processing</th>
                  <th className="text-left p-2 font-medium">Third Party</th>
                  <th className="text-left p-2 font-medium">Marketing</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consentRecords.map((record) => {
                  const status = getConsentStatus(record);
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{record.patient_name}</div>
                          <div className="text-sm text-gray-500">ID: {record.patient_id}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{formatDate(record.consent_date)}</div>
                          <div className="text-gray-500">v{record.consent_version}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={record.sms_consent ? "default" : "secondary"}>
                          {record.sms_consent ? "✓ Opted In" : "✗ Opted Out"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={record.email_consent ? "default" : "secondary"}>
                          {record.email_consent ? "✓ Opted In" : "✗ Opted Out"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={record.data_processing_consent ? "default" : "secondary"}>
                          {record.data_processing_consent ? "✓ Granted" : "✗ Denied"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={record.third_party_sharing_consent ? "default" : "secondary"}>
                          {record.third_party_sharing_consent ? "✓ Granted" : "✗ Denied"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={record.marketing_consent ? "default" : "secondary"}>
                          {record.marketing_consent ? "✓ Opted In" : "✗ Opted Out"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={status.color}>
                          {status.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            Update Consent
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Notes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Compliance Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• All consent records are maintained for 7 years as required by HIPAA</li>
            <li>• Consent withdrawals are logged with reason and timestamp</li>
            <li>• Regular audits ensure consent validity and compliance</li>
            <li>• Patients can update preferences at any time through their clinic</li>
            <li>• Automated reminders for consent renewal when approaching expiration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
