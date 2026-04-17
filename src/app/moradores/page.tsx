'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Building } from 'lucide-react';

type Unit = {
  id: string;
  number: string;
  block: string;
};

type User = {
  id: string;
  cpf: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  unitId?: string;
  unit?: Unit;
  ddd?: string;
  phone?: string;
};

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<User[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ cpf: '', name: '', email: '', password: '', unitId: '', ddd: '', phone: '' });

  const API_URL = '/api/moradores';
  const UNIDADES_URL = '/api/unidades';

  useEffect(() => {
    fetchMoradores();
    fetchUnidades();
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

  const fetchUnidades = async () => {
    try {
      const res = await fetch(UNIDADES_URL);
      const data = await res.json();
      setUnidades(data);
    } catch (error) {
      console.error('Erro ao buscar unidades', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_URL}/${formData.cpf}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload: any = { ...formData };
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
        setFormData({ cpf: '', name: '', email: '', password: '', unitId: '', ddd: '', phone: '' });
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
      if (res.ok) fetchMoradores();
    } catch (error) {
      console.error('Erro ao excluir morador', error);
    }
  };

  const openEditModal = (morador: User) => {
    setFormData({ 
      cpf: morador.cpf, 
      name: morador.name, 
      email: morador.email, 
      password: '', 
      unitId: morador.unitId || '',
      ddd: morador.ddd || '',
      phone: morador.phone || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ cpf: '', name: '', email: '', password: '', unitId: '', ddd: '', phone: '' });
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Nome</th>
                  <th className="p-4 font-semibold">CPF</th>
                  <th className="p-4 font-semibold">Apartamento</th>
                  <th className="p-4 font-semibold">E-mail</th>
                  <th className="p-4 font-semibold">Telefone</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
                ) : moradores.map((morador) => (
                  <tr key={morador.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{morador.name}</td>
                    <td className="p-4">{morador.cpf}</td>
                    <td className="p-4">
                      {morador.unit ? (
                        <span className="flex items-center gap-1 text-primary">
                          <Building size={14} /> {morador.unit.number} - {morador.unit.block}
                        </span>
                      ) : <span className="text-gray-400">Não vinculado</span>}
                    </td>
                    <td className="p-4">{morador.email}</td>
                    <td className="p-4">{morador.ddd ? `(${morador.ddd}) ` : ''}{morador.phone || '-'}</td>
                    <td className="p-4 flex justify-center gap-3">
                      <button onClick={() => openEditModal(morador)} className="text-primary"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(morador.cpf)} className="text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">{isEditMode ? 'Editar Morador' : 'Novo Morador'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="CPF" disabled={isEditMode} className="w-full p-2 border rounded" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
              <input type="text" placeholder="Nome" className="w-full p-2 border rounded" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="email" placeholder="E-mail" className="w-full p-2 border rounded" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Senha" className="w-full p-2 border rounded" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              
              <div className="flex gap-2">
                <input type="text" placeholder="DDD" className="w-1/4 p-2 border rounded" value={formData.ddd} onChange={(e) => setFormData({...formData, ddd: e.target.value})} />
                <input type="text" placeholder="Telefone" className="w-3/4 p-2 border rounded" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <select className="w-full p-2 border rounded bg-white" value={formData.unitId} onChange={(e) => setFormData({...formData, unitId: e.target.value})}>
                <option value="">Vincular Apartamento (Opcional)</option>
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
