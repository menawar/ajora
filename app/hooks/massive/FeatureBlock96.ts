import { useState, useEffect } from 'react';
export function useFeatureBlock96() { const [state, setState] = useState(null); useEffect(() => { setState(true) }, []); return state; }