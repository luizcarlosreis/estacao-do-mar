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
  ChevronRight,
  ChevronLeft,
  Minus
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import { useRouter } from 'next/navigation';

type PhoneEntry = { name?: string; ddd: string; phone: string };

type Contact = {
  id: string;
  name: string;
  description?: string;
  phones?: string; // JSON string of PhoneEntry[]
  email?: string;
  specialty?: string;
  document?: string;
  createdAt: string;
};



function parsePhones(phonesJson?: string): PhoneEntry[] {
  if (!phonesJson) return [];
  try { return JSON.parse(phonesJson); } catch { return []; }
}

export default function ContatosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    email: '',
    specialty: '',
    document: ''
  });

  // Dynamic phone list
  const [phoneList, setPhoneList] = useState<PhoneEntry[]>([{ name: '', ddd: '', phone: '' }]);

  const addPhone = () => setPhoneList(prev => [...prev, { name: '', ddd: '', phone: '' }]);
  const removePhone = (idx: number) => setPhoneList(prev => prev.filter((_, i) => i !== idx));
  const updatePhone = (idx: number, field: 'name' | 'ddd' | 'phone', value: string) => {
    setPhoneList(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

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
      const validPhones = phoneList.filter(p => p.phone.trim() !== '');
      const url = isEdit ? `${API_URL}/${formData.id}` : API_URL;
      const method = isEdit ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phones: validPhones })
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
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

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', email: '', specialty: '', document: '' });
    setPhoneList([{ name: '', ddd: '', phone: '' }]);
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
      email: contact.email || '',
      specialty: contact.specialty || '',
      document: contact.document || ''
    });
    const parsed = parsePhones(contact.phones);
    setPhoneList(parsed.length > 0 ? parsed : [{ name: '', ddd: '', phone: '' }]);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Already sorted by API (orderBy name asc), but ensure frontend too
  const filteredContacts = contacts
    .filter(c => {
      const matchBasic = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const phones = parsePhones(c.phones);
      const matchPhoneName = phones.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchBasic || matchPhoneName;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <PhoneCall size={28} className="text-blue-600" />
              CONTATOS IMPORTANTES
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">
              Prestadores de serviço e contatos de emergência
            </p>
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
              onClick={openNewModal}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} /> Novo Contato
            </button>
          </div>
        </div>

        {/* Grid 4 colunas — igual a Documentos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-20 text-center animate-pulse text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando contatos...</div>
          ) : paginatedContacts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum contato encontrado</div>
          ) : (
            paginatedContacts.map((contact) => {
              const phones = parsePhones(contact.phones);
              return (
                <div
                  key={contact.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 group hover:shadow-md hover:border-blue-200 transition-all flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <PhoneCall size={18} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEditModal(contact)} className="p-1 text-slate-300 hover:text-blue-600 transition">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(contact.id)} className="p-1 text-slate-300 hover:text-rose-500 transition">
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
                    {/* Múltiplos telefones */}
                    {phones.length > 0 ? phones.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-600">
                        <PhoneCall size={10} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-black">
                          {p.name ? <span className="uppercase text-slate-500 mr-1">{p.name}:</span> : null}
                          {p.ddd ? `(${p.ddd}) ` : ''}{p.phone}
                        </span>
                      </div>
                    )) : null}
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
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                {formData.id ? <Pencil size={18} /> : <Plus size={18} />}
                {formData.id ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome do Contato *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" required 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800 uppercase"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              {/* Especialidade + Documento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Especialidade</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                      value={formData.specialty} 
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CNPJ / CPF</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                      value={formData.document} 
                      onChange={(e) => setFormData({...formData, document: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              {/* Telefones dinâmicos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefones</label>
                  <button
                    type="button"
                    onClick={addPhone}
                    className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                  >
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {phoneList.map((p, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="NOME (ex: WhatsApp, Fixo)"
                        className="w-full sm:w-1/3 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 uppercase"
                        value={p.name || ''}
                        onChange={(e) => updatePhone(idx, 'name', e.target.value)}
                      />
                      <div className="flex w-full sm:w-2/3 items-center gap-2">
                        <input
                          type="text"
                          placeholder="DDD"
                          maxLength={3}
                          className="w-16 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 text-center"
                          value={p.ddd}
                          onChange={(e) => updatePhone(idx, 'ddd', e.target.value)}
                        />
                        <div className="relative flex-1">
                          <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input
                            type="text"
                            placeholder="Número do telefone"
                            className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800"
                            value={p.phone}
                            onChange={(e) => updatePhone(idx, 'phone', e.target.value)}
                          />
                        </div>
                        {phoneList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(idx)}
                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Minus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-800 lowercase"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              {/* Descritivo */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descritivo / Notas</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-medium text-slate-700 uppercase min-h-[70px]"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
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
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? 'Gravando...' : 'Salvar Contato'}
                  <ChevronRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
