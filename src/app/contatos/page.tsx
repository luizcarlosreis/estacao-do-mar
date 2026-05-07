'use client';

import { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Plus, 
  Trash2, 
  Mail, 
  Search, 
  X, 
  Pencil,
  Briefcase,
  User,
  CreditCard,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type Contact = {
  id: string;
  name: string;
  description?: string;
  ddd?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  document?: string;
  createdAt: string;
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.9-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.9';

export default function ContatosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    ddd: '',
    phone: '',
    email: '',
    specialty: '',
    document: ''
  });

  const API_URL = '/api/contatos';

  useEffect(() => {
    setMounted(true);
    fetch('/api/me').then(res => {
      if (res.ok) return res.json();
      router.push('/login');
      return null;
    }).then(data => {
      if (data) {
        if (data.user.role === 'MORADOR') {
          router.push('/');
        } else {
          setCurrentUser(data.user);
          fetchContacts();
        }
      }
    });
  }, [router]);

  const fetchContacts = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar contatos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    setSaving(true);
    try {
      const url = isEdit ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEdit ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: '', name: '', description: '', ddd: '', phone: '', email: '', specialty: '', document: '' });
        fetchContacts();
      } else {
        alert('Erro ao salvar contato.');
      }
    } catch (error) {
      console.error('Erro ao salvar contato', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchContacts();
    } catch (error) {
      console.error('Erro ao excluir contato', error);
    }
  };

  const openEditModal = (contact: Contact) => {
    setFormData({
      id: contact.id,
      name: contact.name,
      description: contact.description || '',
      ddd: contact.ddd || '',
      phone: contact.phone || '',
      email: contact.email || '',
      specialty: contact.specialty || '',
      document: contact.document || ''
    });
    setIsModalOpen(true);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <PhoneCall size={28} className="text-blue-600" />
              CONTATOS IMPORTANTES
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">Prestadores de serviço e contatos de emergência.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="BUSCAR POR NOME OU ESPECIALIDADE..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setFormData({ id: '', name: '', description: '', ddd: '', phone: '', email: '', specialty: '', document: '' });
                setIsModalOpen(true);
              }}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} /> Novo Contato
            </button>
          </div>
        </div>

        {/* Content Grid — 4 colunas igual a Documentos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-20 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando contatos...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum contato encontrado</div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 group hover:shadow-md hover:border-blue-200 transition-all relative flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <PhoneCall size={18} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-1 text-slate-300 hover:text-blue-600 transition"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-slate-800 text-[11px] leading-tight uppercase break-words">{contact.name}</h3>
                    {contact.specialty && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {contact.specialty}
                      </span>
                    )}
                  </div>
                  {contact.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug mb-3 lowercase first-letter:uppercase">
                      {contact.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto space-y-1.5">
                  {(contact.ddd || contact.phone) && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <PhoneCall size={10} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-black">({contact.ddd || '--'}) {contact.phone || '---'}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={10} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-bold lowercase truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.document && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <CreditCard size={10} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{contact.document}</span>
                    </div>
                  )}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-200 overflow-hidden relative">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  {formData.id ? <Pencil size={20} /> : <Plus size={20} />}
                  {formData.id ? 'Editar Contato' : 'Novo Contato'}
                </h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 opacity-70">Preencha os dados abaixo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-50 text-slate-400 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" required 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800 uppercase"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descritivo / Notas</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800 uppercase min-h-[80px]"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Especialidade</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800 uppercase"
                      value={formData.specialty} 
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CNPJ ou CPF</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800 uppercase"
                      value={formData.document} 
                      onChange={(e) => setFormData({...formData, document: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">DDD</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800"
                    value={formData.ddd} 
                    onChange={(e) => setFormData({...formData, ddd: e.target.value})} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-800 lowercase"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase text-slate-400 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? 'Gravando...' : 'Salvar Contato'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
