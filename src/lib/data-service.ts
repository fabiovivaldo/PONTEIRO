import { supabase } from './supabase';

/**
 * Interface para os dados extraídos do site oficial.
 */
export interface PonteiroData {
  id?: string;
  Data_Turno: string;
  Funcao: string;
  Sinal: string;
  Original_1: string;
  Temporario_1: string;
  Original_2: string;
  Temporario_2: string;
  created_at?: string;
}

/**
 * Utilitário para decodificar entidades HTML comuns no site do OGMO.
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&atilde;': 'ã', '&Atilde;': 'Ã', '&otilde;': 'õ', '&Otilde;': 'Õ',
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó',
    '&uacute;': 'ú', '&ccedil;': 'ç', '&nbsp;': ' ', '&amp;': '&',
    '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó',
    '&Uacute;': 'Ú', '&Ccedil;': 'Ç'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

/**
 * Realiza o scraping dos dados de ponteiros do OGMO.
 * Esta função é projetada para rodar em Server Components.
 */
export async function fetchPonteiroData(): Promise<PonteiroData[]> {
  const url = 'https://www.ogmopgua.com.br/ogmopr/TempHtml/Ponteiros.html';
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    const html = await response.text();
    
    // Extrai a Data e o Turno (H3)
    const datePattern = /<h3>(.*?)<\/h3>/i;
    const dateMatch = datePattern.exec(html);
    const headerDataRaw = dateMatch ? dateMatch[1].trim() : "Sem Data";
    let headerData = decodeHtmlEntities(headerDataRaw);

    // Regex para capturar as linhas da tabela
    const pattern = /<tr>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
    
    const data: PonteiroData[] = [];
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      const col1 = decodeHtmlEntities(match[1].trim());
      // Filtra o cabeçalho da tabela se necessário
      if (col1 && col1 !== "Lista" && !col1.includes("Função")) {
        data.push({
          Data_Turno: headerData,
          Funcao: col1,
          Sinal: match[2].trim(),
          Original_1: match[3].trim(),
          Temporario_1: match[4].trim(),
          Original_2: match[5].trim(),
          Temporario_2: match[6].trim(),
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error("Scraping error:", error);
    return [];
  }
}

/**
 * Busca os dados de ponteiros diretamente do Supabase filtrados por usuário.
 */
export async function fetchPonteiroDataFromSupabase(userId?: string): Promise<PonteiroData[]> {
  if (!supabase) {
    console.warn("Supabase não configurado. Usando scraping direto.");
    return fetchPonteiroData();
  }

  try {
    let query = supabase
      .from('ponteiros')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return fetchPonteiroData();
    }

    return data;
  } catch (error: any) {
    console.error("Supabase fetch error:", error?.message || error);
    return fetchPonteiroData();
  }
}

/**
 * Sincroniza os dados do scraping para o Supabase vinculando ao usuário.
 */
export async function syncPonteiroDataToSupabase(userId: string): Promise<void> {
  if (!supabase || !userId) return;

  try {
    const scrapedData = await fetchPonteiroData();
    if (scrapedData.length === 0) return;

    const { error } = await supabase
      .from('ponteiros')
      .upsert(
        scrapedData.map(item => ({
          user_id: userId,
          Data_Turno: item.Data_Turno,
          Funcao: item.Funcao,
          Sinal: item.Sinal,
          Original_1: item.Original_1,
          Temporario_1: item.Temporario_1,
          Original_2: item.Original_2,
          Temporario_2: item.Temporario_2
        })),
        { onConflict: 'user_id,Funcao,Data_Turno' }
      );

    if (error) throw error;
    console.log("Sincronização individual concluída.");
  } catch (error: any) {
    console.error("Supabase sync error:", error?.message || error);
  }
}
