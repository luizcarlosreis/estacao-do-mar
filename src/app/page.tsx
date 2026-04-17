'use client';

import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const modules = [
    { title: 'Apartamentos', icon: <Building2 size={24} />, path: '/unidades', description: 'Gestão de blocos e unidades.', color: 'bg-blue-500' },
    { title: 'Moradores', icon: <Users size={24} />, path: '/moradores', description: 'Cadastro e vínculo de residentes.', color: 'bg-emerald-500' },
    { title: 'Vagas de Garagem', icon: <Car size={24} />, path: '/vagas', description: 'Controle de vagas por unidade.', color: 'bg-orange-500' },
    { title: 'Colaboradores', icon: <UserCog size={24} />, path: '/colaboradores', description: 'Gestão de equipe e acessos.', color: 'bg-purple-500' },
    { title: 'Manutenções', icon: <Wrench size={24} />, path: '/manutencoes', description: 'Cronograma preventivo.', color: 'bg-red-500' },
    { title: 'Backlog de Tarefas', icon: <ListTodo size={24} />, path: '/tarefas', description: 'Tarefas pendentes e status.', color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Painel de Controle</h2>
        <p className="text-slate-500 text-lg">Seja bem-vindo ao sistema administrativo do Estação do Mar.</p>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((module, index) => (
          <Link key={index} href={module.path} className="group">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col justify-between hover:shadow-2xl hover:border-blue-200 transition-all duration-500 transform group-hover:-translate-y-2">
              <div>
                <div className={`w-14 h-14 ${module.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  {module.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{module.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {module.description}
                </p>
              </div>
              <div className="mt-8 flex items-center text-blue-600 font-bold text-sm uppercase tracking-widest">
                Acessar módulo 
                <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            Visão Geral do Condomínio
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Unidades', value: '128' },
              { label: 'Moradores', value: '452' },
              { label: 'Manutenções', value: '03' },
              { label: 'Tarefas', value: '12' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-slate-400 text-sm font-medium uppercase tracking-tighter mb-1">{stat.label}</span>
                <span className="text-4xl font-black text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>
    </div>
  );
}
