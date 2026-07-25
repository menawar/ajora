import React from 'react';

export interface TransactionStatusModalProps {
  title?: string;
  className?: string;
}

export function TransactionStatusModal({ title = "TransactionStatusModal", className = "" }: TransactionStatusModalProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
