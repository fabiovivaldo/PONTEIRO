
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

export async function fetchPonteiroData(): Promise<PonteiroData[]> {
  try {
    const response = await fetch('/api/ponteiro-data');

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("Scraping error:", error);
    return Array.from({ length: 15 }, (_, i) => ({
      Data_Turno: "05/03/2026 Madrugada", // Mock atualizado para refletir a lógica
      Funcao: `MOCK_FUNC_${i + 1}`,
      Sinal: i % 2 === 0 ? "+" : "-",
      Original_1: (Math.random() * 100).toFixed(0),
      Temporario_1: (Math.random() * 100).toFixed(0),
      Original_2: (Math.random() * 100).toFixed(0),
      Temporario_2: (Math.random() * 100).toFixed(0),
    }));
  }
}

export function exportToCSV(data: PonteiroData[]) {
  const headers = ["Data_Turno", "Funcao", "Sinal", "Original_1", "Temporario_1", "Original_2", "Temporario_2"];
  const rows = data.map(row => [
    row.Data_Turno,
    row.Funcao,
    row.Sinal,
    row.Original_1,
    row.Temporario_1,
    row.Original_2,
    row.Temporario_2
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map(e => e.join(";"))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Ponteiros_Data.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
