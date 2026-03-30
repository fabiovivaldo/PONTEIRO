'use client';

import React, { useState, useEffect } from 'react';
import { fetchPonteiroData, PonteiroData, ViewMode } from '@/lib/data-service';
import { DynamicFainaCards } from '@/components/dashboard/dynamic-faina-cards';
import { PonteiroDataTable } from '@/components/dashboard/data-table';
import { FainaPreferencesModal } from '@/components/dashboard/faina-preferences-modal';
import { DataArchiver } from '@/components/dashboard/data-archiver';
import { Settings, RefreshCw, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { AuthForm } from '@/components/auth/auth-form';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [data, setData] = useState<PonteiroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await fetchPonteiroData();
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [user, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const availableFainas = Array.from(new Set(data.map(d => d.Funcao))).sort();

  return (
    <main className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">
            Ponteiro<span className="text-foreground">Scope</span>
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
              Analytical Dashboard • OGMO/PR
            </p>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              {user.email}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData} 
            disabled={loading}
            className="h-9 px-3 rounded-xl border-primary/20 hover:bg-primary/5"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">Atualizar</span>
          </Button>

          <FainaPreferencesModal 
            availableFainas={availableFainas}
            trigger={
              <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-primary/20 hover:bg-primary/5">
                <Settings className="h-4 w-4 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Config</span>
              </Button>
            }
          />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="h-9 px-3 rounded-xl border-destructive/20 hover:bg-destructive/5 text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </Button>
        </div>
      </header>

      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Monitoramento Prioritário</h2>
          </div>
          <DynamicFainaCards scrapedData={data} selectedShift={viewMode} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tabela de Dados</h2>
          </div>
          <PonteiroDataTable liveData={data} viewMode={viewMode} setViewMode={setViewMode} />
        </section>
      </div>

      <DataArchiver data={data} />
    </main>
  );
}
