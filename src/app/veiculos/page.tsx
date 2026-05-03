'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Car, 
  X, 
  Building, 
  Bike, 
  Truck, 
  Search,
  LayoutDashboard,
  ChevronRight,
  ShieldCheck,
  Hash
} from 'lucide-react';

type Unit = {
  id: string;
  number: string;
  block: string;
};

type Vehicle = {
  id: string;
  plate: string;
  model: string;
  color: string;
  type: 'CARRO' | 'MOTO' | 'UTILITARIO' | 'BICICLETA';
  unitId: string;
  unit?: Unit;
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.0.99-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.0.99';

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ id: '', plate: '', model: '', color: '', type: 'CARRO' as Vehicle['type'], unitId: '' });

  const API_URL = '/api/veiculos';
  const UNIDADES_URL = '/api/unidades';

  useEffect(() => {
    setMounted(true);
    fetchVeiculos();
    fetchUnidades();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

  const fetchVeiculos = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setVeiculos(data);
    } catch (error) {
      console.error('Erro ao buscar veículos', error);
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
      const url = isEditMode ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload = {
        ...formData,
        plate: formData.plate.toUpperCase(),
        model: formData.model.toUpperCase(),
        color: formData.color.toUpperCase()
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchVeiculos();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar veículo', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVeiculos();
    } catch (error) {
      console.error('Erro ao excluir veículo', error);
    }
  };

  const openEditModal = (v: Vehicle) => {
    setFormData({ 
      id: v.id,
      plate: v.plate,
      model: v.model,
      color: v.color,
      type: v.type,
      unitId: v.unitId
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ id: '', plate: '', model: '', color: '', type: 'CARRO', unitId: currentUser?.role === 'MORADOR' ? (currentUser.unitId || '') : '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'BICICLETA': return <Bike size={16} />;
      case 'UTILITARIO': return <Truck size={16} />;
      case 'MOTO': return <Car size={16} />; // Simulating moto with smaller car icon or specialized if available
      default: return <Car size={16} />;
    }
  };

  // Filtragem e Agrupamento
  const filteredVeiculos = veiculos.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.unit && (v.unit.number.includes(searchTerm) || v.unit.block.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Agrupar por Unidade
  const groupedVeiculos: Record<string, { unit: Unit, vehicles: Vehicle[] }> = {};
  
  filteredVeiculos.forEach(v => {
    if (!v.unit) return;
    const key = v.unit.id;
    if (!groupedVeiculos[key]) {
      groupedVeiculos[key] = { unit: v.unit, vehicles: [] };
    }
    groupedVeiculos[key].vehicles.push(v);
  });

  // Ordenar grupos por Apartamento (Bloco e Número)
  const sortedUnitIds = Object.keys(groupedVeiculos).sort((a, b) => {
    const unitA = groupedVeiculos[a].unit;
    const unitB = groupedVeiculos[b].unit;
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
              <Car size={28} className="text-blue-600" />
              GESTÃO DE VEÍCULOS
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">
              Controle de frota por unidade autônoma
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="BUSCAR PLACA, MODELO OU AP..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} /> Novo Veículo
            </button>
          </div>
        </div>

        {/* Listagem Agrupada */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando dados...</div>
          ) : sortedUnitIds.length === 0 ? (
            <div className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum veículo encontrado</div>
          ) : (
            sortedUnitIds.map(unitId => {
              const group = groupedVeiculos[unitId];
              return (
                <div key={unitId} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                  {/* Header do Grupo (Apartamento) */}
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Building size={14} />
                      </div>
                      <div>
                        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                          AP {group.unit.number} - {group.unit.block}
                        </h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{group.vehicles.length} {group.vehicles.length === 1 ? 'veículo' : 'veículos'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Veículos no Grupo */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.vehicles.map(v => (
                      <div key={v.id} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 group relative hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 bg-white text-slate-600 rounded-lg shadow-sm">
                            {getTypeIcon(v.type)}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => openEditModal(v)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 size={12} /></button>
                            <button onClick={() => handleDelete(v.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Hash size={10} className="text-slate-400" />
                            <span className="text-[12px] font-black text-slate-800 tracking-tighter uppercase">{v.plate}</span>
                          </div>
                          <h3 className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">{v.model}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{v.color} • {v.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

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
                <Car size={18} /> {isEditMode ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Placa do Veículo</label>
                <input 
                  type="text" required 
                  placeholder="EX: ABC-1234"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800 uppercase"
                  value={formData.plate} 
                  onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Marca / Modelo</label>
                  <input 
                    type="text" required 
                    placeholder="EX: HONDA CIVIC"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                    value={formData.model} 
                    onChange={(e) => setFormData({...formData, model: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cor</label>
                  <input 
                    type="text" required 
                    placeholder="EX: PRETO"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                    value={formData.color} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Veículo</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700 appearance-none"
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="CARRO">CARRO</option>
                  <option value="MOTO">MOTO</option>
                  <option value="UTILITARIO">UTILITÁRIO</option>
                  <option value="BICICLETA">BICICLETA</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Apartamento Vinculado</label>
                <select 
                  required 
                  disabled={currentUser?.role === 'MORADOR'}
                  className={`w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700 appearance-none ${currentUser?.role === 'MORADOR' ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                  value={formData.unitId} 
                  onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                >
                  <option value="">SELECIONE O APARTAMENTO</option>
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
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Gravando...' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
