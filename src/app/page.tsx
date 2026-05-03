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
  role?: string;
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.6-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.6';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('As novas senhas não coincidem');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/perfil/senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new })
      });
      if (res.ok) {
        alert('Senha alterada com sucesso!');
        setIsPasswordModalOpen(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setChangingPassword(false);
    }
  };

  const navItems: NavItem[] = [
    { 
      title: "MORADORES", 
      description: "GESTÃO DE RESIDENTES", 
      icon: Users, 
      href: "/moradores", 
      color: "bg-emerald-50 text-emerald-600",
      role: "ADMIN"
    },
    { 
      title: "APARTAMENTOS", 
      description: "UNIDADES E BLOCOS", 
      icon: Building, 
      href: "/unidades", 
      color: "bg-blue-50 text-blue-600",
      role: "ADMIN"
    },
    { 
      title: "VEÍCULOS", 
      description: "FROTA DO CONDOMÍNIO", 
      icon: Car, 
      href: "/veiculos", 
      color: "bg-indigo-50 text-indigo-600"
    },
    { 
      title: "VAGAS", 
      description: "CONTROLE DE GARAGEM", 
      icon: Settings, 
      href: "/vagas", 
      color: "bg-purple-50 text-purple-600",
      role: "ADMIN"
    },
    { 
      title: "TAREFAS", 
      description: "MANUTENÇÕES E ORDENS", 
      icon: ClipboardList, 
      href: "/tarefas", 
      color: "bg-orange-50 text-orange-600"
    },
    { 
      title: "DOCUMENTOS", 
      description: "ARQUIVOS E NORMAS", 
      icon: FileText, 
      href: "/documentos", 
      color: "bg-rose-50 text-rose-600"
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
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Key size={14} className="text-blue-500" /> Alterar Senha
            </button>
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
          {navItems.filter(item => !item.role || item.role === user?.role).map((item, idx) => (
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

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <Lock size={20} /> Alterar Senha
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Segurança da sua conta</p>
              </div>
              <button onClick={() => setIsPasswordModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Senha Atual</label>
                <input 
                  type="password" required 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800"
                  value={passwordForm.current} 
                  onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nova Senha</label>
                  <input 
                    type="password" required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800"
                    value={passwordForm.new} 
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                  <input 
                    type="password" required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[12px] font-bold text-slate-800"
                    value={passwordForm.confirm} 
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={changingPassword}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {changingPassword ? 'Alterando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
