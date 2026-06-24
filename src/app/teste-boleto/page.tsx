'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

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
  reference: string;
  referencia: string;
  vencimento: string;
  valorOriginal: string;
  situacao: string;
  dataPagamento: string;
  valorPago: string;
  nossoNumero: string;
  linhaDigitavel: string | null;
}

export default function TesteBoletoPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Estados para consulta geral de atrasados
  const [isAllOverdueMode, setIsAllOverdueMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoadingUser(true);
      setError(null);
      const res = await fetch('/api/me');
      if (!res.ok) {
        throw new Error('Não foi possível obter dados da sessão no portal.');
      }
      const data = await res.json();
      setUser(data.user);

      if (data.user.role === 'MORADOR') {
        fetchBoletosForMorador();
      } else if (data.user.role === 'SUPER_ADMIN') {
        fetchUnits();
      } else {
        throw new Error('Acesso restrito para administradores e moradores.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao inicializar dados da página.');
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      setError(null);
      const res = await fetch('/api/teste-boleto/unidades');
      if (res.status === 401 || res.status === 403) {
        throw new Error('Acesso não autorizado às unidades.');
      }
      if (!res.ok) {
        throw new Error('Falha ao buscar a lista de unidades do portal.');
      }
      const data = await res.json();
      setUnits(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar unidades.');
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchBoletosForMorador = async () => {
    try {
      setLoadingBoletos(true);
      setError(null);
      const res = await fetch('/api/teste-boleto');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao buscar faturas da sua unidade.');
      }
      const data = await res.json();
      setBoletos(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar boletos.');
    } finally {
      setLoadingBoletos(false);
    }
  };

  const fetchBoletosForUnit = async (unit: Unit) => {
    try {
      setLoadingBoletos(true);
      setError(null);
      setIsAllOverdueMode(false); // Desmarca modo geral
      const res = await fetch(
        `/api/teste-boleto?idUnidade=${unit.id}&nomeUnidade=${encodeURIComponent(unit.name)}`
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

  const fetchTodosAtrasados = async () => {
    try {
      setLoadingBoletos(true);
      setError(null);
      setIsAllOverdueMode(true);
      setSelectedUnit(null); // Desmarca apartamento específico
      setBoletos([]);
      
      const res = await fetch('/api/teste-boleto/atrasados');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao buscar faturas atrasadas do condomínio.');
      }
      const data = await res.json();
      setBoletos(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar faturas atrasadas.');
    } finally {
      setLoadingBoletos(false);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setIsAllOverdueMode(false);
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setSelectedUnit(unit);
      setBoletos([]);
      fetchBoletosForUnit(unit);
    } else {
      setSelectedUnit(null);
      setBoletos([]);
    }
  };

  const handleRefresh = () => {
    if (user?.role === 'MORADOR') {
      fetchBoletosForMorador();
    } else if (isAllOverdueMode) {
      fetchTodosAtrasados();
    } else if (user?.role === 'SUPER_ADMIN' && selectedUnit) {
      fetchBoletosForUnit(selectedUnit);
    } else if (user?.role === 'SUPER_ADMIN') {
      fetchUnits();
    } else {
      fetchUserProfile();
    }
  };

  const handleCopyBarcode = (id: string, barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToExcel = () => {
    if (boletos.length === 0) {
      alert('Não há boletos para exportar.');
      return;
    }

    const data = boletos.map(boleto => ({
      'UNIDADE / APARTAMENTO': boleto.unidadeNome,
      'REFERÊNCIA': boleto.referencia,
      'VENCIMENTO': boleto.vencimento,
      'VALOR ORIGINAL': boleto.valorOriginal,
      'SITUAÇÃO': boleto.situacao,
      'DATA PAGAMENTO': boleto.dataPagamento,
      'VALOR PAGO': boleto.valorPago,
      'NOSSO NÚMERO': boleto.nossoNumero,
      'LINHA DIGITÁVEL': boleto.linhaDigitavel || '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturas');

    // Auto-ajuste e dimensões das colunas
    const colWidths = [
      { wch: 22 }, // Unidade
      { wch: 12 }, // Referência
      { wch: 15 }, // Vencimento
      { wch: 18 }, // Valor Original
      { wch: 12 }, // Situação
      { wch: 18 }, // Data Pagamento
      { wch: 15 }, // Valor Pago
      { wch: 20 }, // Nosso Número
      { wch: 50 }  // Linha Digitável
    ];
    worksheet['!cols'] = colWidths;

    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = isAllOverdueMode 
      ? `Boletos_Atrasados_Geral_${todayStr}.xlsx`
      : `Boletos_Unidade_${selectedUnit?.name || 'Consulta'}_${todayStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  if (!mounted) return null;

  const isMorador = user?.role === 'MORADOR';
  const hasBoletos = boletos.length > 0;
  const showRefreshButton = !loadingUser && !loadingBoletos && (isMorador || selectedUnit || isAllOverdueMode);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Estação do Mar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">
            Boleto (2a. Via)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isMorador 
              ? 'Consulte e visualize as faturas vinculadas à sua unidade de moradia' 
              : isAllOverdueMode
              ? 'Todos os boletos vencidos de todas as unidades do condomínio'
              : 'Painel administrativo para consulta de boletos e códigos de barras por unidade'}
          </p>
        </div>

        {/* Ações Administrativas no Topo */}
        {!loadingUser && !error && user?.role === 'SUPER_ADMIN' && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão Ver Todos Atrasados */}
            <button
              onClick={fetchTodosAtrasados}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-95 border ${
                isAllOverdueMode
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Ver Todos Atrasados
            </button>

            {/* Botão Exportar Excel */}
            {hasBoletos && (
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Excel
              </button>
            )}

            {/* Botão Atualizar */}
            {showRefreshButton && (
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                </svg>
                Atualizar
              </button>
            )}
          </div>
        )}

        {/* Ações do Morador no Topo */}
        {isMorador && showRefreshButton && (
          <div className="flex items-center gap-2.5">
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
              </svg>
              Atualizar
            </button>
          </div>
        )}
      </div>

      {/* Loader Inicial / Perfil */}
      {loadingUser && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm animate-pulse">
            <div className="h-6 w-48 bg-slate-200 rounded-md mb-4"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
          </div>
        </div>
      )}

      {/* Mensagem de Erro Geral */}
      {!loadingUser && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-8 shadow-sm text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-rose-100 text-rose-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-2">
            Não foi possível carregar os dados
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
            {error}
          </p>
          <button 
            onClick={fetchUserProfile}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition active:scale-95"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Caixa de Seleção de Unidades (Apenas para ADMIN) */}
      {!loadingUser && !error && !isMorador && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Selecione o Apartamento ou Unidade
          </label>
          <select
            value={selectedUnit?.id || ''}
            onChange={(e) => handleUnitSelect(e.target.value)}
            disabled={loadingUnits}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option value="">Selecione uma unidade...</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unidade {unit.name} ({unit.division})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loader de Faturas */}
      {loadingBoletos && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
                <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado Vazio - Nenhuma unidade selecionada e fora do modo atrasados (Apenas para ADMIN) */}
      {!loadingUser && !loadingBoletos && !error && !isMorador && !selectedUnit && !isAllOverdueMode && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-12 shadow-sm text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-indigo-50 text-indigo-500 mb-4 border border-indigo-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
            Consulta de Faturas
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Por favor, selecione uma unidade no menu acima ou clique em "Ver Todos Atrasados" para listar as cobranças.
          </p>
        </div>
      )}

      {/* Estado Vazio - Unidade/Portal Sem Boletos */}
      {!loadingUser && !loadingBoletos && !error && (isMorador || selectedUnit || isAllOverdueMode) && !hasBoletos && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-12 shadow-sm text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
            Nenhum boleto localizado
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {isMorador 
              ? 'Não encontramos faturas ou cobranças em aberto para o seu apartamento.' 
              : isAllOverdueMode
              ? 'Não foram encontradas cobranças com status de atraso em nenhuma unidade do condomínio.'
              : `Não foram encontradas cobranças ativas na API da Winker para a unidade ${selectedUnit?.name}.`}
          </p>
        </div>
      )}

      {/* Tabela de Boletos */}
      {!loadingUser && !loadingBoletos && !error && (isMorador || selectedUnit || isAllOverdueMode) && hasBoletos && (
        <div className="w-full max-w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-16">PDF</th>
                  {isAllOverdueMode && (
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apartamento</th>
                  )}
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referência</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Original</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Situação</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Pagamento</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Pago</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nosso Número</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Linha Digitável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boletos.map((boleto) => (
                  <tr key={boleto.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Botão de download/view PDF */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <a
                        href={`/api/teste-boleto?idBoleto=${boleto.id}&idUnidade=${boleto.unidadeId}&reference=${boleto.reference}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Visualizar PDF"
                        className="inline-flex items-center justify-center p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </a>
                    </td>

                    {/* Apartamento / Unidade */}
                    {isAllOverdueMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600">
                        Apto {boleto.unidadeNome}
                      </td>
                    )}
                    
                    {/* Referência */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {boleto.referencia}
                    </td>
                    
                    {/* Vencimento */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {boleto.vencimento}
                    </td>
                    
                    {/* Valor Original */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {boleto.valorOriginal}
                    </td>
                    
                    {/* Situação */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full text-xs font-bold ${
                        boleto.situacao === 'Pago' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : boleto.situacao === 'Atrasado'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {boleto.situacao}
                      </span>
                    </td>
                    
                    {/* Data Pagamento */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {boleto.dataPagamento}
                    </td>
                    
                    {/* Valor Pago */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-700 font-bold">
                      {boleto.valorPago}
                    </td>
                    
                    {/* Nosso Número */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-semibold text-slate-600">
                      {boleto.nossoNumero}
                    </td>
                    
                    {/* Linha Digitável */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {boleto.linhaDigitavel ? (
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <span className="text-[10px] font-mono font-bold text-slate-500 truncate select-all" title={boleto.linhaDigitavel}>
                            {boleto.linhaDigitavel}
                          </span>
                          <button
                            onClick={() => handleCopyBarcode(boleto.id, boleto.linhaDigitavel!)}
                            className={`p-1 rounded-lg border transition ${
                              copiedId === boleto.id
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                            title="Copiar Código de Barras"
                          >
                            {copiedId === boleto.id ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h5.586a1 1 0 01.707-.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
