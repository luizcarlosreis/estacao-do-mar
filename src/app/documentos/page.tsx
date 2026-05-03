'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  X, 
  Pencil,
  Calendar,
  HardDrive,
  FileSearch,
  ExternalLink
} from 'lucide-react';

type Document = {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.2-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.2';

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
      const payload = {
        ...formData,
        title: formData.title.toUpperCase(),
        description: formData.description?.toUpperCase() || ''
      };

      const res = await fetch(isEdit ? `${API_URL}/${formData.id}` : API_URL, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: '', title: '', description: '', fileUrl: '', fileName: '', fileSize: 0 });
        fetchDocs();
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

  const openEdit = (doc: Document) => {
    setFormData({
      id: doc.id,
      title: doc.title,
      description: doc.description || '',
      fileUrl: doc.fileUrl,
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileText size={28} className="text-blue-600" />
              DOCUMENTOS IMPORTANTES
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">
              Regimentos, atas e arquivos oficiais
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="BUSCAR DOCUMENTO..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => { setFormData({id:'', title:'', description:'', fileUrl:'', fileName:'', fileSize:0}); setIsModalOpen(true); }}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
              >
                <Plus size={16} /> Novo Documento
              </button>
            )}
          </div>
        </div>

        {/* List/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-20 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-full py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum documento encontrado</div>
          ) : (
            filteredDocs.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 group hover:shadow-md hover:border-blue-200 transition-all relative flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {isAdmin && (
                      <button 
                        onClick={() => openEdit(doc)}
                        className="p-1 text-slate-300 hover:text-blue-600 transition"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-[11px] leading-tight mb-1.5 uppercase break-words">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug mb-3 lowercase first-letter:uppercase">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={10} />
                      {formatSize(doc.fileSize)}
                    </div>
                  </div>

                  <button 
                    onClick={() => downloadFile(doc.fileUrl, doc.fileName)}
                    className="w-full py-2 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Version Badge */}
        <div className="mt-12 text-center pb-8">
          <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
            Estação do Mar Management Portal • {APP_VERSION}
          </span>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <FileSearch size={18} /> {formData.id ? 'Editar Documento' : 'Novo Documento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título do Documento</label>
                <input 
                  type="text" required 
                  placeholder="EX: REGIMENTO INTERNO V1"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800 uppercase"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Breve Descrição</label>
                <textarea 
                  rows={2} 
                  placeholder="DETALHAMENTO DO CONTEÚDO..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-medium text-slate-700 uppercase"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className={`relative group ${formData.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Arquivo (PDF, JPG, PNG)</label>
                <input 
                  type="file" 
                  disabled={!!formData.id}
                  className="hidden" 
                  id="doc-upload" 
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor={formData.id ? '' : 'doc-upload'} 
                  className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 transition ${!formData.id && 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}`}
                >
                  <Plus size={20} className="text-slate-400 mb-2" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                    {formData.fileName || 'Selecionar Arquivo'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase">Máximo 4.5MB</span>
                </label>
                {formData.id && (
                  <p className="text-[9px] text-blue-500 font-bold mt-2 text-center italic">Para alterar o arquivo, exclua e cadastre novamente.</p>
                )}
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
                  {saving ? 'Gravando...' : 'Salvar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
