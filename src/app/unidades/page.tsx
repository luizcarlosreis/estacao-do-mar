'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Home, Users, Car, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

type Resident = { name: string; cpf: string };
type ParkingSpace = { number: string; block: string };

type Vehicle = { plate: string; model: string; type: string };

type Unit = {
  id: string;
  number: string;
  block: string;
  residents?: Resident[];
  parkingSpaces?: ParkingSpace[];
  vehicles?: Vehicle[];
};

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.10-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.10';

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', number: '', block: '' });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const fetchUnidades = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/unidades');
      if (!res.ok) throw new Error('Falha ao buscar dados');
      const data = await res.json();
      const sortedData = Array.isArray(data) 
        ? [...data].sort((a, b) => {
            const apA = `${a.number}-${a.block}`;
            const apB = `${b.number}-${b.block}`;
            return apA.localeCompare(apB, undefined, { numeric: true, sensitivity: 'base' });
          })
        : [];
      setUnidades(sortedData);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.block) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditMode ? `/api/unidades/${formData.id}` : '/api/unidades';
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: String(formData.number), 
          block: String(formData.block) 
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: '', number: '', block: '' });
        fetchUnidades();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.message || 'Falha na operação'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro de conexão com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este apartamento?')) return;
    try {
      const res = await fetch(`/api/unidades/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUnidades();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Home className="text-blue-600" size={32} /> 
            Apartamentos
          </h1>
          <p className="text-slate-500 font-medium">Gerencie as unidades e blocos do condomínio.</p>
        </div>
        <button 
          onClick={() => { setFormData({id:'', number:'', block:''}); setIsEditMode(false); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus size={20} /> Adicionar Unidade
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium">Carregando unidades...</p>
        </div>
      ) : unidades.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center">
          <p className="text-slate-400 font-medium">Nenhum apartamento cadastrado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
              <div key={u.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">Apto {u.number}</h3>
                    <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mt-1">MORADORES: {u.residents?.length || 0}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setFormData({id:u.id, number:u.number, block:u.block}); setIsEditMode(true); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50 flex-grow">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <Users size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Moradores</p>
                      <p className="text-xs font-bold text-slate-700 break-words whitespace-normal leading-relaxed">
                        {u.residents && u.residents.length > 0 ? u.residents.map(r => r.name).join(', ') : 'Vazio'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <Car size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Número da(s) Vaga(s)</p>
                      <p className="text-xs font-bold text-slate-700 break-words whitespace-normal leading-relaxed">
                        {u.parkingSpaces && u.parkingSpaces.length > 0 ? u.parkingSpaces.map(v => v.number).join(', ') : 'Nenhuma'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <Car size={16} className="rotate-0" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Veículos</p>
                      <p className="text-xs font-bold text-slate-700 break-words whitespace-normal leading-relaxed">
                        {u.vehicles && u.vehicles.length > 0 ? u.vehicles.map(v => `${v.model} (${v.plate})`).join(', ') : 'Nenhum'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {Math.ceil(unidades.length / itemsPerPage) > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(unidades.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(unidades.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(unidades.length / itemsPerPage)}
                className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Version Badge */}
      <div className="mt-12 text-center pb-8">
        <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-8">{isEditMode ? 'Editar Unidade' : 'Nova Unidade'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Número do Apartamento</label>
                <input required type="text" placeholder="Ex: 101" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bloco / Torre</label>
                <input required type="text" placeholder="Ex: Bloco A" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold" value={formData.block} onChange={(e) => setFormData({...formData, block: e.target.value})} />
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button disabled={submitting} type="submit" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="animate-spin" size={18} />}
                  {isEditMode ? 'Salvar Alterações' : 'Criar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
