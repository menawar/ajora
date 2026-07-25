import { useState } from 'react';

export function useFormValidation() {
  const [data, setData] = useState(null);
  return { data };
}
