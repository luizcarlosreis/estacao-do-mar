'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  LayoutDashboard, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

type Installment = {
  id: string;
  month: number;
  year: number;
  installmentNumber: number;
  value: number;
  purchase: {
    id: string;
    date: string;
    provider: string;
    description: string;
    totalValue: number;
    isFinanced: boolean;
    installmentsCount: number;
  };
};

const monthsList = [
  { value: 1, label: 'JANEIRO' },
  { value: 2, label: 'FEVEREIRO' },
  { value: 3, label: 'MARÇO' },
  { value: 4, label: 'ABRIL' },
  { value: 5, label: 'MAIO' },
  { value: 6, label: 'JUNHO' },
  { value: 7, label: 'JULHO' },
  { value: 8, label: 'AGOSTO' },
  { value: 9, label: 'SETEMBRO' },
  { value: 10, label: 'OUTUBRO' },
  { value: 11, label: 'NOVEMBRO' },
  { value: 12, label: 'DEZEMBRO' }
];

export default function CartaoCreditoPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Filter states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: now.toISOString().split('T')[0],
    provider: '',
    description: '',
    totalValue: '',
    isFinanced: false,
    installmentsCount: '2'
  });

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
      fetchInstallments();
    }
  }, [selectedMonth, selectedYear, loadingAuth, currentUser]);

  const fetchInstallments = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/cartao-credito?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setInstallments(data);
      }
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      date: now.toISOString().split('T')[0],
      provider: '',
      description: '',
      totalValue: '',
      isFinanced: false,
      installmentsCount: '2'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/cartao-credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          provider: formData.provider.toUpperCase(),
          description: formData.description.toUpperCase(),
          totalValue: parseFloat(formData.totalValue),
          isFinanced: formData.isFinanced,
          installmentsCount: parseInt(formData.installmentsCount, 10),
          startMonth: selectedMonth,
          startYear: selectedYear
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchInstallments();
        alert('Gasto registrado com sucesso!');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      alert('Erro ao processar requisição.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purchaseId: string, description: string) => {
    if (!confirm(`Tem certeza de que deseja excluir a compra "${description}"?\nEsta ação excluirá todas as parcelas associadas a esta compra.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/cartao-credito/${purchaseId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchInstallments();
        alert('Compra excluída com sucesso!');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir compra:', error);
      alert('Erro ao excluir compra.');
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const totalInvoice = installments.reduce((acc, curr) => acc + curr.value, 0);

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
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                Cartão de Crédito
              </h1>
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                <LayoutDashboard size={10} /> Painel Administrativo <ChevronRight size={10} /> Gastos do Cartão
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-3 font-medium">
            Registro e controle mensal das despesas do cartão de crédito corporativo do condomínio.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/cartao-credito/dashboard"
            className="flex items-center gap-2 px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl transition"
          >
            <TrendingUp size={16} /> Ver Dashboard Anual
          </Link>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-3.5 bg-violet-600 hover:bg-violet-750 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-violet-600/10 hover:shadow-xl hover:shadow-violet-600/20 active:scale-[0.98]"
          >
            <Plus size={16} /> Lançar Compra
          </button>
        </div>
      </div>

      {/* Selectors and KPI Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-1/2">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mês de Referência</label>
            <select
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            >
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-1/2">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ano</label>
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
        </div>

        <div className="bg-violet-600 p-5 rounded-3xl text-white shadow-xl shadow-violet-600/20 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-center z-10">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total da Fatura</span>
            <DollarSign size={18} className="opacity-80" />
          </div>
          <div className="mt-4 z-10">
            <p className="text-2xl font-black tracking-tight">{formatCurrency(totalInvoice)}</p>
            <p className="text-[9px] uppercase tracking-wider opacity-60 mt-1">
              {monthsList.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </div>
        </div>
      </div>

      {/* List / Table */}
      {loadingData ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-16 text-center flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-violet-600 mb-2" size={24} />
          <span className="text-slate-500 font-bold">Carregando faturas...</span>
        </div>
      ) : installments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-16 text-center flex flex-col items-center justify-center">
          <AlertCircle size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-bold">Nenhum gasto lançado para este mês.</p>
          <p className="text-slate-400 text-xs mt-1">Utilize o botão "Lançar Compra" acima para registrar despesas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Data Compra</th>
                  <th className="py-4 px-6">Fornecedor / Prestador</th>
                  <th className="py-4 px-6">Descrição</th>
                  <th className="py-4 px-6 text-center">Tipo</th>
                  <th className="py-4 px-6 text-center">Parcela</th>
                  <th className="py-4 px-6 text-right">Valor Parcela</th>
                  <th className="py-4 px-6 text-right">Valor Total Compra</th>
                  <th className="py-4 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {installments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">{formatDate(item.purchase.date)}</td>
                    <td className="py-4 px-6 font-bold text-slate-800 uppercase">{item.purchase.provider}</td>
                    <td className="py-4 px-6 uppercase">{item.purchase.description}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                        item.purchase.isFinanced 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {item.purchase.isFinanced ? 'Financiada' : 'À Vista'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-500">
                      {item.purchase.isFinanced ? `${item.installmentNumber} / ${item.purchase.installmentsCount}` : '1 / 1'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">{formatCurrency(item.value)}</td>
                    <td className="py-4 px-6 text-right text-slate-400">{formatCurrency(item.purchase.totalValue)}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDelete(item.purchase.id, item.purchase.description)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir Compra"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Total da Fatura</span>
            <span className="text-xl font-black text-violet-700">{formatCurrency(totalInvoice)}</span>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Compra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={16} /> Lançar Compra no Cartão
                </h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Registre um gasto para a fatura de {monthsList.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data da Compra</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800"
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fornecedor / Prestador</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="EX: SABESP / PRESTADOR SERVIÇOS"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 uppercase"
                    value={formData.provider} 
                    onChange={(e) => setFormData({...formData, provider: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descrição da Compra</label>
                <input 
                  type="text" 
                  required 
                  placeholder="EX: COMPRA DE TAMPA DE INSPEÇÃO DE FERRO"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 uppercase"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Valor Total da Compra (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    placeholder="0.00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800"
                    value={formData.totalValue} 
                    onChange={(e) => setFormData({...formData, totalValue: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Forma de Pagamento</label>
                  <select 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none"
                    value={formData.isFinanced ? 'true' : 'false'} 
                    onChange={(e) => setFormData({...formData, isFinanced: e.target.value === 'true'})}
                  >
                    <option value="false">À vista (1x)</option>
                    <option value="true">Financiada / Parcelada</option>
                  </select>
                </div>
              </div>

              {formData.isFinanced && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Número de Prestações (Parcelas)</label>
                  <input 
                    type="number" 
                    required 
                    min="2"
                    max="60"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800"
                    value={formData.installmentsCount} 
                    onChange={(e) => setFormData({...formData, installmentsCount: e.target.value})} 
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    * O valor será dividido em {formData.installmentsCount} parcelas de {formData.totalValue && !isNaN(parseFloat(formData.totalValue)) ? formatCurrency(parseFloat(formData.totalValue) / parseInt(formData.installmentsCount || '1', 10)) : 'R$ 0,00'} a partir de {monthsList.find(m => m.value === selectedMonth)?.label} {selectedYear}.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-[11px] font-black uppercase text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-violet-600/10 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Gravando...' : 'Lançar Compra'}
                </button>
              </div>
            </form>
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

// X Close Icon helper component
function X(props: any) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
