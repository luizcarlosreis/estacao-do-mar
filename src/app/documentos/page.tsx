'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Download, Search, X, FileUp, ShieldAlert } from 'lucide-react';

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
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0
  });

  const API_URL = '/api/documentos';

  useEffect(() => {
    fetchDocs();
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setDocs(data);
    } catch (error) {
      console.error('Erro ao buscar documentos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('O arquivo é muito grande. O limite permitido é de 20MB.');
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
    if (!formData.fileUrl) {
      alert('Por favor, selecione um arquivo.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: '', description: '', fileUrl: '', fileName: '', fileSize: 0 });
        fetchDocs();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar documento', error);
      alert('Erro de conexão ao salvar.');
    } finally {
      setSaving(true);
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir o documento "${title}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchDocs();
    } catch (error) {
      console.error('Erro ao excluir documento', error);
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <FileText size={32} /> Documentos Importantes
            </h1>
            <p className="text-gray-500 mt-1">Repositório central de documentos do condomínio.</p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-opacity-90 transition font-bold shadow-lg"
            >
              <Plus size={20} /> Novo Documento
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border mb-8 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar documentos..." 
            className="w-full focus:outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-400">Carregando documentos...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400">Nenhum documento encontrado.</div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-primary">
                      <FileText size={24} />
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-2" title={doc.title}>{doc.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{doc.description || 'Sem descrição.'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      {formatSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <button 
                      onClick={() => downloadFile(doc.fileUrl, doc.fileName)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-primary p-5 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileUp size={22} /> Novo Documento
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Título do Documento *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ex: REGIMENTO INTERNO 2024"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Descrição</label>
                <textarea 
                  rows={3}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="Breve descrição do conteúdo do documento..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 relative group hover:border-primary transition-colors text-center">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <FileUp size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-600">
                    {formData.fileName || 'Clique ou arraste o arquivo aqui'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    PDF, JPG, PNG ou DOCX até 20MB
                  </p>
                </div>
              </div>

              {formData.fileSize > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between text-xs text-primary font-bold">
                  <span className="truncate flex-1 mr-2">{formData.fileName}</span>
                  <span>{formatSize(formData.fileSize)}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? 'Enviando...' : 'Salvar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
