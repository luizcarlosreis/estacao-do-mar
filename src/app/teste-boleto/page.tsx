'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TesteBoletoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center">
      <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
        Teste de Boleto (Simplificado)
      </h1>
      <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
        Se você está vendo esta tela, a página carregou com sucesso no ambiente Vercel.
      </p>
      <Link href="/" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition">
        Voltar ao Painel
      </Link>
    </div>
  );
}
