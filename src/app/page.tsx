import React from 'react';
import { fetchPonteiroData } from '@/lib/data-service';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';

export default async function DashboardPage() {
  const data = await fetchPonteiroData();
  const lastUpdatedIso = new Date().toISOString();
  
  const uniqueFainas = Array.from(new Set(data.map(d => d.funcao))).sort();

  return (
    <DashboardWrapper 
      initialData={data} 
      lastUpdatedIso={lastUpdatedIso} 
      uniqueFainas={uniqueFainas} 
    />
  );
}
