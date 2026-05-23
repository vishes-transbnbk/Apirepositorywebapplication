import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, ApiRecord } from '../contexts/ApiContext';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface ApiModalProps {
  mode: 'add' | 'edit';
  apiData?: ApiRecord;
  onClose: () => void;
}

export default function ApiModal({ mode, apiData, onClose }: ApiModalProps) {
  const { addApi, updateApi, checkDuplicate } = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jiraId: '',
    name: '',
    vendor: '',
    type: '',
    description: '',
    vendorUat: '',
    vendorProd: '',
    trusthubUat: '',
    trusthubProd: '',
    documentLink: '',
    remarks: '',
    status: 'active' as 'active' | 'inactive',
  });

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
        vendorUat: apiData.vendorUat || '',
        vendorProd: apiData.vendorProd || '',
        trusthubUat: apiData.trusthubUat || '',
        trusthubProd: apiData.trusthubProd || '',
        documentLink: apiData.documentLink || '',
        remarks: apiData.remarks || '',
        status: apiData.status,
      });
    }
  }, [mode, apiData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'name' || field === 'vendor') {
      setDuplicateError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isDuplicate = checkDuplicate(
      formData.name,
      formData.vendor,
      mode === 'edit' ? apiData?.id : undefined
    );

    if (isDuplicate) {
      setDuplicateError('An API with this Name and Vendor already exists.');
      setErrors((prev) => ({
        ...prev,
        name: ' ',
        vendor: ' ',
      }));
      return;
    }

    if (mode === 'add') {
      addApi(formData);
      toast.success('API added successfully');
      onClose();
      navigate('/view');
    } else if (mode === 'edit' && apiData) {
      updateApi(apiData.id, formData);
      toast.success('API updated successfully');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'add' ? 'Add New API' : 'Edit API'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  JIRA ID
                </label>
                <input
                  type="text"
                  value={formData.jiraId}
                  onChange={(e) => handleChange('jiraId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., User Authentication API"
                />
                {errors.name && errors.name !== ' ' && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.vendor ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Auth0"
                />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1">{duplicateError}</p>
                )}
                {errors.vendor && errors.vendor !== ' ' && !duplicateError && (
                  <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.type ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., REST, SOAP, GraphQL"
                />
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the API purpose and functionality"
              />
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">cURL Environments</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Vendor UAT (cURL)
                  </label>
                  <textarea
                    value={formData.vendorUat}
                    onChange={(e) => handleChange('vendorUat', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="curl -X POST https://uat.vendor.com/api/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Vendor Prod (cURL)
                  </label>
                  <textarea
                    value={formData.vendorProd}
                    onChange={(e) => handleChange('vendorProd', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="curl -X POST https://prod.vendor.com/api/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    TrustHub UAT (cURL)
                  </label>
                  <textarea
                    value={formData.trusthubUat}
                    onChange={(e) => handleChange('trusthubUat', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="curl -X POST https://uat.trusthub.com/api/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    TrustHub Prod (cURL)
                  </label>
                  <textarea
                    value={formData.trusthubProd}
                    onChange={(e) => handleChange('trusthubProd', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="curl -X POST https://prod.trusthub.com/api/..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Document Link
              </label>
              <input
                type="text"
                value={formData.documentLink}
                onChange={(e) => handleChange('documentLink', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://docs.example.com/api"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes or remarks"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
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
