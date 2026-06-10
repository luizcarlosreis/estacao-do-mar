'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  LayoutDashboard, 
  ChevronRight, 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Award,
  Loader2
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

type MonthlyTotal = {
  month: number;
  total: number;
};

const monthsLabels = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const monthsFullLabels = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

export default function CartaoCreditoDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // States
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyTotal[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const yearsList = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  useEffect(() => {
    setMounted(true);
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data || !data.user || data.user.role !== 'SUPER_ADMIN') {
          router.push('/');
        } else {
          setCurrentUser(data.user);
          setLoadingAuth(false);
        }
      })
      .catch(() => {
        router.push('/');
      });
  }, [router]);

  useEffect(() => {
    if (!loadingAuth && currentUser) {
      fetchDashboardData();
    }
  }, [selectedYear, loadingAuth, currentUser]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/cartao-credito/dashboard?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalYear = monthlyData.reduce((acc, curr) => acc + curr.total, 0);
  const averageMonth = totalYear / 12;
  
  // Find highest month
  let maxMonthIndex = 0;
  let maxValue = 0;
  monthlyData.forEach((item, idx) => {
    if (item.total > maxValue) {
      maxValue = item.total;
      maxMonthIndex = idx;
    }
  });

  const maxMonthName = totalYear > 0 ? monthsFullLabels[maxMonthIndex] : 'NENHUM';

  if (!mounted || loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-violet-600" size={32} />
        <span className="ml-2 font-bold text-slate-500">Verificando autorização...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-600/10">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                Dashboard Anual do Cartão
              </h1>
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                <LayoutDashboard size={10} /> Painel Administrativo <ChevronRight size={10} /> Cartão de Crédito <ChevronRight size={10} /> Dashboard
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-3 font-medium">
            Visão anual consolidada e distribuição mensal das despesas do cartão de crédito corporativo.
          </p>
        </div>

        <Link
          href="/cartao-credito"
          className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-[0.98]"
        >
          <ArrowLeft size={16} /> Voltar para Faturas
        </Link>
      </div>

      {/* Selectors and KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ano de Análise</label>
          <select
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          >
            {yearsList.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Acumulado</span>
            <p className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{formatCurrency(totalYear)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Média Mensal</span>
            <p className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{formatCurrency(averageMonth)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pico de Gastos</span>
            <p className="text-sm font-black text-slate-800 truncate tracking-tight mt-0.5" title={maxMonthName}>
              {maxMonthName}
            </p>
            {maxValue > 0 && (
              <span className="text-[9px] text-rose-500 font-bold block">{formatCurrency(maxValue)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      {loadingData ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-24 text-center flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-violet-600 mb-2" size={24} />
          <span className="text-slate-500 font-bold">Carregando estatísticas...</span>
        </div>
      ) : totalYear === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-24 text-center">
          <AlertCircle size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Nenhum gasto registrado em {selectedYear}.</p>
          <p className="text-slate-400 text-xs mt-1">Lançamentos de cartão criados na tela de faturas serão exibidos aqui.</p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-8 flex items-center gap-1.5">
            <Activity size={14} className="text-violet-600" /> Comparativo Mensal ({selectedYear})
          </h2>

          {/* Graphical Bars */}
          <div className="space-y-5">
            {monthlyData.map((item, idx) => {
              const percentage = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
              return (
                <div key={item.month} className="flex items-center gap-4 group">
                  <div className="w-12 text-xs font-bold text-slate-400 text-right uppercase tracking-wider">
                    {monthsLabels[idx]}
                  </div>
                  
                  <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center relative">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-r-md transition-all duration-1000 group-hover:opacity-90"
                      style={{ width: `${Math.max(percentage, 1)}%` }}
                    />
                    {item.total > 0 && (
                      <span className="absolute left-3 text-[10px] font-black text-slate-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm">
                        {formatCurrency(item.total)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Version */}
      <div className="mt-16 text-center pb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[8px] font-black text-slate-500 uppercase tracking-widest">
          SISTEMA {APP_VERSION}
        </span>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
