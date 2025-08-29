export default function AppointmentsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600">Schedule and manage patient appointments</p>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500">No appointments scheduled. Create your first appointment.</p>
        </div>
      </div>
    </div>
  );
}
