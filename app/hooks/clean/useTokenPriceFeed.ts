import { useState } from 'react';

export function useTokenPriceFeed() {
  const [data, setData] = useState(null);
  return { data };
}
