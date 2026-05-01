'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, ListTodo, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'CANCELED' | 'DONE';
  performedAt?: string;
  createdAt: string;
};

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    status: 'BACKLOG' as Task['status'], 
    performedAt: '' 
  });

  const API_URL = '/api/tarefas';

  useEffect(() => {
    fetchTasks();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Erro ao buscar tarefas', error);
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
      
      const payload: any = { 
        ...formData,
        title: formData.title.toUpperCase(),
        description: formData.description?.toUpperCase() || ''
      };

      if (!payload.performedAt) delete payload.performedAt;

      console.log(`DEBUG: ID=${formData.id}, Modo=${isEdit ? 'ALTERAR' : 'CRIAR'}`);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTasks();
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
      console.error('Erro ao salvar tarefa', error);
      alert(`Erro de conexão: ${error.message || 'Não foi possível alcançar o servidor'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir esta tarefa?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTasks();
    } catch (error) {
      console.error('Erro ao excluir tarefa', error);
    }
  };

  const openEditModal = (t: Task) => {
    setFormData({ 
      id: t.id, 
      title: t.title, 
      description: t.description || '', 
      status: t.status, 
      performedAt: t.performedAt ? t.performedAt.split('T')[0] : '' 
    });
    setIsModalOpen(true);
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'BACKLOG': return <ListTodo size={16} className="text-gray-400" />;
      case 'IN_PROGRESS': return <Clock size={16} className="text-blue-500" />;
      case 'DONE': return <CheckCircle size={16} className="text-green-500" />;
      case 'CANCELED': return <XCircle size={16} className="text-red-400" />;
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'BACKLOG': return 'Backlog';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'DONE': return 'Realizada';
      case 'CANCELED': return 'Cancelada';
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <ListTodo size={32} /> Backlog de Atividades
          </h1>
          <button 
            onClick={() => { setFormData({id:'', title:'', description:'', status:'BACKLOG', performedAt:''}); setIsModalOpen(true); }}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Nova Tarefa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['BACKLOG', 'IN_PROGRESS', 'DONE', 'CANCELED'].map((groupStatus) => (
            <div key={groupStatus} className="bg-gray-50 bg-opacity-50 rounded-xl p-4 border border-dashed border-gray-200 min-h-[400px]">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                {getStatusIcon(groupStatus as Task['status'])}
                {getStatusLabel(groupStatus as Task['status'])}
              </h2>

              <div className="space-y-3">
                {loading ? <p className="text-xs text-gray-400 text-center">Carregando...</p> : 
                  tasks.filter(t => t.status === groupStatus).map((task) => (
                    <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 group relative hover:shadow-md transition">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEditModal(task)} className="text-gray-400 hover:text-primary"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                      
                      {task.status === 'DONE' && task.performedAt && (
                        <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded inline-block">
                          Realizada em: {formatDate(task.performedAt)}
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-primary mb-6">{formData.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                <input type="text" required className="w-full p-2 border rounded-lg" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea rows={3} className="w-full p-2 border rounded-lg text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                    <option value="BACKLOG">Backlog</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="DONE">Realizada</option>
                    <option value="CANCELED">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data Conclusão</label>
                  <input type="date" disabled={formData.status !== 'DONE'} className="w-full p-2 border rounded-lg text-sm disabled:bg-gray-50" value={formData.performedAt} onChange={(e) => setFormData({...formData, performedAt: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
