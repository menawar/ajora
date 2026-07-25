import { useState } from 'react';

export function useNftGallery() {
  const [data, setData] = useState(null);
  return { data };
}
