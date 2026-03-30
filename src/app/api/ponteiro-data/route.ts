import { NextResponse } from 'next/server';

export interface PonteiroData {
  Data_Turno: string;
  Funcao: string;
  Sinal: string;
  Original_1: string;
  Temporario_1: string;
  Original_2: string;
  Temporario_2: string;
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&atilde;': 'ã',
    '&Atilde;': 'Ã',
    '&otilde;': 'õ',
    '&Otilde;': 'Õ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&ccedil;': 'ç',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&Aacute;': 'Á',
    '&Eacute;': 'É',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Uacute;': 'Ú',
    '&Ccedil;': 'Ç'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

export async function GET() {
  const url = 'https://www.ogmopgua.com.br/ogmopr/TempHtml/Ponteiros.html';
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.statusText}` }, { status: 500 });
    }

    const html = await response.text();
    
    const datePattern = /<h3>(.*?)<\/h3>/i;
    const dateMatch = datePattern.exec(html);
    const headerDataRaw = dateMatch ? dateMatch[1].trim() : "Sem Data";
    let headerData = decodeHtmlEntities(headerDataRaw);

    // Lógica para Madrugada: Se o turno for Madrugada, soma +1 dia na exibição
    if (headerData.toLowerCase().includes('madrugada')) {
      const dateParts = headerData.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateParts) {
        const [fullMatch, day, month, year] = dateParts;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Adiciona 1 dia
        date.setDate(date.getDate() + 1);
        
        const nextDay = String(date.getDate()).padStart(2, '0');
        const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
        const nextYear = date.getFullYear();
        
        const newDateStr = `${nextDay}/${nextMonth}/${nextYear}`;
        headerData = headerData.replace(fullMatch, newDateStr);
      }
    }

    const pattern = /<tr>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
    
    const data: PonteiroData[] = [];
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      const col1 = decodeHtmlEntities(match[1].trim());
      const col2 = match[2].trim();
      const col3 = match[3].trim();
      const col4 = match[4].trim();
      const col5 = match[5].trim();
      const col6 = match[6].trim();

      if (col1 && col1 !== "Lista" && !col1.includes("Função")) {
        data.push({
          Data_Turno: headerData,
          Funcao: col1,
          Sinal: col2,
          Original_1: col3,
          Temporario_1: col4,
          Original_2: col5,
          Temporario_2: col6,
        });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
