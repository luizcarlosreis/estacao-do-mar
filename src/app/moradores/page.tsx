'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Building,
  User,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Send,
  Link2,
  Unlink,
  Copy,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

type Unit = {
  id: string;
  number: string;
  block: string;
};

type Morador = {
  id: string;
  cpf: string;
  name: string;
  email?: string;
  rg?: string;
  role: string;
  unitId?: string;
  unit?: Unit;
  ddd?: string;
  phone?: string;
  phones?: string;
  birthDate?: string;
  residentType?: string;
  isActive?: boolean;
  telegramChatId?: string;
  telegramLinkToken?: string;
};

function parsePhones(phonesJson?: string, fallbackDdd?: string, fallbackPhone?: string): { ddd: string; phone: string }[] {
  if (phonesJson) {
    try {
      const parsed = JSON.parse(phonesJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(p => ({ ddd: p.ddd || '', phone: p.phone || '' }));
      }
    } catch {}
  }
  if (fallbackPhone) {
    return [{ ddd: fallbackDdd || '', phone: fallbackPhone }];
  }
  return [{ ddd: '', phone: '' }];
}

export default function MoradoresPage() {
  const ENABLE_TELEGRAM = false;
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [selectedMorador, setSelectedMorador] = useState<Morador | null>(null);
  const [registeredResident, setRegisteredResident] = useState<Morador | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ cpf: '', name: '', email: '', password: '', unitId: '', ddd: '', phone: '', residentType: 'MORADOR', isActive: true, rg: '', birthDate: '' });
  const [phoneList, setPhoneList] = useState<{ ddd: string; phone: string }[]>([{ ddd: '', phone: '' }]);

  const API_URL = '/api/moradores';
  const UNIDADES_URL = '/api/unidades';

  useEffect(() => {
    setMounted(true);
    fetchMoradores();
    fetchUnidades();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => {
      setCurrentUser(data?.user);
      if (data?.user?.telegramChatId) setTelegramLinked(true);
    });
  }, []);

  const fetchMoradores = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setMoradores(data);
    } catch (error) {
      console.error('Erro ao buscar moradores', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch(UNIDADES_URL);
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => 
          a.number.localeCompare(b.number, undefined, { numeric: true })
        );
        setUnidades(sorted);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEditMode ? `${API_URL}/${formData.cpf}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const validPhones = phoneList.filter(p => p.phone.trim() !== '');
      const payload: any = { 
        ...formData,
        name: formData.name.toUpperCase(),
        email: formData.email.toLowerCase(),
        phones: validPhones,
        ddd: validPhones[0]?.ddd || '',
        phone: validPhones[0]?.phone || ''
      };
      if (isEditMode && !payload.password) delete payload.password;
      if (!payload.unitId) payload.unitId = null;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedResident = await res.json();
        setIsModalOpen(false);
        fetchMoradores();
        if (!isEditMode) {
          setRegisteredResident(savedResident);
          setShowSuccessModal(true);
        }
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar morador', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cpf: string) => {
    if (!confirm(`Tem certeza que deseja excluir este morador?`)) return;
    try {
      const res = await fetch(`${API_URL}/${cpf}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMoradores();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Erro ao excluir morador.');
      }
    } catch (error) {
      console.error('Erro ao excluir morador', error);
      alert('Ocorreu um erro inesperado ao tentar excluir o morador.');
    }
  };

  const openEditModal = (m: Morador) => {
    setSelectedMorador(m);
    setFormData({ 
      cpf: m.cpf, 
      name: m.name, 
      email: m.email || '', 
      password: '', 
      unitId: m.unitId || '',
      ddd: m.ddd || '',
      phone: m.phone || '',
      residentType: m.residentType || 'MORADOR',
      isActive: m.isActive !== undefined ? m.isActive : true,
      rg: m.rg || '',
      birthDate: m.birthDate ? m.birthDate.substring(0, 10) : ''
    });
    const parsed = parsePhones(m.phones, m.ddd, m.phone);
    setPhoneList(parsed.length > 0 ? parsed : [{ ddd: '', phone: '' }]);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedMorador(null);
    setFormData({ cpf: '', name: '', email: '', password: '', unitId: currentUser?.role === 'MORADOR' ? (currentUser.unitId || '') : '', ddd: '', phone: '', residentType: 'MORADOR', isActive: true, rg: '', birthDate: '' });
    setPhoneList([{ ddd: '', phone: '' }]);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleUnlinkTelegram = async (morador: Morador) => {
    if (!confirm(`Deseja desvincular o Telegram de ${morador.name}?`)) return;
    try {
      const res = await fetch(`/api/telegram/link?userId=${morador.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMoradores();
        if (currentUser && morador.id === currentUser.id) {
          setTelegramLinked(false);
        }
        if (selectedMorador && selectedMorador.id === morador.id) {
          setSelectedMorador(prev => prev ? { ...prev, telegramChatId: undefined } : null);
        }
        alert('Telegram desvinculado com sucesso!');
      } else {
        alert('Erro ao desvincular Telegram.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao desvincular Telegram.');
    }
  };

  const handleTelegramUnlink = async () => {
    if (!currentUser || !confirm('Deseja desvincular seu Telegram?')) return;
    try {
      const res = await fetch(`/api/telegram/link?userId=${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTelegramLinked(false);
        alert('Telegram desvinculado.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMoradores = moradores.filter(m => 
    !searchTerm ||
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm) ||
    (m.unit && (m.unit.number.toLowerCase().includes(searchTerm.toLowerCase()) || m.unit.block.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Agrupar por Unidade
  const groupedMoradores: Record<string, { unit?: Unit, moradores: Morador[] }> = {};
  
  const displayUnidades = currentUser?.role === 'MORADOR'
    ? unidades.filter(u => u.id === currentUser.unitId)
    : unidades;

  displayUnidades.forEach(u => {
    groupedMoradores[u.id] = { unit: u, moradores: [] };
  });

  filteredMoradores.forEach(m => {
    const key = m.unitId || 'unlinked';
    if (currentUser?.role === 'MORADOR' && key !== currentUser.unitId) {
      return;
    }
    if (!groupedMoradores[key]) {
      groupedMoradores[key] = { unit: m.unit, moradores: [] };
    }
    groupedMoradores[key].moradores.push(m);
  });

  const sortedUnitIds = Object.keys(groupedMoradores).filter(key => {
    const group = groupedMoradores[key];
    if (!searchTerm) return true;
    
    const s = searchTerm.toLowerCase();
    const unitMatch = group.unit && (group.unit.number.toLowerCase().includes(s) || group.unit.block.toLowerCase().includes(s));
    
    return unitMatch || group.moradores.length > 0;
  }).sort((a, b) => {
    if (a === 'unlinked') return 1;
    if (b === 'unlinked') return -1;
    const unitA = groupedMoradores[a].unit!;
    const unitB = groupedMoradores[b].unit!;
    const apA = `${unitA.number}-${unitA.block}`;
    const apB = `${unitB.number}-${unitB.block}`;
    return apA.localeCompare(apB, undefined, { numeric: true, sensitivity: 'base' });
  });

  const unitsPerPage = 18;
  const totalPages = Math.ceil(sortedUnitIds.length / unitsPerPage);
  const paginatedUnitIds = sortedUnitIds.slice((currentPage - 1) * unitsPerPage, currentPage * unitsPerPage);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <User size={28} className="text-emerald-600" />
              MORADORES / VISITAS FREQUENTES
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">
              Controle de residentes e acessos
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="BUSCAR NOME, CPF OU AP..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {currentUser?.role !== 'CONSELHO' && (
              <button 
                onClick={openCreateModal}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
              >
                <Plus size={16} /> Novo Morador
              </button>
            )}
          </div>
        </div>



        {/* Listagem Agrupada */}
        {loading ? (
          <div className="py-20 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando dados...</div>
        ) : sortedUnitIds.length === 0 ? (
          <div className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum morador encontrado</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {paginatedUnitIds.map(unitId => {
              const group = groupedMoradores[unitId];
              return (
                <div key={unitId} className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group/unit h-full flex flex-col">
                  {/* Header do Grupo */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Building size={16} />
                      </div>
                      <div>
                        <h2 className="text-[16px] font-black text-slate-800 uppercase tracking-wider group-hover/unit:text-emerald-600 transition-colors">
                          {group.unit ? `AP ${group.unit.number}` : 'NÃO VINCULADO'}
                        </h2>
                        <p className="text-[11px] text-emerald-500 font-black uppercase tracking-widest">MORADORES: {group.moradores.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1">
                    {group.moradores.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-4">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">Nenhum residente<br/>cadastrado</span>
                      </div>
                    ) : (
                      group.moradores.map(m => (
                        <div key={m.id} className={`p-3 rounded-xl border group/item relative hover:border-emerald-200 transition-all flex items-center justify-between gap-3 overflow-hidden ${
                           m.isActive === false 
                           ? 'bg-slate-100/50 border-slate-200 opacity-60' 
                           : 'bg-slate-50/50 border-slate-100'
                         }`}>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[10px] font-black text-slate-800 uppercase truncate leading-tight mb-0.5">{m.name}</h3>
                            {m.email && <p className="text-[9px] text-slate-500 truncate mb-1 lowercase">{m.email}</p>}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[8px] text-slate-400 font-black uppercase">{m.cpf}</span>
                               {m.rg && <span className="text-[8px] text-slate-400 font-black uppercase"> · RG: {m.rg}</span>}
                               {m.birthDate && <span className="text-[8px] text-slate-400 font-black uppercase"> · NASC: {new Date(m.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>}
                               {parsePhones(m.phones, m.ddd, m.phone).map((p, idx) => p.phone && (
                                 <span key={idx} className="text-[11px] text-emerald-600 font-black uppercase flex items-center gap-1">
                                   <Phone size={12} /> {p.ddd ? `(${p.ddd}) ` : ''}{p.phone}
                                 </span>
                               ))}
                               <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                                 m.residentType === 'VISITA FREQUENTE' 
                                 ? 'bg-rose-100 text-rose-600' 
                                 : m.residentType === 'PROPRIETÁRIO NÃO RESIDENTE'
                                 ? 'bg-blue-100 text-blue-600'
                                 : 'bg-emerald-100 text-emerald-600'
                               }`}>
                                 {m.residentType === 'VISITA FREQUENTE' 
                                   ? 'VISITA' 
                                   : m.residentType === 'PROPRIETÁRIO NÃO RESIDENTE'
                                   ? 'PROPRIETÁRIO NÃO RESIDENTE'
                                   : 'MORADOR'
                                 }
                               </span>
                               <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                                  m.isActive === false
                                  ? 'bg-slate-200 text-slate-500'
                                  : 'bg-emerald-100/60 text-emerald-600'
                                }`}>
                                  {m.isActive === false ? 'INATIVO' : 'ATIVO'}
                                </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="p-1.5 bg-white text-slate-600 rounded-lg shadow-sm border border-slate-100 group-hover/item:scale-110 transition-transform">
                              <User size={14} />
                            </div>
                          </div>

                          {/* Ações */}
                          {currentUser?.role !== 'CONSELHO' && (
                            <div className="absolute inset-y-0 right-0 bg-white/90 backdrop-blur-sm px-2 flex items-center gap-1 translate-x-full group-hover/item:translate-x-0 transition-transform border-l border-slate-100 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]">
                              <button onClick={() => openEditModal(m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={12} /></button>
                              <button onClick={() => handleDelete(m.cpf)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <User size={18} /> {isEditMode ? 'Editar Morador' : 'Novo Morador'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Coluna 1: Dados Pessoais */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input 
                      type="text" required 
                      placeholder="EX: JOÃO DA SILVA"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CPF (Apenas Números)</label>
                      <input 
                         type="text" required disabled={isEditMode}
                         placeholder="000.000.000-00"
                         className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800 disabled:opacity-50"
                         value={formData.cpf} 
                         onChange={(e) => setFormData({...formData, cpf: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">RG</label>
                      <input 
                        type="text" 
                        placeholder="EX: 12.345.678-9"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                        value={formData.rg} 
                        onChange={(e) => setFormData({...formData, rg: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail de Acesso</label>
                    <input 
                      type="email" 
                      placeholder="EX: JOAO@EMAIL.COM"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Nascimento (Opcional)</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                      value={formData.birthDate} 
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Coluna 2: Telefones, Acesso & Sistema */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefones de Contato</label>
                    {phoneList.map((p, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="DDD"
                          className="w-16 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                          value={p.ddd} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhoneList(prev => prev.map((item, i) => i === idx ? { ...item, ddd: val } : item));
                          }} 
                        />
                        <input 
                          type="text" 
                          placeholder="99999-9999"
                          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                          value={p.phone} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhoneList(prev => prev.map((item, i) => i === idx ? { ...item, phone: val } : item));
                          }} 
                        />
                        {phoneList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPhoneList(prev => prev.filter((_, i) => i !== idx))}
                            className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPhoneList(prev => [...prev, { ddd: '', phone: '' }])}
                      className="py-2 px-3 border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 transition flex items-center gap-1.5 w-fit"
                    >
                      <Plus size={14} /> Adicionar Telefone
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Senha (Opcional)</label>
                    <input 
                      type="password"
                      placeholder="DEIXE EM BRANCO PARA USAR 5 PRIMEIROS DÍGITOS DO CPF"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800 placeholder:normal-case"
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Cadastro</label>
                      <select 
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none"
                        value={formData.residentType} 
                        onChange={(e) => setFormData({...formData, residentType: e.target.value})}
                      >
                        <option value="MORADOR">MORADOR</option>
                        <option value="VISITA FREQUENTE">VISITA FREQUENTE</option>
                        <option value="PROPRIETÁRIO NÃO RESIDENTE">PROPRIETÁRIO NÃO RESIDENTE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none"
                        value={formData.isActive ? 'true' : 'false'} 
                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                      >
                        <option value="true">ATIVO</option>
                        <option value="false">INATIVO</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Apartamento</label>
                    <select 
                      disabled={currentUser?.role === 'MORADOR'}
                      className={`w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-700 appearance-none ${currentUser?.role === 'MORADOR' ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                      value={formData.unitId} 
                      onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                    >
                      <option value="">NÃO VINCULAR APARTAMENTO</option>
                      {displayUnidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {ENABLE_TELEGRAM && isEditMode && selectedMorador && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Integração com Telegram
                  </label>
                  
                  {selectedMorador.telegramChatId ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-black uppercase">
                          <CheckCircle2 size={14} /> Telegram Ativo
                        </div>
                        <p className="text-[9px] text-emerald-600 font-medium mt-0.5">
                          ID: {selectedMorador.telegramChatId} • Recebendo notificações.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkTelegram(selectedMorador)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Desvincular Telegram"
                      >
                        <Unlink size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Vincule esta conta ao Telegram para habilitar avisos instantâneos de encomendas na portaria:
                      </p>
                      
                      <div className="flex gap-2">
                        <a
                          href={`https://t.me/EstacaoDoMarCondominoBot?start=${selectedMorador.telegramLinkToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 bg-[#0088cc] hover:bg-[#006da3] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-100"
                        >
                          <Send size={12} /> Abrir Telegram <ExternalLink size={10} />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://t.me/EstacaoDoMarCondominoBot?start=${selectedMorador.telegramLinkToken}`);
                            alert('Link de vinculação copiado para a área de transferência!');
                          }}
                          className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 transition-all flex items-center gap-1 shadow-sm"
                          title="Copiar Link"
                        >
                          <Copy size={12} /> Copiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
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
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Gravando...' : 'Salvar Morador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sucesso Cadastro com Telegram */}
      {showSuccessModal && registeredResident && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500 animate-bounce" /> Cadastro Concluído!
              </h2>
              <button onClick={() => setShowSuccessModal(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 text-center">
              <div className="space-y-2">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <User size={32} />
                </div>
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                  {registeredResident.name}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Cadastrado com sucesso no portal!
                </p>
              </div>

              {ENABLE_TELEGRAM && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                    <Send size={14} className="text-[#0088cc]" /> Notificações de Encomendas
                  </div>
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                    Para que o morador receba avisos automáticos e em tempo real do Bot da Portaria, peça para ele iniciar o nosso bot do Telegram:
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                    <a
                      href={`https://t.me/EstacaoDoMarCondominoBot?start=${registeredResident.telegramLinkToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 bg-[#0088cc] hover:bg-[#006da3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100"
                    >
                      <Send size={14} /> Iniciar Bot <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://t.me/EstacaoDoMarCondominoBot?start=${registeredResident.telegramLinkToken}`);
                        alert('Link de vinculação copiado para a área de transferência!');
                      }}
                      className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Copy size={14} /> Copiar Link
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
