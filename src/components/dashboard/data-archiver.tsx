
'use client';

import { useEffect, useRef } from 'react';
import { PonteiroData } from '@/lib/data-service';
import { supabase } from '@/lib/supabase';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados.
 * Agora suporta Supabase (se logado) e mantém fallback no LocalStorage.
 */
export function DataArchiver({ data }: DataArchiverProps) {
  const lastArchivedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data.length) return;

    const currentTurno = data[0].Data_Turno;
    const sessionKey = `archived_${currentTurno.replace(/\s+/g, '_')}`;
    const alreadyArchivedInSession = sessionStorage.getItem(sessionKey);

    if (alreadyArchivedInSession === 'true' || lastArchivedRef.current === currentTurno) {
      return;
    }

    lastArchivedRef.current = currentTurno;
    sessionStorage.setItem(sessionKey, 'true');

    const archiveData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const newRecords = data.map((row) => {
        const turnoName = row.Data_Turno.includes(' ') 
          ? row.Data_Turno.split(' ').slice(1).join('_') 
          : row.Data_Turno;

        const safeId = `${row.Funcao}_${turnoName}`
          .replace(/[/\\#?%*:.|"<>\s]/g, '_')
          .substring(0, 100);

        return {
          id: safeId,
          funcao: row.Funcao,
          sinal: row.Sinal,
          original1: row.Original_1,
          temporario1: row.Temporario_1,
          original2: row.Original_2,
          temporario2: row.Temporario_2,
          dataTurno: row.Data_Turno,
          user_id: user?.id || null
        };
      });

      // 1. Salvar no LocalStorage (Fallback/Offline)
      const savedHistory = localStorage.getItem('ponteiro_history');
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      const mergedHistory = [...newRecords.map(r => ({ ...r, createdAt: new Date().toISOString() })), ...history];
      const uniqueHistory = Array.from(new Map(mergedHistory.map(item => [item.id, item])).values()).slice(0, 1000);
      localStorage.setItem('ponteiro_history', JSON.stringify(uniqueHistory));
      window.dispatchEvent(new Event('ponteiro_history_updated'));

      // 2. Salvar no Supabase (se logado)
      if (user) {
        try {
          const { error } = await supabase
            .from('ponteiro_history')
            .upsert(newRecords.map(r => ({
              funcao: r.funcao,
              sinal: r.sinal,
              original1: r.original1,
              temporario1: r.temporario1,
              original2: r.original2,
              temporario2: r.temporario2,
              data_turno: r.dataTurno,
              user_id: user.id
            })), { onConflict: 'funcao,data_turno,user_id' });
          
          if (error) console.error('Erro ao salvar no Supabase:', error);
        } catch (e) {
          console.error('Erro de conexão Supabase:', e);
        }
      }
    };

    archiveData();
  }, [data]);

  return null;
}
