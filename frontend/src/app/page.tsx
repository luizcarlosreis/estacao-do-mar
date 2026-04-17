export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar/Header */}
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Estação do Mar</h1>
        <div className="flex items-center space-x-4">
          <span>Olá, Morador</span>
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-primary font-bold">
            M
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-6">Dashboard</h2>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">Próxima Reserva</h3>
              <p className="text-gray-600">Salão de Festas - 20/04/2026</p>
            </div>
            <button className="mt-4 bg-secondary text-primary font-bold py-2 px-4 rounded hover:opacity-90">
              Ver Detalhes
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">Último Aviso</h3>
              <p className="text-gray-600">Manutenção do Elevador Social da Torre A.</p>
            </div>
            <button className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded hover:opacity-90">
              Ler Aviso
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">Acesso Rápido</h3>
              <p className="text-gray-600">Libere a entrada de visitantes ou prestadores de serviço.</p>
            </div>
            <button className="mt-4 bg-success text-white font-bold py-2 px-4 rounded hover:opacity-90">
              Gerar QR Code
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
