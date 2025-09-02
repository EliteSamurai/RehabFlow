import CSVImport from "@/components/patients/CSVImport";

export default function CSVImportDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CSV Import Demo
          </h1>
          <p className="text-gray-600">
            Test the patient CSV import functionality with drag & drop,
            validation, and preview.
          </p>
        </div>

        <CSVImport />
      </div>
    </div>
  );
}
