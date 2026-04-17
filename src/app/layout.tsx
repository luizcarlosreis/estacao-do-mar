'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo, 
  LayoutDashboard,
  Bell,
  Home as HomeIcon,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { title: 'Apartamentos', icon: <Building2 size={20} />, path: '/unidades' },
    { title: 'Moradores', icon: <Users size={20} />, path: '/moradores' },
    { title: 'Vagas', icon: <Car size={20} />, path: '/vagas' },
    { title: 'Colaboradores', icon: <UserCog size={20} />, path: '/colaboradores' },
    { title: 'Manutenções', icon: <Wrench size={20} />, path: '/manutencoes' },
    { title: 'Tarefas', icon: <ListTodo size={20} />, path: '/tarefas' },
  ];

  if (!mounted) return null;

  return (
    <html lang="pt-br">
      <body className="bg-slate-50 text-slate-900 m-0 p-0 font-sans">
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* Menu Lateral (Sidebar) */}
          <aside className="w-full md:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl">
            {/* Header Sidebar */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <HomeIcon size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-none">Estação do Mar</h1>
                  <span className="text-blue-400 text-xs font-semibold uppercase tracking-widest">Condomínio</span>
                </div>
              </div>
            </div>

            {/* Links de Navegação */}
            <nav className="flex-1 p-4 space-y-1">
              <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Menu Principal</p>
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="opacity-50" />}
                  </Link>
                );
              })}
            </nav>

            {/* Rodapé Sidebar */}
            <div className="p-4 border-t border-slate-800">
              <div className="bg-slate-800/50 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xs">AD</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">Administrador</p>
                  <p className="text-[10px] text-slate-500 truncate">Sair do sistema</p>
                </div>
                <button className="text-slate-500 hover:text-red-400 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col">
            
            {/* Topbar */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
              <div className="text-slate-400 text-sm italic">
                {pathname === '/' ? 'Bem-vindo de volta!' : `Início > ${pathname.substring(1)}`}
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Painel Admin</span>
              </div>
            </header>

            {/* Conteúdo da Página */}
            <main className="p-6 md:p-10">
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}
