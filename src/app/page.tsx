'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  Car, 
  ClipboardList, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Activity,
  Bell,
  Lock,
  X,
  Key
} from 'lucide-react';
import Link from 'next/link';

type NavItem = {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  roles?: string[]; // Multiple roles supported
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.7-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.7';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setUser(data.user);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const navItems: NavItem[] = [
    { 
      title: "MORADORES", 
      description: "GESTÃO DE RESIDENTES", 
      icon: Users, 
      href: "/moradores", 
      color: "bg-emerald-50 text-emerald-600",
      roles: ["SUPER_ADMIN", "SINDICO", "PORTEIRO"]
    },
    { 
      title: "APARTAMENTOS", 
      description: "UNIDADES E BLOCOS", 
      icon: Building, 
      href: "/unidades", 
      color: "bg-blue-50 text-blue-600",
      roles: ["SUPER_ADMIN", "SINDICO", "PORTEIRO"]
    },
    { 
      title: "VEÍCULOS", 
      description: "FROTA DO CONDOMÍNIO", 
      icon: Car, 
      href: "/veiculos", 
      color: "bg-indigo-50 text-indigo-600",
      roles: ["SUPER_ADMIN", "SINDICO", "PORTEIRO", "MORADOR"]
    },
    { 
      title: "VAGAS", 
      description: "CONTROLE DE GARAGEM", 
      icon: Settings, 
      href: "/vagas", 
      color: "bg-purple-50 text-purple-600",
      roles: ["SUPER_ADMIN", "SINDICO"]
    },
    { 
      title: "TAREFAS", 
      description: "MANUTENÇÕES E ORDENS", 
      icon: ClipboardList, 
      href: "/tarefas", 
      color: "bg-orange-50 text-orange-600",
      roles: ["SUPER_ADMIN", "SINDICO"]
    },
    { 
      title: "DOCUMENTOS", 
      description: "ARQUIVOS E NORMAS", 
      icon: FileText, 
      href: "/documentos", 
      color: "bg-rose-50 text-rose-600",
      roles: ["SUPER_ADMIN", "SINDICO", "PORTEIRO", "MORADOR"]
    }
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              ESTAÇÃO DO MAR 
              <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full tracking-widest uppercase">Portal</span>
            </h1>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Bem-vindo(a), {user?.name?.split(' ')[0] || 'Usuário'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        {/* Stats Grid - Glassmorphism Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Sistema</p>
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">OPERACIONAL <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div></h3>
            </div>
            <Activity size={80} className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Perfil Ativo</p>
              <h3 className="text-2xl font-black text-slate-800">{user?.role || 'Visitante'}</h3>
            </div>
            <ShieldCheck size={80} className="absolute -right-4 -bottom-4 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" />
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notificações</p>
              <h3 className="text-2xl font-black text-slate-800">NENHUMA</h3>
            </div>
            <Bell size={80} className="absolute -right-4 -bottom-4 text-orange-500/5 group-hover:text-orange-500/10 transition-colors" />
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col items-start"
            >
              <div className="flex items-center justify-between w-full mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tighter leading-none">{item.title}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">{item.description}</p>
                </div>
                <div className={`p-3 rounded-2xl ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
              </div>
              
              <div className="w-full flex items-center justify-between mt-auto">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Acessar Painel</span>
                <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-300">
            Estação do Mar • Condomínio Resort • {APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
