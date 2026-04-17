'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Home, Users, Car } from 'lucide-react';

type Resident = { name: string; cpf: string };
type ParkingSpace = { number: string; block: string };

type Unit = {
  id: string;
  number: string;
  block: string;
  residents?: Resident[];
  parkingSpaces?: ParkingSpace[];
};

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', number: '', block: '' });

  const API_URL = '/api/unidades';

  useEffect(() => {
    fetchUnidades();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: formData.number, block: formData.block })
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

  const handleDelete = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir este apartamento?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUnidades();
    } catch (error) {
      console.error('Erro ao excluir unidade', error);
    }
  };

  const openEditModal = (unidade: Unit) => {
    setFormData({ id: unidade.id, number: unidade.number, block: unidade.block });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Home size={32} /> Gestão de Apartamentos
          </h1>
          <button onClick={() => { setFormData({id:'', number:'', block:''}); setIsEditMode(false); setIsModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={20} /> Novo Apartamento
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <p className="col-span-full text-center p-8">Carregando...</p> : 
            unidades.map((u) => (
              <div key={u.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">Apto {u.number}</h3>
                    <p className="text-gray-500 font-medium">{u.block}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(u)} className="text-gray-400 hover:text-primary"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Users className="text-primary mt-1 shrink-0" size={16} />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Moradores</p>
                      <p className="text-sm text-gray-700">
                        {u.residents && u.residents.length > 0 
                          ? u.residents.map(r => r.name).join(', ') 
                          : 'Nenhum morador vinculado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Car className="text-primary mt-1 shrink-0" size={16} />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vagas</p>
                      <p className="text-sm text-gray-700">
                        {u.parkingSpaces && u.parkingSpaces.length > 0 
                          ? u.parkingSpaces.map(v => v.number).join(', ') 
                          : 'Nenhuma vaga vinculada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-primary mb-6">{isEditMode ? 'Editar Apartamento' : 'Novo Apartamento'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Número" className="w-full p-2 border rounded" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} />
              <input type="text" placeholder="Torre / Bloco" className="w-full p-2 border rounded" value={formData.block} onChange={(e) => setFormData({...formData, block: e.target.value})} />
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
