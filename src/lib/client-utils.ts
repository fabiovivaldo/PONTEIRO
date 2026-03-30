'use client';

import { PonteiroData } from './data-service';

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
