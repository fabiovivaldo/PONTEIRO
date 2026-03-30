'use client';

import React from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthScreen } from '@/components/auth/auth-screen';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DataArchiver } from '@/components/dashboard/data-archiver';
import { PonteiroData } from '@/lib/data-service';
import { getLatestPonteiroData, syncAndFetchData } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface DashboardWrapperProps {
  initialData: PonteiroData[];
  lastUpdatedIso: string;
  uniqueFainas: string[];
}

export function DashboardWrapper({ initialData, lastUpdatedIso, uniqueFainas }: DashboardWrapperProps) {
  const { user, loading } = useAuth();
  const [liveData, setLiveData] = React.useState(initialData);
  const [historyData, setHistoryData] = React.useState<PonteiroData[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Sincroniza liveData com initialData quando o servidor envia novos dados (ex: após refresh)
  React.useEffect(() => {
    setLiveData(initialData);
  }, [initialData]);

  // Sincroniza e busca histórico quando o usuário loga
  React.useEffect(() => {
    if (user) {
      const initUserSession = async () => {
        setIsSyncing(true);
        try {
          // Usa a ação de servidor para sincronizar e buscar
          const history = await syncAndFetchData(user.id);
          setHistoryData(history);
        } catch (err) {
          console.error("Erro ao inicializar sessão do usuário:", err);
        } finally {
          setIsSyncing(false);
        }
      };

      initUserSession();
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
      <DataArchiver data={liveData} />
      <DashboardContent 
        liveData={liveData}
        historyData={historyData}
        lastUpdatedIso={lastUpdatedIso} 
        uniqueFainas={uniqueFainas} 
      />
    </div>
  );
}
