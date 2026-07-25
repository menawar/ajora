import { useState } from 'react';

export function useGovernanceVotes() {
  const [data, setData] = useState(null);
  return { data };
}
