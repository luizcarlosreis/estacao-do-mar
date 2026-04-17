'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo, 
  Home
} from 'lucide-react';
import './globals.css';

// Deploy Trigger: 2026-04-17 19:12

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { title: 'Início', icon: <Home size={18} />, path: '/' },
    { title: 'Apartamentos', icon: <Building2 size={18} />, path: '/unidades' },
    { title: 'Moradores', icon: <Users size={18} />, path: '/moradores' },
    { title: 'Vagas', icon: <Car size={18} />, path: '/vagas' },
    { title: 'Colaboradores', icon: <UserCog size={18} />, path: '/colaboradores' },
    { title: 'Manutenções', icon: <Wrench size={18} />, path: '/manutencoes' },
    { title: 'Tarefas', icon: <ListTodo size={18} />, path: '/tarefas' },
  ];

  return (
    <html lang="pt-br">
      <body className="bg-slate-50">
        {/* Navbar Superior */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-8">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">EM</div>
                  <span className="font-bold text-slate-900 text-xl hidden md:block">Estação do Mar</span>
                </div>
                <div className="hidden md:flex space-x-4">
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
                <div className="ml-3 relative flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                  <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold">AD</div>
                  <span className="text-xs font-bold text-slate-700">Admin</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Conteúdo Mobile (Horizontal Scroll) */}
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

        {/* Main Content */}
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
