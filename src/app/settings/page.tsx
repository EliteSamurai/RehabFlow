export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your account and application preferences</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500">Update your profile information and preferences.</p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500">Configure how you receive notifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
