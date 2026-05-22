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
  Info
} from 'lucide-react';

interface Unit {
  id: string;
  number: string;
  block: string;
}

interface GasReading {
  identifier: string;
  value: number | null;
}

export default function GasReadingPage() {
  const currentYearVal = new Date().getFullYear();
  const currentMonthVal = new Date().getMonth() + 1; // 1-indexed

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
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthVal);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearVal.toString());
  const [readAt, setReadAt] = useState<string>(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [units, setUnits] = useState<Unit[]>([]);
  const [values, setValues] = useState<Record<string, string>>({}); // id -> value string
  const [prevValues, setPrevValues] = useState<Record<string, number | null>>({}); // id/identifier -> previous numeric value
  
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
          readings: readingsPayload
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

  return (
    <div className="space-y-8 pb-32">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 mb-3 border border-white/20">
              <Flame size={14} className="text-amber-300 animate-pulse" /> Leitura Predial
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-2">Registro de Leitura do Gás</h1>
            <p className="text-blue-100 text-sm font-medium opacity-90 max-w-xl">
              Área exclusiva para Zeladoria e Administração registrar as medições individuais mensais dos cilindros de gás do condomínio.
            </p>
          </div>
          <button 
            onClick={fetchReadings}
            className="bg-white/10 hover:bg-white/20 text-white font-bold p-3 rounded-2xl border border-white/15 transition-all active:scale-95 flex items-center gap-2 self-end md:self-auto"
            title="Recarregar dados"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
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
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
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
            value={readAt}
            onChange={(e) => setReadAt(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 transition-all cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">Carregando leituras do período...</p>
        </div>
      ) : (
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
                <div className="relative flex-grow md:flex-grow-0 min-w-[160px]">
                  <input 
                    type="text"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white border-2 border-orange-150 focus:border-orange-500 rounded-2xl focus:outline-none transition-all font-black text-right text-orange-700 text-lg shadow-inner focus:ring-4 focus:ring-orange-500/10"
                    value={values['COZINHA'] || ''}
                    onChange={(e) => handleInputChange('COZINHA', e.target.value)}
                  />
                </div>
              </div>
              {(() => {
                const currentValStr = values['COZINHA'];
                const prevVal = prevValues['COZINHA'];
                if (currentValStr && prevVal !== undefined && prevVal !== null) {
                  const currentVal = parseFloat(currentValStr);
                  if (!isNaN(currentVal)) {
                    const consumption = currentVal - prevVal;
                    return (
                      <div className="text-right mt-1 px-2 select-none animate-in fade-in duration-200">
                        <span className="text-[10px] font-black text-orange-600/70 uppercase tracking-wider inline-block mr-1">Consumo em m³:</span>
                        <span className={`text-sm font-black ${consumption >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {consumption >= 0 ? '+' : ''}{consumption.toFixed(3)}
                        </span>
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
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none transition-all font-bold text-right text-slate-700 text-sm shadow-inner"
                            value={values[u.id] || ''}
                            onChange={(e) => handleInputChange(u.id, e.target.value)}
                          />
                        </div>

                        {/* Consumo Calculado */}
                        {(() => {
                          const currentValStr = values[u.id];
                          const prevVal = prevValues[u.id];
                          if (currentValStr && prevVal !== undefined && prevVal !== null) {
                            const currentVal = parseFloat(currentValStr);
                            if (!isNaN(currentVal)) {
                              const consumption = currentVal - prevVal;
                              return (
                                <div className="text-right mt-1 px-1 select-none animate-in fade-in duration-200">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Consumo em m³:</span>
                                  <span className={`text-xs font-black ${consumption >= 0 ? 'text-emerald-600' : 'text-rose-500 font-extrabold'}`}>
                                    {consumption >= 0 ? '+' : ''}{consumption.toFixed(3)}
                                  </span>
                                </div>
                              );
                            }
                          }
                          return (
                            <div className="text-right mt-1 px-1 select-none opacity-40">
                              <span className="text-[9px] font-black text-slate-350 uppercase tracking-wider block leading-none mb-0.5">Consumo em m³:</span>
                              <span className="text-xs font-bold text-slate-350">-</span>
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
        </div>
      )}

      {/* Barra de Ação Adesiva / Sticky Footer */}
      {!loading && (
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
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 min-w-[200px]"
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Gravando Leituras...
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
    </div>
  );
}
