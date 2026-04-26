'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Building } from 'lucide-react';

type Unit = {
  id: string;
  number: string;
  block: string;
};

type ParkingSpace = {
  id: string;
  number: string;
  block: string;
  unitId?: string;
  unit?: Unit;
};

export default function VagasPage() {
  const [vagas, setVagas] = useState<ParkingSpace[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState('');
  const [totalMoradores, setTotalMoradores] = useState(0);
  const [totalVeiculos, setTotalVeiculos] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', number: '', block: '', unitId: '' });

  const API_URL = '/api/vagas';
  const UNIDADES_URL = '/api/unidades';

  useEffect(() => {
    fetchVagas();
    fetchUnidades();
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

  const fetchVagas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const sortedData = [...data].sort((a, b) => {
        const apA = a.unit ? `${a.unit.block}-${a.unit.number}` : `ZZZ-${a.block}-${a.number}`;
        const apB = b.unit ? `${b.unit.block}-${b.unit.number}` : `ZZZ-${b.block}-${b.number}`;
        return apA.localeCompare(apB, undefined, { numeric: true, sensitivity: 'base' });
      });
      setVagas(sortedData);
    } catch (error) {
      console.error('Erro ao buscar vagas', error);
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
      
      const payload: any = { number: formData.number, block: formData.block };
      payload.unitId = formData.unitId || null;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchVagas();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar vaga', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir esta vaga?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVagas();
    } catch (error) {
      console.error('Erro ao excluir vaga', error);
    }
  };

  const openEditModal = (vaga: ParkingSpace) => {
    setFormData({ id: vaga.id, number: vaga.number, block: vaga.block, unitId: vaga.unitId || '' });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ id: '', number: '', block: '', unitId: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const filteredVagas = vagas.filter(v => {
    if (filterUnit === '') return true;
    if (filterUnit === 'none') return !v.unitId;
    return v.unitId === filterUnit;
  });

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-primary">Gestão de Vagas</h1>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative flex items-center w-full md:w-auto">
              <Search className="absolute left-3 text-gray-400" size={18} />
              <select 
                className="w-full md:w-auto pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
              >
                <option value="">Todos os Apartamentos</option>
                <option value="none">Não vinculadas</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
              </select>
            </div>

            <button onClick={openCreateModal} className="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition shadow-sm shrink-0">
              <Plus size={20} /> Nova Vaga
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Vaga</th>
                  <th className="p-4 font-semibold">Setor/Bloco</th>
                  <th className="p-4 font-semibold">Apartamento Vinculado</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center">Carregando...</td></tr>
                ) : filteredVagas.map((vaga) => (
                  <tr key={vaga.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{vaga.number}</td>
                    <td className="p-4">{vaga.block}</td>
                    <td className="p-4">
                      {vaga.unit ? (
                        <span className="flex items-center gap-1 text-primary">
                          <Building size={14} /> {vaga.unit.number} - {vaga.unit.block}
                        </span>
                      ) : <span className="text-gray-400">Não vinculada</span>}
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      <button onClick={() => openEditModal(vaga)} className="text-primary"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(vaga.id)} className="text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold text-gray-600 border-t-2 border-gray-100">
                <tr>
                  <td colSpan={2} className="p-4 text-left">Total de Moradores: {totalMoradores}</td>
                  <td colSpan={2} className="p-4 text-right">Total de Veículos: {totalVeiculos}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">{isEditMode ? 'Editar Vaga' : 'Nova Vaga'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Número da Vaga" className="w-full p-2 border rounded" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} />
              <input type="text" placeholder="Bloco/Setor" className="w-full p-2 border rounded" value={formData.block} onChange={(e) => setFormData({...formData, block: e.target.value})} />
              
              <select className="w-full p-2 border rounded bg-white" value={formData.unitId} onChange={(e) => setFormData({...formData, unitId: e.target.value})}>
                <option value="">Pertence a qual Apartamento? (Opcional)</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
              </select>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
