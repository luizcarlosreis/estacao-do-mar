'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo, 
  Home,
  ShieldCheck,
  LogOut,
  User,
  Lock,
  ChevronDown,
  Megaphone,
  FileText,
  Calendar,
  X,
  Package as PackageIcon,
  Flame,
  CreditCard
} from 'lucide-react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (pathname === '/login') {
      setLoadingUser(false);
      return;
    }

    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not auth');
      })
      .then(data => {
        setUser(data.user);
        setLoadingUser(false);
      })
      .catch(() => {
        setUser(null);
        setLoadingUser(false);
        if (pathname !== '/login') router.push('/login');
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const openProfile = async () => {
    setIsDropdownOpen(false);
    try {
      const res = await fetch('/api/me/profile');
      if (res.ok) {
        setFullProfile(await res.json());
        setIsProfileModalOpen(true);
      }
    } catch (e) { console.error(e); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      if (res.ok) {
        alert('Senha alterada com sucesso!');
        setIsPasswordModalOpen(false);
        setNewPassword('');
      } else {
        const data = await res.json();
        alert(`Erro: ${data.message}`);
      }
    } catch (e) { console.error(e); }
    finally { setPasswordLoading(false); }
  };

  if (pathname === '/login') {
    return (
      <html lang="pt-br">
        <body className="bg-slate-50">
          {children}
        </body>
      </html>
    );
  }

  if (loadingUser) {
    return (
      <html lang="pt-br">
        <body className="bg-slate-50 flex items-center justify-center min-h-screen">
          <div className="text-slate-500 font-bold">Carregando portal...</div>
        </body>
      </html>
    );
  }

  const allMenuItems = [
    { title: 'Início', icon: <Home size={18} />, path: '/', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR', 'ADMINISTRADORA'] },
    { title: 'Apartamentos', icon: <Building2 size={18} />, path: '/unidades', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO'] },
    { title: 'Moradores/Visitas', icon: <Users size={18} />, path: '/moradores', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR', 'ADMINISTRADORA'] },
    { title: 'Vagas', icon: <Car size={18} />, path: '/vagas', roles: ['SUPER_ADMIN'] },
    { title: 'Veículos', icon: <Car size={18} />, path: '/veiculos', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Autorizações', icon: <ShieldCheck size={18} />, path: '/autorizacoes', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Salão de Festas', icon: <Calendar size={18} />, path: '/reservas', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR', 'PORTEIRO'] },
    { title: 'Cadastro de Usuários', icon: <UserCog size={18} />, path: '/usuarios', roles: ['SUPER_ADMIN'] },
    { title: 'Colaboradores', icon: <UserCog size={18} />, path: '/colaboradores', roles: ['SUPER_ADMIN'] },
    { title: 'Manutenções', icon: <Wrench size={18} />, path: '/manutencoes', roles: ['SUPER_ADMIN', 'SINDICO'] },
    { title: user?.role === 'MORADOR' ? 'Solicitação de Reparos' : 'Tarefas', icon: <ListTodo size={18} />, path: '/tarefas', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR'] },
    { title: 'Mural', icon: <Megaphone size={18} />, path: '/mural', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Encomendas', icon: <PackageIcon size={18} />, path: '/encomendas', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Leitura de Gás', icon: <Flame size={18} />, path: '/leitura-gas', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR', 'ADMINISTRADORA'] },
    { title: 'Cartão de Crédito', icon: <CreditCard size={18} />, path: '/cartao-credito', roles: ['SUPER_ADMIN', 'ADMINISTRADORA'] },
  ];

  const rawMenuItems = user ? allMenuItems.filter(item => item.roles.includes(user.role)) : [];
  const inicioItem = rawMenuItems.find(item => item.path === '/');
  const otherMenuItems = rawMenuItems
    .filter(item => item.path !== '/')
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  const menuItems = inicioItem ? [inicioItem, ...otherMenuItems] : otherMenuItems;

  return (
    <html lang="pt-br">
      <body className="bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center min-h-16 py-2 xl:py-0">
              <div className="flex items-center gap-4 xl:gap-8 flex-grow min-w-0">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">EM</div>
                  <span className="font-bold text-slate-900 text-xl hidden xl:block">Estação do Mar</span>
                </div>
                <div className="hidden xl:flex flex-wrap gap-1 py-1 max-w-[75vw]">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        pathname === item.path 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-3 relative flex items-center gap-2">
                  {/* Menu do Perfil */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-1.5 rounded-full"
                    >
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        {user?.name?.substring(0,2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700 hidden sm:block">{user?.name}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Logado como</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{user?.name}</p>
                        </div>
                        
                        {(user?.role === 'MORADOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'SINDICO' || user?.role === 'ADMINISTRADORA') && (
                          <>
                            {user?.role === 'MORADOR' && (
                              <button onClick={openProfile} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <User size={16} /> Meu Perfil
                              </button>
                            )}
                            <button onClick={() => { setIsPasswordModalOpen(true); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                              <Lock size={16} /> Alterar Senha
                            </button>
                            <div className="h-px bg-slate-50 my-1"></div>
                          </>
                        )}
                        
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={16} /> Sair do Sistema
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="xl:hidden bg-white border-b border-slate-200 overflow-x-auto whitespace-nowrap px-4 py-2 scrollbar-hide">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                pathname === item.path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </div>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 main-container xl:mt-0">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            &copy; 2026 Condomínio Estação do Mar - Sistema de Gestão
          </div>
        </footer>

        {/* Modal Perfil */}
        {isProfileModalOpen && fullProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-blue-600 p-6 text-white text-center relative">
                <button onClick={() => setIsProfileModalOpen(false)} className="absolute right-4 top-4 hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 shadow-inner">
                  {fullProfile.name?.substring(0,2).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold">{fullProfile.name}</h2>
                <p className="text-blue-100 text-xs opacity-80 uppercase tracking-widest font-semibold mt-1">Morador</p>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-600">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold">CPF</span>
                  <span>{fullProfile.cpf}</span>
                </div>
                {fullProfile.email && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold">E-mail</span>
                    <span>{fullProfile.email}</span>
                  </div>
                )}
                {fullProfile.unit && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold">Apartamento</span>
                    <span className="text-blue-600 font-bold">{fullProfile.unit.number} - {fullProfile.unit.block}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold">Telefone</span>
                  <span>{fullProfile.ddd ? `(${fullProfile.ddd}) ` : ''}{fullProfile.phone || '—'}</span>
                </div>
                <button onClick={() => setIsProfileModalOpen(false)} className="w-full bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition font-bold text-slate-700 mt-2">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alterar Senha */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2"><Lock size={18} /> Alterar Senha</h2>
                <button onClick={() => setIsPasswordModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                <p className="text-xs text-slate-500">Escolha uma nova senha segura para seus próximos acessos.</p>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nova Senha</label>
                  <input 
                    required 
                    type="password" 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm">Cancelar</button>
                  <button type="submit" disabled={passwordLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50">
                    {passwordLoading ? 'Gravando...' : 'Salvar Senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
