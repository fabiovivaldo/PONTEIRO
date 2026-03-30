"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Zap,
  Sun,
  Sunrise,
  Moon,
  CloudMoon,
  Calendar,
  Star,
  Filter
} from "lucide-react";
import { PonteiroData } from "@/lib/data-service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { ViewMode } from '@/components/dashboard/dashboard-content';

interface DataTableProps {
  liveData: PonteiroData[];
  historyData: PonteiroData[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const CATEGORY_CONFIG = [
  { id: "TODOS", label: "T", color: "text-primary" },
  { id: "ESTIVA", label: "E", color: "text-yellow-500" },
  { id: "ARRUMADOR", label: "A", color: "text-blue-500" },
  { id: "CONFERENTE", label: "C", color: "text-orange-500" },
  { id: "VIGIA", label: "V", color: "text-red-500" },
  { id: "BLOCO", label: "B", color: "text-purple-500" },
  { id: "CONSERTADOR", label: "C", color: "text-green-500" },
];

const SHIFT_CONFIG = [
  { id: 'Manhã', label: '07X13', icon: Sunrise, color: 'text-orange-500' },
  { id: 'Tarde', label: '13X19', icon: Sun, color: 'text-yellow-500' },
  { id: 'Noite', label: '19X01', icon: Moon, color: 'text-blue-500' },
  { id: 'Madrugada', label: '01X07', icon: CloudMoon, color: 'text-indigo-500' },
] as const;

export function PonteiroDataTable({ liveData, historyData, viewMode, setViewMode }: DataTableProps) {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PonteiroData; direction: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const loadLocal = () => {
      const savedPrefs = localStorage.getItem('faina_preferences');
      const savedHistory = localStorage.getItem('ponteiro_history');
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
      if (savedHistory) setLocalHistory(JSON.parse(savedHistory));
    };

    loadLocal();
    window.addEventListener('faina_preferences_updated', loadLocal);
    window.addEventListener('ponteiro_history_updated', loadLocal);
    return () => {
      window.removeEventListener('faina_preferences_updated', loadLocal);
      window.removeEventListener('ponteiro_history_updated', loadLocal);
    };
  }, []);

  const favoriteFainas = useMemo(() => {
    return new Set(preferences.map(p => p.faina.toUpperCase()));
  }, [preferences]);

  // Mapeia o histórico local para o formato PonteiroData
  const mappedLocalHistory = useMemo(() => {
    return localHistory.map(h => ({
      data_turno: h.dataTurno,
      turno: h.turno || "REAL",
      funcao: h.funcao,
      sinal: h.sinal,
      original_1: h.original1,
      temporario_1: h.temporario1,
      original_2: h.original2,
      temporario_2: h.temporario2,
      created_at: h.createdAt // Adicionado para ordenação
    }));
  }, [localHistory]);

  // Combina histórico do Supabase com histórico local
  // Implementa a lógica de substituição total: para cada turno, mantém apenas a lista mais recente
  const currentData = useMemo(() => {
    if (viewMode === 'live') return liveData;
    
    // Busca o label do turno selecionado (ex: 07X13)
    const shiftLabel = SHIFT_CONFIG.find(s => s.id === viewMode)?.label;
    if (!shiftLabel) return [];

    // 1. Junta todo o histórico disponível para este turno
    const allHistoryForShift = [
      ...historyData.filter(h => h.turno === shiftLabel),
      ...mappedLocalHistory.filter(h => h.turno === shiftLabel)
    ];

    if (allHistoryForShift.length === 0) return [];

    // 2. Identifica a data/hora mais recente para este turno
    // Usamos created_at para precisão, ou data_turno como fallback
    const latestTimestamp = allHistoryForShift.reduce((latest, current) => {
      const currentTs = current.created_at ? new Date(current.created_at).getTime() : 0;
      const latestTs = latest ? new Date(latest).getTime() : 0;
      return currentTs > latestTs ? current.created_at : latest;
    }, allHistoryForShift[0].created_at);

    // 3. Retorna apenas os registros que pertencem a essa lista mais recente
    // Isso garante que a tabela seja substituída por completo
    return allHistoryForShift.filter(h => h.created_at === latestTimestamp);
  }, [viewMode, liveData, historyData, mappedLocalHistory]);

  const handleSort = (key: keyof PonteiroData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      const matchesFilter = Object.values(item).some(val => 
        String(val).toLowerCase().includes(filter.toLowerCase())
      );
      
      const functionUpper = item.funcao.toUpperCase();
      const matchesCategory = activeCategory === "TODOS" || functionUpper.startsWith(activeCategory);
      
      const isFavorite = favoriteFainas.has(functionUpper);
      const matchesFavorites = !showFavoritesOnly || isFavorite;
      
      return matchesFilter && matchesCategory && matchesFavorites;
    });
  }, [currentData, filter, activeCategory, showFavoritesOnly, favoriteFainas]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const cellTextStyle = "text-[12px] font-bold tracking-tight py-2 px-3";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Período</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={viewMode === 'live' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setViewMode('live')}
              className="rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Real
            </Button>
            
            {SHIFT_CONFIG.map((shift) => (
              <Button 
                key={shift.id}
                variant={viewMode === shift.id ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setViewMode(shift.id as any)}
                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9"
              >
                <shift.icon className={cn("h-3.5 w-3.5 mr-1", viewMode === shift.id ? "" : shift.color)} />
                {shift.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Filtro</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CONFIG.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "h-9 w-9 p-0 flex items-center justify-center border rounded-xl font-black text-xs",
                  activeCategory === cat.id ? "" : cat.color
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="p-4 bg-muted/20 border-b border-border/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black uppercase tracking-tight">
                {viewMode === 'live' ? 'Lista em Tempo Real' : `Histórico: ${SHIFT_CONFIG.find(s => s.id === viewMode)?.label}`}
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="h-9 px-3 rounded-lg"
              >
                <Star className={cn("h-4 w-4 mr-1.5", showFavoritesOnly ? "fill-current" : "")} />
                <span className="text-[10px] font-black uppercase">Fav</span>
              </Button>

              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="BUSCAR FAINA..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 h-9 text-[11px] font-bold uppercase"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-3 px-4 text-[10px] font-black uppercase">Faina</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase text-center w-16">S</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">REG: O</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">REG: P</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">CAD: O</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">CAD: P</TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-black uppercase">Data / Turno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-accent/5 transition-colors border-border/40">
                      <TableCell className={cn(cellTextStyle, "font-black text-foreground min-w-[200px]")}>
                        {row.funcao}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-black text-[13px]",
                          row.sinal === '-' ? "text-destructive" : "text-green-500"
                        )}>
                          {row.sinal}
                        </span>
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground font-mono")}>
                        {row.original_1}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-primary font-mono")}>
                        {row.temporario_1}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground font-mono")}>
                        {row.original_2}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-primary font-mono")}>
                        {row.temporario_2}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground text-[10px] whitespace-nowrap")}>
                        {row.data_turno}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
