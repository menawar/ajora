import React from 'react';

export interface AgnesWidget027Props {
  id?: string;
  title?: string;
  status?: 'active' | 'pending' | 'completed';
}

export function AgnesWidget027({ id = "AgnesWidget027", title = "AgnesWidget027 Widget", status = 'active' }: AgnesWidget027Props) {
  return (
    <div id={id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    </div>
  );
}
