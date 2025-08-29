export default function CampaignsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-600">Create and manage communication campaigns</p>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Campaigns</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500">No campaigns running. Launch your first campaign to engage patients.</p>
        </div>
      </div>
    </div>
  );
}
