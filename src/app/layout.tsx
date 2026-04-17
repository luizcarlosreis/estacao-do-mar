'use client';

import { useState } from 'react';
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
  Menu,
  X,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { title: 'Apartamentos', icon: <Building2 size={20} />, path: '/unidades' },
    { title: 'Moradores', icon: <Users size={20} />, path: '/moradores' },
    { title: 'Vagas', icon: <Car size={20} />, path: '/vagas' },
    { title: 'Colaboradores', icon: <UserCog size={20} />, path: '/colaboradores' },
    { title: 'Manutenções', icon: <Wrench size={20} />, path: '/manutencoes' },
    { title: 'Tarefas', icon: <ListTodo size={20} />, path: '/tarefas' },
  ];

  return (
    <html lang="pt-br">
      <body className="bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside 
            className={`${
              isSidebarOpen ? 'w-64' : 'w-20'
            } bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col fixed h-full z-50`}
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
              {isSidebarOpen && (
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold shrink-0">
                    EM
                  </div>
                  <span className="font-bold text-white text-lg">Estação do Mar</span>
                </div>
              )}
              {!isSidebarOpen && (
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold mx-auto">
                  EM
                </div>
              )}
            </div>

            <nav className="flex-1 mt-6 px-2 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`flex items-center p-3 rounded-lg transition-colors group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                      {item.icon}
                    </div>
                    {isSidebarOpen && (
                      <span className="ml-3 font-medium flex-1">{item.title}</span>
                    )}
                    {isSidebarOpen && isActive && (
                      <ChevronRight size={14} className="opacity-50" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-full flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
            {/* Topbar */}
            <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-40 flex items-center justify-between px-8 shadow-sm">
              <div className="flex items-center gap-4 text-slate-500">
                <span className="text-sm font-medium">Condomínio Residencial Estação do Mar</span>
              </div>
              
              <div className="flex items-center gap-6">
                <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Settings size={20} />
                </button>
                <div className="flex items-center gap-3 border-l border-slate-200 pl-6 ml-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">Administração</p>
                    <p className="text-xs text-slate-400">logado como síndico</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white ring-2 ring-slate-100">
                    AD
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
