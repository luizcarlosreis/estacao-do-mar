import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Car, 
  UserCog, 
  Wrench, 
  ListTodo, 
  LayoutDashboard,
  LogOut
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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar/Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">Estação do Mar <span className="text-emerald-400 font-light">Admin</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Síndico Admin</p>
              <p className="text-xs text-slate-400">logado agora</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
              A
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Painel de Controle</h2>
          <p className="text-slate-500">Bem-vindo ao sistema de gestão do Condomínio Estação do Mar.</p>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Link key={index} href={module.path} className="group">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col justify-between hover:shadow-xl hover:border-emerald-200 transition-all duration-300 transform group-hover:-translate-y-1">
                <div>
                  <div className={`w-12 h-12 ${module.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    {module.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">{module.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {module.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-emerald-600 font-semibold text-sm">
                  Acessar módulo 
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Placeholder */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
                { label: 'Unidades', value: '128', sub: 'Total' },
                { label: 'Moradores', value: '452', sub: 'Ativos' },
                { label: 'Manutenções', value: '3', sub: 'Pendentes' },
                { label: 'Tarefas', value: '12', sub: 'Em Backlog' },
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-emerald-400 mt-1">{stat.sub}</p>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
