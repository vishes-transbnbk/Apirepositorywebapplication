import { useState } from 'react';
import { useApi } from '../contexts/ApiContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import ApiModal from './ApiModal';

const COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#64748b', '#84cc16',
];

// Compute Y-axis width dynamically based on longest vendor name
function yAxisWidth(data: { vendor: string }[]): number {
  const longest = Math.max(...data.map((d) => d.vendor.length));
  return Math.min(Math.max(longest * 7, 80), 180);
}

// Custom legend for the type chart — renders as a clean list instead of crowded pie labels
function TypeLegend({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-1">
      {data
        .sort((a, b) => b.count - a.count)
        .map((d, i) => (
          <div key={d.type} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-slate-700 truncate">{d.type}</span>
            </div>
            <span className="text-slate-500 shrink-0 font-medium">
              {d.count} ({((d.count / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
    </div>
  );
}

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

  // Bar chart height: 36px per vendor row, minimum 200px
  const vendorChartHeight = Math.max(apisByVendor.length * 36, 200);
  const axisWidth = yAxisWidth(apisByVendor);

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
        {/* API Groups */}
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

        {/* Total Endpoints */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Total Endpoints</h2>
          <div className="text-4xl font-bold text-indigo-600">{totalEndpoints}</div>
          <div className="text-sm text-slate-500 mt-1">
            across {apiGroups.length} API{apiGroups.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* APIs by Type — replaced pie chart with horizontal bar + legend list */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">APIs by Type</h2>
          {apisByType.length === 0 ? (
            <div className="text-slate-400 text-sm">No data</div>
          ) : (
            <div className="flex gap-4">
              {/* Small bar chart */}
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[...apisByType].sort((a, b) => b.count - a.count)}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                  >
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="type" type="category" width={0} tick={false} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value, _name, props) => [value, props.payload.type]}
                      labelFormatter={() => ''}
                    />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                      {[...apisByType]
                        .sort((a, b) => b.count - a.count)
                        .map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend list */}
              <div className="w-36 shrink-0">
                <TypeLegend data={apisByType} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* APIs by Vendor — dynamic height + dynamic Y-axis width */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">APIs by Vendor</h2>
          <div style={{ height: vendorChartHeight }} className="overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={apisByVendor}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="vendor"
                  type="category"
                  width={axisWidth}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recently Added APIs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recently Added APIs</h2>
          <div className="space-y-3">
            {recentApis.map((g) => (
              <div key={g.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-medium text-slate-900">{g.name}</div>
                <div className="text-sm text-slate-600">
                  {g.vendor} • {g.type} •{' '}
                  {g.endpoints.length > 0 && (
                    <span className="text-indigo-600 font-medium">
                      {g.endpoints.length} endpoint{g.endpoints.length !== 1 ? 's' : ''} •{' '}
                    </span>
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