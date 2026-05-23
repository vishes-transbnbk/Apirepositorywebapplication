import { useState } from 'react';
import { useApi } from '../contexts/ApiContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ApiModal from './ApiModal';

export default function Dashboard() {
  const { apis } = useApi();
  const [showAddModal, setShowAddModal] = useState(false);

  const activeCount = apis.filter((api) => api.status === 'active').length;
  const inactiveCount = apis.filter((api) => api.status === 'inactive').length;

  const apisByVendor = Object.entries(
    apis.reduce((acc, api) => {
      acc[api.vendor] = (acc[api.vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);

  const apisByType = Object.entries(
    apis.reduce((acc, api) => {
      acc[api.type] = (acc[api.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  const recentApis = [...apis]
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Total APIs</h2>
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">APIs by Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={apisByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {apisByType.map((entry, index) => (
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
              <XAxis type="number" />
              <YAxis dataKey="vendor" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recently Added APIs</h2>
          <div className="space-y-3">
            {recentApis.map((api) => (
              <div key={api.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-medium text-slate-900">{api.name}</div>
                <div className="text-sm text-slate-600">
                  {api.vendor} • {api.type} • {new Date(api.createdAt).toLocaleDateString()}
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
        <ApiModal
          mode="add"
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
