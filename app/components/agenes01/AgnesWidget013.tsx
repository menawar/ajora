import React, { useState } from 'react';

/**
 * AgnesWidget013 Component Props
 */
export interface AgnesWidget013Props {
  /** Optional HTML element ID */
  id?: string;
  /** Display title */
  title?: string;
  /** Current execution status */
  status?: 'active' | 'pending' | 'completed';
  /** Action callback handler */
  onAction?: () => void;
}

/**
 * AgnesWidget013 presents an interactive GameFi card module created by agenes01.
 */
export function AgnesWidget013({ id = "AgnesWidget013", title = "AgnesWidget013 Widget", status = 'active', onAction }: AgnesWidget013Props) {
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
    <div id={id} data-testid="AgnesWidget013-container" className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {status}
        </span>
      </div>
      {onAction && (
        <button data-testid="AgnesWidget013-btn" onClick={handleClick} disabled={loading} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Processing...' : 'Execute'}
        </button>
      )}
    </div>
  );
}
