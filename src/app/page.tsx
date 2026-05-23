'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo,
  ChevronRight,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  FileText,
  LayoutDashboard,
  Activity,
  PhoneCall,
  Calendar,
  Package,
  Flame
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'ADMINISTRADOR',
  SINDICO: 'ZELADORIA',
  PORTEIRO: 'PORTARIA',
  MORADOR: 'MORADOR',
  ADMINISTRADORA: 'ADMINISTRADORA'
};



export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ units: 0, residents: 0 });

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          if (['SUPER_ADMIN', 'PORTEIRO', 'SINDICO'].includes(data.user.role)) {
            Promise.all([
              fetch('/api/unidades').then(res => res.ok ? res.json() : []),
              fetch('/api/moradores').then(res => res.ok ? res.json() : [])
            ]).then(([unidades, moradores]) => {
              setStats({
                units: Array.isArray(unidades) ? unidades.length : 0,
                residents: Array.isArray(moradores) ? moradores.length : 0
              });
            }).catch(e => console.error('Erro ao buscar stats:', e));
          }
        }
      });
  }, []);

  const allModules = [
    { title: 'Apartamentos', icon: <Building2 size={16} />, path: '/unidades', desc: 'Gestão de unidades e blocos.', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO'], color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Moradores / Visitas', icon: <Users size={16} />, path: '/moradores', desc: 'Cadastro de residentes e frequentes.', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR', 'ADMINISTRADORA'], color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Vagas de Garagem', icon: <Car size={16} />, path: '/vagas', desc: 'Controle de numeração de vagas.', roles: ['SUPER_ADMIN', 'SINDICO'], color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Veículos', icon: <Car size={16} />, path: '/veiculos', desc: 'Cadastro e vínculo de veículos.', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'], color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Autorizações', icon: <ShieldCheck size={16} />, path: '/autorizacoes', desc: 'Controle de acesso e uso.', roles: ['SUPER_ADMIN', 'PORTEIRO', 'SINDICO', 'MORADOR'], color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Salão de Festas', icon: <Calendar size={16} />, path: '/reservas', desc: 'Solicitações de reserva do salão.', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR', 'PORTEIRO'], color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Cadastro de Usuários', icon: <UserCog size={16} />, path: '/usuarios', desc: 'Gerenciamento de usuários administrativos.', roles: ['SUPER_ADMIN'], color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Manutenções', icon: <Wrench size={16} />, path: '/manutencoes', desc: 'Controle de manutenção predial.', roles: ['SUPER_ADMIN', 'SINDICO'], color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: user?.role === 'MORADOR' ? 'Solicitação de Reparos' : 'Tarefas', icon: <ListTodo size={16} />, path: '/tarefas', desc: user?.role === 'MORADOR' ? 'Solicitar manutenção.' : 'Backlog de atividades.', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR'], color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Mural', icon: <Megaphone size={16} />, path: '/mural', desc: 'Avisos e comunicados.', roles: ['SUPER_ADMIN', 'SINDICO', 'PORTEIRO', 'MORADOR'], color: 'text-pink-600', bg: 'bg-pink-50' },
    { title: 'Fale com o Síndico', icon: <MessageSquare size={16} />, path: '/fale-sindico', desc: 'Comunicação direta com a gestão.', roles: ['SUPER_ADMIN', 'MORADOR'], color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Documentos Importantes', icon: <FileText size={16} />, path: '/documentos', desc: 'Regimentos e informativos.', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR'], color: 'text-slate-600', bg: 'bg-slate-50' },
    { title: 'Contatos Importantes', icon: <PhoneCall size={16} />, path: '/contatos', desc: 'Prestadores e emergência.', roles: ['SUPER_ADMIN', 'SINDICO', 'PORTEIRO'], color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Encomendas', icon: <Package size={16} />, path: '/encomendas', desc: 'Recebimento de mercadorias e avisos.', roles: ['SUPER_ADMIN', 'SINDICO', 'PORTEIRO', 'MORADOR'], color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Leitura de Gás', icon: <Flame size={16} />, path: '/leitura-gas', desc: user?.role === 'MORADOR' ? 'Consulte o histórico de consumo de gás da sua unidade.' : 'Registro da leitura mensal de gás.', roles: ['SUPER_ADMIN', 'SINDICO', 'MORADOR', 'ADMINISTRADORA'], color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const modules = user 
    ? allModules
        .filter(item => item.roles.includes(user.role))
        .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    : [];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {user ? `OLÁ, ${user.name.split(' ')[0]}` : 'CARREGANDO...'}
            </h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] opacity-80">
              {user ? roleLabels[user.role] : 'PORTAL DE GESTÃO'}
            </p>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-3 font-medium">
          Bem vindo ao Portal do condomínio Estação do Mar
        </p>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {modules.map((item, i) => (
          <Link key={i} href={item.path} className="group">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 hover:border-blue-400 hover:shadow-md transition-all h-full flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 text-[10px] leading-tight mb-1 uppercase tracking-wide group-hover:text-blue-600 transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-[9px] text-slate-500 leading-snug lowercase first-letter:uppercase font-medium opacity-70 line-clamp-2">
                  {item.desc}
                </p>
              </div>
              
              <div className={`p-2 ${item.bg} ${item.color} rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                {item.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Estatísticas / Monitoramento */}
      {['SUPER_ADMIN', 'PORTEIRO', 'SINDICO'].includes(user?.role) && (
        <div className="mt-12 p-1 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="bg-white/5 absolute inset-0 pointer-events-none" />
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-blue-500 rounded-lg animate-pulse">
                  <Activity size={18} className="text-white" />
                </div>
                <h3 className="text-white text-lg font-black uppercase tracking-tight">Monitoramento em Tempo Real</h3>
              </div>
              <p className="text-slate-400 text-xs font-medium max-w-md">
                Estatísticas operacionais sincronizadas com a base de dados. Integridade total garantida.
              </p>
            </div>
            
            <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-3xl text-center min-w-[120px] hover:bg-white/20 transition-colors group">
                  <p className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{stats.units}</p>
                  <p className="text-[9px] uppercase font-black text-blue-300 tracking-[0.2em]">Unidades</p>
               </div>
               <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-3xl text-center min-w-[120px] hover:bg-white/20 transition-colors group">
                  <p className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{stats.residents}</p>
                  <p className="text-[9px] uppercase font-black text-blue-300 tracking-[0.2em]">Moradores</p>
               </div>
            </div>
          </div>
          
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Footer Version */}
      <div className="mt-16 text-center pb-12">
        <span className="text-[10px] uppercase tracking-[0.3em] font-black px-4 py-2 rounded-full text-red-600 bg-white shadow-xl shadow-red-100/20 border border-red-50">
          ESTAÇÃO DO MAR • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
