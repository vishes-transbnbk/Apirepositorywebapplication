import { useState } from 'react';
import { useApi } from '../contexts/ApiContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ApiModal from './ApiModal';

export default function Dashboard() {
  const { apiGroups } = useApi();
  const [showAddModal, setShowAddModal] = useState(false);

  const activeCount = apiGroups.filter((g) => g.status === 'active').length;
  const inactiveCount = apiGroups.filter((g) => g.status === 'inactive').length;
  const totalEndpoints = apiGroups.reduce((sum, g) => sum + g.endpoints.length, 0);

  const apisByVendor = Object.entries(
    apiGroups.reduce((acc, g) => {
      acc[g.vendor] = (acc[g.vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);

  const apisByType = Object.entries(
    apiGroups.reduce((acc, g) => {
      acc[g.type] = (acc[g.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  const recentApis = [...apiGroups]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New API
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">API Groups</h2>
          <div className="flex gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600">{activeCount}</div>
              <div className="text-sm text-slate-600 mt-1">Active</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-400">{inactiveCount}</div>
              <div className="text-sm text-slate-600 mt-1">Inactive</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Total Endpoints</h2>
          <div className="text-4xl font-bold text-indigo-600">{totalEndpoints}</div>
          <div className="text-sm text-slate-500 mt-1">
            across {apiGroups.length} API{apiGroups.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">APIs by Type</h2>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={apisByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={50}
                dataKey="count"
              >
                {apisByType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">APIs by Vendor</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={apisByVendor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="vendor" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recently Added APIs</h2>
          <div className="space-y-3">
            {recentApis.map((g) => (
              <div key={g.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-medium text-slate-900">{g.name}</div>
                <div className="text-sm text-slate-600">
                  {g.vendor} • {g.type} •{' '}
                  {g.endpoints.length > 0 && (
                    <span className="text-indigo-600 font-medium">{g.endpoints.length} endpoint{g.endpoints.length !== 1 ? 's' : ''} • </span>
                  )}
                  {new Date(g.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {recentApis.length === 0 && (
              <div className="text-slate-500 text-center py-8">No APIs added yet</div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <ApiModal mode="add" onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
