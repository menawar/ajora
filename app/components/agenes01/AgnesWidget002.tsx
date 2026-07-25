import React from 'react';

export interface AgnesWidget002Props {
  id?: string;
}

export function AgnesWidget002({ id = "AgnesWidget002" }: AgnesWidget002Props) {
  return <div id={id}>Base Component AgnesWidget002</div>;
}
