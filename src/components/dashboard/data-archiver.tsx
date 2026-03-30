
'use client';

import { useEffect, useRef } from 'react';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados no LocalStorage.
 */
export function DataArchiver({ data }: DataArchiverProps) {
  const lastArchivedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data.length) return;

    const currentTurnoIdentifier = data[0].turno;
    if (!currentTurnoIdentifier) return;

    const currentDataTurno = data[0].data_turno;
    // Chave única baseada na data e turno para evitar duplicatas na mesma sessão
    const sessionKey = `archived_${currentDataTurno.replace(/\s+/g, '_')}`;
    const alreadyArchivedInSession = sessionStorage.getItem(sessionKey);

    if (alreadyArchivedInSession === 'true' || lastArchivedRef.current === currentDataTurno) {
      return;
    }

    lastArchivedRef.current = currentDataTurno;
    sessionStorage.setItem(sessionKey, 'true');

    // Carrega histórico atual do LocalStorage
    const savedHistory = localStorage.getItem('ponteiro_history');
    let history: any[] = savedHistory ? JSON.parse(savedHistory) : [];

    // Formata os novos registros para armazenamento
    const newRecords = data.map((row) => {
      const safeId = `${row.funcao}_${row.turno}`
        .replace(/[/\\#?%*:.|"<>\s]/g, '_')
        .substring(0, 100);

      return {
        id: safeId,
        funcao: row.funcao,
        sinal: row.sinal,
        original1: row.original_1,
        temporario1: row.temporario_1,
        original2: row.original_2,
        temporario2: row.temporario_2,
        dataTurno: row.data_turno,
        turno: row.turno,
        createdAt: new Date().toISOString()
      };
    });

    // Filtra o histórico para REMOVER registros do período atual (substituição)
    // Isso garante que a nova lista substitua completamente a antiga para aquele período (ex: 07X13)
    const historyWithoutCurrentShift = history.filter(h => h.turno !== currentTurnoIdentifier);

    // Mescla e limita a 1000 registros
    const uniqueHistory = [...newRecords, ...historyWithoutCurrentShift].slice(0, 1000);

    localStorage.setItem('ponteiro_history', JSON.stringify(uniqueHistory));
    
    // Dispara evento global para sincronizar outros componentes
    window.dispatchEvent(new Event('ponteiro_history_updated'));
  }, [data]);

  return null;
}
