'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Package as PackageIcon, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  User, 
  Building, 
  Truck, 
  Info,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  X,
  FileDown,
  Send
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import * as XLSX from 'xlsx';

type Unit = { id: string; number: string; block: string };
type Resident = { id: string; name: string; cpf: string; email?: string; unitId?: string; telegramChatId?: string };
type Package = {
  id: string;
  number: number;
  unitId: string;
  unit: Unit;
  residentId: string;
  resident: Resident;
  type: string;
  size?: string;
  carrier?: string;
  observations?: string;
  conciergeName: string;
  receivedAt: string;
  status: string;
  withdrawnAt?: string;
  withdrawnBy?: string;
  withdrawnConciergeName?: string;
};

const MONTHS = [
  { val: '1', name: 'Janeiro' }, { val: '2', name: 'Fevereiro' }, { val: '3', name: 'Março' },
  { val: '4', name: 'Abril' }, { val: '5', name: 'Maio' }, { val: '6', name: 'Junho' },
  { val: '7', name: 'Julho' }, { val: '8', name: 'Agosto' }, { val: '9', name: 'Setembro' },
  { val: '10', name: 'Outubro' }, { val: '11', name: 'Novembro' }, { val: '12', name: 'Dezembro' }
];

export default function EncomendasPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [concierges, setConcierges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifiedPackages, setNotifiedPackages] = useState<Set<string>>(new Set());
  const [notifyingPackage, setNotifyingPackage] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('RECEBIDO PORTARIA');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [packageNumberInput, setPackageNumberInput] = useState('');
  const [filterPackageNumber, setFilterPackageNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [formData, setFormData] = useState({
    unitId: '',
    residentId: '',
    type: 'Pacote',
    size: 'média',
    carrier: '',
    observations: '',
    conciergeName: ''
  });

  const [withdrawData, setWithdrawData] = useState({
    withdrawnBy: '',
    withdrawnConciergeName: ''
  });

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/encomendas?unitId=${filterUnit}&status=${filterStatus}&month=${filterMonth}&year=${filterYear}&packageNumber=${filterPackageNumber}`);
      const data = await res.json();
      if (Array.isArray(data)) setPackages(data);
    } catch (error) {
      console.error('Erro ao buscar encomendas:', error);
    } finally {
      setLoading(false);
    }
  }, [filterUnit, filterStatus, filterMonth, filterYear, filterPackageNumber]);

  useEffect(() => {
    fetchPackages();
    fetch('/api/unidades')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => 
            a.number.localeCompare(b.number, undefined, { numeric: true })
          );
          setUnits(sorted);
        }
      });
    fetch('/api/moradores?active=true').then(res => res.json()).then(data => {
      setResidents(data);
    });
    fetch('/api/colaboradores').then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        const sortedStaff = data
          .map((e: any) => e.name.toUpperCase())
          .sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'));
        setConcierges(sortedStaff);
      }
    });
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, [fetchPackages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/encomendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ unitId: '', residentId: '', type: 'Pacote', size: 'média', carrier: '', observations: '', conciergeName: '' });
        fetchPackages();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar encomenda:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/encomendas/${selectedPackage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawData)
      });
      if (res.ok) {
        setIsWithdrawModalOpen(false);
        setWithdrawData({ withdrawnBy: '', withdrawnConciergeName: '' });
        setSelectedPackage(null);
        fetchPackages();
      }
    } catch (error) {
      console.error('Erro ao registrar baixa:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filtered.map(p => ({
      'Nº Mercadoria': `#${p.number}`,
      Unidade: `${p.unit.number}-${p.unit.block}`,
      Morador: p.resident.name,
      Tipo: p.type,
      Tamanho: p.size,
      'Transportadora/Remetente': p.carrier || '',
      Porteiro: p.conciergeName,
      'Data Recebimento': new Date(p.receivedAt).toLocaleString('pt-BR'),
      Status: p.status,
      'Retirado Por': p.withdrawnBy || '',
      'Porteiro Retirada': p.withdrawnConciergeName || '',
      'Data Retirada': p.withdrawnAt ? new Date(p.withdrawnAt).toLocaleString('pt-BR') : '',
      Observações: p.observations || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Encomendas");
    XLSX.writeFile(wb, `Relatorio_Encomendas_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filtered = packages.filter(p => {
    if (currentUser?.role === 'MORADOR' && p.unitId !== currentUser.unitId) return false;
    const s = searchTerm.toLowerCase();
    return (
      p.resident.name.toLowerCase().includes(s) ||
      p.unit.number.toLowerCase().includes(s) ||
      p.carrier?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isStaff = currentUser?.role === 'SINDICO' || currentUser?.role === 'PORTEIRO' || currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SINDICO';

  const handleTelegramNotify = async (pkg: Package) => {
    setNotifyingPackage(pkg.id);
    try {
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id })
      });
      if (res.ok) {
        setNotifiedPackages(prev => new Set(prev).add(pkg.id));
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar notificação.');
    } finally {
      setNotifyingPackage(null);
    }
  };

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <PackageIcon className="text-blue-600" size={32} /> 
            Recebimento de Mercadorias
          </h1>
          <p className="text-slate-500 font-medium">Controle de encomendas e correspondências do condomínio.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {isAdmin && (
            <button 
              onClick={exportToExcel}
              className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-emerald-100 active:scale-95"
            >
              <FileDown size={20} /> Exportar Excel
            </button>
          )}
          {isStaff && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus size={20} /> Nova Encomenda
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por morador, AP ou transportadora..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Busca por Número de Mercadoria */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setFilterPackageNumber(packageNumberInput);
              setCurrentPage(1);
            }}
            className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 min-w-[200px]"
          >
            <input 
              type="number"
              placeholder="Nº Mercadoria..."
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 w-28 pl-3 focus:outline-none"
              value={packageNumberInput}
              onChange={(e) => setPackageNumberInput(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
            >
              Consultar
            </button>
            {filterPackageNumber && (
              <button 
                type="button"
                onClick={() => {
                  setPackageNumberInput('');
                  setFilterPackageNumber('');
                  setCurrentPage(1);
                }}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Limpar filtro de número"
              >
                <X size={16} />
              </button>
            )}
          </form>

          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <Filter size={16} className="text-slate-400 ml-2" />
            <select 
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 pr-8"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="TODOS">TODOS STATUS</option>
              <option value="RECEBIDO PORTARIA">RECEBIDOS</option>
              <option value="RETIRADO">RETIRADOS</option>
            </select>
          </div>

          {isStaff && (
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <Building size={16} className="text-slate-400 ml-2" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 pr-8"
                value={filterUnit}
                onChange={(e) => { setFilterUnit(e.target.value); setCurrentPage(1); }}
              >
                <option value="">TODAS UNIDADES</option>
                {units.map(u => <option key={u.id} value={u.id}>AP {u.number} - {u.block}</option>)}
              </select>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-50">
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <Calendar size={16} className="text-slate-400 ml-2" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 pr-8"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
              >
                <option value="">TODOS OS MESES</option>
                {MONTHS.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <Calendar size={16} className="text-slate-400 ml-2" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 pr-8"
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
              >
                {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Encomendas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Clock className="animate-spin" size={40} />
          <p className="font-medium">Carregando encomendas...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center">
          <PackageIcon size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium text-lg">Nenhuma encomenda encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((p) => (
            <div 
              key={p.id} 
              onClick={() => { setSelectedPackage(p); setIsViewModalOpen(true); }}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {p.status === 'RETIRADO' && (
                <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 size={12} /> Retirado
                </div>
              )}
              {p.status === 'RECEBIDO PORTARIA' && (
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  <Clock size={12} /> Pendente
                </div>
              )}

              <div className="mb-6">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-sm font-black text-blue-600 uppercase tracking-wider block">AP {p.unit.number} • {p.unit.block}</span>
                  <span className="bg-blue-50 text-blue-700 font-black px-2.5 py-0.5 rounded-lg text-xs border border-blue-100">
                    Nº #{p.number}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{p.resident.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">{p.type}</span>
                  <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">{p.size}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50 flex-grow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Transportadora / Remetente</p>
                    <p className="text-xs font-bold text-slate-700">{p.carrier || 'Não informada'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Data de Recebimento</p>
                    <p className="text-xs font-bold text-slate-700">{new Date(p.receivedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Registrado por (Porteiro)</p>
                    <p className="text-xs font-bold text-slate-700">{p.conciergeName}</p>
                  </div>
                </div>

                {p.status === 'RETIRADO' && p.withdrawnConciergeName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Retirada Registrada por (Porteiro)</p>
                      <p className="text-xs font-bold text-slate-700">{p.withdrawnConciergeName}</p>
                    </div>
                  </div>
                )}

                {p.status === 'RETIRADO' && (
                  <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <LogOut size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter leading-none mb-1">Retirado por {p.withdrawnBy}</p>
                      {p.withdrawnConciergeName && (
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">Entregue por: {p.withdrawnConciergeName}</p>
                      )}
                      <p className="text-[9px] font-bold text-emerald-500 leading-none">{new Date(p.withdrawnAt!).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                )}
              </div>

              {isStaff && p.status === 'RECEBIDO PORTARIA' && (
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedPackage(p); setIsWithdrawModalOpen(true); }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} /> Dar Baixa
                  </button>
                  {p.resident.telegramChatId && (
                    notifiedPackages.has(p.id) ? (
                      <span className="py-3 px-4 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100">
                        <CheckCircle2 size={14} /> Notificado ✅
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTelegramNotify(p); }}
                        disabled={notifyingPackage === p.id}
                        className="py-3 px-4 bg-[#0088cc] hover:bg-[#006da3] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Send size={14} /> {notifyingPackage === p.id ? '...' : 'Telegram'}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm border border-slate-100"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                  currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border border-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm border border-slate-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Version Badge */}
      <div className="mt-12 text-center pb-8">
        <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>

      {/* Modal Nova Encomenda */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Plus className="text-blue-600" /> Registrar Entrada
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unidade</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value, residentId: '' })}
                  >
                    <option value="">Selecionar AP</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Morador</label>
                  <select 
                    required
                    disabled={!formData.unitId}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 disabled:opacity-50"
                    value={formData.residentId}
                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                  >
                    <option value="">Selecionar Morador</option>
                    {residents.filter(r => r.unitId === formData.unitId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  {formData.residentId && (
                    <div className="mt-2 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 animate-in slide-in-from-top-1 duration-200">
                      <Info size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        E-mail: {residents.find(r => r.id === formData.residentId)?.email || 'Não cadastrado'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Volume</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Caixa">Caixa</option>
                    <option value="Envelope">Envelope</option>
                    <option value="Pacote">Pacote</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tamanho</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  >
                    <option value="pequena">Pequena</option>
                    <option value="média">Média</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transportadora / Remetente</label>
                <input 
                  type="text"
                  placeholder="Ex: Mercado Livre, Correios, Amazon..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold uppercase"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Porteiro</label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 uppercase"
                  value={formData.conciergeName}
                  onChange={(e) => setFormData({ ...formData, conciergeName: e.target.value })}
                >
                  <option value="">Selecionar Porteiro</option>
                  {concierges.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Observações</label>
                <textarea 
                  rows={3}
                  placeholder="Alguma observação importante sobre o volume?"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm uppercase"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button disabled={saving} type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
                  {saving ? 'Gravando...' : 'Registrar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dar Baixa */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <LogOut className="text-emerald-600" /> Registrar Retirada
            </h2>
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quem retirou a mercadoria?</label>
                <input 
                  required autoFocus
                  type="text"
                  placeholder="Nome do morador ou preposto..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold uppercase"
                  value={withdrawData.withdrawnBy}
                  onChange={(e) => setWithdrawData({ ...withdrawData, withdrawnBy: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Porteiro</label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700 uppercase"
                  value={withdrawData.withdrawnConciergeName}
                  onChange={(e) => setWithdrawData({ ...withdrawData, withdrawnConciergeName: e.target.value })}
                >
                  <option value="">Selecionar Porteiro</option>
                  {concierges.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-2 uppercase tracking-tighter italic">* Ao gravar, o status passará para RETIRADO e o horário será registrado.</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => { setIsWithdrawModalOpen(false); setSelectedPackage(null); setWithdrawData({ withdrawnBy: '', withdrawnConciergeName: '' }); }} className="px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button disabled={saving} type="submit" className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
                  {saving ? 'Gravando...' : 'Confirmar Retirada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar Encomenda (Apenas Consulta) */}
      {isViewModalOpen && selectedPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <PackageIcon className="text-blue-600 animate-pulse" size={28} />
                Detalhes da Entrega
              </h2>
              <button 
                onClick={() => { setIsViewModalOpen(false); setSelectedPackage(null); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header com Unidade, Morador e Status */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest block">
                      AP {selectedPackage.unit.number} • {selectedPackage.unit.block}
                    </span>
                    <span className="bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded-md text-[10px] border border-blue-100">
                      Nº #{selectedPackage.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">
                    {selectedPackage.resident.name}
                  </h3>
                  {selectedPackage.resident.email && (
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedPackage.resident.email}
                    </span>
                  )}
                </div>
                <div>
                  {selectedPackage.status === 'RETIRADO' ? (
                    <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-200">
                      <CheckCircle2 size={14} /> Retirado
                    </div>
                  ) : (
                    <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-amber-200 animate-pulse">
                      <Clock size={14} /> Pendente
                    </div>
                  )}
                </div>
              </div>

              {/* Grid de Informações de Entrada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Transportadora / Remetente</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPackage.carrier || 'Não informada'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                    <PackageIcon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tipo & Tamanho</p>
                    <p className="text-sm font-bold text-slate-800 capitalize">
                      {selectedPackage.type} • <span className="lowercase">{selectedPackage.size || 'médio'}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Recebido em</p>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(selectedPackage.receivedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Recebido por (Porteiro)</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPackage.conciergeName}</p>
                  </div>
                </div>
              </div>

              {/* Informações de Retirada (se retirado) */}
              {selectedPackage.status === 'RETIRADO' && (
                <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50 space-y-4">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <LogOut size={14} /> Dados da Retirada
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Retirado por</p>
                      <p className="text-sm font-black text-emerald-700">{selectedPackage.withdrawnBy}</p>
                    </div>
                    {selectedPackage.withdrawnConciergeName && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Entregue por (Porteiro)</p>
                        <p className="text-sm font-bold text-slate-800">{selectedPackage.withdrawnConciergeName}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Data da Retirada</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedPackage.withdrawnAt ? new Date(selectedPackage.withdrawnAt).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Info size={14} className="text-blue-500" /> Observações
                </p>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed uppercase whitespace-pre-wrap">
                  {selectedPackage.observations || 'NENHUMA OBSERVAÇÃO REGISTRADA.'}
                </p>
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => { setIsViewModalOpen(false); setSelectedPackage(null); }} 
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all text-sm active:scale-95"
              >
                Fechar
              </button>
              {isStaff && selectedPackage.status === 'RECEBIDO PORTARIA' && (
                <>
                  {selectedPackage.resident.telegramChatId && !notifiedPackages.has(selectedPackage.id) && (
                    <button 
                      type="button"
                      onClick={() => handleTelegramNotify(selectedPackage)}
                      disabled={notifyingPackage === selectedPackage.id}
                      className="px-8 py-4 bg-[#0088cc] hover:bg-[#006da3] text-white rounded-2xl font-bold transition-all text-sm shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Send size={16} /> {notifyingPackage === selectedPackage.id ? 'Enviando...' : 'Notificar Telegram'}
                    </button>
                  )}
                  {notifiedPackages.has(selectedPackage.id) && (
                    <span className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm flex items-center gap-2 border border-emerald-100">
                      <CheckCircle2 size={16} /> Notificado ✅
                    </span>
                  )}
                  <button 
                    type="button"
                    onClick={() => { 
                      setIsViewModalOpen(false); 
                      setIsWithdrawModalOpen(true); 
                    }} 
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all text-sm shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95"
                  >
                    <LogOut size={16} /> Dar Baixa / Retirada
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
