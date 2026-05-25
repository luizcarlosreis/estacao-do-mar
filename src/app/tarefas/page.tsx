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
  Download,
  Paperclip,
  Filter,
  FileSpreadsheet,
  User,
  LayoutGrid
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import * as XLSX from 'xlsx';

type Task = {
  id: string;
  number?: number;
  title: string;
  description?: string;
  status: 'SOLICITADA_MORADOR' | 'BACKLOG' | 'IN_PROGRESS' | 'CANCELED' | 'DONE';
  performedAt?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  user?: { id: string; name: string };
  unit?: { block: string; number: string };
};

const statusConfig = {
  SOLICITADA_MORADOR: { label: 'Solicitada pelo Morador', color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500', icon: <User size={14} /> },
  BACKLOG: { label: 'Backlog', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: <ListTodo size={14} /> },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500', icon: <Clock size={14} /> },
  DONE: { label: 'Realizada', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', icon: <CheckCircle2 size={14} /> },
  CANCELED: { label: 'Cancelada', color: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500', icon: <XCircle size={14} /> },
};

const statusOrder = {
  SOLICITADA_MORADOR: 1,
  BACKLOG: 2,
  IN_PROGRESS: 3,
  DONE: 4,
  CANCELED: 5
};



const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function TarefasPage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Alternador de Visualização e Paginação
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Limites visíveis no Kanban (Alternativa B)
  const [visibleLimits, setVisibleLimits] = useState<Record<Task['status'], number>>({
    SOLICITADA_MORADOR: 5,
    BACKLOG: 5,
    IN_PROGRESS: 5,
    DONE: 5,
    CANCELED: 5
  });

  // Filtros de Data (Inicia com o ano corrente)
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    status: 'BACKLOG' as Task['status'], 
    performedAt: '',
    attachmentUrl: '',
    attachmentName: ''
  });

  const API_URL = '/api/tarefas';

  useEffect(() => {
    setMounted(true);
    fetchTasks();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setVisibleLimits({
      SOLICITADA_MORADOR: 5,
      BACKLOG: 5,
      IN_PROGRESS: 5,
      DONE: 5,
      CANCELED: 5
    });
  }, [searchTerm, filterYear, filterMonth]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo é muito grande. Tamanho máximo permitido: 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        attachmentUrl: reader.result as string,
        attachmentName: file.name
      }));
    };
    reader.readAsDataURL(file);
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

      if (!isEdit && currentUser) {
        payload.userId = currentUser.id;
        if (currentUser.unitId) payload.unitId = currentUser.unitId;
      } else if (isEdit && currentUser && currentUser.role !== 'MORADOR') {
        const taskObj = tasks.find(t => t.id === formData.id);
        if (taskObj && !taskObj.user) {
          payload.userId = currentUser.id;
        }
      }

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
      performedAt: t.performedAt ? t.performedAt.split('T')[0] : '',
      attachmentUrl: t.attachmentUrl || '',
      attachmentName: t.attachmentName || ''
    });
    setIsModalOpen(true);
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const filteredTasks = tasks.filter(t => {
    if (currentUser?.role === 'MORADOR' && t.user?.id !== currentUser.id) return false;

    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterYear !== 'ALL' || filterMonth !== 'ALL') {
      const dateToUse = (t.status === 'DONE' && t.performedAt) ? new Date(t.performedAt) : new Date(t.createdAt);
      const perfYear = dateToUse.getUTCFullYear().toString();
      const perfMonth = (dateToUse.getUTCMonth() + 1).toString();
      if (filterYear !== 'ALL' && perfYear !== filterYear) return false;
      if (filterMonth !== 'ALL' && perfMonth !== filterMonth) return false;
    }
    return true;
  });

  // Ordenar para a Lista conforme a prioridade dos status
  const sortedListTasks = [...filteredTasks].sort((a, b) => {
    const orderA = statusOrder[a.status as keyof typeof statusOrder] || 99;
    const orderB = statusOrder[b.status as keyof typeof statusOrder] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // Se o status for o mesmo, ordena por data de criação decrescente (mais recente primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Cálculos para paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = sortedListTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const exportToExcel = () => {
    if (filteredTasks.length === 0) return alert('Nenhuma tarefa para exportar.');

    const data = filteredTasks.map(t => ({
      'NÚMERO': t.number ? `#${t.number}` : '—',
      'TÍTULO': t.title,
      'DESCRIÇÃO': t.description || '—',
      'STATUS': statusConfig[t.status].label.toUpperCase(),
      'DATA REALIZAÇÃO': t.performedAt ? t.performedAt.split('T')[0].split('-').reverse().join('/') : '—',
      'DATA CRIAÇÃO': new Date(t.createdAt).toLocaleDateString('pt-BR'),
      'POSSUI ANEXO': t.attachmentUrl ? 'SIM' : 'NÃO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarefas');
    
    // Auto-ajuste de colunas
    const colWidths = [
      { wch: 40 }, // Título
      { wch: 60 }, // Descrição
      { wch: 15 }, // Status
      { wch: 20 }, // Data Realização
      { wch: 20 }, // Data Criação
      { wch: 15 }  // Anexo
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `relatorio_tarefas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const availableYears = Array.from(new Set(tasks
    .map(t => {
      const dateToUse = (t.status === 'DONE' && t.performedAt) ? new Date(t.performedAt) : new Date(t.createdAt);
      return dateToUse.getUTCFullYear().toString();
    })
  )).sort((a, b) => b.localeCompare(a));

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ListTodo size={28} className="text-blue-600" />
              TAREFAS
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">
              Gestão operacional do Estação do Mar
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* Filtros de Data */}
            {currentUser?.role !== 'MORADOR' && (
              <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5 px-2 text-slate-400 border-r border-slate-100 pr-3">
                  <Filter size={14} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Filtros</span>
                </div>
                
                <select 
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-slate-600 outline-none px-2 py-1 cursor-pointer"
                >
                  <option value="ALL">TODOS OS ANOS</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select 
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-slate-600 outline-none px-2 py-1 cursor-pointer border-l border-slate-100"
                >
                  <option value="ALL">TODOS OS MESES</option>
                  {months.map((m, i) => (
                    <option key={i} value={(i + 1).toString()}>{m.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Alternador de Visualização */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto justify-center">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  viewMode === 'kanban'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid size={12} />
                Quadro
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ListTodo size={12} />
                Lista
              </button>
            </div>

            {/* Busca e Ações */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="BUSCAR TAREFA..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {currentUser?.role !== 'MORADOR' && (
                <button 
                  onClick={exportToExcel}
                  className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center gap-2"
                  title="Exportar Excel"
                >
                  <FileSpreadsheet size={18} />
                  <span className="hidden lg:inline text-[10px] font-black uppercase tracking-wider">Exportar</span>
                </button>
              )}
            </div>

            <button 
              onClick={() => { setFormData({id:'', title:'', description:'', status: currentUser?.role === 'MORADOR' ? 'SOLICITADA_MORADOR' : 'BACKLOG', performedAt:'', attachmentUrl:'', attachmentName:''}); setIsModalOpen(true); }}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <Plus size={16} /> {currentUser?.role === 'MORADOR' ? 'Solicitação de Reparos no Condomínio' : 'Nova Tarefa'}
            </button>
          </div>
        </div>

        {/* Info Card - Janitor Role and Services */}
        <div className="mb-8 bg-white rounded-3xl p-6 md:p-8 border border-blue-100 shadow-sm overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-50 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10">
            <h2 className="text-blue-700 text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              O Zelador e a Manutenção do Condomínio
            </h2>
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              <div className="flex-1">
                <p className="text-slate-600 text-[13px] leading-relaxed font-medium">
                  O zelador de condomínio é o profissional que realiza supervisão predial, acompanha a manutenção preventiva, apoia a segurança e atua como elo entre síndico, moradores e fornecedores. Organiza rotinas, distribui tarefas e garante o bom funcionamento das áreas comuns, realiza vistorias diárias em corredores, halls, garagem, salão de festas, piscinas e demais espaços.
                </p>
                <p className="mt-5 text-slate-900 text-[13px] font-black leading-relaxed">
                  Neste sentido, caso necessite dos serviços descritos ao lado para nosso condomínio, abra um chamado para que o mesmo possa ser realizado.
                </p>
              </div>
              <div className="w-full xl:w-[450px] bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {[
                  "Manutenção elétrica",
                  "Troca de luminária queimada",
                  "Limpeza e conservação",
                  "Cuidados com jardim",
                  "Manutenção de elevadores",
                  "Reparos no portão e porta de entrada"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-[10px] text-slate-700 font-black uppercase tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Board or List View */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4 animate-in fade-in duration-200">
            {(['SOLICITADA_MORADOR', 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const).map((status) => (
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
                    <>
                      {(() => {
                        const statusTasks = filteredTasks
                          .filter(t => t.status === status)
                          .sort((a, b) => {
                            if (status === 'DONE' && a.performedAt && b.performedAt) {
                              return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
                            }
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                          });
                        
                        const visibleTasks = statusTasks.slice(0, visibleLimits[status]);
                        
                        return (
                          <>
                            {visibleTasks.map((task) => (
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
                                    {task.attachmentUrl && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); downloadFile(task.attachmentUrl!, task.attachmentName || 'anexo'); }}
                                        className="p-1 text-blue-400 hover:text-blue-600 transition"
                                        title="Baixar Anexo"
                                      >
                                        <Download size={12} />
                                      </button>
                                    )}
                                    {(task.status === 'SOLICITADA_MORADOR' || currentUser?.role !== 'MORADOR') && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                        className="p-1 text-slate-300 hover:text-rose-500 transition"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                <h3 className="font-bold text-slate-800 text-[11px] leading-tight mb-1 uppercase break-words">
                                  {task.number ? <span className="text-blue-600 mr-1">#{task.number}</span> : null}
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug mb-2 lowercase first-letter:uppercase">{task.description}</p>
                                )}
                                
                                {(task.user || task.unit) && (
                                  <div className="flex items-center gap-1.5 mt-2 mb-2 text-[9px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <User size={10} className="text-slate-400" />
                                    <span className="font-bold truncate uppercase">{task.user?.name || 'DESCONHECIDO'}</span>
                                    {task.unit && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-black text-slate-600">AP {task.unit.number}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                                      <Calendar size={10} />
                                      {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                    {task.attachmentUrl && (
                                      <div className="flex items-center gap-1 text-[9px] text-blue-500 font-bold uppercase">
                                        <Paperclip size={10} />
                                        ANEXO
                                      </div>
                                    )}
                                  </div>
                                  {task.status === 'DONE' && task.performedAt && (
                                    <div className="text-[9px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      <CheckCircle2 size={10} />
                                      {task.performedAt.split('T')[0].split('-').reverse().join('/')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {statusTasks.length > visibleLimits[status] && (
                              <button
                                type="button"
                                onClick={() => setVisibleLimits(prev => ({ ...prev, [status]: prev[status] + 5 }))}
                                className="w-full py-2.5 mt-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-[9px] font-black text-slate-500 hover:text-slate-700 transition uppercase tracking-wider text-center shadow-sm flex items-center justify-center gap-1.5 duration-200"
                              >
                                <span>Ver Mais (+{statusTasks.length - visibleLimits[status]})</span>
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Número</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tarefa</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Solicitante</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Data Criação</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Realização</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right min-w-[125px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                        Carregando tarefas...
                      </td>
                    </tr>
                  ) : currentTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                        Nenhuma tarefa encontrada
                      </td>
                    </tr>
                  ) : (
                    currentTasks.map((task) => (
                      <tr 
                        key={task.id} 
                        className="hover:bg-slate-50/50 transition cursor-pointer group"
                        onClick={() => openEditModal(task)}
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-black text-blue-600 text-[11px]">
                            {task.number ? `#${task.number}` : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-md">
                            <h3 className="font-bold text-slate-800 text-[11px] uppercase truncate">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5 lowercase first-letter:uppercase">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${statusConfig[task.status].color}`}>
                            {statusConfig[task.status].label}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {(task.user || task.unit) ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold">
                              <span className="uppercase truncate max-w-[120px]">{task.user?.name || 'DESCONHECIDO'}</span>
                              {task.unit && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-black text-slate-500">AP {task.unit.number}</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-[10px] text-slate-500 font-bold">
                          {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {task.status === 'DONE' && task.performedAt ? (
                            <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-1.5 py-0.5 rounded">
                              {task.performedAt.split('T')[0].split('-').reverse().join('/')}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right min-w-[125px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {task.attachmentUrl && (
                              <button 
                                onClick={() => downloadFile(task.attachmentUrl!, task.attachmentName || 'anexo')}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                title="Baixar Anexo"
                              >
                                <Download size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => openEditModal(task)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            {(task.status === 'SOLICITADA_MORADOR' || currentUser?.role !== 'MORADOR') && (
                              <button 
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50/50 border-t border-slate-100 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Exibindo {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredTasks.length)} de {filteredTasks.length} tarefas
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase text-slate-500 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-black uppercase transition ${
                          currentPage === pageNum
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase text-slate-500 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
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
                  rows={2} 
                  placeholder="DETALHAMENTO DA ATIVIDADE..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-medium text-slate-700 uppercase"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              {currentUser?.role !== 'MORADOR' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={formData.status === 'DONE' ? 'col-span-1' : 'col-span-2'}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status Atual</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700 appearance-none disabled:opacity-50"
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      disabled={!formData.id}
                    >
                      <option value="SOLICITADA_MORADOR">SOLICITADA PELO MORADOR</option>
                      <option value="BACKLOG">BACKLOG</option>
                      <option value="IN_PROGRESS">EM ANDAMENTO</option>
                      <option value="DONE">REALIZADA</option>
                      <option value="CANCELED">CANCELADA</option>
                    </select>
                  </div>
                  {formData.status === 'DONE' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Realização</label>
                      <input 
                        type="date" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700"
                        value={formData.performedAt} 
                        onChange={(e) => setFormData({...formData, performedAt: e.target.value})} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Upload de Arquivo */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Anexo (Opcional - PDF ou JPG máx 2MB)</label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    id="task-file"
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="task-file"
                    className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition bg-slate-50"
                  >
                    <Paperclip size={16} className={formData.attachmentUrl ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      {formData.attachmentName || 'Selecionar Arquivo'}
                    </span>
                  </label>
                  {formData.attachmentUrl && (
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[9px] text-blue-600 font-bold italic truncate max-w-[200px]">Arquivo carregado</span>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, attachmentUrl: '', attachmentName: '' }))}
                        className="text-[9px] text-red-500 font-bold uppercase hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
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
