import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, ApiGroup, NewEndpoint } from '../contexts/ApiContext';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApiModalProps {
  mode: 'add' | 'edit';
  apiData?: ApiGroup;
  onClose: () => void;
}

const EMPTY_ENDPOINT: NewEndpoint = {
  name: '',
  vendorUat: '',
  vendorProd: '',
  trusthubUat: '',
  trusthubProd: '',
};

export default function ApiModal({ mode, apiData, onClose }: ApiModalProps) {
  const { addApiGroup, updateApiGroup, checkDuplicate } = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jiraId: '',
    name: '',
    vendor: '',
    type: '',
    description: '',
    documentLink: '',
    remarks: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [endpoints, setEndpoints] = useState<NewEndpoint[]>([{ ...EMPTY_ENDPOINT }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && apiData) {
      setFormData({
        jiraId: apiData.jiraId || '',
        name: apiData.name,
        vendor: apiData.vendor,
        type: apiData.type,
        description: apiData.description || '',
        documentLink: apiData.documentLink || '',
        remarks: apiData.remarks || '',
        status: apiData.status,
      });
      setEndpoints(
        apiData.endpoints.length > 0
          ? apiData.endpoints.map((ep) => ({
              name: ep.name,
              vendorUat: ep.vendorUat || '',
              vendorProd: ep.vendorProd || '',
              trusthubUat: ep.trusthubUat || '',
              trusthubProd: ep.trusthubProd || '',
            }))
          : [{ ...EMPTY_ENDPOINT }]
      );
    }
  }, [mode, apiData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'name' || field === 'vendor') setDuplicateError('');
  };

  const handleEndpointChange = (index: number, field: keyof NewEndpoint, value: string) => {
    setEndpoints((prev) => prev.map((ep, i) => i === index ? { ...ep, [field]: value } : ep));
  };

  const addEndpoint = () => {
    setEndpoints((prev) => [...prev, { ...EMPTY_ENDPOINT }]);
  };

  const removeEndpoint = (index: number) => {
    if (endpoints.length === 1) return; // always keep at least one
    setEndpoints((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required';
    if (!formData.type.trim()) newErrors.type = 'Type is required';

    // Validate endpoint names if more than one endpoint (name is optional for single)
    if (endpoints.length > 1) {
      endpoints.forEach((ep, i) => {
        if (!ep.name.trim()) {
          newErrors[`endpoint_name_${i}`] = 'Endpoint name is required when multiple endpoints exist';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const isDuplicate = checkDuplicate(
      formData.name,
      formData.vendor,
      mode === 'edit' ? apiData?.id : undefined
    );

    if (isDuplicate) {
      setDuplicateError('An API with this Name and Vendor already exists.');
      setErrors((prev) => ({ ...prev, name: ' ', vendor: ' ' }));
      return;
    }

    // Filter out completely empty endpoints
    const validEndpoints = endpoints.filter(
      (ep) => ep.name.trim() || ep.vendorUat || ep.vendorProd || ep.trusthubUat || ep.trusthubProd
    );

    const payload = { ...formData, endpoints: validEndpoints };

    if (mode === 'add') {
      addApiGroup(payload);
      toast.success('API added successfully');
      onClose();
      navigate('/view');
    } else if (mode === 'edit' && apiData) {
      updateApiGroup(apiData.id, payload);
      toast.success('API updated successfully');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'add' ? 'Add New API' : 'Edit API'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">JIRA ID</label>
              <input
                type="text"
                value={formData.jiraId}
                onChange={(e) => handleChange('jiraId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., API-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="e.g., KYC Validation"
              />
              {errors.name && errors.name !== ' ' && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Vendor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.vendor ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="e.g., Auth0"
              />
              {duplicateError && <p className="text-red-500 text-xs mt-1">{duplicateError}</p>}
              {errors.vendor && errors.vendor !== ' ' && !duplicateError && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.type ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="e.g., REST, SOAP, GraphQL"
              />
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the API purpose and functionality"
            />
          </div>

          {/* Endpoints */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Endpoints</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Add one or more endpoints for this API (e.g. Generate OTP, Submit OTP)
                </p>
              </div>
              <button
                type="button"
                onClick={addEndpoint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Plus size={14} />
                Add Endpoint
              </button>
            </div>

            <div className="space-y-5">
              {endpoints.map((ep, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Endpoint {endpoints.length > 1 ? index + 1 : ''}
                    </span>
                    {endpoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEndpoint(index)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Remove endpoint"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Endpoint Name {endpoints.length > 1 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={ep.name}
                      onChange={(e) => handleEndpointChange(index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors[`endpoint_name_${index}`] ? 'border-red-500' : 'border-slate-300'}`}
                      placeholder="e.g., Generate OTP"
                    />
                    {errors[`endpoint_name_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`endpoint_name_${index}`]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'vendorUat', label: 'Vendor UAT (cURL)', placeholder: 'curl -X POST https://uat.vendor.com/...' },
                      { key: 'vendorProd', label: 'Vendor Prod (cURL)', placeholder: 'curl -X POST https://prod.vendor.com/...' },
                      { key: 'trusthubUat', label: 'TrustHub UAT (cURL)', placeholder: 'curl -X POST https://uat.trusthub.com/...' },
                      { key: 'trusthubProd', label: 'TrustHub Prod (cURL)', placeholder: 'curl -X POST https://prod.trusthub.com/...' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                        <textarea
                          value={ep[key as keyof NewEndpoint] || ''}
                          onChange={(e) => handleEndpointChange(index, key as keyof NewEndpoint, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer fields */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Document Link</label>
              <input
                type="text"
                value={formData.documentLink}
                onChange={(e) => handleChange('documentLink', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://docs.example.com/api"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or remarks"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              {mode === 'add' ? 'Add API' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
