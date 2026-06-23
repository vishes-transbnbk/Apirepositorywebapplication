import { useState, useMemo, useRef, useEffect } from 'react';
import { useApi, ApiGroup } from '../contexts/ApiContext';
import { Pencil, Filter, Download, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import ApiModal from './ApiModal';
import ConfirmDialog from './ConfirmDialog';
import CurlModal from './CurlModal';
import { toast } from 'sonner';

function FilterDropdown({
  columnKey,
  uniqueValues,
  selectedValues,
  onToggle,
  onSelectAll,
}: {
  columnKey: string;
  uniqueValues: string[];
  selectedValues: string[];
  onToggle: (column: string, value: string) => void;
  onSelectAll: (column: string, values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const allSelected = uniqueValues.length > 0 && uniqueValues.every((v) => selectedValues.includes(v));
  const someSelected = selectedValues.length > 0 && !allSelected;

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: Math.max(0, rect.right + window.scrollX - 150) });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative">
      <button ref={btnRef} onClick={handleOpen} className="p-1 hover:bg-slate-200 rounded">
        <Filter size={14} className={selectedValues.length > 0 ? 'text-blue-600' : 'text-slate-400'} />
      </button>
      {open && (
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-md shadow-lg min-w-[150px]"
        >
          <div className="max-h-60 overflow-y-auto p-2">
            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 mb-1">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={() => onSelectAll(columnKey, uniqueValues)}
                className="rounded border-slate-300"
              />
              <span className="text-slate-700 font-medium">Select All</span>
            </label>
            {uniqueValues.map((value) => (
              <label key={value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => onToggle(columnKey, value)}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-700">{value}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CurlCell({ label, value, onView }: { label: string; value?: string; onView: (title: string, cmd: string) => void }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <button
      onClick={() => onView(label, value)}
      className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm whitespace-nowrap"
    >
      View cURL
    </button>
  );
}

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 80;
  if (!text) return <span className="text-slate-400">—</span>;
  if (text.length <= LIMIT) return <span className="text-slate-700 text-sm">{text}</span>;
  return (
    <div className="max-w-[200px]">
      <span className="text-slate-700 text-sm">
        {expanded ? text : `${text.slice(0, LIMIT)}...`}
      </span>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="block text-xs text-blue-500 hover:text-blue-700 mt-0.5 font-medium"
      >
        {expanded ? 'less' : 'more'}
      </button>
    </div>
  );
}

export default function ViewPage() {
  const { apiGroups, toggleStatus } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiGroup | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; currentStatus: string } | null>(null);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlModalData, setCurlModalData] = useState<{ title: string; command: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    let result = apiGroups;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.vendor.toLowerCase().includes(q) ||
          g.type.toLowerCase().includes(q) ||
          g.jiraId?.toLowerCase().includes(q) ||
          g.endpoints.some((ep) => ep.name.toLowerCase().includes(q))
      );
    }
    Object.entries(columnFilters).forEach(([col, vals]) => {
      if (vals.length > 0) {
        result = result.filter((g) => vals.includes(String(g[col as keyof ApiGroup] || '')));
      }
    });
    return result;
  }, [apiGroups, searchQuery, columnFilters]);

  const getUniqueValues = (col: string): string[] => {
    const vals = apiGroups.map((g) => String(g[col as keyof ApiGroup] || '')).filter(Boolean);
    return Array.from(new Set(vals)).sort();
  };

  const handleColumnFilter = (col: string, val: string) => {
    setColumnFilters((prev) => {
      const cur = prev[col] || [];
      const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
      if (next.length === 0) { const { [col]: _, ...rest } = prev; return rest; }
      return { ...prev, [col]: next };
    });
  };

  const handleSelectAll = (col: string, allVals: string[]) => {
    setColumnFilters((prev) => {
      const cur = prev[col] || [];
      const allSelected = allVals.every((v) => cur.includes(v));
      if (allSelected) { const { [col]: _, ...rest } = prev; return rest; }
      return { ...prev, [col]: allVals };
    });
  };

  const exportToExcel = () => {
    const rows: Record<string, string>[] = [];
    apiGroups.forEach((g) => {
      if (g.endpoints.length === 0) {
        rows.push({
          'JIRA ID': g.jiraId || '',
          'API Name': g.name,
          'Endpoint': '',
          'Vendor': g.vendor,
          'Type': g.type,
          'Description': g.description || '',
          'Vendor UAT': '',
          'Vendor Prod': '',
          'TrustHub UAT': '',
          'TrustHub Prod': '',
          'Document Link': g.documentLink || '',
          'Remarks': g.remarks || '',
          'Status': g.status.charAt(0).toUpperCase() + g.status.slice(1),
        });
      } else {
        g.endpoints.forEach((ep) => {
          rows.push({
            'JIRA ID': g.jiraId || '',
            'API Name': g.name,
            'Endpoint': ep.name,
            'Vendor': g.vendor,
            'Type': g.type,
            'Description': g.description || '',
            'Vendor UAT': ep.vendorUat || '',
            'Vendor Prod': ep.vendorProd || '',
            'TrustHub UAT': ep.trusthubUat || '',
            'TrustHub Prod': ep.trusthubProd || '',
            'Document Link': g.documentLink || '',
            'Remarks': g.remarks || '',
            'Status': g.status.charAt(0).toUpperCase() + g.status.slice(1),
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'API Repository');
    XLSX.writeFile(wb, `API_Repository_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export completed successfully');
  };

  const handleEdit = (g: ApiGroup) => { setEditingApi(g); setShowEditModal(true); };

  const handleToggleStatus = (g: ApiGroup) => {
    setConfirmAction({ id: g.id, name: g.name, currentStatus: g.status });
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

  const filterableCols = [
    { key: 'jiraId',  label: 'JIRA ID'     },
    { key: 'name',    label: 'Name'         },
    { key: 'vendor',  label: 'Vendor'       },
    { key: 'type',    label: 'Type'         },
    { key: 'status',  label: 'Status'       },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">View APIs</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add New API
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Name, Vendor, Type, JIRA ID, or Endpoint..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {/* expand toggle */}
              <th className="px-3 py-3 border-b border-slate-200 w-10" />

              {/* filterable group columns */}
              {filterableCols.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    <FilterDropdown
                      columnKey={col.key}
                      uniqueValues={getUniqueValues(col.key)}
                      selectedValues={columnFilters[col.key] || []}
                      onToggle={handleColumnFilter}
                      onSelectAll={handleSelectAll}
                    />
                  </div>
                </th>
              ))}

              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 min-w-[200px]">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-24">Endpoints</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-28">Vendor UAT</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-28">Vendor Prod</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-28">TrustHub UAT</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-28">TrustHub Prod</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-24">Document</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 min-w-[160px]">Remarks</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200 w-28">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredGroups.map((group, index) => {
              const isExpanded = expandedGroups.has(group.id);
              const epCount = group.endpoints.length;
              const isSingle = epCount === 1;
              const isMulti = epCount > 1;
              const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
              const ep0 = group.endpoints[0]; // used for single-endpoint inline display

              return (
                <>
                  {/* ── Parent / group row ── */}
                  <tr key={group.id} className={`${rowBg} hover:bg-blue-50/30 transition-colors`}>

                    {/* Expand chevron — only for multi-endpoint groups */}
                    <td className="px-3 py-2.5 border-b border-slate-200">
                      {isMulti && (
                        <button
                          onClick={() => toggleExpand(group.id)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown size={15} className="text-slate-500" />
                            : <ChevronRight size={15} className="text-slate-500" />}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-2.5 border-b border-slate-200 text-slate-700">{group.jiraId || '—'}</td>
                    <td className="px-4 py-2.5 border-b border-slate-200 font-semibold text-slate-900">{group.name}</td>
                    <td className="px-4 py-2.5 border-b border-slate-200 text-slate-700">{group.vendor}</td>
                    <td className="px-4 py-2.5 border-b border-slate-200 text-slate-700">{group.type}</td>

                    {/* Status badge */}
                    <td className="px-4 py-2.5 border-b border-slate-200">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                        {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 border-b border-slate-200">
                      <ExpandableDescription text={group.description || ''} />
                    </td>

                    {/* Endpoint count */}
                    <td className="px-4 py-2.5 border-b border-slate-200">
                      {epCount === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : isMulti ? (
                        <button
                          onClick={() => toggleExpand(group.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {epCount} endpoints
                        </button>
                      ) : (
                        <span className="text-slate-600">1</span>
                      )}
                    </td>

                    {/* cURL columns:
                        - single endpoint → show links directly on parent row
                        - multi endpoint  → blank (links shown on child rows)
                        - no endpoints    → dash */}
                    <td className="px-4 py-2.5 border-b border-slate-200">
                      {isSingle
                        ? <CurlCell label={`${group.name} — Vendor UAT`} value={ep0.vendorUat} onView={handleViewCurl} />
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-200">
                      {isSingle
                        ? <CurlCell label={`${group.name} — Vendor Prod`} value={ep0.vendorProd} onView={handleViewCurl} />
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-200">
                      {isSingle
                        ? <CurlCell label={`${group.name} — TrustHub UAT`} value={ep0.trusthubUat} onView={handleViewCurl} />
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-200">
                      {isSingle
                        ? <CurlCell label={`${group.name} — TrustHub Prod`} value={ep0.trusthubProd} onView={handleViewCurl} />
                        : <span className="text-slate-400">—</span>}
                    </td>

                   <td className="px-4 py-2.5 border-b border-slate-200">
  {group.documentLink && group.documentLink.startsWith('https://') ? (
    <a href={group.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
      View Doc
    </a>
  ) : group.documentLink ? (
    <span className="text-slate-400 text-xs">Invalid URL</span>
  ) : '—'}
</td>

                    <td className="px-4 py-2.5 border-b border-slate-200 text-slate-700">
                      <div className="max-w-[160px] whitespace-normal break-words">{group.remarks || '—'}</div>
                    </td>

                    <td className="px-4 py-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(group)} className="p-1.5 hover:bg-slate-200 rounded transition-colors" title="Edit">
                          <Pencil size={16} className="text-blue-600" />
                        </button>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.status === 'active'}
                            onChange={() => handleToggleStatus(group)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                        </label>
                      </div>
                    </td>
                  </tr>

                  {/* ── Child rows — only for multi-endpoint groups when expanded ── */}
                  {isMulti && isExpanded && group.endpoints.map((ep, epIdx) => (
                    <tr key={ep.id} className="bg-indigo-50/40">
                      {/* empty expand cell */}
                      <td className="border-b border-indigo-100" />

                      {/* JIRA ID empty */}
                      <td className="border-b border-indigo-100" />

                      {/* Endpoint name, indented under Name column */}
                      <td className="px-4 py-2 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-px bg-indigo-300 shrink-0" />
                          <span className="text-sm text-indigo-800 font-medium">
                            {ep.name || `Endpoint ${epIdx + 1}`}
                          </span>
                        </div>
                      </td>

                      {/* Vendor, Type, Status, Description — blank on child rows */}
                      <td className="border-b border-indigo-100" />
                      <td className="border-b border-indigo-100" />
                      <td className="border-b border-indigo-100" />
                      <td className="border-b border-indigo-100" />

                      {/* Endpoints count — blank on child rows */}
                      <td className="border-b border-indigo-100" />

                      {/* 4 cURL columns on child rows */}
                      <td className="px-4 py-2 border-b border-indigo-100">
                        <CurlCell label={`${ep.name || `Endpoint ${epIdx + 1}`} — Vendor UAT`} value={ep.vendorUat} onView={handleViewCurl} />
                      </td>
                      <td className="px-4 py-2 border-b border-indigo-100">
                        <CurlCell label={`${ep.name || `Endpoint ${epIdx + 1}`} — Vendor Prod`} value={ep.vendorProd} onView={handleViewCurl} />
                      </td>
                      <td className="px-4 py-2 border-b border-indigo-100">
                        <CurlCell label={`${ep.name || `Endpoint ${epIdx + 1}`} — TrustHub UAT`} value={ep.trusthubUat} onView={handleViewCurl} />
                      </td>
                      <td className="px-4 py-2 border-b border-indigo-100">
                        <CurlCell label={`${ep.name || `Endpoint ${epIdx + 1}`} — TrustHub Prod`} value={ep.trusthubProd} onView={handleViewCurl} />
                      </td>

                      {/* Document, Remarks, Actions — blank on child rows */}
                      <td className="border-b border-indigo-100" />
                      <td className="border-b border-indigo-100" />
                      <td className="border-b border-indigo-100" />
                    </tr>
                  ))}
                </>
              );
            })}

            {filteredGroups.length === 0 && (
              <tr>
                <td colSpan={15} className="px-4 py-12 text-center text-slate-500">No APIs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEditModal && editingApi && (
        <ApiModal mode="edit" apiData={editingApi} onClose={() => { setShowEditModal(false); setEditingApi(null); }} />
      )}
      {showConfirmDialog && confirmAction && (
        <ConfirmDialog
          title="Confirm Status Change"
          message={`Are you sure you want to mark "${confirmAction.name}" as ${confirmAction.currentStatus === 'active' ? 'Inactive' : 'Active'}?`}
          onConfirm={confirmToggleStatus}
          onCancel={() => { setShowConfirmDialog(false); setConfirmAction(null); }}
        />
      )}
      {showCurlModal && curlModalData && (
        <CurlModal title={curlModalData.title} curlCommand={curlModalData.command} onClose={() => { setShowCurlModal(false); setCurlModalData(null); }} />
      )}
      {showAddModal && (
        <ApiModal mode="add" onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}