'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  User, 
  LayoutDashboard, 
  ChevronRight, 
  ChevronLeft, 
  Mail, 
  Phone, 
  Key,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

type Usuario = {
  id: string;
  cpf: string;
  name: string;
  email?: string;
  role: string;
  ddd?: string;
  phone?: string;
  residentType?: string;
  isActive?: boolean;
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Administrador',
  ADMINISTRADORA: 'Administradora',
  SINDICO: 'Zeladoria',
  PORTEIRO: 'Portaria'
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-600 border-red-100',
  ADMINISTRADORA: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  SINDICO: 'bg-amber-50 text-amber-600 border-amber-100',
  PORTEIRO: 'bg-sky-50 text-sky-600 border-sky-100'
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    cpf: '', 
    name: '', 
    email: '', 
    password: '', 
    ddd: '', 
    phone: '', 
    role: 'ADMINISTRADORA', 
    isActive: true 
  });

  const API_URL = '/api/usuarios';

  useEffect(() => {
    setMounted(true);
    fetchUsuarios();
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setCurrentUser(data?.user);
      });
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setUsuarios(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEditMode ? `${API_URL}/${formData.cpf}` : API_URL;
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload: any = { 
        ...formData,
        name: formData.name.toUpperCase(),
        email: formData.email ? formData.email.toLowerCase() : null,
        residentType: formData.role // Sincroniza residentType para consistência com o banco
      };

      if (isEditMode && !payload.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsuarios();
        alert(isEditMode ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Ocorreu um erro ao salvar o usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cpf: string, name: string) => {
    if (cpf === 'Admin') {
      alert('Não é permitido excluir o usuário Administrador principal.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário administrativo ${name}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${cpf}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsuarios();
        alert('Usuário excluído com sucesso!');
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Ocorreu um erro ao excluir o usuário.');
    }
  };

  const openEditModal = (user: Usuario) => {
    setFormData({ 
      cpf: user.cpf, 
      name: user.name, 
      email: user.email || '', 
      password: '', 
      ddd: user.ddd || '', 
      phone: user.phone || '', 
      role: user.role, 
      isActive: user.isActive !== undefined ? user.isActive : true 
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ 
      cpf: '', 
      name: '', 
      email: '', 
      password: '', 
      ddd: '', 
      phone: '', 
      role: 'ADMINISTRADORA', 
      isActive: true 
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Filtragem e Busca
  const filteredUsuarios = usuarios.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cpf.includes(searchTerm) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginação
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (!mounted) return null;

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                Cadastro de Usuários
              </h1>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                <LayoutDashboard size={10} /> Painel Administrativo <ChevronRight size={10} /> Perfis Operacionais
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-3 font-medium">
            Gerenciamento de contas e perfis de acesso operacionais do condomínio.
          </p>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98]"
        >
          <Plus size={16} /> Cadastrar Usuário
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="BUSCAR USUÁRIO POR NOME, CPF OU E-MAIL..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Grid de Usuários */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <div className="animate-pulse text-slate-500 font-bold">Carregando usuários...</div>
        </div>
      ) : paginatedUsuarios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <ShieldAlert size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Nenhum usuário administrativo cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedUsuarios.map((u) => (
              <div 
                key={u.id} 
                className={`bg-white p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm relative group hover:border-slate-400 hover:shadow-md ${
                  !u.isActive ? 'opacity-60 grayscale-[40%]' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${
                      roleColors[u.role] || 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                    
                    {!u.isActive && (
                      <span className="text-[8px] font-black uppercase bg-rose-50 text-rose-500 border border-rose-100 px-2 py-1 rounded">
                        Inativo
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight truncate" title={u.name}>
                    {u.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mb-3 tracking-wide">
                    CPF: {u.cpf}
                  </p>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                      <Mail size={12} className="text-slate-400" />
                      <span className="truncate">{u.email || 'Sem e-mail'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                      <Phone size={12} className="text-slate-400" />
                      <span>{u.ddd ? `(${u.ddd}) ` : ''}{u.phone || 'Sem telefone'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => openEditModal(u)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  {u.cpf !== 'Admin' && (
                    <button 
                      onClick={() => handleDelete(u.cpf, u.name)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider rounded-xl transition"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-xl hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed bg-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-xl hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed bg-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <User size={16} /> {isEditMode ? 'Editar Usuário' : 'Novo Usuário Administrativo'}
                </h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {isEditMode ? 'Atualize as informações do perfil selecionado' : 'Cadastre um perfil com credenciais de acesso'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CPF (Login)</label>
                  <input 
                    type="text" 
                    required 
                    disabled={isEditMode}
                    placeholder="000.000.000-00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 disabled:opacity-50"
                    value={formData.cpf} 
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="EX: JOÃO DA SILVA"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 uppercase"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail</label>
                <input 
                  type="email" 
                  placeholder="EX: USUARIO@EMAIL.COM"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">DDD</label>
                  <input 
                    type="text" 
                    placeholder="11"
                    maxLength={2}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 text-center"
                    value={formData.ddd} 
                    onChange={(e) => setFormData({...formData, ddd: e.target.value})} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Telefone</label>
                  <input 
                    type="text" 
                    placeholder="99999-9999"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Senha (Opcional)</label>
                <input 
                  type="password"
                  placeholder={isEditMode ? "DEIXE EM BRANCO PARA NÃO ALTERAR" : "DEIXE EM BRANCO PARA USAR 5 PRIMEIROS DÍGITOS DO CPF"}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-800 placeholder:normal-case"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Cadastro</label>
                  <select 
                    disabled={formData.cpf === 'Admin'}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none disabled:opacity-50"
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="ADMINISTRADORA">Administradora</option>
                    <option value="SINDICO">Zeladoria</option>
                    <option value="PORTEIRO">Portaria</option>
                    {formData.cpf === 'Admin' && <option value="SUPER_ADMIN">Administrador</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none text-[11px] font-bold text-slate-700 bg-slate-50 appearance-none"
                    value={formData.isActive ? 'true' : 'false'} 
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                  >
                    <option value="true">ATIVO</option>
                    <option value="false">INATIVO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
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
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-slate-900/10 hover:bg-slate-850 disabled:opacity-50 transition-all animate-pulse-subtle"
                >
                  {saving ? 'Gravando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rodapé de Versão */}
      <div className="mt-16 text-center pb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-red-200 shadow-sm text-[8px] font-black text-red-500 uppercase tracking-widest animate-fade-in">
          SISTEMA {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
