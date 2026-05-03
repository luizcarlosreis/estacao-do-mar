'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  X,
  Search,
  Calendar,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'CANCELED' | 'DONE';
  performedAt?: string;
  createdAt: string;
};

const statusConfig = {
  BACKLOG: { label: 'Backlog', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: <ListTodo size={14} /> },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500', icon: <Clock size={14} /> },
  DONE: { label: 'Realizada', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', icon: <CheckCircle2 size={14} /> },
  CANCELED: { label: 'Cancelada', color: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500', icon: <XCircle size={14} /> },
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.0.90-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.0.90';

export default function TarefasPage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    status: 'BACKLOG' as Task['status'], 
    performedAt: '' 
  });

  const API_URL = '/api/tarefas';

  useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar tarefas', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        alert(`Erro: ${text}`);
      }
    } catch (error: any) {
      alert(`Erro de conexão: ${error.message}`);
    } finally {
      setSaving(false);
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

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ListTodo size={28} className="text-blue-600" />
              TAREFAS & MANUTENÇÕES
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">
              Gestão operacional do Estação do Mar
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="BUSCAR TAREFA..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setFormData({id:'', title:'', description:'', status:'BACKLOG', performedAt:''}); setIsModalOpen(true); }}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} /> Nova Tarefa
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {(['BACKLOG', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const).map((status) => (
            <div key={status} className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`} />
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {statusConfig[status].label}
                  </h2>
                  <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {filteredTasks.filter(t => t.status === status).length}
                  </span>
                </div>
              </div>

              <div className="space-y-3 min-h-[500px] bg-slate-100/50 p-2 rounded-2xl border border-slate-200/60 border-dashed">
                {loading ? (
                  <div className="py-10 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</div>
                ) : filteredTasks.filter(t => t.status === status).length === 0 ? (
                  <div className="py-10 text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">Vazio</div>
                ) : (
                  filteredTasks
                    .filter(t => t.status === status)
                    .sort((a, b) => {
                      if (status === 'DONE' && a.performedAt && b.performedAt) {
                        return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-white p-3 rounded-xl shadow-sm border border-slate-200/60 group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative"
                      onClick={() => openEditModal(task)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${statusConfig[task.status].color}`}>
                          {statusConfig[task.status].label}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                            className="p-1 text-slate-300 hover:text-rose-500 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-[11px] leading-tight mb-1 uppercase break-words">{task.title}</h3>
                      {task.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug mb-2 lowercase first-letter:uppercase">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                          <Calendar size={10} />
                          {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        {task.status === 'DONE' && task.performedAt && (
                          <div className="text-[9px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} />
                            {task.performedAt.split('T')[0].split('-').reverse().join('/')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ListTodo size={18} /> {formData.id ? 'Editar Atividade' : 'Nova Atividade'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título da Tarefa</label>
                <input 
                  type="text" required 
                  placeholder="EX: TROCA DE LÂMPADAS BLOCO A"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800 uppercase"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descrição / Detalhes</label>
                <textarea 
                  rows={3} 
                  placeholder="DETALHAMENTO DA ATIVIDADE..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-medium text-slate-700 uppercase"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status Atual</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700 appearance-none"
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="BACKLOG">BACKLOG</option>
                    <option value="IN_PROGRESS">EM ANDAMENTO</option>
                    <option value="DONE">REALIZADA</option>
                    <option value="CANCELED">CANCELADA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Realização</label>
                  <input 
                    type="date" 
                    disabled={formData.status !== 'DONE'} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700 disabled:opacity-50"
                    value={formData.performedAt} 
                    onChange={(e) => setFormData({...formData, performedAt: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
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
                  {saving ? 'Gravando...' : 'Salvar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-12 text-center pb-8">
        <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
