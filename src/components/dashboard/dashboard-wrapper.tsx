'use client';

import React from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthScreen } from '@/components/auth/auth-screen';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DataArchiver } from '@/components/dashboard/data-archiver';
import { PonteiroData } from '@/lib/data-service';
import { Loader2 } from 'lucide-react';

interface DashboardWrapperProps {
  initialData: PonteiroData[];
  lastUpdatedIso: string;
  uniqueFainas: string[];
}

export function DashboardWrapper({ initialData, lastUpdatedIso, uniqueFainas }: DashboardWrapperProps) {
  const { user, loading } = useAuth();
  const [data, setData] = React.useState(initialData);

  React.useEffect(() => {
    if (user) {
      fetchPonteiroDataFromSupabase(user.id).then(setData);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DataArchiver data={data} />
      <DashboardContent 
        initialData={data} 
        lastUpdatedIso={lastUpdatedIso} 
        uniqueFainas={uniqueFainas} 
      />
    </div>
  );
}
