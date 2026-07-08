'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Briefcase, Phone, Clock, Key } from 'lucide-react';

type Employee = {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  role: string;
  shift?: string;
  birthDate?: string;
};

export default function ColaboradoresPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', 
    name: '', 
    cpf: '', 
    email: '', 
    password: '', 
    phone: '', 
    role: 'PORTEIRO', 
    shift: 'Diurno',
    birthDate: '' 
  });

  const API_URL = '/api/colaboradores';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao buscar colaboradores', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!formData.id;
      const url = isEdit ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload: any = { ...formData };
      if (isEdit && !payload.password) delete payload.password;
      if (!payload.email) delete payload.email;

      console.log(`DEBUG: ID=${formData.id}, Modo=${isEdit ? 'ALTERAR' : 'CRIAR'}`);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        const text = await res.text();
        let errorMsg = 'Falha ao salvar';
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          errorMsg = `Erro ${res.status}: ${text.substring(0, 100) || 'Resposta vazia'}`;
        }
        alert(`Erro: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Erro ao salvar colaborador', error);
      alert(`Erro de conexão: ${error.message || 'Não foi possível alcançar o servidor'}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir colaborador ${name}?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEmployees();
    } catch (error) {
      console.error('Erro ao excluir colaborador', error);
    }
  };

  const openEditModal = (emp: Employee) => {
    setFormData({ 
      id: emp.id, 
      name: emp.name, 
      cpf: emp.cpf, 
      email: emp.email || '', 
      password: '', 
      phone: emp.phone || '', 
      role: emp.role, 
      shift: emp.shift || '',
      birthDate: emp.birthDate ? emp.birthDate.split('T')[0] : '' 
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Briefcase size={32} /> Gestão de Colaboradores
          </h1>
          <button 
            onClick={() => { setFormData({id:'', name:'', cpf:'', email:'', password:'', phone:'', role:'PORTEIRO', shift:'Diurno', birthDate:''}); setIsModalOpen(true); }}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Novo Colaborador
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <p className="col-span-full text-center">Carregando...</p> : 
            employees.map((emp) => (
              <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEditModal(emp)} className="text-gray-400 hover:text-primary"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(emp.id, emp.name)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>

                <div className="mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    emp.role === 'PORTEIRO' ? 'bg-blue-100 text-blue-700' : 
                    emp.role === 'ZELADOR' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {emp.role}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 mt-2">{emp.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <p>CPF: {emp.cpf}</p>
                    {emp.birthDate && <p>Nasc: {formatDate(emp.birthDate)}</p>}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Phone size={14} /> {emp.phone || 'Sem telefone'}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> Turno: {emp.shift || 'Não definido'}</div>
                  {emp.email && <div className="flex items-center gap-2 text-primary underline"><Search size={14} /> {emp.email}</div>}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-primary mb-6">{formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome Completo</label>
                <input type="text" required className="w-full p-2 border rounded" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CPF</label>
                  <input type="text" required disabled={!!formData.id} className="w-full p-2 border rounded" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Nascimento (Opcional)</label>
                  <input type="date" className="w-full p-2 border rounded" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cargo</label>
                <select className="w-full p-2 border rounded bg-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="PORTEIRO">Porteiro</option>
                  <option value="ZELADOR">Zelador</option>
                  <option value="LIMPEZA">Limpeza</option>
                  <option value="MANUTENCAO">Manutenção</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Turno de Trabalho</label>
                <input type="text" placeholder="Ex: 08:00 - 18:00, 12x36..." className="w-full p-2 border rounded" value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Key size={14}/> Dados de Acesso (Login)</h3>
                <div className="space-y-3">
                  <input type="email" placeholder="E-mail (Login)" className="w-full p-2 border rounded text-sm" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <input type="password" placeholder={formData.id ? "Nova senha (opcional)" : "Senha de Acesso"} className="w-full p-2 border rounded text-sm" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

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
