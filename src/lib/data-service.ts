import { supabase } from './supabase';

/**
 * Interface para os dados extraídos do site oficial.
 */
export interface PonteiroData {
  id?: string;
  data_turno: string;
  turno?: string; // Adicionado para identificar o período (ex: 07X13)
  funcao: string;
  sinal: string;
  original_1: string;
  temporario_1: string;
  original_2: string;
  temporario_2: string;
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
    
    // Tenta encontrar a data/turno no cabeçalho da tabela (geralmente em H3 ou em uma célula com classe 'titulo')
    const dateMatch = html.match(/<h3>(.*?)<\/h3>/i) || 
                     html.match(/<td[^>]*class=["']?titulo["']?[^>]*>(.*?)<\/td>/i) ||
                     html.match(/<td[^>]*bgcolor=["']?#E6E6E6["']?[^>]*>(.*?)<\/td>/i);
    
    const headerDataRaw = dateMatch ? dateMatch[1].trim() : "Sem Data";
    let headerData = decodeHtmlEntities(headerDataRaw);

    // Regex mais robusto para capturar as linhas da tabela
    // Captura <tr>...</tr> e extrai o conteúdo de cada <td>
    const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
    const cellPattern = /<td[^>]*>(.*?)<\/td>/gis;
    
    const data: PonteiroData[] = [];
    let rowMatch;
    
    // Extrai o período do cabeçalho (ex: 07X13)
    const shiftMatch = headerData.match(/\((.*?)\)/);
    const turnoIdentificador = shiftMatch ? shiftMatch[1] : "REAL";

    while ((rowMatch = rowPattern.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        cells.push(decodeHtmlEntities(cellMatch[1].trim()));
      }

      // Uma linha válida de ponteiro tem exatamente 6 colunas
      // Ignora o cabeçalho ("Função", "Sinal", etc.)
      if (cells.length === 6 && cells[0] !== "Função" && !cells[0].includes("Lista")) {
        data.push({
          data_turno: headerData,
          turno: turnoIdentificador,
          funcao: cells[0],
          sinal: cells[1],
          original_1: cells[2],
          temporario_1: cells[3],
          original_2: cells[4],
          temporario_2: cells[5]
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

    const turnoIdentificador = scrapedData[0].turno;
    if (!turnoIdentificador) return;

    // 1. Remove todos os registros antigos deste usuário para este turno específico
    // Isso garante que a nova tabela substitua completamente a anterior (mesmo que tenha menos linhas)
    const { error: deleteError } = await supabase
      .from('ponteiros')
      .delete()
      .eq('user_id', userId)
      .eq('turno', turnoIdentificador);

    if (deleteError) throw deleteError;

    // 2. Insere os novos registros
    const { error: insertError } = await supabase
      .from('ponteiros')
      .insert(
        scrapedData.map(item => ({
          user_id: userId,
          data_turno: item.data_turno,
          turno: item.turno,
          funcao: item.funcao,
          sinal: item.sinal,
          original_1: item.original_1,
          temporario_1: item.temporario_1,
          original_2: item.original_2,
          temporario_2: item.temporario_2,
          created_at: new Date().toISOString()
        }))
      );

    if (insertError) throw insertError;
    console.log(`Sincronização concluída: Tabela do turno ${turnoIdentificador} substituída.`);
  } catch (error: any) {
    console.error("Supabase sync error:", error?.message || error);
  }
}
