'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Unit {
  id: string;
  name: string;
  idDivision: string;
  division: string;
}

interface Boleto {
  id: string;
  unidadeId: string;
  unidadeNome: string;
  referencia: string;
  vencimento: string;
  valor: string;
  linhaDigitavel: string | null;
  status: string;
}

export default function BoletoTestePage() {
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchUnits();
  }, []);

  // Fechar o dropdown de busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      setError(null);
      const res = await fetch('/api/boleto-teste/unidades');
      if (res.status === 401 || res.status === 403) {
        throw new Error('Acesso não autorizado. Apenas administradores do portal.');
      }
      if (!res.ok) {
        throw new Error('Falha ao buscar a lista de unidades do portal.');
      }
      const data = await res.json();
      setUnits(data);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao buscar unidades.');
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchBoletosForUnit = async (unit: Unit) => {
    try {
      setLoadingBoletos(true);
      setError(null);
      const res = await fetch(
        `/api/boleto-teste?idUnidade=${unit.id}&idDivisao=${unit.idDivision}&nomeUnidade=${encodeURIComponent(unit.name)}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao carregar os boletos desta unidade.');
      }

      const data = await res.json();
      setBoletos(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar os boletos.');
    } finally {
      setLoadingBoletos(false);
    }
  };

  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setUnitSearch(unit.name);
    setDropdownOpen(false);
    setBoletos([]);
    fetchBoletosForUnit(unit);
  };

  const handleCopyBarcode = (id: string, barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(unitSearch.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Painel Administrativo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">
              Boleto - Teste
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Consulte e visualize os boletos de qualquer unidade do portal 10493 (Estação do Mar)
            </p>
          </div>

          {!loadingBoletos && selectedUnit && (
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => fetchBoletosForUnit(selectedUnit)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                </svg>
                Atualizar
              </button>
            </div>
          )}
        </div>

        {/* Mensagem de Erro Geral */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-rose-100 text-rose-600 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-2">
              Erro ocorrido
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
              {error}
            </p>
          </div>
        )}

        {/* Seleção de Unidades (Combobox Alfanumérico) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Selecione a Unidade (Apartamento / Garagem)
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center">
              <input
                type="text"
                placeholder={loadingUnits ? "Carregando unidades..." : "Digite o número ou sigla (ex: 11, VG.75)"}
                value={unitSearch}
                onChange={(e) => {
                  setUnitSearch(e.target.value);
                  setDropdownOpen(true);
                  if (selectedUnit && selectedUnit.name !== e.target.value) {
                    setSelectedUnit(null);
                  }
                }}
                onFocus={() => setDropdownOpen(true)}
                disabled={loadingUnits}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              {selectedUnit && (
                <button
                  onClick={() => {
                    setSelectedUnit(null);
                    setUnitSearch('');
                    setBoletos([]);
                  }}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Lista Dropdown */}
            {dropdownOpen && !loadingUnits && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleUnitSelect(unit)}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between transition ${
                        selectedUnit?.id === unit.id ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <span>Unidade {unit.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                        {unit.division}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">
                    Nenhuma unidade encontrada para "{unitSearch}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loader de Carregamento de Boletos */}
        {loadingBoletos && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Sem Boletos para Unidade Selecionada */}
        {!loadingBoletos && selectedUnit && boletos.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
              Nenhum boleto encontrado
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Não foram encontradas cobranças recentes da unidade {selectedUnit.name} no portal da Winker.
            </p>
          </div>
        )}

        {/* Mensagem Inicial se nenhuma Unidade estiver selecionada */}
        {!selectedUnit && !loadingUnits && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-indigo-50 text-indigo-500 mb-4 border border-indigo-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
              Ambiente de Teste
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Selecione uma unidade no campo de pesquisa acima para consultar as cobranças e o código de barras diretamente do Winker.
            </p>
          </div>
        )}

        {/* Lista de Boletos da Unidade Selecionada */}
        {!loadingBoletos && selectedUnit && boletos.length > 0 && (
          <div className="space-y-6">
            {boletos.map((boleto) => (
              <div 
                key={boleto.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                        Unidade {boleto.unidadeNome}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Referência: {boleto.referencia}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold ${
                    boleto.status === 'Pago' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : boleto.status === 'Vencido'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {boleto.status !== 'Pago' && (
                      <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                        boleto.status === 'Vencido' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></span>
                    )}
                    {boleto.status}
                  </span>
                </div>

                {/* Grid de Informações Financeiras */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Vencimento</span>
                    <span className="text-sm font-black text-slate-700">{boleto.vencimento}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Valor Total</span>
                    <span className="text-sm font-black text-indigo-600">{boleto.valor}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Identificador</span>
                    <span className="text-sm font-black text-slate-700">{boleto.id}</span>
                  </div>
                </div>

                {/* Código de Barras / Linha Digitável */}
                {boleto.linhaDigitavel && (
                  <div className="mb-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Linha Digitável</span>
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 truncate pr-2 select-all">
                        {boleto.linhaDigitavel}
                      </span>
                      <button
                        onClick={() => handleCopyBarcode(boleto.id, boleto.linhaDigitavel!)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                          copiedId === boleto.id
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {copiedId === boleto.id ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h5.586a1 1 0 01.707-.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href={`/api/boleto-teste?idBoleto=${boleto.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Visualizar PDF
                  </a>

                  <a
                    href={`/api/boleto-teste?idBoleto=${boleto.id}`}
                    download={`boleto_${boleto.id}.pdf`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar PDF
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
