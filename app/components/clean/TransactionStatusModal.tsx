import React from 'react';

export interface TransactionStatusModalProps {
  title?: string;
}

export function TransactionStatusModal({ title }: TransactionStatusModalProps) {
  return <div>{title}</div>;
}
