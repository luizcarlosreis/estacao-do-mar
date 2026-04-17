'use client';

import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo,
  ArrowUpRight
} from 'lucide-react';

export default function Home() {
  const modules = [
    { title: 'Apartamentos', icon: <Building2 />, path: '/unidades', count: '128', label: 'Unidades', color: 'blue' },
    { title: 'Moradores', icon: <Users />, path: '/moradores', count: '452', label: 'Residentes', color: 'emerald' },
    { title: 'Vagas', icon: <Car />, path: '/vagas', count: '150', label: 'Vagas Ativas', color: 'orange' },
    { title: 'Colaboradores', icon: <UserCog />, path: '/colaboradores', count: '12', label: 'Equipe', color: 'purple' },
    { title: 'Manutenções', icon: <Wrench />, path: '/manutencoes', count: '03', label: 'Pendentes', color: 'red' },
    { title: 'Tarefas', icon: <ListTodo />, path: '/tarefas', count: '08', label: 'Backlog', color: 'indigo' },
  ];

  const colors: any = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  const borders: any = {
    blue: 'border-blue-100',
    emerald: 'border-emerald-100',
    orange: 'border-orange-100',
    purple: 'border-purple-100',
    red: 'border-red-100',
    indigo: 'border-indigo-100',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Administrativo</h1>
        <p className="text-slate-500 mt-2 font-medium">Controle total do Condomínio Estação do Mar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) => (
          <Link key={i} href={m.path} className="group">
            <div className={`bg-white border ${borders[m.color]} p-6 rounded-[2rem] hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 flex flex-col h-full relative overflow-hidden group-hover:scale-[1.02]`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl ${colors[m.color]} flex items-center justify-center`}>
                  {m.icon}
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-1">{m.title}</h3>
              <p className="text-slate-400 text-sm mb-4">Gerenciar {m.title.toLowerCase()} do condomínio.</p>
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
                <div>
                  <span className="text-3xl font-black text-slate-900 leading-none">{m.count}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.label}</p>
                </div>
              </div>

              {/* Decorative element */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${colors[m.color]} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Access or Summary */}
      <div className="mt-12 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Status Geral</h2>
            <p className="text-slate-500">O sistema está operando normalmente e todos os módulos estão sincronizados.</p>
          </div>
          <div className="flex gap-2">
            <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">Atualizado agora</div>
          </div>
        </div>
      </div>
    </div>
  );
}
