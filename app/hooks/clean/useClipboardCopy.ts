import { useState } from 'react';

export function useClipboardCopy() {
  const [data, setData] = useState(null);
  return { data };
}
