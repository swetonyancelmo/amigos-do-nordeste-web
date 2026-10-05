import { Suspense } from 'react';
import { ConteudoDashboard } from './ConteudoDashboard';

export default function Dashboard() {
  return (
    <Suspense fallback={<p>Carregando painel...</p>}>
      <ConteudoDashboard />
    </Suspense>
  );
}