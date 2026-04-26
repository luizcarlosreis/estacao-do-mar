'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Car, X, Building, Bike, Truck, Search } from 'lucide-react';

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

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterUnit, setFilterUnit] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalMoradores, setTotalMoradores] = useState(0);
  const [totalVeiculos, setTotalVeiculos] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', plate: '', model: '', color: '', type: 'CARRO', unitId: '' });

  const API_URL = '/api/veiculos';
  const UNIDADES_URL = '/api/unidades';

  useEffect(() => {
    setMounted(true);
    fetchVeiculos();
    fetchUnidades();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
    fetchTotals();
  }, []);

  const fetchTotals = async () => {
    try {
      const resM = await fetch('/api/moradores');
      const dataM = await resM.json();
      if (Array.isArray(dataM)) setTotalMoradores(dataM.length);
      
      const resV = await fetch('/api/veiculos');
      const dataV = await resV.json();
      if (Array.isArray(dataV)) setTotalVeiculos(dataV.length);
    } catch (e) { console.error(e); }
  };

  const fetchVeiculos = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
    
      if (Array.isArray(data)) {
        const sortedData = [...data].sort((a, b) => {
          const apA = a.unit ? `${a.unit.block}-${a.unit.number}` : 'ZZZ';
          const apB = b.unit ? `${b.unit.block}-${b.unit.number}` : 'ZZZ';
          return apA.localeCompare(apB, undefined, { numeric: true, sensitivity: 'base' });
        });
        setVeiculos(sortedData);
        setFetchError(null);
      } else {
        setVeiculos([]);
        setFetchError(data.message || 'Erro inesperado na API');
      }
    } catch (error: any) {
      console.error('Erro ao buscar veículos', error);
      setFetchError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch(UNIDADES_URL);
      const data = await res.json();
      const sortedData = Array.isArray(data) 
        ? [...data].sort((a, b) => {
            const apA = `${a.block}-${a.number}`;
            const apB = `${b.block}-${b.number}`;
            return apA.localeCompare(apB, undefined, { numeric: true, sensitivity: 'base' });
          })
        : [];
      setUnidades(sortedData);
    } catch (error) {
      console.error('Erro ao buscar unidades', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      let finalPayload: any;
      if (!isEditMode) {
        const { id, ...createPayload } = formData;
        finalPayload = createPayload;
      } else {
        finalPayload = formData;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchVeiculos();
        setFormData({ id: '', plate: '', model: '', color: '', type: 'CARRO', unitId: '' });
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar veículo', error);
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
      case 'BICICLETA': return <Bike size={18} />;
      case 'UTILITARIO': return <Truck size={18} />;
      default: return <Car size={18} />;
    }
  };

  const filteredVeiculos = veiculos.filter(v => {
    if (filterUnit === '') return true;
    return v.unitId === filterUnit;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Car size={32} /> Gestão de Veículos
          </h1>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {currentUser?.role !== 'MORADOR' && (
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-3 text-gray-400" size={18} />
                <select 
                  className="w-full md:w-auto pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white/80 backdrop-blur-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                >
                  <option value="">Todos os Apartamentos</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                </select>
              </div>
            )}

            <button 
              onClick={openCreateModal}
              className="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition shadow-md shrink-0"
            >
              <Plus size={20} />
              Novo Veículo
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 animate-pulse">
            <span className="font-bold">Aviso:</span> {fetchError}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Placa</th>
                  <th className="p-4 font-semibold">Marca/Modelo</th>
                  <th className="p-4 font-semibold">Cor</th>
                  <th className="p-4 font-semibold">Apartamento</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando veículos...</td></tr>
                ) : filteredVeiculos.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum veículo encontrado.</td></tr>
                ) : filteredVeiculos.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-white/50 transition">
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-primary">
                        {getTypeIcon(v.type)}
                        <span className="text-xs font-medium uppercase">{v.type}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold tracking-wider">{v.plate}</td>
                    <td className="p-4 font-medium">{v.model}</td>
                    <td className="p-4">{v.color}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Building size={14} /> {v.unit?.number} - {v.unit?.block}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      <button onClick={() => openEditModal(v)} className="text-primary hover:scale-110 transition"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:scale-110 transition"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50/50 font-bold text-gray-600 border-t-2 border-gray-100">
                <tr>
                  <td colSpan={3} className="p-4">Total de Moradores: {totalMoradores}</td>
                  <td colSpan={3} className="p-4 text-right">Total de Veículos: {totalVeiculos}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{isEditMode ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                <input required type="text" placeholder="Ex: ABC-1234" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" value={formData.plate} onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca/Modelo</label>
                  <input required type="text" placeholder="Ex: Honda Civic" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <input required type="text" placeholder="Ex: Preto" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Veículo</label>
                <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})}>
                  <option value="CARRO">Carro</option>
                  <option value="MOTO">Moto</option>
                  <option value="UTILITARIO">Utilitário</option>
                  <option value="BICICLETA">Bicicleta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apartamento Vinculado</label>
                <select 
                  required 
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none ${currentUser?.role === 'MORADOR' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                  value={formData.unitId} 
                  onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                  disabled={currentUser?.role === 'MORADOR'}
                >
                  <option value="">Selecione o Apartamento</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-opacity-90 shadow-lg transition">Salvar Veículo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
