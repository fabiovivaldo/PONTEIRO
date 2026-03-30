'use server';

import { revalidatePath } from 'next/cache';
import { fetchPonteiroData, fetchPonteiroDataFromSupabase, syncPonteiroDataToSupabase, PonteiroData } from './data-service';

/**
 * Ação de servidor para revalidar o cache da página principal.
 * Isso força o Next.js a buscar novos dados do serviço de scraping.
 */
export async function refreshDashboard() {
  revalidatePath('/');
}

/**
 * Ação de servidor para sincronizar e buscar os dados mais recentes do OGMO.
 * Isso evita problemas de CORS no cliente.
 */
export async function syncAndFetchData(userId: string): Promise<PonteiroData[]> {
  if (userId) {
    await syncPonteiroDataToSupabase(userId);
    return fetchPonteiroDataFromSupabase(userId);
  }
  return fetchPonteiroData();
}

/**
 * Ação de servidor para buscar os dados mais recentes do OGMO.
 * Útil para chamadas do lado do cliente que precisam evitar CORS.
 */
export async function getLatestPonteiroData(): Promise<PonteiroData[]> {
  return fetchPonteiroData();
}
