'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Home } from 'lucide-react';

type Unit = {
  id: string;
  number: string;
  block: string;
  ownerId?: string;
  owner?: { name: string; cpf: string };
};

type User = {
  id: string;
  name: string;
  cpf: string;
};

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [moradores, setMoradores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', number: '', block: '', ownerId: '' });

  const API_URL = 'http://localhost:3000/unidades';
  const MORADORES_URL = 'http://localhost:3000/moradores';

  useEffect(() => {
    fetchUnidades();
    fetchMoradores();
  }, []);

  const fetchUnidades = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setUnidades(data);
    } catch (error) {
      console.error('Erro ao buscar unidades', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoradores = async () => {
    try {
      const res = await fetch(MORADORES_URL);
      const data = await res.json();
      setMoradores(data);
    } catch (error) {
      console.error('Erro ao buscar moradores', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload: any = { number: formData.number, block: formData.block };
      if (formData.ownerId) {
        payload.ownerId = formData.ownerId;
      } else {
        payload.ownerId = null; // desvincular se vazio
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUnidades();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar unidade', error);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Tem certeza que deseja excluir o apartamento ${number}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUnidades();
      }
    } catch (error) {
      console.error('Erro ao excluir unidade', error);
    }
  };

  const openEditModal = (unidade: Unit) => {
    setFormData({ 
      id: unidade.id, 
      number: unidade.number, 
      block: unidade.block, 
      ownerId: unidade.ownerId || '' 
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ id: '', number: '', block: '', ownerId: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Home className="text-primary" size={32} />
            Gestão de Apartamentos
          </h1>
          <button 
            onClick={openCreateModal}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition"
          >
            <Plus size={20} />
            Novo Apartamento
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar unidade ou morador..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Número / Apto</th>
                  <th className="p-4 font-semibold">Torre / Bloco</th>
                  <th className="p-4 font-semibold">Morador / Proprietário</th>
                  <th className="p-4 font-semibold">CPF</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Carregando dados...</td>
                  </tr>
                ) : unidades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum apartamento cadastrado.</td>
                  </tr>
                ) : (
                  unidades.map((unidade) => (
                    <tr key={unidade.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{unidade.number}</td>
                      <td className="p-4">{unidade.block}</td>
                      <td className="p-4">
                        {unidade.owner ? (
                          <span className="bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-md text-sm font-medium">{unidade.owner.name}</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">Vago</span>
                        )}
                      </td>
                      <td className="p-4">{unidade.owner ? unidade.owner.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-'}</td>
                      <td className="p-4 flex justify-center gap-3">
                        <button 
                          onClick={() => openEditModal(unidade)}
                          className="text-primary hover:text-opacity-80 transition"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(unidade.id, unidade.number)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-primary">
                {isEditMode ? 'Editar Apartamento' : 'Novo Apartamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Apartamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 101, 1204..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Torre / Bloco</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Torre A, Bloco 2..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.block}
                  onChange={(e) => setFormData({...formData, block: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Morador Responsável (Opcional)</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary bg-white"
                  value={formData.ownerId}
                  onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
                >
                  <option value="">Vago (Sem morador)</option>
                  {moradores.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - CPF: {m.cpf}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-opacity-90 font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
