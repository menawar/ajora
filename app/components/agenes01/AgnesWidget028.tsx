import React from 'react';

export interface AgnesWidget028Props {
  id?: string;
  title?: string;
  status?: 'active' | 'pending' | 'completed';
}

export function AgnesWidget028({ id = "AgnesWidget028", title = "AgnesWidget028 Widget", status = 'active' }: AgnesWidget028Props) {
  return (
    <div id={id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    </div>
  );
}
