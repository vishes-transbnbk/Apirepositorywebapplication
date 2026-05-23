import { useState, useMemo } from 'react';
import { useApi, ApiRecord } from '../contexts/ApiContext';
import { Pencil, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import ApiModal from './ApiModal';
import ConfirmDialog from './ConfirmDialog';
import CurlModal from './CurlModal';
import { toast } from 'sonner';

export default function ViewPage() {
  const { apis, toggleStatus } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiRecord | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; currentStatus: string } | null>(null);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlModalData, setCurlModalData] = useState<{ title: string; command: string } | null>(null);

  const columns = [
    { key: 'jiraId', label: 'JIRA ID', width: '120px' },
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'vendor', label: 'Vendor', width: '150px' },
    { key: 'type', label: 'Type', width: '100px' },
    { key: 'description', label: 'Description', width: '250px' },
    { key: 'vendorUat', label: 'Vendor UAT', width: '200px' },
    { key: 'vendorProd', label: 'Vendor Prod', width: '200px' },
    { key: 'trusthubUat', label: 'TrustHub UAT', width: '200px' },
    { key: 'trusthubProd', label: 'TrustHub Prod', width: '200px' },
    { key: 'documentLink', label: 'Document Link', width: '200px' },
    { key: 'remarks', label: 'Remarks', width: '200px' },
    { key: 'status', label: 'Status', width: '100px' },
  ];

  const filteredApis = useMemo(() => {
    let result = apis;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (api) =>
          api.name.toLowerCase().includes(query) ||
          api.vendor.toLowerCase().includes(query) ||
          api.type.toLowerCase().includes(query) ||
          api.jiraId?.toLowerCase().includes(query)
      );
    }

    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        result = result.filter((api) => {
          const value = api[column as keyof ApiRecord];
          return values.includes(String(value || ''));
        });
      }
    });

    return result;
  }, [apis, searchQuery, columnFilters]);

  const getUniqueValues = (column: string): string[] => {
    const values = apis.map((api) => String(api[column as keyof ApiRecord] || '')).filter(Boolean);
    return Array.from(new Set(values)).sort();
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => {
      const currentValues = prev[column] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      if (newValues.length === 0) {
        const { [column]: removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [column]: newValues };
    });
  };

  const exportToExcel = () => {
    const exportData = apis.map((api) => ({
      'JIRA ID': api.jiraId || '',
      'Name': api.name,
      'Vendor': api.vendor,
      'Type': api.type,
      'Description': api.description || '',
      'Vendor UAT': api.vendorUat || '',
      'Vendor Prod': api.vendorProd || '',
      'TrustHub UAT': api.trusthubUat || '',
      'TrustHub Prod': api.trusthubProd || '',
      'Document Link': api.documentLink || '',
      'Remarks': api.remarks || '',
      'Status': api.status.charAt(0).toUpperCase() + api.status.slice(1),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'API Repository');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `API_Repository_Export_${today}.xlsx`);
    toast.success('Export completed successfully');
  };

  const handleEdit = (api: ApiRecord) => {
    setEditingApi(api);
    setShowEditModal(true);
  };

  const handleToggleStatus = (api: ApiRecord) => {
    setConfirmAction({
      id: api.id,
      name: api.name,
      currentStatus: api.status,
    });
    setShowConfirmDialog(true);
  };

  const confirmToggleStatus = () => {
    if (confirmAction) {
      toggleStatus(confirmAction.id);
      toast.success(`API marked as ${confirmAction.currentStatus === 'active' ? 'inactive' : 'active'}`);
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleViewCurl = (title: string, command: string) => {
    setCurlModalData({ title, command });
    setShowCurlModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">View APIs</h1>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download size={18} />
          Export to Excel
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Name, Vendor, Type, or JIRA ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200"
                  style={{ minWidth: column.width }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{column.label}</span>
                    {column.key !== 'description' && column.key !== 'vendorUat' && column.key !== 'vendorProd' && column.key !== 'trusthubUat' && column.key !== 'trusthubProd' && column.key !== 'documentLink' && column.key !== 'remarks' && (
                      <div className="relative group">
                        <button className="p-1 hover:bg-slate-200 rounded">
                          <Filter size={14} className={columnFilters[column.key]?.length > 0 ? 'text-blue-600' : 'text-slate-400'} />
                        </button>
                        <div className="hidden group-hover:block absolute right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-20 min-w-[150px]">
                          <div className="max-h-60 overflow-y-auto p-2">
                            {getUniqueValues(column.key).map((value) => (
                              <label key={value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={columnFilters[column.key]?.includes(value) || false}
                                  onChange={() => handleColumnFilter(column.key, value)}
                                  className="rounded border-slate-300"
                                />
                                <span className="text-slate-700">{value}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200" style={{ minWidth: '150px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredApis.map((api, index) => (
              <tr key={api.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">{api.jiraId || '-'}</td>
                <td className="px-4 py-2.5 text-sm text-slate-900 font-medium border-b border-slate-200">{api.name}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">{api.vendor}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">{api.type}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  <div className="max-w-[250px] truncate">{api.description || '-'}</div>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  {api.vendorUat ? (
                    <button
                      onClick={() => handleViewCurl('Vendor UAT — cURL', api.vendorUat!)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      View cURL
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  {api.vendorProd ? (
                    <button
                      onClick={() => handleViewCurl('Vendor Prod — cURL', api.vendorProd!)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      View cURL
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  {api.trusthubUat ? (
                    <button
                      onClick={() => handleViewCurl('TrustHub UAT — cURL', api.trusthubUat!)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      View cURL
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  {api.trusthubProd ? (
                    <button
                      onClick={() => handleViewCurl('TrustHub Prod — cURL', api.trusthubProd!)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      View cURL
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  <div className="max-w-[200px] truncate">{api.documentLink || '-'}</div>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-200">
                  <div className="max-w-[200px] truncate">{api.remarks || '-'}</div>
                </td>
                <td className="px-4 py-2.5 text-sm border-b border-slate-200">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      api.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(api)}
                      className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={api.status === 'active'}
                        onChange={() => handleToggleStatus(api)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </td>
              </tr>
            ))}
            {filteredApis.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                  No APIs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEditModal && editingApi && (
        <ApiModal
          mode="edit"
          apiData={editingApi}
          onClose={() => {
            setShowEditModal(false);
            setEditingApi(null);
          }}
        />
      )}

      {showConfirmDialog && confirmAction && (
        <ConfirmDialog
          title={`Confirm Status Change`}
          message={`Are you sure you want to mark "${confirmAction.name}" as ${confirmAction.currentStatus === 'active' ? 'Inactive' : 'Active'}?`}
          onConfirm={confirmToggleStatus}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
          }}
        />
      )}

      {showCurlModal && curlModalData && (
        <CurlModal
          title={curlModalData.title}
          curlCommand={curlModalData.command}
          onClose={() => {
            setShowCurlModal(false);
            setCurlModalData(null);
          }}
        />
      )}
    </div>
  );
}
