'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Building, 
  Calendar, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Info,
  Download,
  Phone,
  User,
  ShieldCheck,
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  BarChart3,
  Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_VERSION } from '@/lib/version';

type Unit = { id: string; number: string; block: string };
type BallroomGuest = { id: string; reservationId: string; name: string; cpf?: string };
type Reservation = {
  id: string;
  unitId: string;
  unit?: Unit;
  name: string;
  cpf: string;
  rg: string;
  ddd: string;
  phone: string;
  date: string;
  notes: string;
  adminNotes: string;
  status: 'SOLICITADO' | 'EFETIVADO' | 'CANCELADO';
  requesterCpf: string;
  guests?: BallroomGuest[];
  keyPickupTime?: string;
};

const emptyForm = {
  id: '', unitId: '', name: '', rg: '', cpf: '', ddd: '', phone: '',
  date: '', notes: '', adminNotes: '', status: 'SOLICITADO' as Reservation['status'],
  keyPickupTime: ''
};

const statusStyle = {
  SOLICITADO: 'bg-amber-100 text-amber-700 border-amber-200',
  EFETIVADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-rose-100 text-rose-600 border-rose-200',
};

const statusIcon = {
  SOLICITADO: <Clock size={14} />,
  EFETIVADO: <CheckCircle2 size={14} />,
  CANCELADO: <XCircle size={14} />,
};

function formatDate(d: string) {
  if (!d) return '—';
  const datePart = d.split('T')[0];
  const [y, m, day] = datePart.split('-');
  return `${day}/${m}/${y}`;
}

export default function ReservasPage() {
  const [list, setList] = useState<Reservation[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [filterName, setFilterName] = useState('');
  const [filterDateMode, setFilterDateMode] = useState<'todas' | 'futuras'>('futuras');
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  // Datas bloqueadas (acessível a todos os perfis)
  const [blockedDates, setBlockedDates] = useState<{ id: string; date: string; status: string; reason?: string; type?: string }[]>([]);
  // Admin Block Dates modal states
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDateInput, setBlockDateInput] = useState('');
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);
  // Dashboard Admin states
  const [dashYear, setDashYear] = useState<number>(new Date().getFullYear());
  const [dashMonth, setDashMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [isDashModalOpen, setIsDashModalOpen] = useState(false);
  // Guest list modal
  const [guestModalReservation, setGuestModalReservation] = useState<Reservation | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestCpf, setGuestCpf] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestCpf, setEditGuestCpf] = useState('');
  const [savingEditGuest, setSavingEditGuest] = useState(false);

  useEffect(() => { 
    setMounted(true);
    fetchList();
    fetchBlockedDates();
    fetchUnidades(); 
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

  const fetchBlockedDates = async () => {
    try {
      const res = await fetch('/api/reservas/datas-bloqueadas');
      if (res.ok) setBlockedDates(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchList = async () => {
    try {
      const res = await fetch('/api/reservas');
      if (res.ok) setList(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch('/api/unidades');
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => 
          a.number.localeCompare(b.number, undefined, { numeric: true })
        );
        setUnidades(sorted);
      }
    } catch (e) { console.error(e); }
  };

  const isDateBlocked = (dateStr: string, excludeId?: string) => {
    if (!dateStr) return false;
    const target = dateStr.split('T')[0];
    const isReserved = list.some(r => 
      r.id !== excludeId && 
      r.date.split('T')[0] === target && 
      r.status !== 'CANCELADO'
    );
    const isBlocked = blockedDates.some(b => 
      b.id !== excludeId && 
      b.date.split('T')[0] === target
    );
    return isReserved || isBlocked;
  };

  const getBlockInfo = (dateStr: string) => {
    if (!dateStr) return null;
    const target = dateStr.split('T')[0];
    return blockedDates.find(b => b.date.split('T')[0] === target && b.type === 'BLOQUEIO_ADMIN');
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDateInput) return;
    setSavingBlock(true);
    try {
      const res = await fetch('/api/reservas/bloqueios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: blockDateInput, reason: blockReasonInput }),
      });
      if (res.ok) {
        setBlockDateInput('');
        setBlockReasonInput('');
        fetchBlockedDates();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao bloquear data.');
    } finally {
      setSavingBlock(false);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    if (!confirm('Desbloquear esta data?')) return;
    try {
      const res = await fetch(`/api/reservas/bloqueios?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBlockedDates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const blockInfo = getBlockInfo(formData.date);
    if (blockInfo) {
      alert(`Esta data está indisponível para reserva pela administração (${blockInfo.reason || 'Bloqueio Administrativo'}). Por favor, escolha outra data.`);
      return;
    }

    if (isDateBlocked(formData.date, formData.id)) {
      alert('Esta data já possui uma reserva ativa ou solicitada. Por favor, escolha outra data.');
      return;
    }

    setSaving(true);
    try {
      const { id, ...data } = formData;
      const url = isEditMode ? `/api/reservas/${id}` : '/api/reservas';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const savedData = await res.json();
        setIsModalOpen(false);
        fetchList();

        // Enviar e-mail apenas na criação ou mudança para EFETIVADO? 
        // O usuário disse: "Quando efetivar a gravação, utilizar o mesmo recurso de envio de e-mail"
        // Vou disparar na criação.
        if (!isEditMode) {
          try {
            const doc = createReservationPDF(savedData, currentUser?.email);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            
            await fetch('/api/send-authorization-email', { // Reutilizando a mesma rota para luiz.carlos.reis@gmail.com
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pdfBase64,
                authorizationName: `RESERVA_${savedData.name}`,
                unitInfo: `${savedData.unit?.number} - ${savedData.unit?.block}`
              })
            });
          } catch (err) {
            console.error('Erro ao enviar e-mail:', err);
          }
        }
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir reserva de "${name}"?`)) return;
    await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
    fetchList();
  };

  const openGuestModal = (r: Reservation) => {
    setGuestModalReservation(r);
    setGuestName('');
    setGuestCpf('');
    setGuestSearch('');
    setEditingGuestId(null);
    setEditGuestName('');
    setEditGuestCpf('');
  };

  const handleAddGuest = async () => {
    if (!guestName.trim() || !guestModalReservation) return;
    setSavingGuest(true);
    try {
      const res = await fetch(`/api/reservas/${guestModalReservation.id}/convidados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, cpf: guestCpf }),
      });
      if (res.ok) {
        const newGuest: BallroomGuest = await res.json();
        setGuestModalReservation(prev =>
          prev ? { ...prev, guests: [...(prev.guests || []), newGuest].sort((a, b) => a.name.localeCompare(b.name)) } : prev
        );
        setList(prev => prev.map(r =>
          r.id === guestModalReservation.id
            ? { ...r, guests: [...(r.guests || []), newGuest].sort((a, b) => a.name.localeCompare(b.name)) }
            : r
        ));
        setGuestName('');
        setGuestCpf('');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } finally { setSavingGuest(false); }
  };

  const startEditGuest = (g: BallroomGuest) => {
    setEditingGuestId(g.id);
    setEditGuestName(g.name);
    setEditGuestCpf(g.cpf || '');
  };

  const cancelEditGuest = () => {
    setEditingGuestId(null);
    setEditGuestName('');
    setEditGuestCpf('');
  };

  const handleUpdateGuest = async (guestId: string) => {
    if (!editGuestName.trim() || !guestModalReservation) return;
    setSavingEditGuest(true);
    try {
      const res = await fetch(`/api/reservas/${guestModalReservation.id}/convidados`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, name: editGuestName, cpf: editGuestCpf }),
      });
      if (res.ok) {
        const updated: BallroomGuest = await res.json();
        setGuestModalReservation(prev =>
          prev
            ? {
                ...prev,
                guests: (prev.guests || [])
                  .map(g => (g.id === guestId ? updated : g))
                  .sort((a, b) => a.name.localeCompare(b.name)),
              }
            : prev
        );
        setList(prev =>
          prev.map(r =>
            r.id === guestModalReservation.id
              ? {
                  ...r,
                  guests: (r.guests || [])
                    .map(g => (g.id === guestId ? updated : g))
                    .sort((a, b) => a.name.localeCompare(b.name)),
                }
              : r
          )
        );
        setEditingGuestId(null);
        setEditGuestName('');
        setEditGuestCpf('');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (e: any) {
      console.error(e);
      alert('Erro ao alterar convidado.');
    } finally {
      setSavingEditGuest(false);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (!guestModalReservation) return;
    if (!confirm('Remover convidado?')) return;
    const res = await fetch(`/api/reservas/${guestModalReservation.id}/convidados?guestId=${guestId}`, { method: 'DELETE' });
    if (res.ok) {
      setGuestModalReservation(prev =>
        prev ? { ...prev, guests: (prev.guests || []).filter(g => g.id !== guestId) } : prev
      );
      setList(prev => prev.map(r =>
        r.id === guestModalReservation.id
          ? { ...r, guests: (r.guests || []).filter(g => g.id !== guestId) }
          : r
      ));
    }
  };


  const openCreate = () => {
    setFormData({ 
      ...emptyForm, 
      unitId: currentUser?.unitId || '',
      name: currentUser?.name?.toUpperCase() || '',
      cpf: currentUser?.cpf || '',
      rg: currentUser?.rg || '',
      ddd: currentUser?.ddd || '',
      phone: currentUser?.phone || '',
      keyPickupTime: ''
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEdit = (r: Reservation) => {
    setFormData({
      id: r.id, unitId: r.unitId, name: r.name, rg: r.rg || '', cpf: r.cpf || '',
      ddd: r.ddd || '', phone: r.phone || '',
      date: r.date.split('T')[0],
      notes: r.notes || '',
      adminNotes: r.adminNotes || '',
      status: r.status,
      keyPickupTime: r.keyPickupTime || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const createReservationPDF = (r: Reservation, requesterEmail?: string) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('ESTAÇÃO DO MAR', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('SOLICITAÇÃO DE RESERVA - SALÃO DE FESTAS', 105, 30, { align: 'center' });
    
    autoTable(doc, {
      startY: 40,
      body: [
        ['Unidade:', `${r.unit?.number} - ${r.unit?.block}`],
        ['Solicitante:', r.name],
        ['CPF:', r.cpf || '—'],
        ['RG:', r.rg || '—'],
        ['Telefone:', r.ddd ? `(${r.ddd}) ${r.phone}` : (r.phone || '—')],
        ['E-mail:', requesterEmail || '—'],
        ['Data Reservada:', formatDate(r.date)],
        ['Retirada da Chave:', r.keyPickupTime ? `${r.keyPickupTime} hs` : '—'],
        ['Status:', r.status],
        ['Observações:', r.notes || '—']
      ],
      theme: 'striped',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    return doc;
  };

  const filtered = list.filter(a => {
    let match = true;
    if (filterName) {
      match = a.name.toLowerCase().includes(filterName.toLowerCase());
    }
    if (match && filterDateMode === 'futuras') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Construct local date ignoring timezones correctly
      const resDate = new Date(a.date.split('T')[0] + 'T00:00:00');
      match = resDate >= today;
    }
    return match;
  });
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SINDICO';
  const isZeladoria = currentUser?.role === 'ZELADORIA';
  const isPorteiro = currentUser?.role === 'PORTEIRO';
  const isReadOnlyReservation = isZeladoria || isPorteiro || currentUser?.role === 'CONSELHO';
  const isReadOnlyGuest = isZeladoria || isPorteiro || currentUser?.role === 'CONSELHO';
  const isMorador = currentUser?.role === 'MORADOR';

  // Dashboard calculations
  const availableYears = (() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    list.forEach(r => {
      if (r.date) {
        try {
          const y = new Date(r.date).getFullYear();
          if (!isNaN(y)) years.add(y);
        } catch (e) {}
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  })();

  const dashFiltered = list.filter(r => {
    if (!r.date) return false;
    const datePart = r.date.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length < 2) return false;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const yearMatches = y === dashYear;
    const monthMatches = dashMonth === 'todos' || m === Number(dashMonth);
    return yearMatches && monthMatches;
  });

  const dashTotal = dashFiltered.length;
  const dashEfetivadas = dashFiltered.filter(r => r.status === 'EFETIVADO').length;
  const dashSolicitadas = dashFiltered.filter(r => r.status === 'SOLICITADO').length;
  const dashCanceladas = dashFiltered.filter(r => r.status === 'CANCELADO').length;

  const revenueRealized = dashEfetivadas * 150;
  const revenuePending = dashSolicitadas * 150;

  const apartmentBookings = (() => {
    const counts: Record<string, { unit: string; count: number }> = {};
    dashFiltered.forEach(r => {
      if (r.status === 'CANCELADO') return;
      const key = r.unitId;
      const unitLabel = r.unit ? `${r.unit.number} - ${r.unit.block}` : '—';
      if (!counts[key]) {
        counts[key] = { unit: unitLabel, count: 0 };
      }
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  })();

  const inp = 'w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white';
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar size={26} className="text-blue-600" /> SALÃO DE FESTAS
          </h1>
          <p className="text-slate-500 text-[11px] uppercase font-bold tracking-widest mt-1">Solicitações de Reserva</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {isAdmin && (
            <>
              <button onClick={() => setIsDashModalOpen(true)}
                className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-900 transition font-black shadow-lg shadow-slate-100 text-xs uppercase tracking-wider">
                <BarChart3 size={18} /> Dashboard
              </button>
              <button onClick={() => setIsBlockModalOpen(true)}
                className="bg-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-rose-700 transition font-black shadow-lg shadow-rose-100 text-xs uppercase tracking-wider">
                <Lock size={18} /> Bloquear Datas
              </button>
            </>
          )}
          {!isReadOnlyReservation && (
            <button onClick={openCreate}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-black shadow-lg shadow-blue-100 text-xs uppercase tracking-wider">
              <Plus size={18} /> Nova Reserva
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Administrativo (Pop-up/Modal) */}
      {isAdmin && isDashModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={18} /> Painel Estatístico / Dashboard
              </h2>
              <button onClick={() => setIsDashModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <BarChart3 size={22} className="text-blue-600" />
                    DASHBOARD DE RESERVAS
                  </h3>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Indicadores e Métricas do Salão de Festas</p>
                </div>
                
                {/* Filtros de Ano e Mês */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Ano</label>
                    <select
                      value={dashYear}
                      onChange={e => setDashYear(Number(e.target.value))}
                      className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white text-slate-700 font-bold"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Mês</label>
                    <select
                      value={dashMonth}
                      onChange={e => setDashMonth(e.target.value)}
                      className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white text-slate-700 font-bold"
                    >
                      <option value="todos">Todos os Meses</option>
                      <option value="1">Janeiro</option>
                      <option value="2">Fevereiro</option>
                      <option value="3">Março</option>
                      <option value="4">Abril</option>
                      <option value="5">Maio</option>
                      <option value="6">Junho</option>
                      <option value="7">Julho</option>
                      <option value="8">Agosto</option>
                      <option value="9">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Indicadores Gerais & Financeiro */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Card Receitas */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-slate-200/50">
                      <DollarSign size={80} />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Arrecadação da Taxa</h3>
                    <div className="space-y-3 relative z-10">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 block uppercase">Realizada (Efetivada)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-slate-400">R$</span>
                          <span className="text-2xl font-black text-emerald-600">
                            {revenueRealized.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{dashEfetivadas} reservas efetivadas</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-amber-600 block uppercase">Prevista (Solicitada)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-slate-400">R$</span>
                          <span className="text-lg font-black text-amber-600">
                            {revenuePending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{dashSolicitadas} reservas pendentes</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Resumo Status */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detalhamento de Reservas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Efetivadas:
                        </span>
                        <span className="font-black text-slate-800">{dashEfetivadas}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          Solicitadas:
                        </span>
                        <span className="font-black text-slate-800">{dashSolicitadas}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          Canceladas:
                        </span>
                        <span className="font-black text-slate-800">{dashCanceladas}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-black text-slate-700 uppercase">Total Geral:</span>
                        <span className="font-black text-blue-600 text-sm">{dashTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reservas por Apartamento */}
                <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade de Reservas por Apartamento</h3>
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">Ativas</span>
                  </div>
                  
                  {apartmentBookings.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">
                      Nenhuma reserva ativa no período selecionado.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {apartmentBookings.map((apt) => {
                        const maxCount = apartmentBookings[0]?.count || 1;
                        const percent = (apt.count / maxCount) * 100;
                        return (
                          <div key={apt.unit} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-slate-700 flex items-center gap-1">
                                <Building size={12} className="text-blue-500" /> App. {apt.unit}
                              </span>
                              <span className="font-black text-slate-800">{apt.count} {apt.count === 1 ? 'reserva' : 'reservas'}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDashModalOpen(false)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition text-[11px] font-black uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bloqueio de Datas (Apenas ADMIN) */}
      {isAdmin && isBlockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-rose-700 text-white flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Lock size={18} /> Cadastrar Datas Impossibilitadas (Bloqueios)
              </h2>
              <button onClick={() => setIsBlockModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form para adicionar bloqueio */}
              <form onSubmit={handleAddBlock} className="p-5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-4">
                <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16} /> Novo Bloqueio de Data
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Data a Bloquear *</label>
                    <input
                      required
                      type="date"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      value={blockDateInput}
                      onChange={e => setBlockDateInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Motivo do Bloqueio</label>
                    <input
                      type="text"
                      placeholder="Ex: Manutenção, Evento, Reforma..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      value={blockReasonInput}
                      onChange={e => setBlockReasonInput(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingBlock || !blockDateInput}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-rose-100"
                  >
                    <Lock size={14} /> {savingBlock ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                  </button>
                </div>
              </form>

              {/* Lista de bloqueios administrativos */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Datas Bloqueadas pela Administração ({blockedDates.filter(b => b.type === 'BLOQUEIO_ADMIN').length})
                </h3>
                {blockedDates.filter(b => b.type === 'BLOQUEIO_ADMIN').length === 0 ? (
                  <p className="text-center text-xs text-slate-400 italic py-6">
                    Nenhuma data bloqueada manualmente pela administração.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {blockedDates.filter(b => b.type === 'BLOQUEIO_ADMIN').map((b, idx) => (
                      <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-400">{idx + 1}.</span>
                          <div>
                            <span className="text-xs font-black text-rose-700 block">{formatDate(b.date)}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{b.reason || 'Bloqueio Administrativo'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBlock(b.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                          title="Remover Bloqueio"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition text-[11px] font-black uppercase"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informativo */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 text-blue-50/50 group-hover:text-blue-50 transition-colors">
          <Info size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            INFORMAÇÕES E REGRAS PARA RESERVA
          </h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-3">
              {[
                { letter: 'A', text: 'A pré-reserva será realizada no Portal do condomínio e posteriormente a administradora irá verificar se o proprietário do apartamento não possui débitos condominiais.' },
                { letter: 'B', text: 'Móveis de grande porte não podem e não serão removidos pela equipe do condomínio (fogão, mesas, geladeira).' },
                { letter: 'C', text: 'No caso de contratação de serviços de Buffet, não nos responsabilizamos por qualquer outro equipamento.' },
                { letter: 'D', text: 'O condomínio não possui área de fumantes.' },
                { letter: 'E', text: 'Convidados devem permanecer na parte interna do salão.' },
                { letter: 'F', text: 'Bebidas alcoólicas devem ser consumidas com bom senso e apenas na área interna.' },
                { letter: 'G', text: 'É proibido fixar qualquer objeto nas paredes e no teto utilizando cola ou fitas.' }
              ].map((item: { letter: string; text: string; bold?: boolean }) => (
                <div key={item.letter} className="flex gap-3 text-[11px] leading-relaxed">
                  <span className="font-black text-blue-600 shrink-0">{item.letter}.</span>
                  <p className={`text-slate-600 ${item.bold ? 'font-bold text-slate-900' : 'font-medium'}`}>{item.text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { letter: 'H', text: 'O salão de festas tem capacidade para 100 pessoas.' },
                { letter: 'I', text: 'Mobiliário incluso: 5 conjuntos de mesas redondas de madeira com 4 cadeiras para cada mesa, mesas de 2,20m e 2,00m, banquetas, aparador, pufs e fraldário.' },
                { letter: 'J', text: 'Disponível: 5 conjuntos de mesas de plástico com 4 cadeiras para cada mesa. Proibido remanejar móveis de outras áreas.' },
                { letter: 'K', text: 'Empresas terceiras devem ser avisadas previamente à portaria.' },
                { letter: 'L', text: 'Após a aprovação da reserva for efetivada, preencher a lista de convidados no portal.' },
                { letter: 'M', text: 'Taxa de utilização do salão de festas: R$ 150,00. (Art. 46 do RI) e conforme aprovação em assembleia de 18/03/2023.' },
                { 
                  letter: 'N', 
                  text: 'Impossibilidade de alugar o salão conforme convenção: Art. 45 - A recusa ao pagamento; ou sua demora por mais de quinze dias, a partir da data da notificação relativa ao ressarcimento das despesas havidas com reparação dos danos causados, acarretará o acréscimo de 10% (dez por cento) no montante dos danos apurados e a cobrança judicial do débito, com o pagamento de custas e honorários advocatícios, bem como a perda do direito de requisição do Salão de Festas até o cumprimento das obrigações.',
                  bold: true
                }
              ].map((item: { letter: string; text: string; bold?: boolean }) => (
                <div key={item.letter} className="flex gap-3 text-[11px] leading-relaxed">
                  <span className="font-black text-blue-600 shrink-0">{item.letter}.</span>
                  <p className={`text-slate-600 ${item.bold ? 'font-bold text-slate-900' : 'font-medium'}`}>{item.text}</p>
                </div>
              ))}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={24} />
                  <span className="text-[10px] font-black uppercase text-blue-800 leading-tight">
                    Baixe o termo oficial em <br /> "Documentos Importantes"
                  </span>
                </div>
                <button 
                  onClick={() => window.location.href = '/documentos'}
                  className="bg-white text-blue-600 p-2 rounded-lg shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <select
            value={filterDateMode}
            onChange={e => setFilterDateMode(e.target.value as any)}
            className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white text-slate-700 font-medium"
          >
            <option value="todas">Todas as Reservas</option>
            <option value="futuras">Reservas Futuras</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              className="w-64 p-2.5 pl-9 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Calendário de Disponibilidade (Compacto) */}
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
          Datas Indisponíveis para Reserva (Bloqueadas)
        </h3>
        <div className="flex flex-wrap gap-2">
          {blockedDates.map(r => (
            <div 
              key={r.id} 
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm border ${
                r.type === 'BLOQUEIO_ADMIN' 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-white border-red-100 text-slate-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${r.type === 'BLOQUEIO_ADMIN' ? 'bg-rose-600' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[11px] font-black">{formatDate(r.date)}</span>
              {r.type === 'BLOQUEIO_ADMIN' ? (
                <span className="text-[9px] font-bold uppercase bg-rose-200/60 px-1.5 py-0.5 rounded text-rose-900">
                  {r.reason || 'Bloqueio ADM'}
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase text-slate-400">Reserva</span>
              )}
            </div>
          ))}
          {blockedDates.length === 0 && <span className="text-xs text-slate-400 italic px-1">Nenhuma data bloqueada ou reservada no momento.</span>}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-5">Apartamento</th>
                <th className="p-5">Data</th>
                <th className="p-5">Retirada Chave</th>
                <th className="p-5">Solicitante</th>
                <th className="p-5">Telefone</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-[10px] font-black text-slate-300 uppercase">Nenhuma solicitação encontrada</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition group">
                  <td className="p-5">
                    <span className="flex items-center gap-1.5 text-blue-600 font-black text-xs">
                      <Building size={14} /> {r.unit?.number} - {r.unit?.block}
                    </span>
                  </td>
                  <td className="p-5 font-black text-slate-800 text-xs">{formatDate(r.date)}</td>
                  <td className="p-5 text-xs text-slate-600 font-semibold">{r.keyPickupTime || '—'}</td>
                  <td className="p-5 font-bold text-slate-600 text-xs uppercase">{r.name}</td>
                  <td className="p-5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Phone size={12} className="text-slate-300" /> {r.ddd ? `(${r.ddd}) ${r.phone}` : r.phone}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-fit border ${statusStyle[r.status]}`}>
                      {statusIcon[r.status]} {r.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => openEdit(r)} title="Ver/Editar" className="p-2 text-slate-400 hover:text-blue-600 transition hover:bg-blue-50 rounded-lg">
                        {isAdmin ? <Edit2 size={16} /> : <Search size={16} />}
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(r.id, r.name)} title="Excluir" className="p-2 text-red-400 hover:text-red-600 transition hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                      {r.status === 'EFETIVADO' && (
                        <button
                          onClick={() => openGuestModal(r)}
                          title="Lista de Convidados"
                          className="p-2 text-emerald-500 hover:text-emerald-700 transition hover:bg-emerald-50 rounded-lg relative"
                        >
                          <Users size={16} />
                          {(r.guests?.length ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                              {r.guests!.length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar size={18} /> {isEditMode ? 'Detalhes da Reserva' : 'Nova Solicitação de Reserva'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Apartamento */}
                <div>
                  <label className={lbl}>Apartamento *</label>
                  <select 
                    required 
                    className={`${inp} ${!isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} 
                    value={formData.unitId}
                    disabled={!isAdmin}
                    onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                  >
                    <option value="">Selecione o apartamento</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className={lbl}>Data da Reserva *</label>
                  <input 
                    required 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    className={`${inp} ${(isMorador && isEditMode) || isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''} ${isDateBlocked(formData.date, formData.id) ? 'border-red-500 bg-red-50 text-red-700 font-bold' : ''}`} 
                    readOnly={(isMorador && isEditMode) || isReadOnlyReservation}
                    value={formData.date} 
                    onChange={e => {
                      const selected = e.target.value;
                      const blockInfo = getBlockInfo(selected);
                      if (blockInfo) {
                        alert(`⛔ Data Indisponível: Esta data está bloqueada pela administração (${blockInfo.reason || 'Bloqueio Administrativo'}). Por favor, escolha outra data.`);
                        setFormData({ ...formData, date: '' });
                        return;
                      }
                      if (isDateBlocked(selected, formData.id)) {
                        alert('🔴 Data Indisponível: Esta data já possui uma reserva ativa ou solicitada. Por favor, escolha outra data.');
                        setFormData({ ...formData, date: '' });
                        return;
                      }
                      setFormData({ ...formData, date: selected });
                    }} 
                  />

                  {/* Alerta de bloqueio caso data seja inválida */}
                  {formData.date && isDateBlocked(formData.date, formData.id) && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                      <XCircle size={16} className="shrink-0 text-red-500" />
                      <span>
                        {getBlockInfo(formData.date)
                          ? `Data Indisponível: Bloqueada pela administração (${getBlockInfo(formData.date)?.reason})`
                          : 'Data Indisponível: Esta data já possui uma reserva ativa!'}
                      </span>
                    </div>
                  )}

                  {/* Lista visual de datas indisponíveis para o usuário */}
                  {blockedDates.length > 0 && !isEditMode && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        🚫 Datas que NÃO podem ser reservadas:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {blockedDates.map(b => (
                          <span 
                            key={b.id} 
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              b.type === 'BLOQUEIO_ADMIN' 
                                ? 'bg-rose-100 text-rose-700 border-rose-200' 
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}
                          >
                            {formatDate(b.date)} {b.type === 'BLOQUEIO_ADMIN' ? `(${b.reason || 'Bloqueio ADM'})` : '(Reservado)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Retirada da Chave */}
              <div className="pt-4 border-t border-slate-100">
                <label className={lbl}>Hora para Retirada da Chave *</label>
                <select
                  required
                  className={`${inp} ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                  disabled={isReadOnlyReservation}
                  value={formData.keyPickupTime || ''}
                  onChange={e => setFormData({ ...formData, keyPickupTime: e.target.value })}
                >
                  <option value="">Selecione o horário</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  <option value="16:30">16:30</option>
                  <option value="17:00">17:00</option>
                  <option value="17:30">17:30</option>
                  <option value="18:00">18:00</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1">
                  <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  Esta informação é importante para que se possa organizar a limpeza e disponibilização do salão de festas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="md:col-span-2">
                  <label className={lbl}>Nome completo *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" className={`${inp} pl-10 ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isReadOnlyReservation} placeholder="NOME DO SOLICITANTE"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>CPF</label>
                  <input type="text" className={`${inp} ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isReadOnlyReservation} placeholder="000.000.000-00"
                    value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>RG</label>
                  <input type="text" className={`${inp} ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isReadOnlyReservation} placeholder="RG"
                    value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Telefone para Contato</label>
                  <div className="flex gap-2">
                    <input type="text" className={`${inp} w-20 ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isReadOnlyReservation} placeholder="DDD"
                      value={formData.ddd} onChange={e => setFormData({ ...formData, ddd: e.target.value })} />
                    <input type="text" className={`${inp} ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isReadOnlyReservation} placeholder="NÚMERO"
                      value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Observações do Solicitante */}
              <div className="pt-4 border-t border-slate-100">
                <label className={lbl}>Observações do Solicitante</label>
                <textarea rows={2} className={`${inp} resize-none ${isReadOnlyReservation ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isReadOnlyReservation} placeholder="INFORMAÇÕES ADICIONAIS..."
                  value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              {/* Área do Administrador */}
              {isAdmin && (
                <div className="pt-6 border-t border-slate-100 bg-slate-50 -mx-8 px-8 pb-8">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} /> Gestão da Reserva (Administrativo)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <label className={lbl}>Status da Reserva</label>
                      <select className={inp} value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="SOLICITADO">SOLICITADO</option>
                        <option value="EFETIVADO">EFETIVADO</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={lbl}>Observação Administrativa (Opcional)</label>
                      <input type="text" className={inp} placeholder="MOTIVO DO CANCELAMENTO OU OBSERVAÇÃO..."
                        value={formData.adminNotes} onChange={e => setFormData({ ...formData, adminNotes: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition text-[11px] font-black uppercase">
                  Fechar
                </button>
                {(!isZeladoria && !isPorteiro && currentUser?.role !== 'CONSELHO') && (
                  <button type="submit" disabled={saving}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-60 text-[11px] tracking-wider">
                    {saving ? 'Gravando...' : isEditMode ? 'Salvar Alterações' : 'Confirmar Solicitação'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Guest List Modal */}
      {guestModalReservation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-6">
            {/* Header */}
            <div className="p-6 bg-emerald-700 text-white flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users size={18} /> Lista de Convidados
              </h2>
              <button onClick={() => setGuestModalReservation(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Info da reserva */}
              <div className="mb-5 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-semibold">
                <span className="font-black">{guestModalReservation.unit?.number} – {guestModalReservation.unit?.block}</span>
                {' '}·{' '}{formatDate(guestModalReservation.date)}
              </div>

              {/* Formulário de adição — somente MORADOR */}
              {!isReadOnlyGuest && (
                <div className="flex flex-col gap-3 mb-5">
                  <div>
                    <label className={lbl}>Nome Completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        className={`${inp} pl-9`}
                        placeholder="NOME DO CONVIDADO"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>CPF</label>
                    <input
                      type="text"
                      className={inp}
                      placeholder="000.000.000-00"
                      value={guestCpf}
                      onChange={e => setGuestCpf(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
                    />
                  </div>
                  <button
                    onClick={handleAddGuest}
                    disabled={savingGuest || !guestName.trim()}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <UserPlus size={16} /> {savingGuest ? 'Adicionando...' : 'Adicionar Convidado'}
                  </button>
                </div>
              )}

              {/* Barra de pesquisa — somente Admin/Zeladoria */}
              {isReadOnlyGuest && (
                <div className="mb-5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      className={`${inp} pl-9`}
                      placeholder="Pesquisar por nome..."
                      value={guestSearch}
                      onChange={e => setGuestSearch(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Lista de convidados */}
              <div className="border-t border-slate-100 pt-4">
                {(() => {
                  const allGuests = guestModalReservation.guests ?? [];
                  const filtered = isReadOnlyGuest && guestSearch.trim()
                    ? allGuests.filter(g => g.name.toLowerCase().includes(guestSearch.toLowerCase()))
                    : allGuests;
                  return (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        {isReadOnlyGuest
                          ? `Convidados cadastrados (${filtered.length}${guestSearch ? ` de ${allGuests.length}` : ''})`
                          : `Convidados cadastrados (${allGuests.length})`
                        }
                      </p>
                      {filtered.length === 0 ? (
                        <p className="text-center text-xs text-slate-300 italic py-4">
                          {guestSearch ? 'Nenhum resultado para a pesquisa.' : 'Nenhum convidado cadastrado ainda.'}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {filtered.map((g, idx) => (
                            <div key={g.id} className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100 transition">
                              {editingGuestId === g.id ? (
                                <div className="flex flex-col gap-2.5">
                                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                                    <span>Editar Convidado #{idx + 1}</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Completo *</label>
                                      <input
                                        type="text"
                                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={editGuestName}
                                        onChange={e => setEditGuestName(e.target.value.toUpperCase())}
                                        placeholder="NOME DO CONVIDADO"
                                        autoFocus
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleUpdateGuest(g.id);
                                          if (e.key === 'Escape') cancelEditGuest();
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">CPF</label>
                                      <input
                                        type="text"
                                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={editGuestCpf}
                                        onChange={e => setEditGuestCpf(e.target.value)}
                                        placeholder="000.000.000-00"
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleUpdateGuest(g.id);
                                          if (e.key === 'Escape') cancelEditGuest();
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      onClick={cancelEditGuest}
                                      disabled={savingEditGuest}
                                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition text-[10px] font-bold uppercase"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleUpdateGuest(g.id)}
                                      disabled={savingEditGuest || !editGuestName.trim()}
                                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                                    >
                                      {savingEditGuest ? 'Salvando...' : 'Salvar Alteração'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <span className="text-[10px] font-black text-slate-400 mr-2">{idx + 1}.</span>
                                    <span className="text-xs font-bold text-slate-700">{g.name}</span>
                                    {g.cpf && <span className="ml-2 text-[10px] text-slate-400 font-medium">({g.cpf})</span>}
                                  </div>
                                  {!isReadOnlyGuest && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => startEditGuest(g)}
                                        title="Alterar Convidado"
                                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveGuest(g.id)}
                                        title="Excluir Convidado"
                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setGuestModalReservation(null)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition text-[11px] font-black uppercase"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Badge */}
      <div className="mt-12 text-center pb-8">
        <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}


