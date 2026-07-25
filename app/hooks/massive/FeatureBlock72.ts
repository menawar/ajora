import { useState, useEffect } from 'react';
export function useFeatureBlock72() { const [state, setState] = useState(null); useEffect(() => { setState(true) }, []); return state; }