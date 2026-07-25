import { useState } from 'react';

export function useTransactionReceipt() {
  const [data, setData] = useState(null);
  return { data };
}
