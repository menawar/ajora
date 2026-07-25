import { useState } from 'react';

export function useModalDisclosure() {
  const [data, setData] = useState(null);
  return { data };
}
