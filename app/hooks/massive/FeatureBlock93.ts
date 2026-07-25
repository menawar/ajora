import { useState, useEffect } from 'react';
export function useFeatureBlock93() { const [state, setState] = useState(null); useEffect(() => { setState(true) }, []); return state; }