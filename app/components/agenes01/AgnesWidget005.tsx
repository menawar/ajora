import React, { useState } from 'react';

export interface AgnesWidget005Props {
  id?: string;
  title?: string;
  status?: 'active' | 'pending' | 'completed';
  onAction?: () => void;
}

export function AgnesWidget005({ id = "AgnesWidget005", title = "AgnesWidget005 Widget", status = 'active', onAction }: AgnesWidget005Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onAction || loading) return;
    setLoading(true);
    try {
      await onAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {status}
        </span>
      </div>
      {onAction && (
        <button onClick={handleClick} disabled={loading} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Processing...' : 'Execute'}
        </button>
      )}
    </div>
  );
}
