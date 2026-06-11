'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Boleto {
  id: string;
  unidadeId: string;
  unidadeNome: string;
  referencia: string;
  vencimento: string;
  valor: string;
  linhaDigitavel: string | null;
  status: string;
}

export default function TesteBoletoPage() {
  const [mounted, setMounted] = useState(false);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de formulário de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Tentar carregar boletos diretamente (se já houver cookie)
      const res = await fetch('/api/teste-boleto');
      
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.winkerSessionRequired) {
          setSessionRequired(true);
          // Buscar e-mail padrão do usuário logado no portal
          fetchPortalEmail();
          setLoading(false);
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao buscar a lista de boletos.');
      }

      const data = await res.json();
      setBoletos(data);
      setSessionRequired(false);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortalEmail = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data?.user?.email) {
          setEmail(data.user.email);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar e-mail do portal:', e);
    }
  };

  const handleWinkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Por favor, informe o e-mail e a senha.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const res = await fetch('/api/teste-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Usuário ou senha incorretos na Winker.');
      }

      const data = await res.json();
      setBoletos(data);
      setSessionRequired(false);
      setPassword(''); // Limpar campo de senha
    } catch (err: any) {
      setFormError(err.message || 'Falha na autenticação do Winker.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWinkerLogout = async () => {
    try {
      setLoading(true);
      await fetch('/api/teste-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      setBoletos([]);
      setSessionRequired(true);
      fetchPortalEmail();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBarcode = (id: string, barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Estação do Mar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">
              BOLETO (2a. via)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Visualização e impressão de boletos diretamente do portal Winker
            </p>
          </div>

          {!loading && !sessionRequired && (
            <div className="flex items-center gap-2.5">
              <button 
                onClick={initializePage}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                </svg>
                Atualizar
              </button>
              <button 
                onClick={handleWinkerLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-50 transition"
              >
                Sair
              </button>
            </div>
          )}
        </div>

        {/* Loader de Inicialização */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Formulário de Login da Winker */}
        {!loading && sessionRequired && (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Autenticação Winker
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                Para carregar seus boletos, insira as credenciais do seu login no aplicativo Winker.
              </p>
            </div>

            <form onSubmit={handleWinkerLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">E-mail Winker</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Senha</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  disabled={submitting}
                />
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition shadow-sm"
              >
                {submitting ? 'Autenticando...' : 'Carregar Boletos'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 leading-relaxed flex items-start gap-2.5">
              <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Aviso de Segurança:</strong> Seus dados de e-mail e senha são usados apenas na conexão direta e segura com a Winker. O portal Estação do Mar não armazena ou registra suas senhas no banco de dados.
              </span>
            </div>
          </div>
        )}

        {/* Mensagem de Erro Geral */}
        {!loading && !sessionRequired && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-rose-100 text-rose-600 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-2">
              Erro de conexão
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
              {error}
            </p>
            <button 
              onClick={initializePage}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Sem boletos após logado */}
        {!loading && !sessionRequired && !error && boletos.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
              Nenhum boleto encontrado
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              Não encontramos nenhuma fatura pendente nos últimos meses para as unidades vinculadas ao seu usuário do Winker.
            </p>
            <button 
              onClick={handleWinkerLogout}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition"
            >
              Entrar com Outra Conta
            </button>
          </div>
        )}

        {/* Lista de Boletos */}
        {!loading && !sessionRequired && !error && boletos.length > 0 && (
          <div className="space-y-6">
            {boletos.map((boleto) => (
              <div 
                key={boleto.id} 
                className="bg-white border border-slate-200 hover:border-slate-350 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                        Unidade {boleto.unidadeNome}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Referência: {boleto.referencia}
                      </p>
                    </div>
                  </div>

                  {(boleto.status || 'Aberto') === 'Pago' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Pago
                    </span>
                  ) : (boleto.status || 'Aberto') === 'Vencido' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-rose-700">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                      Vencido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-700">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                      Aberto
                    </span>
                  )}
                </div>

                {/* Grid de Informações Financeiras */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Vencimento</span>
                    <span className="text-sm font-black text-slate-700">{boleto.vencimento}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Valor Total</span>
                    <span className="text-sm font-black text-indigo-650 text-indigo-600">{boleto.valor}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Identificador</span>
                    <span className="text-sm font-black text-slate-700">{boleto.id}</span>
                  </div>
                </div>

                {/* Código de Barras / Linha Digitável */}
                {boleto.linhaDigitavel && (
                  <div className="mb-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Linha Digitável</span>
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 truncate pr-2 select-all">
                        {boleto.linhaDigitavel}
                      </span>
                      <button
                        onClick={() => handleCopyBarcode(boleto.id, boleto.linhaDigitavel!)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                          copiedId === boleto.id
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {copiedId === boleto.id ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h5.586a1 1 0 01.707-.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href={`/api/teste-boleto?idBoleto=${boleto.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Visualizar PDF
                  </a>

                  <a
                    href={`/api/teste-boleto?idBoleto=${boleto.id}`}
                    download={`boleto_${boleto.id}.pdf`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar Arquivo
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
