'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Flame, 
  Calendar, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  UtensilsCrossed, 
  Building,
  RefreshCw,
  Info,
  DollarSign,
  FileSpreadsheet,
  ShieldAlert,
  Copy,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { APP_VERSION } from '@/lib/version';

interface Unit {
  id: string;
  number: string;
  block: string;
}

interface GasReading {
  identifier: string;
  value: number | null;
}

interface CalculatedMonth {
  month: number;
  label: string;
  hasReading: boolean;
  currentVal: number | null;
  prevVal: number | null;
  consumptionM3: number;
  consumptionKilo: number;
  pricePerKilo: number | null;
  cost: number;
  readAt: string | Date | null;
}

export default function GasReadingPage() {
  const currentYearVal = new Date().getFullYear();
  
  // Obter a data do mês anterior da data vigente
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const defaultMonthVal = prevMonthDate.getMonth() + 1; // 1-indexed
  const defaultYearVal = prevMonthDate.getFullYear().toString();

  // Dropdown presets
  const years = Array.from({ length: 5 }, (_, i) => (currentYearVal - i).toString());
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonthVal);
  const [selectedYear, setSelectedYear] = useState<string>(defaultYearVal);
  const [readAt, setReadAt] = useState<string>(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [pricePerKilo, setPricePerKilo] = useState<string>('');
  const [previousPricePerKilo, setPreviousPricePerKilo] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [values, setValues] = useState<Record<string, string>>({}); // id -> value string
  const [prevValues, setPrevValues] = useState<Record<string, number | null>>({}); // id/identifier -> previous numeric value

  // Estados da consulta anual do morador
  const [activeTab, setActiveTab] = useState<'mensal' | 'comparativo'>('mensal');
  const [annualYear, setAnnualYear] = useState<string>(new Date().getFullYear().toString());
  const [annualData, setAnnualData] = useState<{
    readings: Array<{ month: number; year: number; value: number | null; readAt: string }>;
    prices: Array<{ month: number; year: number; pricePerKilo: number }>;
  } | null>(null);
  const [loadingAnnual, setLoadingAnnual] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Busca de dados anuais
  const fetchAnnualData = useCallback(async (year: string) => {
    setLoadingAnnual(true);
    try {
      const res = await fetch(`/api/leitura-gas?anual=true&year=${year}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setAnnualData(data);
      } else {
        console.error('Erro ao buscar dados anuais de gás');
      }
    } catch (err) {
      console.error('Erro de rede ao buscar dados anuais:', err);
    } finally {
      setLoadingAnnual(false);
    }
  }, []);

  // Efeito para buscar dados anuais quando a aba comparativa estiver ativa ou o ano mudar
  useEffect(() => {
    if (currentUser?.role === 'MORADOR' && activeTab === 'comparativo') {
      fetchAnnualData(annualYear);
    }
  }, [currentUser, activeTab, annualYear, fetchAnnualData]);

  // Fetch logged in user profile on mount
  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setCurrentUser(data?.user))
      .catch(err => console.error('Erro ao buscar perfil do usuário:', err));
  }, []);
  
  // Keep track of the latest selected month/year to prevent race conditions during async fetches
  const latestSelected = useRef({ month: selectedMonth, year: selectedYear });
  
  useEffect(() => {
    latestSelected.current = { month: selectedMonth, year: selectedYear };
  }, [selectedMonth, selectedYear]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load Units
  useEffect(() => {
    fetch('/api/unidades')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => 
            a.number.localeCompare(b.number, undefined, { numeric: true })
          );
          setUnits(sorted);
        }
      })
      .catch(err => console.error('Erro ao buscar unidades:', err));
  }, []);

  // Fetch Existing Readings for Selected Month/Year
  const fetchReadings = useCallback(async () => {
    const fetchMonth = selectedMonth;
    const fetchYear = selectedYear;

    setLoading(true);
    setValues({}); // Clear values state immediately to prevent stale data bleeding
    setPrevValues({}); // Clear previous values state immediately as well
    setPricePerKilo(''); // Clear price state immediately to prevent stale data bleeding
    setPreviousPricePerKilo(''); // Clear previous price state as well
    try {
      const res = await fetch(`/api/leitura-gas?month=${fetchMonth}&year=${fetchYear}&t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (res.redirected || res.url.includes('/login')) {
        setNotification({ type: 'error', message: 'Sessão expirada. Redirecionando para o login...' });
        setTimeout(() => window.location.href = '/login', 2500);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        
        // Compare with latestSelected.current to ensure user hasn't switched selection in the meantime
        if (latestSelected.current.month === fetchMonth && latestSelected.current.year === fetchYear) {
          // Se a data de leitura existir, atualiza ela (YYYY-MM-DD)
          if (data.readAt) {
            setReadAt(new Date(data.readAt).toISOString().substring(0, 10));
          } else {
            setReadAt(new Date().toISOString().substring(0, 10));
          }

          // Se o preço por quilo existir, atualiza ele
          if (data.pricePerKilo !== null && data.pricePerKilo !== undefined) {
            setPricePerKilo(data.pricePerKilo.toString());
          } else {
            setPricePerKilo('');
          }

          // Se o preço do quilo do mês anterior existir, atualiza ele
          if (data.previousPricePerKilo !== null && data.previousPricePerKilo !== undefined) {
            setPreviousPricePerKilo(data.previousPricePerKilo.toString());
          } else {
            setPreviousPricePerKilo('');
          }

          // Mapeia valores salvos
          const initialValues: Record<string, string> = {};
          if (Array.isArray(data.readings)) {
            data.readings.forEach((r: GasReading) => {
              initialValues[r.identifier] = r.value !== null && r.value !== undefined ? r.value.toString() : '';
            });
          }
          setValues(initialValues);

          // Mapeia valores do mês anterior
          const initialPrevValues: Record<string, number | null> = {};
          if (Array.isArray(data.previousReadings)) {
            data.previousReadings.forEach((r: GasReading) => {
              initialPrevValues[r.identifier] = r.value;
            });
          }
          setPrevValues(initialPrevValues);
        }
      } else {
        const err = await res.json().catch(() => ({ message: 'Erro desconhecido ao carregar leituras.' }));
        setNotification({ type: 'error', message: err.message || 'Erro ao buscar as leituras de gás.' });
      }
    } catch (err) {
      console.error('Erro ao buscar leituras de gás:', err);
    } finally {
      if (latestSelected.current.month === fetchMonth && latestSelected.current.year === fetchYear) {
        setLoading(false);
      }
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Safe input value modification accepting only positive decimals with max 3 decimal places
  const handleInputChange = (identifier: string, rawVal: string) => {
    // Substitui vírgula por ponto para consistência
    const formatted = rawVal.replace(',', '.');
    
    // Expressão regular que permite apenas números maiores/iguais a zero com até 3 casas decimais
    if (formatted === '' || /^\d*(\.\d{0,3})?$/.test(formatted)) {
      setValues(prev => ({
        ...prev,
        [formatted === '' ? identifier : identifier]: formatted
      }));
    }
  };

  // Submit all readings at once
  const handleSave = async () => {
    setSaving(true);
    setNotification(null);
    try {
      // Validação: Preço por quilo é obrigatório
      if (pricePerKilo === '' || pricePerKilo === null || pricePerKilo === undefined) {
        setNotification({
          type: 'error',
          message: 'O Valor do Kilo (R$) é obrigatório para salvar as leituras.'
        });
        setSaving(false);
        return;
      }

      // Validação: a leitura atual não pode ser menor que a anterior
      let hasInvalidReading = false;
      let invalidUnitDetails = '';

      // Verificar Cozinha
      const cozinhaCurStr = values['COZINHA'];
      const cozinhaPrev = prevValues['COZINHA'];
      if (cozinhaCurStr && cozinhaPrev !== null && cozinhaPrev !== undefined) {
        const cur = parseFloat(cozinhaCurStr);
        if (!isNaN(cur) && cur < cozinhaPrev) {
          hasInvalidReading = true;
          invalidUnitDetails = 'Cozinha Condomínio';
        }
      }

      // Verificar Apartamentos
      if (!hasInvalidReading) {
        for (const u of units) {
          const curStr = values[u.id];
          const prev = prevValues[u.id];
          if (curStr && prev !== null && prev !== undefined) {
            const cur = parseFloat(curStr);
            if (!isNaN(cur) && cur < prev) {
              hasInvalidReading = true;
              invalidUnitDetails = `Apartamento ${u.number} - Bloco ${u.block}`;
              break;
            }
          }
        }
      }

      if (hasInvalidReading) {
        setNotification({
          type: 'error',
          message: `Gravação impedida: A leitura atual não pode ser menor que a leitura anterior (${invalidUnitDetails}).`
        });
        setSaving(false);
        return;
      }

      const readingsPayload = [
        // Adiciona a Cozinha
        {
          identifier: 'COZINHA',
          value: values['COZINHA'] !== '' && values['COZINHA'] !== undefined ? values['COZINHA'] : null,
          unitId: null
        },
        // Adiciona todos os apartamentos
        ...units.map(u => ({
          identifier: u.id,
          value: values[u.id] !== '' && values[u.id] !== undefined ? values[u.id] : null,
          unitId: u.id
        }))
      ];

      const res = await fetch('/api/leitura-gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: parseInt(selectedYear),
          readAt,
          readings: readingsPayload,
          pricePerKilo: pricePerKilo !== '' ? pricePerKilo : null
        })
      });

      if (res.redirected || res.url.includes('/login')) {
        setNotification({ type: 'error', message: 'Sessão expirada. Redirecionando para o login...' });
        setTimeout(() => window.location.href = '/login', 2500);
        return;
      }

      if (res.ok) {
        setNotification({ type: 'success', message: 'Leituras de gás gravadas com sucesso!' });
        fetchReadings();
      } else {
        const err = await res.json().catch(() => ({ message: 'Erro desconhecido ao salvar as leituras.' }));
        setNotification({ type: 'error', message: err.message || 'Erro ao salvar as leituras.' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Ocorreu um erro de rede ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  // Export readings to Excel sheet (Zeladoria & Administrador only)
  const exportToExcel = () => {
    const exportedData: any[] = [];
    const numericPrice = pricePerKilo !== '' && !isNaN(parseFloat(pricePerKilo)) ? parseFloat(pricePerKilo) : 0;
    
    const formattedReadDate = readAt 
      ? new Date(readAt + 'T00:00:00').toLocaleDateString('pt-BR') 
      : '-';

    const getCalculations = (identifier: string, curValStr: string) => {
      const cur = parseFloat(curValStr);
      if (isNaN(cur)) return null;

      const prev = prevValues[identifier] !== undefined && prevValues[identifier] !== null 
        ? Number(prevValues[identifier]) 
        : null;

      const hasPrev = prev !== null;
      const consumptionM3 = hasPrev ? (cur - prev) : 0;
      const consumptionKilo = consumptionM3 * 2.32;
      const cost = numericPrice > 0 ? (consumptionKilo * numericPrice) : 0;

      return {
        prev: hasPrev ? prev : null,
        current: cur,
        consumptionM3,
        consumptionKilo,
        cost
      };
    };

    // 1. Process common area "Cozinha Condomínio" if filled
    const cozinhaVal = values['COZINHA'];
    if (cozinhaVal !== undefined && cozinhaVal !== '') {
      const calcs = getCalculations('COZINHA', cozinhaVal);
      if (calcs) {
        exportedData.push({
          'Unidade': 'Cozinha Condomínio',
          'Data da Leitura': formattedReadDate,
          'Leitura Anterior (m³)': calcs.prev !== null ? parseFloat(calcs.prev.toFixed(3)) : '-',
          'Leitura Atual (m³)': parseFloat(calcs.current.toFixed(3)),
          'Consumo Líquido (m³)': parseFloat(calcs.consumptionM3.toFixed(3)),
          'Consumo Convertido (Kg)': parseFloat(calcs.consumptionKilo.toFixed(3)),
          'Preço por Kg (R$)': numericPrice > 0 ? parseFloat(numericPrice.toFixed(4)) : '-',
          'Valor do Consumo (R$)': numericPrice > 0 ? parseFloat(calcs.cost.toFixed(2)) : 0
        });
      }
    }

    // 2. Process all units
    units.forEach(u => {
      const aptVal = values[u.id];
      if (aptVal !== undefined && aptVal !== '') {
        const calcs = getCalculations(u.id, aptVal);
        if (calcs) {
          exportedData.push({
            'Unidade': u.number,
            'Data da Leitura': formattedReadDate,
            'Leitura Anterior (m³)': calcs.prev !== null ? parseFloat(calcs.prev.toFixed(3)) : '-',
            'Leitura Atual (m³)': parseFloat(calcs.current.toFixed(3)),
            'Consumo Líquido (m³)': parseFloat(calcs.consumptionM3.toFixed(3)),
            'Consumo Convertido (Kg)': parseFloat(calcs.consumptionKilo.toFixed(3)),
            'Preço por Kg (R$)': numericPrice > 0 ? parseFloat(numericPrice.toFixed(4)) : '-',
            'Valor do Consumo (R$)': numericPrice > 0 ? parseFloat(calcs.cost.toFixed(2)) : 0
          });
        }
      }
    });

    if (exportedData.length === 0) {
      alert('Nenhuma medição preenchida para o período selecionado para exportar.');
      return;
    }

    // 3. Compute Totals
    const sumM3 = exportedData.reduce((acc, row) => acc + Number(row['Consumo Líquido (m³)']), 0);
    const sumKilo = exportedData.reduce((acc, row) => acc + Number(row['Consumo Convertido (Kg)']), 0);
    const sumCost = exportedData.reduce((acc, row) => acc + Number(row['Valor do Consumo (R$)']), 0);

    // 4. Append consolidated TOTAL row at the end
    exportedData.push({
      'Unidade': 'TOTAL',
      'Data da Leitura': '',
      'Leitura Anterior (m³)': '',
      'Leitura Atual (m³)': '',
      'Consumo Líquido (m³)': parseFloat(sumM3.toFixed(3)),
      'Consumo Convertido (Kg)': parseFloat(sumKilo.toFixed(3)),
      'Preço por Kg (R$)': '',
      'Valor do Consumo (R$)': parseFloat(sumCost.toFixed(2))
    });

    // 5. Build sheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leituras de Gás');

    // 6. Define column widths to prevent text clipping
    const colWidths = [
      { wch: 25 }, // Unidade
      { wch: 18 }, // Data da Leitura
      { wch: 22 }, // Leitura Anterior (m³)
      { wch: 20 }, // Leitura Atual (m³)
      { wch: 22 }, // Consumo Líquido (m³)
      { wch: 25 }, // Consumo Convertido (Kg)
      { wch: 20 }, // Preço por Kg (R$)
      { wch: 22 }  // Valor do Consumo (R$)
    ];
    ws['!cols'] = colWidths;

    // 7. Write and trigger download
    const monthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth.toString();
    XLSX.writeFile(wb, `Leituras_Gas_${monthLabel}_${selectedYear}.xlsx`);
  };

  // Agrupa apartamentos por Bloco para exibição elegante
  const groupedUnits = units.reduce((acc, unit) => {
    if (!acc[unit.block]) acc[unit.block] = [];
    acc[unit.block].push(unit);
    return acc;
  }, {} as Record<string, Unit[]>);

  // Calcula total de preenchidos
  const totalApartments = units.length;
  const filledCount = [
    values['COZINHA'] !== '' && values['COZINHA'] !== undefined ? 1 : 0,
    ...units.map(u => values[u.id] !== '' && values[u.id] !== undefined ? 1 : 0)
  ].reduce((sum, current) => sum + current, 0);

  const totalFields = totalApartments + 1; // Unidades + Cozinha

  const hasInvalidReading = (() => {
    const cozCur = values['COZINHA'];
    const cozPrev = prevValues['COZINHA'];
    if (cozCur && cozPrev !== null && cozPrev !== undefined) {
      const curVal = parseFloat(cozCur);
      if (!isNaN(curVal) && curVal < cozPrev) return true;
    }
    for (const u of units) {
      const cur = values[u.id];
      const prev = prevValues[u.id];
      if (cur && prev !== null && prev !== undefined) {
        const curVal = parseFloat(cur);
        if (!isNaN(curVal) && curVal < prev) return true;
      }
    }
    return false;
  })();

  // Calcula os totais de consumo acumulados para m³, Kilo e Reais em tempo real
  let totalConsumptionM3 = 0;
  let totalConsumptionKilo = 0;
  let totalCost = 0;
  const hasPrice = pricePerKilo !== '' && !isNaN(parseFloat(pricePerKilo));
  const numericPrice = hasPrice ? parseFloat(pricePerKilo) : 0;

  // 1. Cozinha
  const cozinhaCurStr = values['COZINHA'];
  const cozinhaPrev = prevValues['COZINHA'];
  if (cozinhaCurStr && cozinhaPrev !== undefined && cozinhaPrev !== null) {
    const cur = parseFloat(cozinhaCurStr);
    if (!isNaN(cur)) {
      const diff = cur - cozinhaPrev;
      totalConsumptionM3 += diff;
      totalConsumptionKilo += diff * 2.32;
      if (hasPrice) {
        totalCost += diff * 2.32 * numericPrice;
      }
    }
  }

  // 2. Apartamentos
  units.forEach(u => {
    const curStr = values[u.id];
    const prev = prevValues[u.id];
    if (curStr && prev !== undefined && prev !== null) {
      const cur = parseFloat(curStr);
      if (!isNaN(cur)) {
        const diff = cur - prev;
        totalConsumptionM3 += diff;
        totalConsumptionKilo += diff * 2.32;
        if (hasPrice) {
          totalCost += diff * 2.32 * numericPrice;
        }
      }
    }
  });

  const isMorador = currentUser?.role === 'MORADOR';
  const isReadOnly = isMorador || currentUser?.role === 'ADMINISTRADORA' || currentUser?.role === 'CONSELHO';

  const handleReload = () => {
    if (isMorador && activeTab === 'comparativo') {
      fetchAnnualData(annualYear);
    } else {
      fetchReadings();
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 mb-3 border border-white/20">
              <Flame size={14} className="text-amber-300 animate-pulse" /> {isMorador ? 'Consumo Individual' : 'Leitura Predial'}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                {isMorador ? 'Histórico de Consumo de Gás' : 'Registro de Leitura do Gás'}
              </h1>
              {isMorador && (
                <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/15 shrink-0 self-start sm:self-auto shadow-inner">
                  <button
                    onClick={() => setActiveTab('mensal')}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      activeTab === 'mensal'
                        ? 'bg-white text-indigo-900 shadow-sm font-extrabold'
                        : 'text-blue-100 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setActiveTab('comparativo')}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      activeTab === 'comparativo'
                        ? 'bg-white text-indigo-900 shadow-sm font-extrabold'
                        : 'text-blue-100 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Comparativo Anual
                  </button>
                </div>
              )}
            </div>
            <p className="text-blue-100 text-sm font-medium opacity-90 max-w-xl">
              {isMorador 
                ? 'Consulte com facilidade as medições de consumo de gás do seu apartamento e acompanhe o histórico mensal.'
                : 'Área exclusiva para Zeladoria e Administração registrar as medições individuais mensais dos cilindros de gás do condomínio.'
              }
            </p>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            {!isMorador && (
              <button 
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl border border-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-700/20"
                title="Exportar Leituras para Excel"
              >
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">Exportar Excel</span>
              </button>
            )}
            <button 
              onClick={handleReload}
              className="bg-white/10 hover:bg-white/20 text-white font-bold p-3 rounded-2xl border border-white/15 transition-all active:scale-95 flex items-center gap-2"
              title="Recarregar dados"
            >
              <RefreshCw size={18} className={loading || loadingAnnual ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Alertas Flutuantes */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" /> : <AlertCircle size={20} className="text-red-600 shrink-0" />}
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}

      {/* Barra de Filtros / Período */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
        {/* Mês */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Escolha o Mês</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 transition-all cursor-pointer"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Ano */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Escolha o Ano</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 transition-all cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Data de Leitura */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" /> Data da Leitura
          </label>
          <input 
            type="date"
            required
            disabled={isReadOnly}
            value={readAt}
            onChange={(e) => setReadAt(e.target.value)}
            className={`w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700 transition-all ${
              isReadOnly 
                ? 'opacity-75 cursor-not-allowed border-transparent bg-slate-100/50' 
                : 'focus:ring-2 focus:ring-blue-500/20 cursor-pointer'
            }`}
          />
        </div>

        {/* Valor do Kilo (R$) */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign size={12} className="text-slate-400" /> Valor do Kilo (R$) <span className="text-rose-500">*</span>
          </label>
          <input 
            type="text"
            placeholder="0.0000"
            required
            disabled={isReadOnly}
            value={pricePerKilo}
            onChange={(e) => {
              const rawVal = e.target.value.replace(',', '.');
              if (rawVal === '' || /^\d*(\.\d{0,4})?$/.test(rawVal)) {
                setPricePerKilo(rawVal);
              }
            }}
            className={`w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700 transition-all ${
              isReadOnly 
                ? 'opacity-75 cursor-not-allowed border-transparent bg-slate-100/50' 
                : 'focus:ring-2 focus:ring-blue-500/20'
            }`}
          />
          {!isReadOnly && previousPricePerKilo !== '' && previousPricePerKilo !== null && previousPricePerKilo !== undefined && (
            <div className="flex justify-start mt-1.5">
              <button
                type="button"
                onClick={() => setPricePerKilo(previousPricePerKilo)}
                className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none"
              >
                <Copy size={10} /> Repetir anterior (R$ {Number(previousPricePerKilo).toFixed(4)})
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-404 font-bold animate-pulse">Carregando leituras do período...</p>
        </div>
      ) : isMorador ? (
        /* VISÃO EXCLUSIVA DO MORADOR (READ-ONLY DEMONSTRATIVO PREMIUM) */
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
          {!currentUser?.unitId ? (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vínculo não encontrado</h3>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                Seu perfil de morador ainda não está associado a nenhum apartamento no sistema.
              </p>
              <p className="text-slate-400 text-xs">
                Por favor, entre em contato com a zeladoria ou a administração para realizar o vínculo da sua unidade.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {activeTab === 'mensal' ? (
                /* ABA 1: DEMONSTRATIVO MENSAL (RECEITA MENSAL) */
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
                  {(() => {
                    const myUnit = units.find(u => u.id === currentUser.unitId);
                    const currentReadingStr = values[currentUser.unitId];
                    const hasReading = currentReadingStr !== undefined && currentReadingStr !== '';

                    if (!hasReading) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm space-y-6">
                          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto shadow-sm border border-amber-100">
                            <Calendar size={32} className="animate-pulse" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Medição em andamento</h3>
                            <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                              A leitura do medidor de gás para o apartamento <strong className="text-slate-800 font-black">AP {myUnit?.number || 'carregando...'} {myUnit?.block ? `- Bloco ${myUnit.block}` : ''}</strong> referente a <strong className="text-indigo-600 font-black">{months.find(m => m.value === selectedMonth)?.label} de {selectedYear}</strong> ainda não foi lançada pela administração do condomínio.
                            </p>
                          </div>
                          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            Zeladoria • Estação do Mar Condomínio
                          </div>
                        </div>
                      );
                    }

                    const currentReading = parseFloat(currentReadingStr);
                    const prevReadingVal = prevValues[currentUser.unitId];
                    const prevReading = prevReadingVal !== undefined && prevReadingVal !== null ? prevReadingVal : null;
                    const hasPrev = prevReading !== null;
                    const consumption = hasPrev ? (currentReading - prevReading) : 0;
                    const consumptionKilo = consumption * 2.32;
                    const price = pricePerKilo !== '' ? parseFloat(pricePerKilo) : 0;
                    const cost = (price > 0) ? (consumptionKilo * price) : 0;

                    return (
                      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl overflow-hidden relative">
                        {/* Cabeçalho do Demonstrativo */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-white relative">
                          <div className="absolute right-6 top-6 opacity-10">
                            <Flame size={120} />
                          </div>
                          <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">
                            Demonstrativo Individual
                          </span>
                          <h3 className="text-2xl font-black tracking-tight leading-none">CONSUMO DE GÁS</h3>
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mt-2">
                            Apartamento {myUnit?.number} — Bloco {myUnit?.block}
                          </p>
                          <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4 text-xs font-medium text-indigo-200/70">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-indigo-300/80 font-black">Período de Referência</p>
                              <p className="text-sm font-black text-white mt-0.5">{months.find(m => m.value === selectedMonth)?.label} / {selectedYear}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] uppercase tracking-wider text-indigo-300/80 font-black">Data da Leitura</p>
                              <p className="text-sm font-black text-white mt-0.5">
                                {readAt ? new Date(readAt + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Corpo do Demonstrativo (Recibo) */}
                        <div className="p-8 space-y-6 bg-slate-50/50">
                          <div className="space-y-4">
                            {/* Linha: Leitura Anterior */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Leitura Anterior</span>
                              <span className="font-bold text-slate-800">
                                {hasPrev ? `${Number(prevReading).toFixed(3)} m³` : '-'}
                              </span>
                            </div>

                            {/* Linha: Leitura Atual */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Leitura Atual</span>
                              <span className="font-bold text-slate-800">
                                {currentReading.toFixed(3)} m³
                              </span>
                            </div>

                            <div className="border-t border-dashed border-slate-200 my-2" />

                            {/* Linha: Consumo Líquido */}
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-slate-800 font-black text-sm block">Consumo Líquido (m³)</span>
                                <span className="text-[10px] text-slate-400 font-bold block">(Leitura Atual - Leitura Anterior)</span>
                              </div>
                              <span className="text-base font-black text-emerald-600">
                                {consumption.toFixed(3)} m³
                              </span>
                            </div>

                            {/* Linha: Consumo em Quilo */}
                            <div className="flex justify-between items-center pt-2">
                              <div>
                                <span className="text-slate-800 font-black text-sm block">Consumo Convertido (Kg)</span>
                                <span className="text-[10px] text-slate-400 font-bold block">(Volume em m³ × 2.32)</span>
                              </div>
                              <span className="text-base font-black text-blue-600">
                                {consumptionKilo.toFixed(3)} Kg
                              </span>
                            </div>

                            {/* Linha: Valor por Quilo */}
                            <div className="flex justify-between items-center pt-2">
                              <div>
                                <span className="text-slate-800 font-black text-sm block">Valor Unitário do Gás</span>
                                <span className="text-[10px] text-slate-400 font-bold block">(Preço por quilo no período)</span>
                              </div>
                              <span className="text-base font-black text-slate-700">
                                {price > 0 ? `R$ ${price.toFixed(4)}` : 'Não definido'}
                              </span>
                            </div>
                          </div>

                          {/* Totalizador do Recibo (Destaque) */}
                          {price > 0 && (
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 flex justify-between items-center mt-6">
                              <div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">Custo Estimado do Período</span>
                                <span className="text-xs text-slate-500 font-medium block">Rateio estimado para faturamento</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-indigo-600 block mr-1 leading-none">R$</span>
                                <span className="text-3xl font-black text-indigo-900 leading-none">
                                  {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Selo de Garantia */}
                          <div className="text-center pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Medição verificada pela Zeladoria
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ABA 2: PAINEL COMPARATIVO ANUAL */
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Seletor de Ano da Visão Anual */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Comparativo Anual de Consumo</h3>
                      <p className="text-slate-400 text-xs font-semibold">Consulte o histórico de consumo de gás do apartamento consolidado mês a mês.</p>
                    </div>
                    <div className="w-full sm:w-48">
                      <select
                        value={annualYear}
                        onChange={(e) => setAnnualYear(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 cursor-pointer transition-all"
                      >
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loadingAnnual ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold animate-pulse">Carregando dados históricos...</p>
                    </div>
                  ) : (() => {
                    // CÁLCULO DOS DADOS ANUAIS
                    const formatReadDate = (dateVal: string | Date | null) => {
                      if (!dateVal) return 'Sem leitura';
                      const d = new Date(dateVal);
                      if (isNaN(d.getTime())) return 'Sem leitura';
                      const day = String(d.getUTCDate()).padStart(2, '0');
                      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                      const year = d.getUTCFullYear();
                      return `${day}/${month}/${year}`;
                    };

                    const calculatedMonths: CalculatedMonth[] = months.map(m => {
                      const monthVal = m.value;
                      const yearVal = parseInt(annualYear);

                      const rCur = annualData?.readings.find(r => r.month === monthVal && r.year === yearVal);
                      const hasReading = !!rCur && rCur.value !== null;
                      
                      let rPrevVal: number | null = null;
                      if (monthVal > 1) {
                        const rPrev = annualData?.readings.find(r => r.month === monthVal - 1 && r.year === yearVal);
                        rPrevVal = rPrev ? rPrev.value : null;
                      } else {
                        const rPrev = annualData?.readings.find(r => r.month === 12 && r.year === yearVal - 1);
                        rPrevVal = rPrev ? rPrev.value : null;
                      }

                      const currentVal = rCur ? rCur.value : null;
                      const prevVal = rPrevVal;
                      
                      const hasPrev = prevVal !== null && currentVal !== null;
                      const consumptionM3 = (hasPrev && currentVal >= prevVal) ? (currentVal - prevVal) : 0;
                      const consumptionKilo = consumptionM3 * 2.32;
                      
                      const pCur = annualData?.prices.find(p => p.month === monthVal && p.year === yearVal);
                      const pricePerKilo = pCur ? pCur.pricePerKilo : null;
                      const cost = pricePerKilo !== null ? consumptionKilo * pricePerKilo : 0;

                      return {
                        month: monthVal,
                        label: m.label,
                        hasReading,
                        currentVal,
                        prevVal,
                        consumptionM3,
                        consumptionKilo,
                        pricePerKilo,
                        cost,
                        readAt: rCur ? rCur.readAt : null
                      };
                    });

                    const monthsWithReadings = calculatedMonths.filter(m => m.hasReading);
                    const totalM3 = calculatedMonths.reduce((sum, m) => sum + (m.hasReading ? m.consumptionM3 : 0), 0);
                    const averageM3 = monthsWithReadings.length > 0 ? (totalM3 / monthsWithReadings.length) : 0;
                    const totalCostAnnual = calculatedMonths.reduce((sum, m) => sum + (m.hasReading ? m.cost : 0), 0);

                    let peakMonth: CalculatedMonth | null = null;
                    let maxConsumption = -1;
                    for (const m of calculatedMonths) {
                      if (m.hasReading && m.consumptionM3 > maxConsumption) {
                        maxConsumption = m.consumptionM3;
                        peakMonth = m;
                      }
                    }

                    const maxVal = Math.max(...calculatedMonths.map(m => m.consumptionM3), 1);

                    if (monthsWithReadings.length === 0) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm space-y-6">
                          <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-slate-400 mx-auto shadow-sm">
                            <BarChart3 size={32} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sem dados para {annualYear}</h3>
                            <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                              Nenhuma leitura de gás foi cadastrada para o seu apartamento neste ano.
                            </p>
                          </div>
                          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            Zeladoria • Estação do Mar Condomínio
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-8">
                        {/* Grid de KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* KPI 1: Consumo Acumulado */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-4 top-4 bg-indigo-50 text-indigo-605 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/50">
                              <Flame size={20} className="animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-3">Consumo Anual</span>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-800 tracking-tight">{totalM3.toFixed(3)}</span>
                              <span className="text-xs font-bold text-slate-450">m³</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Consumo total acumulado</p>
                          </div>

                          {/* KPI 2: Média Mensal */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-4 top-4 bg-blue-50 text-blue-605 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/50">
                              <Award size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-3">Média Mensal</span>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-800 tracking-tight">{averageM3.toFixed(3)}</span>
                              <span className="text-xs font-bold text-slate-450">m³</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Média nos meses medidos</p>
                          </div>

                          {/* KPI 3: Custo Total */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-605 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                              <DollarSign size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-3">Custo Acumulado</span>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-xs font-bold text-emerald-600 mr-0.5">R$</span>
                              <span className="text-2xl font-black text-emerald-600 tracking-tight font-extrabold">
                                {totalCostAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Rateio anual estimado</p>
                          </div>

                          {/* KPI 4: Pico de Consumo */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-4 top-4 bg-rose-50 text-rose-605 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-rose-100/50">
                              <TrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-3">Mês de Pico</span>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-800 tracking-tight">
                                {peakMonth ? `${peakMonth.consumptionM3.toFixed(3)}` : '—'}
                              </span>
                              <span className="text-xs font-bold text-slate-450">{peakMonth ? 'm³' : ''}</span>
                            </div>
                            <p className="text-[10px] text-rose-600 mt-2 font-bold uppercase tracking-wider truncate">
                              {peakMonth ? `Pico em: ${peakMonth.label}` : 'Nenhum consumo'}
                            </p>
                          </div>
                        </div>

                        {/* Gráfico de Barras SVG Interativo */}
                        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-150 shadow-sm space-y-6 relative overflow-hidden">
                          <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                              <BarChart3 size={18} className="text-indigo-650" /> Histórico Mensal
                            </h3>
                            <p className="text-slate-400 text-xs font-semibold">Gráfico demonstrando o volume (m³) medido em cada período. Passe o cursor sobre as barras para ver detalhes.</p>
                          </div>
                          
                          {/* Container do Gráfico */}
                          <div className="relative w-full h-[260px]">
                            <svg 
                              viewBox="0 0 600 240" 
                              className="w-full h-full"
                            >
                              <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#4f46e5" />
                                  <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                                <linearGradient id="hoverBarGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#06b6d4" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>

                              {/* Linhas de Grade e Eixo Y */}
                              {[0, 0.25, 0.50, 0.75, 1].map((ratio, i) => {
                                const y = 20 + 180 * (1 - ratio);
                                const labelVal = maxVal * ratio;
                                return (
                                  <g key={i}>
                                    <line 
                                      x1="45" 
                                      y1={y} 
                                      x2="585" 
                                      y2={y} 
                                      stroke="#f1f5f9" 
                                      strokeWidth="1.5" 
                                      strokeDasharray="4 4" 
                                    />
                                    <text 
                                      x="38" 
                                      y={y + 4} 
                                      textAnchor="end" 
                                      className="text-[10px] font-black fill-slate-400"
                                    >
                                      {labelVal.toFixed(1)}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Barras do Gráfico */}
                              {calculatedMonths.map((m, idx) => {
                                if (!m.hasReading) return null;
                                const barHeight = (m.consumptionM3 / maxVal) * 180;
                                const x = 45 + idx * 45 + (45 - 24) / 2;
                                const y = 200 - barHeight;
                                const isHovered = hoveredIndex === idx;

                                return (
                                  <rect
                                    key={idx}
                                    x={x}
                                    y={y}
                                    width="24"
                                    height={Math.max(barHeight, 3)}
                                    rx="6"
                                    fill={isHovered ? 'url(#hoverBarGradient)' : 'url(#barGradient)'}
                                    className="cursor-pointer transition-all duration-200"
                                    onMouseEnter={() => setHoveredIndex(idx)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                  />
                                );
                              })}

                              {/* Placeholders para meses não medidos */}
                              {calculatedMonths.map((m, idx) => {
                                if (m.hasReading) return null;
                                const x = 45 + idx * 45 + (45 - 24) / 2;
                                return (
                                  <rect
                                    key={idx}
                                    x={x}
                                    y="198"
                                    width="24"
                                    height="2"
                                    rx="1"
                                    fill="#e2e8f0"
                                    className="opacity-50"
                                  />
                                );
                              })}

                              {/* Eixo X (Nomes dos Meses) */}
                              {calculatedMonths.map((m, idx) => (
                                <text
                                  key={idx}
                                  x={45 + idx * 45 + 22.5}
                                  y="222"
                                  textAnchor="middle"
                                  className="text-[10px] font-black fill-slate-400 uppercase tracking-tight"
                                >
                                  {m.label.substring(0, 3)}
                                </text>
                              ))}

                              {/* Linha da Base */}
                              <line 
                                x1="45" 
                                y1="200" 
                                x2="585" 
                                y2="200" 
                                stroke="#cbd5e1" 
                                strokeWidth="2" 
                              />

                              {/* Tooltip Renderizado Dentro do SVG para Perfeição de Escala */}
                              {hoveredIndex !== null && (() => {
                                const hMonth = calculatedMonths[hoveredIndex];
                                let tooltipX = 45 + hoveredIndex * 45 + 22.5;
                                if (tooltipX < 95) tooltipX = 95;
                                if (tooltipX > 505) tooltipX = 505;
                                const tooltipY = Math.max(200 - (hMonth.consumptionM3 / maxVal) * 180 - 75, 10);

                                return (
                                  <g 
                                    transform={`translate(${tooltipX - 70}, ${tooltipY})`} 
                                    className="pointer-events-none transition-all duration-150"
                                  >
                                    <rect 
                                      width="140" 
                                      height="68" 
                                      rx="12" 
                                      fill="#0f172a" 
                                      stroke="#334155" 
                                      strokeWidth="1.5" 
                                      opacity="0.96" 
                                    />
                                    <text 
                                      x="70" 
                                      y="16" 
                                      textAnchor="middle" 
                                      fill="#818cf8" 
                                      className="text-[9px] font-black uppercase tracking-widest"
                                    >
                                      {hMonth.label}
                                    </text>
                                    
                                    <text x="12" y="32" fill="#94a3b8" className="text-[9px] font-bold">Consumo:</text>
                                    <text x="128" y="32" textAnchor="end" fill="#34d399" className="text-[9px] font-black">{hMonth.consumptionM3.toFixed(3)} m³</text>
                                    
                                    <text x="12" y="44" fill="#94a3b8" className="text-[9px] font-bold">Peso (Kg):</text>
                                    <text x="128" y="44" textAnchor="end" fill="#60a5fa" className="text-[9px] font-black">{hMonth.consumptionKilo.toFixed(3)} Kg</text>
                                    
                                    <text x="12" y="56" fill="#94a3b8" className="text-[9px] font-bold">Custo Est.:</text>
                                    <text x="128" y="56" textAnchor="end" fill="#fbbf24" className="text-[9px] font-black">R$ {hMonth.cost.toFixed(2)}</text>
                                  </g>
                                );
                              })()}
                            </svg>
                          </div>
                        </div>

                        {/* Detalhamento Mensal (Tabela Informativa Premium) */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-150 shadow-sm overflow-hidden">
                          <div className="p-6 md:p-8 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Detalhamento Mensal das Leituras</h3>
                            <p className="text-slate-400 text-xs font-semibold">Tabela completa detalhando cada leitura e variação de consumo.</p>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  <th className="py-4 px-6">Mês</th>
                                  <th className="py-4 px-6 text-center">Data Leitura</th>
                                  <th className="py-4 px-6 text-right">Leitura (m³)</th>
                                  <th className="py-4 px-6 text-right">Consumo (m³)</th>
                                  <th className="py-4 px-6 text-right">Massa (Kg)</th>
                                  <th className="py-4 px-6 text-right">Preço/Kg</th>
                                  <th className="py-4 px-6 text-right">Custo Est.</th>
                                  <th className="py-4 px-6 text-center">Variação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-bold">
                                {calculatedMonths.map((m, idx) => {
                                  let changeElement = <span className="text-slate-400 font-bold">—</span>;
                                  
                                  if (m.hasReading && idx > 0) {
                                    const mPrev = calculatedMonths[idx - 1];
                                    if (mPrev.hasReading) {
                                      const prevCons = mPrev.consumptionM3;
                                      const curCons = m.consumptionM3;
                                      
                                      let percentDiff = 0;
                                      if (prevCons > 0) {
                                        percentDiff = ((curCons - prevCons) / prevCons) * 100;
                                      } else if (curCons > 0) {
                                        percentDiff = 100;
                                      }

                                      if (percentDiff > 0.01) {
                                        changeElement = (
                                          <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-55 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-inner-sm">
                                            <TrendingUp size={10} /> +{percentDiff.toFixed(1)}%
                                          </span>
                                        );
                                      } else if (percentDiff < -0.01) {
                                        changeElement = (
                                          <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-55 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-inner-sm">
                                            <TrendingDown size={10} /> {percentDiff.toFixed(1)}%
                                          </span>
                                        );
                                      } else {
                                        changeElement = (
                                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">
                                            <Minus size={10} /> 0%
                                          </span>
                                        );
                                      }
                                    }
                                  }

                                  return (
                                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${!m.hasReading ? 'opacity-40 bg-slate-50/20' : ''}`}>
                                      <td className="py-4 px-6 font-extrabold text-slate-800 uppercase tracking-tight">{m.label}</td>
                                      <td className="py-4 px-6 text-center text-[10px] text-slate-400">
                                        {formatReadDate(m.readAt)}
                                      </td>
                                      <td className="py-4 px-6 text-right font-medium">
                                        {m.currentVal !== null ? `${m.currentVal.toFixed(3)}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 text-right font-black text-indigo-600">
                                        {m.hasReading ? `${m.consumptionM3.toFixed(3)}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 text-right">
                                        {m.hasReading ? `${m.consumptionKilo.toFixed(3)}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 text-right text-slate-450 font-medium">
                                        {m.pricePerKilo !== null ? `R$ ${m.pricePerKilo.toFixed(4)}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 text-right font-extrabold text-emerald-600">
                                        {m.hasReading && m.pricePerKilo !== null ? `R$ ${m.cost.toFixed(2)}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 text-center">{changeElement}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VISÃO ADMINISTRATIVA (SUPER_ADMIN E SINDICO) */
        <div className="space-y-10">
          {/* Card Especial da Cozinha */}
          <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 p-6 md:p-8 rounded-[2.5rem] border border-orange-100/60 shadow-inner-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <UtensilsCrossed size={24} />
              </div>
              <div>
                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-100/80 px-2 py-0.5 rounded">Área Comum</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">Cozinha Condomínio</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Medidor coletivo do salão de festas e cozinhas sociais.</span>
                  {prevValues['COZINHA'] !== undefined && prevValues['COZINHA'] !== null && (
                    <span className="bg-orange-100 text-orange-750 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0 border border-orange-200/60 shadow-sm animate-pulse-subtle">
                      Anterior: {Number(prevValues['COZINHA']).toFixed(3)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-3 w-full justify-end">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block shrink-0">Leitura Atual:</label>
                {(() => {
                  const curStr = values['COZINHA'];
                  const prev = prevValues['COZINHA'];
                  const isInvalid = curStr && prev !== null && prev !== undefined && parseFloat(curStr) < prev;
                  return (
                    <div className="relative flex-grow md:flex-grow-0 min-w-[160px]">
                      <input 
                        type="text"
                        placeholder="0"
                        disabled={isReadOnly}
                        className={`w-full px-4 py-3 bg-white border-2 rounded-2xl focus:outline-none transition-all font-black text-right text-orange-700 text-lg shadow-inner ${
                          isReadOnly 
                            ? 'border-transparent bg-slate-100/50 cursor-not-allowed opacity-75' 
                            : isInvalid
                              ? 'border-rose-500 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10'
                              : 'border-orange-150 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                        }`}
                        value={values['COZINHA'] || ''}
                        onChange={(e) => handleInputChange('COZINHA', e.target.value)}
                      />
                      {isInvalid && (
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block mt-1.5 text-right select-none animate-in fade-in slide-in-from-top-1 duration-200">
                          Leitura menor que anterior!
                        </span>
                      )}
                      {!isReadOnly && prev !== null && prev !== undefined && (
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="button"
                            onClick={() => setValues(prevVals => ({ ...prevVals, COZINHA: String(prev) }))}
                            className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none"
                          >
                            <Copy size={10} /> Repetir valor ({Number(prev).toFixed(3)})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {(() => {
                const currentValStr = values['COZINHA'];
                const prevVal = prevValues['COZINHA'];
                if (currentValStr && prevVal !== undefined && prevVal !== null) {
                  const currentVal = parseFloat(currentValStr);
                  if (!isNaN(currentVal)) {
                    const consumption = currentVal - prevVal;
                    const consumptionKilo = consumption * 2.32;
                    const numericPrice = parseFloat(pricePerKilo);
                    const cost = !isNaN(numericPrice) ? consumptionKilo * numericPrice : null;
                    return (
                      <div className="text-right mt-1 px-2 select-none animate-in fade-in duration-200 flex flex-col items-end gap-0.5">
                        <div>
                          <span className="text-[10px] font-black text-orange-600/70 uppercase tracking-wider inline-block mr-1">Consumo em m³:</span>
                          <span className={`text-sm font-black ${consumption >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {consumption >= 0 ? '+' : ''}{consumption.toFixed(3)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-orange-600/70 uppercase tracking-wider inline-block mr-1">Consumo em Kilo:</span>
                          <span className={`text-sm font-black ${consumptionKilo >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                            {consumptionKilo >= 0 ? '+' : ''}{consumptionKilo.toFixed(3)}
                          </span>
                        </div>
                        {cost !== null && (
                          <div className="mt-1 border-t border-orange-200/60 pt-1 w-full text-right">
                            <span className="text-[10px] font-black text-orange-600/70 uppercase tracking-wider inline-block mr-1">Valor do Gás:</span>
                            <span className={`text-sm font-black ${cost >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                              R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>

          {/* Grid de Blocos e Apartamentos */}
          <div className="space-y-12">
            {Object.keys(groupedUnits).length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center">
                <Building size={48} className="mx-auto text-slate-200 mb-4 animate-bounce" />
                <p className="text-slate-400 font-bold text-lg">Nenhum apartamento cadastrado.</p>
                <p className="text-slate-400 text-sm mt-1">Cadastre unidades em "Apartamentos" primeiro.</p>
              </div>
            ) : (
              Object.entries(groupedUnits).map(([blockName, blockUnits]) => (
                <div key={blockName} className="space-y-4">
                  {/* Título do Bloco */}
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pl-2">
                    <Building size={16} className="text-blue-600" /> Bloco {blockName}
                  </h3>

                  {/* Grid de Apartamentos */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {blockUnits.map((u) => (
                      <div 
                        key={u.id}
                        className="bg-white p-4 rounded-3xl border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none block mb-0.5">Apartamento</span>
                            <span className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors">{u.number}</span>
                          </div>
                          {prevValues[u.id] !== undefined && prevValues[u.id] !== null && (
                            <div className="text-right">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-0.5">Anterior</span>
                              <span className="text-xs font-black text-blue-600 bg-blue-50/60 border border-blue-100/50 px-1.5 py-0.5 rounded-lg select-none shadow-sm">
                                {Number(prevValues[u.id]).toFixed(3)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Input Individual */}
                        {(() => {
                          const curStr = values[u.id];
                          const prev = prevValues[u.id];
                          const isInvalid = curStr && prev !== null && prev !== undefined && parseFloat(curStr) < prev;
                          return (
                            <div className="relative">
                              <input 
                                type="text"
                                placeholder="0"
                                disabled={isReadOnly}
                                className={`w-full px-3 py-2 border rounded-xl focus:outline-none transition-all font-bold text-right text-slate-700 text-sm shadow-inner ${
                                  isReadOnly 
                                    ? 'border-transparent bg-slate-100/40 cursor-not-allowed opacity-75' 
                                    : isInvalid
                                      ? 'bg-rose-50/50 border-rose-400 hover:border-rose-500 focus:border-rose-500 text-rose-700'
                                      : 'bg-slate-50 border-slate-100 hover:border-slate-200 focus:border-blue-500'
                                }`}
                                value={values[u.id] || ''}
                                onChange={(e) => handleInputChange(u.id, e.target.value)}
                              />
                              {isInvalid && (
                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block mt-1 text-right select-none animate-in fade-in slide-in-from-top-1 duration-200">
                                  Leitura menor que anterior!
                                </span>
                              )}
                              {!isReadOnly && prev !== null && prev !== undefined && (
                                <div className="flex justify-end mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setValues(prevVals => ({ ...prevVals, [u.id]: String(prev) }))}
                                    className="w-full text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 select-none"
                                  >
                                    <Copy size={10} /> Repetir valor ({Number(prev).toFixed(3)})
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Consumo Calculado */}
                        {(() => {
                          const currentValStr = values[u.id];
                          const prevVal = prevValues[u.id];
                          if (currentValStr && prevVal !== undefined && prevVal !== null) {
                            const currentVal = parseFloat(currentValStr);
                            if (!isNaN(currentVal)) {
                              const consumption = currentVal - prevVal;
                              const consumptionKilo = consumption * 2.32;
                              const numericPrice = parseFloat(pricePerKilo);
                              const cost = !isNaN(numericPrice) ? consumptionKilo * numericPrice : null;
                              return (
                                <div className="text-right mt-1.5 px-1 select-none animate-in fade-in duration-200 space-y-1">
                                  <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Consumo em m³:</span>
                                    <span className={`text-xs font-black ${consumption >= 0 ? 'text-emerald-600' : 'text-rose-500 font-extrabold'}`}>
                                      {consumption >= 0 ? '+' : ''}{consumption.toFixed(3)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Consumo em Kilo:</span>
                                    <span className={`text-xs font-black ${consumptionKilo >= 0 ? 'text-blue-600' : 'text-rose-500 font-extrabold'}`}>
                                      {consumptionKilo >= 0 ? '+' : ''}{consumptionKilo.toFixed(3)}
                                    </span>
                                  </div>
                                  {cost !== null && (
                                    <div className="mt-1 border-t border-slate-100 pt-1 text-right">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Valor do Consumo:</span>
                                      <span className={`text-xs font-black ${cost >= 0 ? 'text-blue-600' : 'text-rose-500 font-extrabold'}`}>
                                        R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          }
                          return (
                            <div className="text-right mt-1.5 px-1 select-none opacity-40 space-y-1">
                              <div>
                                <span className="text-[9px] font-black text-slate-350 uppercase tracking-wider block leading-none mb-0.5">Consumo em m³:</span>
                                <span className="text-xs font-bold text-slate-350">-</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-350 uppercase tracking-wider block leading-none mb-0.5">Consumo em Kilo:</span>
                                <span className="text-xs font-bold text-slate-350">-</span>
                              </div>
                              {pricePerKilo !== '' && !isNaN(parseFloat(pricePerKilo)) && (
                                <div className="mt-1 border-t border-slate-100 pt-1">
                                  <span className="text-[9px] font-black text-slate-350 uppercase tracking-wider block leading-none mb-0.5">Valor do Consumo:</span>
                                  <span className="text-xs font-bold text-slate-350">-</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Card de Resumo Geral (Totais) */}
          <div className="bg-gradient-to-br from-slate-800 to-indigo-950 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden mt-8">
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-16 -top-16 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
                  <Flame size={20} className="text-amber-300 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block leading-none mb-0.5">Consolidado Mensal</span>
                  <h3 className="text-xl font-black tracking-tight leading-none">Resumo Geral de Consumo</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Total m³ */}
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Consumido (m³)</span>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{totalConsumptionM3.toFixed(3)}</span>
                    <span className="text-xs font-bold text-indigo-300 font-medium">m³</span>
                  </div>
                </div>

                {/* Total Kg */}
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Consumido (Kg)</span>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-blue-300">{totalConsumptionKilo.toFixed(3)}</span>
                    <span className="text-xs font-bold text-indigo-300 font-medium">Kg</span>
                  </div>
                </div>

                {/* Total Reais */}
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Valor Total Acumulado</span>
                  <div className="mt-4 flex items-baseline gap-1">
                    {hasPrice ? (
                      <>
                        <span className="text-xs font-bold text-indigo-300 font-medium mr-0.5">R$</span>
                        <span className="text-3xl font-black text-emerald-400">
                          {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-indigo-300/60 italic font-medium">Preço do Kg não definido</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Ação Adesiva / Sticky Footer */}
      {!loading && !isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                <Info size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Progresso de Lançamento</p>
                <p className="text-xs font-bold text-slate-600">
                  <strong className="text-blue-600">{filledCount}</strong> de <strong className="text-slate-800">{totalFields}</strong> campos preenchidos.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full sm:w-auto font-bold px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 min-w-[200px] ${
                hasInvalidReading 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Gravando Leituras...
                </>
              ) : hasInvalidReading ? (
                <>
                  <ShieldAlert size={18} /> Valor menor detectado!
                </>
              ) : (
                <>
                  <Save size={18} /> Salvar Tudo
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {/* Rodapé da Versão do Sistema */}
      <div className="mt-12 text-center pb-8 select-none">
        <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
