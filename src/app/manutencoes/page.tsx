'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Wrench, Calendar, ArrowRight, AlertCircle } from 'lucide-react';

type Maintenance = {
  id: string;
  title: string;
  description?: string;
  observation?: string;
  performedAt: string;
  nextMaintenanceAt: string;
};

export default function ManutencoesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    observation: '',
    performedAt: '', 
    nextMaintenanceAt: '' 
  });

  const API_URL = '/api/manutencoes';

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const sortedData = [...data].sort((a, b) => new Date(a.nextMaintenanceAt).getTime() - new Date(b.nextMaintenanceAt).getTime());
      setMaintenances(sortedData);
    } catch (error) {
      console.error('Erro ao buscar manutenções', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMaintenances();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (error: any) {
      console.error('Erro ao salvar manutenção', error);
      alert(`Erro de conexão: ${error.message || 'Não foi possível alcançar o servidor'}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir registro de ${title}?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMaintenances();
    } catch (error) {
      console.error('Erro ao excluir manutenção', error);
    }
  };

  const openEditModal = (m: Maintenance) => {
    setFormData({ 
      id: m.id, 
      title: m.title, 
      description: m.description || '', 
      observation: m.observation || '',
      performedAt: m.performedAt.split('T')[0], 
      nextMaintenanceAt: m.nextMaintenanceAt.split('T')[0] 
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const filteredMaintenances = maintenances.filter(m => {
    if (filterYear === '') return true;
    return new Date(m.nextMaintenanceAt).getFullYear().toString() === filterYear;
  });

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Wrench size={32} className="text-primary" /> Cronograma de Manutenções
          </h1>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative flex items-center w-full md:w-auto">
              <Calendar className="absolute left-3 text-gray-400" size={18} />
              <select 
                className="w-full md:w-auto pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">Todos os Anos</option>
                {Array.from(new Set(maintenances.map(m => new Date(m.nextMaintenanceAt).getFullYear().toString()))).sort((a, b) => b.localeCompare(a)).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => { setFormData({id:'', title:'', description:'', observation:'', performedAt:'', nextMaintenanceAt:''}); setIsEditMode(false); setIsModalOpen(true); }}
              className="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition shadow-sm shrink-0"
            >
              <Plus size={20} /> Registrar Manutenção
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Tarefa / Equipamento</th>
                <th className="p-4 font-semibold">Realizada em</th>
                <th className="p-4 font-semibold">Próxima Manutenção</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Carregando...</td></tr>
              ) : filteredMaintenances.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma manutenção encontrada.</td></tr>
              ) : filteredMaintenances.map((m) => {
                const isOverdue = new Date(m.nextMaintenanceAt) < new Date();
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{m.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{m.description}</p>
                      {m.observation && <p className="text-[10px] text-primary mt-1 italic">Obs: {m.observation}</p>}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Calendar size={14} /> {new Date(m.performedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className={`flex items-center gap-2 font-medium ${isOverdue ? 'text-red-500' : 'text-primary'}`}>
                        <Calendar size={14} /> {new Date(m.nextMaintenanceAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4">
                      {isOverdue ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase bg-red-50 px-2 py-1 rounded">
                          <AlertCircle size={10} /> Vencida
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                          Em dia
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      <button onClick={() => openEditModal(m)} className="text-primary hover:bg-primary hover:bg-opacity-10 p-2 rounded-full transition"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(m.id, m.title)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Wrench size={20}/> {isEditMode ? 'Editar Registro' : 'Novo Registro'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título da Manutenção</label>
                <input type="text" required placeholder="Ex: Limpeza de Ar Condicionado, Elevadores..." className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição do Serviço</label>
                <textarea rows={2} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observações Internas</label>
                <textarea rows={2} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" value={formData.observation} onChange={(e) => setFormData({...formData, observation: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data Realizada</label>
                  <input type="date" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" value={formData.performedAt} onChange={(e) => setFormData({...formData, performedAt: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Próxima Data</label>
                  <input type="date" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" value={formData.nextMaintenanceAt} onChange={(e) => setFormData({...formData, nextMaintenanceAt: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 font-bold transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
