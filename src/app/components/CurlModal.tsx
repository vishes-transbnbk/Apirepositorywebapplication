import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CurlModalProps {
  title: string;
  curlCommand: string;
  onClose: () => void;
}

export default function CurlModal({ title, curlCommand, onClose }: CurlModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm font-mono">{curlCommand}</code>
          </pre>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy to Clipboard
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
