import React from 'react';
import { fetchPonteiroDataFromSupabase } from '@/lib/data-service';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';

export default async function DashboardPage() {
  const data = await fetchPonteiroDataFromSupabase();
  const lastUpdatedIso = new Date().toISOString();
  
  const uniqueFainas = Array.from(new Set(data.map(d => d.Funcao))).sort();

  return (
    <DashboardWrapper 
      initialData={data} 
      lastUpdatedIso={lastUpdatedIso} 
      uniqueFainas={uniqueFainas} 
    />
  );
}
