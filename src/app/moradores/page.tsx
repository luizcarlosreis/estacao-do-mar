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
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';

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
  role: string;
  unitId?: string;
  unit?: Unit;
  ddd?: string;
  phone?: string;
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.10-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.10';

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ cpf: '', name: '', email: '', password: '', unitId: '', ddd: '', phone: '' });

  const API_URL = '/api/moradores';
  const UNIDADES_URL = '/api/unidades';

  useEffect(() => {
    setMounted(true);
    fetchMoradores();
    fetchUnidades();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
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
      if (Array.isArray(data)) setUnidades(data);
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
      
      const payload: any = { 
        ...formData,
        name: formData.name.toUpperCase(),
        email: formData.email.toLowerCase()
      };
      if (isEditMode && !payload.password) delete payload.password;
      if (!payload.unitId) payload.unitId = null;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMoradores();
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
      if (res.ok) fetchMoradores();
    } catch (error) {
      console.error('Erro ao excluir morador', error);
    }
  };

  const openEditModal = (m: Morador) => {
    setFormData({ 
      cpf: m.cpf, 
      name: m.name, 
      email: m.email || '', 
      password: '', 
      unitId: m.unitId || '',
      ddd: m.ddd || '',
      phone: m.phone || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ cpf: '', name: '', email: '', password: '', unitId: currentUser?.role === 'MORADOR' ? (currentUser.unitId || '') : '', ddd: '', phone: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const filteredMoradores = moradores.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm) ||
    (m.unit && (m.unit.number.includes(searchTerm) || m.unit.block.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Agrupar por Unidade
  const groupedMoradores: Record<string, { unit?: Unit, moradores: Morador[] }> = {};
  
  filteredMoradores.forEach(m => {
    const key = m.unitId || 'unlinked';
    if (!groupedMoradores[key]) {
      groupedMoradores[key] = { unit: m.unit, moradores: [] };
    }
    groupedMoradores[key].moradores.push(m);
  });

  const sortedUnitIds = Object.keys(groupedMoradores).sort((a, b) => {
    if (a === 'unlinked') return 1;
    if (b === 'unlinked') return -1;
    const unitA = groupedMoradores[a].unit!;
    const unitB = groupedMoradores[b].unit!;
    const apA = `${unitA.block}-${unitA.number.padStart(5, '0')}`;
    const apB = `${unitB.block}-${unitB.number.padStart(5, '0')}`;
    return apA.localeCompare(apB);
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <User size={28} className="text-emerald-600" />
              GESTÃO DE MORADORES
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
            <button 
              onClick={openCreateModal}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} /> Novo Morador
            </button>
          </div>
        </div>

        {/* Listagem Agrupada */}
        {loading ? (
          <div className="py-20 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando dados...</div>
        ) : sortedUnitIds.length === 0 ? (
          <div className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum morador encontrado</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {sortedUnitIds.map(unitId => {
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

                  {/* Lista de Moradores */}
                  <div className="p-4 space-y-2 flex-1">
                    {group.moradores.map(m => (
                      <div key={m.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 group/item relative hover:border-emerald-200 transition-all flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[10px] font-black text-slate-800 uppercase truncate leading-tight mb-0.5">{m.name}</h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] text-slate-400 font-black uppercase">{m.cpf}</span>
                             {m.phone && <span className="text-[11px] text-emerald-600 font-black uppercase flex items-center gap-1"><Phone size={12} /> {m.ddd ? `(${m.ddd}) ` : ''}{m.phone}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="p-1.5 bg-white text-slate-600 rounded-lg shadow-sm border border-slate-100 group-hover/item:scale-110 transition-transform">
                            <User size={14} />
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="absolute inset-y-0 right-0 bg-white/90 backdrop-blur-sm px-2 flex items-center gap-1 translate-x-full group-hover/item:translate-x-0 transition-transform border-l border-slate-100 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]">
                          <button onClick={() => openEditModal(m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete(m.cpf)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <User size={18} /> {isEditMode ? 'Editar Morador' : 'Novo Morador'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                  <input 
                    type="text" required 
                    placeholder="EX: JOÃO DA SILVA"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">DDD</label>
                  <input 
                    type="text" 
                    placeholder="11"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                    value={formData.ddd} 
                    onChange={(e) => setFormData({...formData, ddd: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Telefone</label>
                  <input 
                    type="text" 
                    placeholder="99999-9999"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Senha {isEditMode && '(Opcional)'}</label>
                <input 
                  type="password" required={!isEditMode}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-[11px] font-bold text-slate-800"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
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
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                </select>
              </div>

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
    </div>
  );
}
