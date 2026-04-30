'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  FileText, 
  Building, 
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip
} from 'lucide-react';

type SyndicMessage = {
  id: string;
  unitId: string;
  userId: string;
  type: string;
  otherType?: string;
  description: string;
  attachmentUrl?: string;
  status: string;
  createdAt: string;
  unit?: { number: string; block: string };
  user?: { name: string; email: string };
};

const statusStyle: any = {
  PENDENTE: 'bg-amber-100 text-amber-700 border border-amber-200',
  EM_ANALISE: 'bg-blue-100 text-blue-700 border border-blue-200',
  RESOLVIDO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const statusLabel: any = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  RESOLVIDO: 'Resolvido',
};

const APP_VERSION = 'v1.0.41';

export default function FaleSindicoPage() {
  const [list, setList] = useState<SyndicMessage[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportMode, setIsReportMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: '',
    unitId: '',
    type: '',
    otherType: '',
    description: '',
    attachmentUrl: '',
  });

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const u = JSON.parse(userJson);
      setCurrentUser(u);
      // Se não for admin, redirecionar ou mostrar erro (conforme solicitado: disponível somente Admin)
      if (u.role !== 'SUPER_ADMIN') {
          // window.location.href = '/'; 
      }
    }
    fetchList();
    fetchUnidades();
  }, []);

  const fetchList = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('/api/fale-sindico', {
        headers: {
          'x-user-role': user.role || '',
          'x-user-unit': user.unitId || ''
        }
      });
      setList(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch('/api/unidades');
      setUnidades(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, ...data } = formData;
      const url = '/api/fale-sindico';
      const method = 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchList();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta solicitação?')) return;
    await fetch(`/api/fale-sindico/${id}`, { method: 'DELETE' });
    fetchList();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/fale-sindico/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchList();
  };

  const openCreate = () => {
    setFormData({ id: '', unitId: '', type: '', otherType: '', description: '', attachmentUrl: '' });
    setIsReportMode(false);
    setIsModalOpen(true);
  };

  const openView = (m: SyndicMessage) => {
    setFormData({
      id: m.id,
      unitId: m.unitId,
      type: m.type,
      otherType: m.otherType || '',
      description: m.description,
      attachmentUrl: m.attachmentUrl || '',
    });
    setIsReportMode(true);
    setIsModalOpen(true);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const inp = 'w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white';
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Esta funcionalidade está disponível apenas para administradores no momento.</p>
        <button onClick={() => window.location.href = '/'} className="mt-6 text-blue-600 font-semibold hover:underline">Voltar para o Início</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={26} className="text-blue-600" /> Fale com o Síndico
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestão de solicitações e comunicações</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-semibold shadow-md shadow-blue-200 text-sm">
          <Plus size={18} /> Nova Solicitação
        </button>
      </div>

      {/* Lista de Solicitações */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Solicitante</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Carregando...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma solicitação encontrada</td></tr>
              ) : list.map(m => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                  <td className="p-4 font-medium text-blue-600">
                    {m.unit?.number} - {m.unit?.block}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{m.user?.name}</td>
                  <td className="p-4 text-sm">
                    <span className="font-semibold">{m.type}</span>
                    {m.type === 'Outro' && m.otherType && <span className="text-slate-400 ml-1">({m.otherType})</span>}
                  </td>
                  <td className="p-4 text-sm text-slate-500">{formatDate(m.createdAt)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusStyle[m.status]}`}>
                      {statusLabel[m.status]}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openView(m)} className="text-slate-400 hover:text-blue-600 transition"><Search size={18} /></button>
                      <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
            <div className={`${isReportMode ? 'bg-slate-800' : 'bg-blue-600'} p-5 rounded-t-2xl text-white flex justify-between items-center`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare size={20} /> {isReportMode ? 'Detalhes da Solicitação' : 'Nova Solicitação ao Síndico'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={22} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Apartamento *</label>
                  <select required className={inp} value={formData.unitId} 
                    disabled={isReportMode}
                    onChange={e => setFormData({ ...formData, unitId: e.target.value })}>
                    <option value="">Selecione</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Tipo de Solicitação *</label>
                  <select required className={inp} value={formData.type}
                    disabled={isReportMode}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="">Selecione</option>
                    <option value="Reclamação">Reclamação</option>
                    <option value="Sugestão">Sugestão</option>
                    <option value="Dúvida">Dúvida</option>
                    <option value="Serviço">Serviço</option>
                    <option value="Autorização de utilização da vaga de garagem">Autorização de utilização da vaga de garagem</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {formData.type === 'Outro' && (
                <div>
                  <label className={lbl}>Especifique o Tipo *</label>
                  <input required type="text" className={inp} placeholder="Digite o tipo da solicitação"
                    disabled={isReportMode}
                    value={formData.otherType} onChange={e => setFormData({ ...formData, otherType: e.target.value })} />
                </div>
              )}

              <div>
                <label className={lbl}>Descrição da Solicitação *</label>
                <textarea required rows={5} className={`${inp} resize-none`} placeholder="Descreva detalhadamente sua solicitação..."
                  disabled={isReportMode}
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div>
                <label className={lbl}>Anexar Arquivos (Opcional)</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition bg-slate-50">
                    <Paperclip className="mx-auto text-slate-400 mb-1" size={20} />
                    <span className="text-xs text-slate-500 font-medium italic">Clique para anexar (Simulação)</span>
                  </div>
                </div>
              </div>

              {isReportMode && (
                <div className="border-t border-slate-100 pt-4">
                  <label className={lbl}>Alterar Status</label>
                  <div className="flex gap-2">
                    {['PENDENTE', 'EM_ANALISE', 'RESOLVIDO'].map(s => (
                      <button key={s} type="button" onClick={() => updateStatus(formData.id, s)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition ${formData.id ? (list.find(l => l.id === formData.id)?.status === s ? statusStyle[s] : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50') : ''}`}>
                        {statusLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">
                  {isReportMode ? 'Fechar' : 'Cancelar'}
                </button>
                {!isReportMode && (
                  <button type="submit" disabled={saving}
                    className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 text-sm">
                    {saving ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
        Estação do Mar Management Portal • {APP_VERSION}
      </div>
    </div>
  );
}
