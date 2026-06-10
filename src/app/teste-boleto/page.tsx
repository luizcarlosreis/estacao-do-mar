'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  LayoutDashboard, 
  ChevronRight, 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  Printer, 
  ShieldAlert, 
  Info,
  Calendar,
  Building,
  Key
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

export default function TesteBoletoPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Form Método 1 (Intranet)
  const [dataRefRateio, setDataRefRateio] = useState('202606');
  const [idUnidade, setIdUnidade] = useState('863378');
  const [idDivisao, setIdDivisao] = useState('35641');

  // Form Método 2 (API)
  const [idBoleto, setIdBoleto] = useState('1');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setCurrentUser(data?.user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleDownloadApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idBoleto.trim()) return;

    setDownloading(true);
    try {
      // Abre em uma nova aba que iniciará o download direto
      window.open(`/api/teste-boleto?idBoleto=${idBoleto}`, '_blank');
    } catch (err) {
      console.error(err);
      alert('Erro ao tentar baixar o boleto.');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenIntranet = () => {
    const url = `https://app.winker.com.br/intra/meuCondominio/boleto?dataRefRateio=${dataRefRateio}&idUnidade=${idUnidade}&idDivisao=${idDivisao}`;
    window.open(url, '_blank');
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse text-slate-500 font-bold uppercase tracking-wider text-[10px]">
          Verificando permissões...
        </div>
      </div>
    );
  }

  // Restrição de Acesso
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center">
        <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Acesso Negado</h2>
        <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
          Esta funcionalidade é exclusiva para testes do perfil de Administrador Principal (SUPER_ADMIN).
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition">
          <ArrowLeft size={14} /> Voltar ao Painel
        </Link>
      </div>
    );
  }

  const inp = 'w-full p-3 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-slate-50 text-slate-700';
  const lbl = 'block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="max-w-[1000px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-100">
              <Printer size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Impressão de Boleto (Teste)
              </h1>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                <LayoutDashboard size={10} /> Painel Administrativo <ChevronRight size={10} /> Teste de Integração Winker
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3 font-medium">
            Interface administrativa exclusiva para validação técnica da integração com a API financeira da Winker.
          </p>
        </div>

        <Link href="/" className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all">
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card Método 1: Intranet Winker */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Método 1: Acesso via Portal Web (Intranet)
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium">
              Gera um redirecionamento direto para o link de visualização do boleto hospedado na intranet do Winker.
            </p>

            <div className="space-y-4">
              <div>
                <label className={lbl}>Mês de Referência (dataRefRateio)</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="AAAAMM" 
                    className={inp} 
                    value={dataRefRateio} 
                    onChange={e => setDataRefRateio(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>ID da Unidade (idUnidade)</label>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="ID" 
                    className={inp} 
                    value={idUnidade} 
                    onChange={e => setIdUnidade(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>ID da Divisão (idDivisao)</label>
                <div className="relative">
                  <Info className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="ID" 
                    className={inp} 
                    value={idDivisao} 
                    onChange={e => setIdDivisao(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2.5 text-[10px] text-blue-800 font-semibold leading-relaxed">
              <Info className="text-blue-600 shrink-0 mt-0.5" size={14} />
              <span>
                <strong>Importante:</strong> Para que este método funcione, o seu navegador deve possuir uma sessão de login ativa no site da Winker.
              </span>
            </div>
            
            <button 
              onClick={handleOpenIntranet}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-100"
            >
              <ExternalLink size={14} /> Abrir Boleto no Winker
            </button>
          </div>
        </div>

        {/* Card Método 2: API de Backend (Proxy) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Método 2: Download Direto via API de Backend
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium">
              Efetua o login automático nas APIs da Winker utilizando as credenciais administrativas configuradas no servidor, trazendo o PDF de forma transparente.
            </p>

            <form onSubmit={handleDownloadApi} className="space-y-4">
              <div>
                <label className={lbl}>ID do Boleto (id_boleto)</label>
                <div className="relative">
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: 1" 
                    className={inp} 
                    value={idBoleto} 
                    onChange={e => setIdBoleto(e.target.value)} 
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2.5 text-[10px] text-emerald-800 font-semibold leading-relaxed">
              <Key className="text-emerald-600 shrink-0 mt-0.5" size={14} />
              <span>
                <strong>Automação Completa:</strong> Não há necessidade de estar logado no navegador. O servidor resolve o token e consome o endpoint `billing/{id}/download`.
              </span>
            </div>

            <button 
              type="submit"
              disabled={downloading || !idBoleto.trim()}
              onClick={handleDownloadApi}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              <Download size={14} /> {downloading ? 'Baixando...' : 'Baixar PDF do Boleto'}
            </button>
          </div>
        </div>

      </div>

      {/* Footer Version */}
      <div className="mt-16 text-center pb-12">
        <span className="text-[9px] uppercase tracking-[0.2em] font-black px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-50">
          ESTAÇÃO DO MAR • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
