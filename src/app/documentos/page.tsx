'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Download, Search, X } from 'lucide-react';

type Document = {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
};

export default function DocumentosPage() {
  const [mounted, setMounted] = useState(false);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0
  });

  const API_URL = '/api/documentos';

  useEffect(() => {
    setMounted(true);
    fetchDocs();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setDocs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="p-8 text-gray-400">Carregando módulo...</div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4.5 * 1024 * 1024) {
      alert('O arquivo é muito grande. Tamanho máximo permitido: 4.5MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize: file.size
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) return alert('Selecione um arquivo.');

    const isEdit = !!formData.id;
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `${API_URL}/${formData.id}` : API_URL, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: '', title: '', description: '', fileUrl: '', fileName: '', fileSize: 0 });
        fetchDocs();
      } else {
        const text = await res.text();
        alert(`Erro ${res.status}: ${text.substring(0, 100)}`);
      }
    } catch (error: any) {
      alert(`Erro de conexão: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (doc: Document) => {
    setFormData({
      id: doc.id,
      title: doc.title,
      description: doc.description || '',
      fileUrl: doc.fileUrl, // Mantém o arquivo atual
      fileName: doc.fileName,
      fileSize: doc.fileSize
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"?`)) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchDocs();
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FileText size={32} className="text-blue-600" /> Documentos Importantes
            </h1>
            <p className="text-slate-500 mt-1">Regimentos, atas e informativos oficiais.</p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { setFormData({ id: '', title: '', description: '', fileUrl: '', fileName: '', fileSize: 0 }); setIsModalOpen(true); }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-100 w-full md:w-auto justify-center"
            >
              <Plus size={20} /> Novo Documento
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar documentos..." 
            className="w-full focus:outline-none text-sm bg-transparent"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-400">Carregando...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400">Nenhum documento encontrado.</div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                      <FileText size={24} />
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <button 
                          onClick={() => openEdit(doc)}
                          className="text-slate-300 hover:text-blue-500 transition"
                        >
                          <Plus size={18} className="rotate-45" /> {/* Usei Plus girado como ícone de edição simples se Edit2 não estiver disponível */}
                        </button>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="text-slate-300 hover:text-red-500 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1" title={doc.title}>{doc.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{doc.description || 'Sem descrição.'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {formatSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <button 
                      onClick={() => downloadFile(doc.fileUrl, doc.fileName)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus size={22} /> {formData.id ? 'Alterar Documento' : 'Novo Documento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Título *</label>
                <input 
                  type="text" required 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="EX: REGIMENTO INTERNO"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descrição</label>
                <textarea 
                  rows={2}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  placeholder="Descrição opcional..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={`bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 relative group transition-colors text-center ${formData.id ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}`}>
                <input 
                  type="file" required={!formData.id}
                  disabled={!!formData.id}
                  className={`absolute inset-0 opacity-0 ${formData.id ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onChange={handleFileChange}
                />
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <Plus size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">
                    {formData.fileName || 'Selecionar Arquivo'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    PDF, JPG ou PNG até 4.5MB
                  </p>
                </div>
              </div>
              {formData.id && (
                <p className="text-[10px] text-blue-500 font-bold text-center italic">Para trocar o arquivo, exclua o documento e cadastre-o novamente.</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50">
                  {saving ? 'Gravando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

