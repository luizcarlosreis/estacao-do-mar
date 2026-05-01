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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type SyndicMessage = {
  id: string;
  number: number;
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

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.0.62-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.0.62';

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
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      });
    fetchList();
    fetchUnidades();
  }, []);

  const fetchList = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Adiciona timestamp para evitar cache do navegador
      const res = await fetch(`/api/fale-sindico?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      console.log('Frontend: Lista de mensagens recebida:', data);
      setList(data);
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
        const savedData = await res.json();
        setIsModalOpen(false);
        fetchList();

        try {
          const doc = createFaleSindicoPDF(savedData);
          const pdfBase64 = doc.output('datauristring').split(',')[1];
          
          console.log('Frontend: Iniciando disparo de e-mail automático...');
          const emailRes = await fetch('/api/send-fale-sindico-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64,
              ticketNumber: savedData.number,
              type: savedData.type,
              unitInfo: `${savedData.unit?.number} - ${savedData.unit?.block}`
            })
          });
          
          if (emailRes.ok) {
            console.log('Frontend: E-mail enviado com sucesso!');
            alert('Solicitação enviada e PDF encaminhado por e-mail com sucesso!');
          } else {
            const emailData = await emailRes.json();
            console.error('Frontend: Erro retornado pela API de e-mail:', emailData);
            alert(`Atenção: A solicitação foi salva, mas houve um erro no envio do e-mail: ${emailData.message || 'Erro desconhecido'}`);
          }
        } catch (emailErr) {
          console.error('Frontend: Erro crítico ao processar e-mail:', emailErr);
          alert('A solicitação foi salva, mas houve um erro ao processar o envio do e-mail. Verifique o console para detalhes.');
        }
      } else {
        let errorMsg = 'Erro desconhecido no servidor';
        try {
          const err = await res.json();
          errorMsg = err.message || errorMsg;
        } catch (parseError) {
          errorMsg = `Erro ${res.status}: O servidor não retornou uma resposta válida. Verifique se a tabela foi criada no banco de dados.`;
        }
        alert(`Erro ao Gravar: ${errorMsg}`);
      }
    } catch (e: any) { 
      console.error(e); 
      alert(`Erro de Conexão: Não foi possível alcançar o servidor. Detalhe: ${e.message}`);
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/fale-sindico/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Solicitação excluída com sucesso!');
        fetchList();
      } else {
        const err = await res.json();
        alert(`Erro ao excluir: ${err.message}`);
      }
    } catch (e: any) {
      alert(`Erro de conexão ao excluir: ${e.message}`);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/fale-sindico/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchList();
  };

  const createFaleSindicoPDF = (m: SyndicMessage) => {
    const doc = new jsPDF();
    
    // Configurações do Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(147, 51, 234); // purple-600
    doc.text('ESTAÇÃO DO MAR', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('SOLICITAÇÃO AO SÍNDICO', 105, 30, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Dados da Solicitação
    doc.setFontSize(12);
    doc.setTextColor(147, 51, 234);
    doc.text('Detalhes da Solicitação', 14, 45);
    
    const body = [
      ['Nº Ticket:', `#${m.number || '—'}`],
      ['Apartamento:', `${m.unit?.number || ''} - ${m.unit?.block || ''}`],
      ['Solicitante:', m.user?.name || '—'],
      ['Tipo:', m.type === 'Outro' ? `Outro (${m.otherType})` : m.type],
      ['Status:', statusLabel[m.status] || m.status],
      ['Data de Registro:', formatDate(m.createdAt)]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Campo', 'Informação']],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // Descrição
    doc.setFontSize(12);
    doc.setTextColor(147, 51, 234);
    doc.text('Descrição', 14, (doc as any).lastAutoTable.finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    
    const splitDescription = doc.splitTextToSize(m.description || 'Sem descrição.', 180);
    doc.text(splitDescription, 14, (doc as any).lastAutoTable.finalY + 22);

    // Anexo info
    if (m.attachmentUrl) {
      doc.setFontSize(10);
      doc.setTextColor(147, 51, 234);
      doc.text('* Esta solicitação contém um arquivo anexo no sistema.', 14, (doc as any).lastAutoTable.finalY + 25 + (splitDescription.length * 5) + 10);
    }

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 105, 285, { align: 'center' });
    
    return doc;
  };

  const openCreate = () => {
    const isMorador = currentUser?.role === 'MORADOR';
    setFormData({ 
      id: '', 
      unitId: isMorador ? (currentUser.unitId || '') : '', 
      type: '', 
      otherType: '', 
      description: '', 
      attachmentUrl: '' 
    });
    setIsReportMode(false);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      alert('Tipo de arquivo não permitido.\nAceito apenas: PDF, JPG ou JPEG.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo é muito grande. O limite é de 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormData(prev => ({ ...prev, attachmentUrl: result, attachmentName: file.name }));
    };
    reader.readAsDataURL(file);
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

  const inp = 'w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentUser && !['SUPER_ADMIN', 'SINDICO', 'MORADOR'].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Você não tem permissão para acessar esta área.</p>
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

      {/* Cabeçalho Informativo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 bg-gradient-to-br from-white to-purple-50/30">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          🏢 Comunicação com a Gestão do Condomínio
        </h2>

        {/* Card do usuário logado */}
        {currentUser && (
          <div className="bg-purple-600/5 border border-purple-100 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg shrink-0">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Apartamento</p>
                <p className="font-bold text-slate-800">
                  {unidades.find(u => u.id === currentUser.unitId)
                    ? `${unidades.find(u => u.id === currentUser.unitId)?.number} - ${unidades.find(u => u.id === currentUser.unitId)?.block}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Solicitante</p>
                <p className="font-bold text-slate-800">{currentUser.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">E-mail</p>
                <p className="font-bold text-slate-800 break-all">{currentUser.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
          <p>
            A finalidade do formulário <strong>"Fale com o Síndico"</strong> é facilitar e organizar a comunicação entre os moradores e o síndico do condomínio. Ele permite que os condôminos registrem suas dúvidas, sugestões, solicitações e reclamações de forma estruturada, garantindo que todas as demandas sejam recebidas e analisadas de maneira eficiente.
          </p>
          <p className="text-xs text-purple-700 font-semibold bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
            📧 A resposta da sua solicitação será encaminhada ao e-mail cadastrado: <strong>{currentUser?.email}</strong>
          </p>

          <div className="bg-purple-600/5 p-4 rounded-xl border border-purple-100">
            <h3 className="text-purple-700 font-bold text-sm mb-3">Principais benefícios do formulário:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <li className="flex items-start gap-2"><span>✅</span> <div><strong>Organização:</strong> Centraliza as solicitações, evitando informações perdidas ou repassadas informalmente.</div></li>
              <li className="flex items-start gap-2"><span>✅</span> <div><strong>Registro formal:</strong> Garante que todas as demandas tenham um histórico documentado.</div></li>
              <li className="flex items-start gap-2"><span>✅</span> <div><strong>Transparência:</strong> Demonstra comprometimento do síndico em ouvir e atender os moradores.</div></li>
              <li className="flex items-start gap-2"><span>✅</span> <div><strong>Agilidade na resposta:</strong> Permite uma melhor gestão das prioridades e otimiza a tomada de decisões.</div></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Nº</th>
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
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Carregando...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Nenhuma solicitação encontrada</td></tr>
              ) : list.map(m => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                  <td className="p-4 pl-5">
                    <span className="font-bold text-purple-700 text-sm">#{m.number ?? '—'}</span>
                  </td>
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
                <MessageSquare size={20} />
                {isReportMode
                  ? `Solicitação #${list.find(l => l.id === formData.id)?.number ?? ''} — Detalhes`
                  : 'Nova Solicitação ao Síndico'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={22} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Apartamento *</label>
                  <select required className={inp} value={formData.unitId} 
                    disabled={isReportMode || currentUser?.role === 'MORADOR'}
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
                <label className={lbl}>Anexar Arquivo — Apenas PDF, JPG ou JPEG (Máx 2MB)</label>
                <div className="flex flex-col gap-2">
                  {!isReportMode ? (
                    <div className="relative group">
                      <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept=".pdf,.jpg,.jpeg,image/jpeg,application/pdf" />
                      <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition bg-slate-50">
                        <Paperclip size={20} className={formData.attachmentUrl ? 'text-blue-600' : 'text-slate-400'} />
                        <span className="text-xs text-slate-500 font-medium">
                          {formData.attachmentUrl
                            ? `✅ Arquivo selecionado — Clique para trocar`
                            : 'Clique para selecionar PDF, JPG ou JPEG'}
                        </span>
                      </label>
                    </div>
                  ) : (
                    formData.attachmentUrl ? (
                      <a
                        href={formData.attachmentUrl}
                        download="anexo-solicitacao"
                        className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-100 transition text-sm font-semibold">
                        <FileText size={18} /> ⬇️ Baixar Anexo Enviado
                      </a>
                    ) : (
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-xs italic text-center">
                        Nenhum anexo enviado para esta solicitação.
                      </div>
                    )
                  )}
                  {formData.attachmentUrl && !isReportMode && (
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, attachmentUrl: '' }))} className="text-[10px] text-red-500 font-bold uppercase hover:underline text-right px-2">
                      Remover Anexo
                    </button>
                  )}
                </div>
              </div>

              {isReportMode && ['SUPER_ADMIN', 'SINDICO'].includes(currentUser?.role) && (
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

      <div className="mt-8 text-center">
        <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${currentUser?.role === 'MORADOR' ? 'text-red-600 bg-white shadow-sm border border-red-100' : 'text-slate-400'}`}>
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
