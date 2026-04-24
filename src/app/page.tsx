'use client';

import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function Home() {
  const modules = [
    { title: 'Apartamentos', icon: <Building2 className="text-blue-600" />, path: '/unidades', desc: 'Gestão de unidades e blocos.' },
    { title: 'Moradores', icon: <Users className="text-emerald-600" />, path: '/moradores', desc: 'Cadastro de residentes.' },
    { title: 'Vagas de Garagem', icon: <Car className="text-orange-600" />, path: '/vagas', desc: 'Controle de numeração de vagas.' },
    { title: 'Veículos', icon: <Car className="text-blue-500" />, path: '/veiculos', desc: 'Cadastro e vínculo de veículos.' },
    { title: 'Autorizações', icon: <ShieldCheck className="text-teal-600" />, path: '/autorizacoes', desc: 'Controle de acesso e uso por apartamento.' },
    { title: 'Colaboradores', icon: <UserCog className="text-purple-600" />, path: '/colaboradores', desc: 'Equipe de serviço e portaria.' },
    { title: 'Manutenções', icon: <Wrench className="text-red-600" />, path: '/manutencoes', desc: 'Controle de manutenção predial.' },
    { title: 'Tarefas Pendentes', icon: <ListTodo className="text-indigo-600" />, path: '/tarefas', desc: 'Backlog de atividades.' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Seja bem-vindo, Administrador</h2>
        <p className="text-slate-500">Selecione um módulo abaixo para gerenciar o condomínio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((item, i) => (
          <Link key={i} href={item.path} className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all h-full flex items-start space-x-4">
              <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Acessar <ChevronRight size={12} className="ml-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-8 bg-blue-600 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-xl font-bold">Monitoramento em Tempo Real</h3>
          <p className="text-blue-100 opacity-80 mt-1">Todas as operações do Estação do Mar estão sincronizadas com o banco de dados.</p>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-center min-w-[100px]">
              <p className="text-2xl font-bold">128</p>
              <p className="text-[10px] uppercase font-bold text-blue-200">Unidades</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-center min-w-[100px]">
              <p className="text-2xl font-bold">452</p>
              <p className="text-[10px] uppercase font-bold text-blue-200">Moradores</p>
           </div>
        </div>
        {/* Decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
}
