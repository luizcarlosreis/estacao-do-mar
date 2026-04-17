'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

type User = {
  id: string;
  cpf: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ cpf: '', name: '', email: '', password: '' });

  const API_URL = 'http://localhost:3000/moradores';

  useEffect(() => {
    fetchMoradores();
  }, []);

  const fetchMoradores = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setMoradores(data);
    } catch (error) {
      console.error('Erro ao buscar moradores', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_URL}/${formData.cpf}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload = { ...formData };
      if (isEditMode && !payload.password) {
        delete payload.password; // Não envia senha se estiver vazia na edição
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMoradores();
        setFormData({ cpf: '', name: '', email: '', password: '' });
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar morador', error);
    }
  };

  const handleDelete = async (cpf: string) => {
    if (!confirm(`Tem certeza que deseja excluir o morador com CPF ${cpf}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${cpf}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMoradores();
      }
    } catch (error) {
      console.error('Erro ao excluir morador', error);
    }
  };

  const openEditModal = (morador: User) => {
    setFormData({ cpf: morador.cpf, name: morador.name, email: morador.email, password: '' });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ cpf: '', name: '', email: '', password: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Gestão de Moradores</h1>
          <button 
            onClick={openCreateModal}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition"
          >
            <Plus size={20} />
            Novo Morador
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou CPF..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Nome</th>
                  <th className="p-4 font-semibold">CPF</th>
                  <th className="p-4 font-semibold">E-mail</th>
                  <th className="p-4 font-semibold">Cadastro em</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Carregando dados...</td>
                  </tr>
                ) : moradores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum morador encontrado.</td>
                  </tr>
                ) : (
                  moradores.map((morador) => (
                    <tr key={morador.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{morador.name}</td>
                      <td className="p-4">{morador.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                      <td className="p-4">{morador.email}</td>
                      <td className="p-4">{new Date(morador.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 flex justify-center gap-3">
                        <button 
                          onClick={() => openEditModal(morador)}
                          className="text-primary hover:text-opacity-80 transition"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(morador.cpf)}
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
                {isEditMode ? 'Editar Morador' : 'Novo Morador'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF (apenas números)</label>
                <input
                  type="text"
                  required
                  disabled={isEditMode}
                  maxLength={11}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {isEditMode && <span className="text-xs text-gray-500 font-normal">(Deixe em branco para manter a atual)</span>}
                </label>
                <input
                  type="password"
                  required={!isEditMode}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
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
