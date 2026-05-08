'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User as UserIcon, Loader2, Info, X, RefreshCw } from 'lucide-react';

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
  ? `v1.1.13-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}` 
  : 'v1.1.13';

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCpf, setResetCpf] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password })
      });

      if (res.ok) {
        // Redirecionar dependendo da role
        const data = await res.json();
        
        if (data.user.role === 'MORADOR') {
          router.push('/autorizacoes'); // Morador default view
        } else if (data.user.role === 'SUPER_ADMIN') {
          router.push('/');
        } else {
          router.push('/');
        }
        
        // Em um app real usaríamos router.refresh() e redirecionaríamos baseado na sessão
        setTimeout(() => {
          window.location.href = '/';
        }, 500);

      } else {
        const data = await res.json();
        setError(data.message || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    try {
      const res = await fetch('/api/login/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: resetCpf })
      });
      const data = await res.json();
      if (res.ok) {
        setResetMessage('Sucesso! Senha resetada para o padrão (5 primeiros dígitos do CPF).');
        setTimeout(() => {
          setShowResetModal(false);
          setResetMessage('');
          setResetCpf('');
        }, 3000);
      } else {
        setResetMessage(`Erro: ${data.message}`);
      }
    } catch (err) {
      setResetMessage('Erro de conexão ao tentar resetar.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 mb-2">Estação do Mar</h1>
          <p className="text-slate-500 font-medium">Acesse o portal do condomínio</p>
        </div>



        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 animate-in shake duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">CPF ou Login</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                required
                autoFocus
                className="w-full pl-11 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700" 
                placeholder="Digite seu CPF ou login"
                value={cpf}
                onChange={e => setCpf(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="password" 
                required
                className="w-full pl-11 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700" 
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setShowResetModal(true)}
            className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            Esqueceu sua senha? Resetar padrão
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-300">
            Estação do Mar • {APP_VERSION}
          </span>
        </div>
      </div>

      {/* Modal de Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><RefreshCw size={18} /> Resetar Senha</h2>
              <button onClick={() => setShowResetModal(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Informe seu CPF abaixo. Se cadastrado, sua senha voltará a ser os <strong>5 primeiros dígitos</strong> do CPF.
              </p>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">CPF</label>
                <input 
                  type="text" 
                  required
                  placeholder="Apenas números ou login"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={resetCpf}
                  onChange={e => setResetCpf(e.target.value)}
                />
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold ${resetMessage.startsWith('Erro') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {resetLoading ? 'Processando...' : 'Confirmar Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
