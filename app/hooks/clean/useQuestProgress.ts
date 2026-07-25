import { useState } from 'react';

export function useQuestProgress() {
  const [data, setData] = useState(null);
  return { data };
}
