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
  LogOut
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
    { title: 'Início', icon: <Home size={18} />, path: '/', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO'] },
    { title: 'Apartamentos', icon: <Building2 size={18} />, path: '/unidades', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO'] },
    { title: 'Moradores', icon: <Users size={18} />, path: '/moradores', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Vagas', icon: <Car size={18} />, path: '/vagas', roles: ['SUPER_ADMIN'] },
    { title: 'Veículos', icon: <Car size={18} />, path: '/veiculos', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Autorizações', icon: <ShieldCheck size={18} />, path: '/autorizacoes', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'] },
    { title: 'Colaboradores', icon: <UserCog size={18} />, path: '/colaboradores', roles: ['SUPER_ADMIN'] },
    { title: 'Manutenções', icon: <Wrench size={18} />, path: '/manutencoes', roles: ['SUPER_ADMIN', 'SINDICO'] },
    { title: 'Tarefas', icon: <ListTodo size={18} />, path: '/tarefas', roles: ['SUPER_ADMIN', 'SINDICO'] },
  ];

  const menuItems = user ? allMenuItems.filter(item => item.roles.includes(user.role)) : [];

  return (
    <html lang="pt-br">
      <body className="bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-8">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">EM</div>
                  <span className="font-bold text-slate-900 text-xl hidden md:block">Estação do Mar</span>
                </div>
                <div className="hidden md:flex space-x-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                <div className="ml-3 relative flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {user?.name?.substring(0,2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{user?.name}</span>
                  </div>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Sair">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto whitespace-nowrap px-4 py-2 scrollbar-hide">
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

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 main-container">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            &copy; 2026 Condomínio Estação do Mar - Sistema de Gestão
          </div>
        </footer>
      </body>
    </html>
  );
}
