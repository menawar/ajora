import { useState, useEffect } from 'react';
export function useFeatureBlock100() { const [state, setState] = useState(null); useEffect(() => { setState(true) }, []); return state; }