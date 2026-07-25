import { useState } from 'react';

export function useBiometricAuth() {
  const [data, setData] = useState(null);
  return { data };
}
