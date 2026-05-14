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
  UserPlus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
};

const emptyForm = {
  id: '', unitId: '', name: '', rg: '', cpf: '', ddd: '', phone: '',
  date: '', notes: '', adminNotes: '', status: 'SOLICITADO' as Reservation['status']
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
  const [filterUnit, setFilterUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  // Guest list modal
  const [guestModalReservation, setGuestModalReservation] = useState<Reservation | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestCpf, setGuestCpf] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);

  useEffect(() => { 
    setMounted(true);
    fetchList(); 
    fetchUnidades(); 
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

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
    return list.some(r => 
      r.id !== excludeId && 
      r.date.split('T')[0] === target && 
      r.status !== 'CANCELADO'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
            const doc = createReservationPDF(savedData);
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
      name: currentUser?.name?.toUpperCase() || ''
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
      status: r.status
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const createReservationPDF = (r: Reservation) => {
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
        ['Data Reservada:', formatDate(r.date)],
        ['Status:', r.status],
        ['Observações:', r.notes || '—']
      ],
      theme: 'striped',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    return doc;
  };

  const filtered = filterUnit ? list.filter(a => a.unitId === filterUnit) : list;
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SINDICO';
  const isMorador = currentUser?.role === 'MORADOR';

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
        {!isAdmin && (
          <button onClick={openCreate}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-black shadow-lg shadow-blue-100 text-xs uppercase tracking-wider">
            <Plus size={18} /> Nova Reserva
          </button>
        )}
      </div>

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
                { letter: 'D', text: 'O condomínio não possui área de fumantes. Convidados devem permanecer na parte interna do salão.' },
                { letter: 'E', text: 'Bebidas alcoólicas devem ser consumidas com bom senso e apenas na área interna.' },
                { letter: 'F', text: 'É proibido fixar qualquer objeto nas paredes e no teto utilizando cola ou fitas.' }
              ].map((item) => (
                <div key={item.letter} className="flex gap-3 text-[11px] leading-relaxed">
                  <span className="font-black text-blue-600 shrink-0">{item.letter}.</span>
                  <p className="text-slate-600 font-medium">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { letter: 'G', text: 'O salão de festas tem capacidade para 100 pessoas.' },
                { letter: 'H', text: 'Mobiliário incluso: 5 conjuntos de madeira, mesas de 2,20m e 2,00m, banquetas, aparador, pufs e fraldário.' },
                { letter: 'I', text: 'Disponível: 5 conjuntos de plástico. Proibido remanejar móveis de outras áreas.' },
                { letter: 'J', text: 'Empresas terceiras devem ser avisadas previamente à portaria.' },
                { letter: 'K', text: 'Entregar lista de convidados na portaria 1 dia antes da reserva.' }
              ].map((item) => (
                <div key={item.letter} className="flex gap-3 text-[11px] leading-relaxed">
                  <span className="font-black text-blue-600 shrink-0">{item.letter}.</span>
                  <p className="text-slate-600 font-medium">{item.text}</p>
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

      {/* Calendário de Disponibilidade (Compacto) */}
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Datas já reservadas (Bloqueadas)</h3>
        <div className="flex flex-wrap gap-2">
          {list.filter(r => r.status !== 'CANCELADO').map(r => (
            <div key={r.id} className="bg-white border border-red-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-black text-slate-700">{formatDate(r.date)}</span>
            </div>
          ))}
          {list.filter(r => r.status !== 'CANCELADO').length === 0 && <span className="text-xs text-slate-400 italic px-1">Nenhuma data reservada no momento.</span>}
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
                <th className="p-5">Solicitante</th>
                <th className="p-5">Telefone</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-[10px] font-black text-slate-300 uppercase">Nenhuma solicitação encontrada</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition group">
                  <td className="p-5">
                    <span className="flex items-center gap-1.5 text-blue-600 font-black text-xs">
                      <Building size={14} /> {r.unit?.number} - {r.unit?.block}
                    </span>
                  </td>
                  <td className="p-5 font-black text-slate-800 text-xs">{formatDate(r.date)}</td>
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
                  <select required className={`${inp} bg-slate-50 cursor-not-allowed`} value={formData.unitId}
                    disabled={true}>
                    <option value="">Selecione o apartamento</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className={lbl}>Data da Reserva *</label>
                  <input required type="date" className={`${inp} ${(isMorador && isEditMode) || isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} 
                    readOnly={(isMorador && isEditMode) || isAdmin}
                    value={formData.date} 
                    onChange={e => {
                      if (isDateBlocked(e.target.value, formData.id)) {
                        alert('Esta data já está reservada ou solicitada.');
                        return;
                      }
                      setFormData({ ...formData, date: e.target.value });
                    }} 
                  />
                  {isDateBlocked(formData.date, formData.id) && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">Atenção: Esta data já possui reserva!</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="md:col-span-2">
                  <label className={lbl}>Nome completo *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" className={`${inp} pl-10 ${isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isAdmin} placeholder="NOME DO SOLICITANTE"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>CPF</label>
                  <input type="text" className={`${inp} ${isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isAdmin} placeholder="000.000.000-00"
                    value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>RG</label>
                  <input type="text" className={`${inp} ${isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isAdmin} placeholder="RG"
                    value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Telefone para Contato</label>
                  <div className="flex gap-2">
                    <input type="text" className={`${inp} w-20 ${isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isAdmin} placeholder="DDD"
                      value={formData.ddd} onChange={e => setFormData({ ...formData, ddd: e.target.value })} />
                    <input type="text" className={`${inp} ${isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isAdmin} placeholder="NÚMERO"
                      value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Observações do Solicitante */}
              <div className="pt-4 border-t border-slate-100">
                <label className={lbl}>Observações do Solicitante</label>
                <textarea rows={2} className={`${inp} resize-none ${isAdmin ? 'bg-slate-50 cursor-not-allowed' : ''}`} readOnly={isAdmin} placeholder="INFORMAÇÕES ADICIONAIS..."
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
                <button type="submit" disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-60 text-[11px] tracking-wider">
                  {saving ? 'Gravando...' : isEditMode ? 'Salvar Alterações' : 'Confirmar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Guest List Modal */}
      {guestModalReservation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-6">
            <div className="p-6 bg-emerald-700 text-white flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users size={18} /> Lista de Convidados
              </h2>
              <button onClick={() => setGuestModalReservation(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-semibold">
                <span className="font-black">{guestModalReservation.unit?.number} – {guestModalReservation.unit?.block}</span>
                {' '}·{' '}{formatDate(guestModalReservation.date)}
              </div>

              {/* Add guest form */}
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

              {/* Guest list */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Convidados cadastrados ({guestModalReservation.guests?.length ?? 0})
                </p>
                {(guestModalReservation.guests?.length ?? 0) === 0 ? (
                  <p className="text-center text-xs text-slate-300 italic py-4">Nenhum convidado cadastrado ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {guestModalReservation.guests!.map((g, idx) => (
                      <div key={g.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100 group">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 mr-2">{idx + 1}.</span>
                          <span className="text-xs font-bold text-slate-700">{g.name}</span>
                          {g.cpf && <span className="ml-2 text-[10px] text-slate-400 font-medium">{g.cpf}</span>}
                        </div>
                        <button
                          onClick={() => handleRemoveGuest(g.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.23-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.23';
