'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Building, ShieldCheck, Car, Users, ChevronDown, ChevronUp, FileText, Search, FileDown, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_VERSION } from '@/lib/version';

type Unit = { id: string; number: string; block: string };
type Companion = { id?: string; name: string; rg: string; cpf: string };
type Authorization = {
  id: string;
  unitId: string;
  unit?: Unit;
  name: string;
  rg: string;
  cpf: string;
  ddd: string;
  phone: string;
  hasGarageAccess: boolean;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor: string;
  entryDate: string;
  exitDate: string;
  notes: string;
  requesterCpf: string;
  companions: Companion[];
};

const emptyForm = {
  id: '', unitId: '', name: '', rg: '', cpf: '', ddd: '', phone: '',
  hasGarageAccess: false, vehiclePlate: '', vehicleModel: '', vehicleColor: '',
  entryDate: '', exitDate: '', notes: '',
};

function formatDate(d: string) {
  if (!d) return '—';
  const datePart = d.split('T')[0];
  const [y, m, day] = datePart.split('-');
  return `${day}/${m}/${y}`;
}

function getStatus(entry: string, exit: string) {
  if (!entry && !exit) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const e = entry ? new Date(entry) : null;
  const x = exit ? new Date(exit) : null;
  
  const eDate = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()) : null;
  const xDate = x ? new Date(x.getFullYear(), x.getMonth(), x.getDate()) : null;

  if (xDate && today > xDate) return 'expirado';
  if (eDate && today < eDate) return 'aguardando';
  return 'ativo';
}

const statusStyle: Record<string, string> = {
  ativo: 'bg-emerald-100 text-emerald-700',
  expirado: 'bg-red-100 text-red-600',
  aguardando: 'bg-amber-100 text-amber-700',
};
const statusLabel: Record<string, string> = { ativo: 'Ativo', expirado: 'Expirado', aguardando: 'Aguardando' };

export default function AutorizacoesPage() {
  const [list, setList] = useState<Authorization[]>([]);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [filterUnit, setFilterUnit] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isReportMode, setIsReportMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState({
    aguardando: true,
    ativo: true,
    expirado: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => { 
    fetchList(); 
    fetchUnidades(); 
    fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user));
  }, []);

  const fetchList = async () => {
    try {
      const res = await fetch('/api/autorizacoes');
      setList(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch('/api/unidades');
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => 
          a.number.localeCompare(b.number, undefined, { numeric: true })
        );
        setUnidades(sorted);
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, ...data } = formData;
      
      if (!data.entryDate || !data.exitDate) {
        alert('As datas de entrada e saída são obrigatórias');
        setSaving(false);
        return;
      }

      const url = isEditMode ? `/api/autorizacoes/${id}` : '/api/autorizacoes';
      const method = isEditMode ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, companions }),
      });
      if (res.ok) {
        const savedData = await res.json();
        setIsModalOpen(false);
        fetchList();

        // Gerar e enviar PDF por e-mail
        try {
          // O objeto savedData retornado pela API já contém o 'unit' com os 'residents'
          const doc = createAuthorizationPDF(savedData, currentUser?.email);
          const pdfBase64 = doc.output('datauristring').split(',')[1];
          
          console.log('Frontend: Iniciando disparo de e-mail automático...');
          const emailRes = await fetch('/api/send-authorization-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64,
              authorizationName: savedData.name,
              unitInfo: `${savedData.unit?.number} - ${savedData.unit?.block}`
            })
          });
          
          if (emailRes.ok) {
            console.log('Frontend: E-mail enviado com sucesso!');
          } else {
            const emailData = await emailRes.json();
            console.error('Frontend: Erro retornado pela API de e-mail:', emailData);
            alert(`Atenção: A autorização foi salva, mas houve um erro no envio do e-mail: ${emailData.message || 'Erro desconhecido'}`);
          }
        } catch (emailErr) {
          console.error('Frontend: Erro crítico ao processar e-mail:', emailErr);
          alert('Erro ao processar o envio do e-mail. Verifique o console para detalhes.');
        }

      } else {
        const err = await res.json();
        alert(`Erro: ${err.message}`);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir autorização de "${name}"?`)) return;
    await fetch(`/api/autorizacoes/${id}`, { method: 'DELETE' });
    fetchList();
  };

  const openCreate = () => {
    setFormData({ ...emptyForm, unitId: currentUser?.role === 'MORADOR' ? (currentUser.unitId || '') : '' });
    setCompanions([]);
    setIsEditMode(false);
    setIsReportMode(false);
    setIsModalOpen(true);
  };

  const openEdit = (a: Authorization) => {
    setFormData({
      id: a.id, unitId: a.unitId, name: a.name, rg: a.rg || '', cpf: a.cpf,
      ddd: a.ddd || '', phone: a.phone || '',
      hasGarageAccess: a.hasGarageAccess,
      vehiclePlate: a.vehiclePlate || '', vehicleModel: a.vehicleModel || '', vehicleColor: a.vehicleColor || '',
      entryDate: a.entryDate ? a.entryDate.slice(0, 10) : '',
      exitDate: a.exitDate ? a.exitDate.slice(0, 10) : '',
      notes: a.notes || '',
    });
    setCompanions(a.companions.map(c => ({ name: c.name, rg: c.rg || '', cpf: c.cpf || '' })));
    setIsEditMode(true);
    setIsReportMode(false);
    setIsModalOpen(true);
  };

  const openReport = (a: Authorization) => {
    setFormData({
      id: a.id, unitId: a.unitId, name: a.name, rg: a.rg || '', cpf: a.cpf,
      ddd: a.ddd || '', phone: a.phone || '',
      hasGarageAccess: a.hasGarageAccess,
      vehiclePlate: a.vehiclePlate || '', vehicleModel: a.vehicleModel || '', vehicleColor: a.vehicleColor || '',
      entryDate: a.entryDate ? a.entryDate.slice(0, 10) : '',
      exitDate: a.exitDate ? a.exitDate.slice(0, 10) : '',
      notes: a.notes || '',
    });
    setCompanions(a.companions.map(c => ({ name: c.name, rg: c.rg || '', cpf: c.cpf || '' })));
    setIsEditMode(false);
    setIsReportMode(true);
    setIsModalOpen(true);
  };

  const addCompanion = () => setCompanions([...companions, { name: '', rg: '', cpf: '' }]);
  const removeCompanion = (i: number) => setCompanions(companions.filter((_, idx) => idx !== i));
  const updateCompanion = (i: number, field: keyof Companion, val: string) =>
    setCompanions(companions.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const createAuthorizationPDF = (a: Authorization, requesterEmail?: string) => {
    const doc = new jsPDF();
    
    // Configurações do Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('ESTAÇÃO DO MAR', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('AUTORIZAÇÃO DE USO', 105, 30, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    // Dados do Solicitante/Proprietário (Morador da Unidade)
    const residents = (a as any).unit?.residents || [];
    const requester = residents.find((r: any) => r.cpf === a.requesterCpf) || residents[0];
    if (requester) {
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('Dados do Solicitante (Proprietário/Residente)', 14, 45);
      
      const emailToShow = requesterEmail || requester.email || '—';
      const ownerBody = [
        ['Nome:', requester.name],
        ['Unidade:', a.unit ? `${a.unit.number} - ${a.unit.block}` : '—'],
        ['Telefone:', requester.ddd ? `(${requester.ddd}) ${requester.phone}` : (requester.phone || '—')],
        ['E-mail:', emailToShow]
      ];

      autoTable(doc, {
        startY: 50,
        body: ownerBody,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
      });
    }

    // Dados Principais da Autorização
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('Dados da Autorização de Uso', 14, (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 45);
    
    const body = [
      ['Apartamento:', `${a.unit?.number || ''} - ${a.unit?.block || ''}`],
      ['Pessoa Autorizada:', a.name],
      ['CPF:', a.cpf || '—'],
      ['RG:', a.rg || '—'],
      ['Telefone:', a.ddd ? `(${a.ddd}) ${a.phone}` : (a.phone || '—')],
      ['Período de Validade:', `${formatDate(a.entryDate)} À ${formatDate(a.exitDate)}`],
      ['Acesso Garagem:', a.hasGarageAccess ? `Sim (Placa: ${a.vehiclePlate || '—'} / Mod: ${a.vehicleModel || '—'})` : 'Não'],
      ['Observações:', a.notes || '—']
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 50,
      head: [['Campo', 'Informação']],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
      didParseCell: (data) => {
        if (data.section === 'body' && (data.row.raw as any)[0] === 'Período de Validade:' && data.column.index === 1) {
          data.cell.styles.fontSize = 12;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [30, 41, 59]; // slate-800
        }
      }
    });

    // Acompanhantes
    if (a.companions && a.companions.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('Acompanhantes', 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Nome', 'CPF', 'RG']],
        body: a.companions.map(c => [c.name, c.cpf || '—', c.rg || '—']),
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] }, // slate-600
        styles: { fontSize: 8 }
      });
    }

    // Adicionar Regras ao PDF em uma nova página
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('REGRAS E ORIENTAÇÕES GERAIS', 105, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Seja bem-vindo ao Estação do Mar!', 14, 35);
    doc.setFontSize(10);
    doc.text('Para que sua estadia ocorra sem imprevistos, atente-se às nossas normas:', 14, 42);

    autoTable(doc, {
      startY: 48,
      head: [['PRAZO PARA AUTORIZAÇÃO']],
      body: [
        ['Envie os dados dos hóspedes através deste portal com 48h de antecedência.'],
        ['A PORTARIA NÃO ESTÁ AUTORIZADA A LIBERAR ACESSOS SEM O PRÉVIO REGISTRO OPERACIONAL.']
      ],
      theme: 'plain',
      headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [37, 99, 235] },
      styles: { fontSize: 9, cellPadding: 1 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['LEMBRETES DE OURO']],
      body: [
        ['• ÁREAS DE LAZER: O uso da Piscina, Academia e Salões é restrito a proprietários.'],
        ['• VISUAL EXTERNO: Toalhas e roupas não devem ser estendidas nas sacadas.'],
        ['• PÓS-PRAIA: Use o Elevador de Serviço. Lembre-se de usar o chuveiro externo para retirar a areia e secar-se antes de subir.'],
        ['• GARAGEM: Local exclusivo para veículos. Objetos de praia devem ser guardados dentro do apartamento.'],
        [''],
        ['Abaixo os telefones da Portaria e do Zelador do condomínio:'],
        ['Portaria: (12) 2134-0416'],
        ['Zelador: (12) 99156-9883']
      ],
      theme: 'plain',
      headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [180, 83, 9] }, // amber-700
      styles: { fontSize: 9, cellPadding: 1 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index >= 5) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    return doc;
  };

  const generatePDF = (a: Authorization) => {
    const doc = createAuthorizationPDF(a, currentUser?.email);
    doc.save(`Autorizacao_${a.name.replace(/\s+/g, '_')}.pdf`);
  };

  const filtered = list.filter(a => {
    const matchUnit = filterUnit ? a.unitId === filterUnit : true;
    const status = getStatus(a.entryDate, a.exitDate);
    const matchStatus = status ? statusFilter[status as keyof typeof statusFilter] : true;
    return matchUnit && matchStatus;
  }).sort((a, b) => {
    if (!a.unit || !b.unit) return 0;
    const apA = `${a.unit.number}-${a.unit.block}`;
    const apB = `${b.unit.number}-${b.unit.block}`;
    return apA.localeCompare(apB, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const inp = 'w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white';
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={26} className="text-blue-600" /> Autorizações de Uso
          </h1>
          <p className="text-slate-500 text-sm mt-1">Controle de acesso por apartamento</p>
        </div>
        {currentUser?.role !== 'PORTEIRO' && currentUser?.role !== 'CONSELHO' && (
          <button onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-semibold shadow-md shadow-blue-200 text-sm">
            <Plus size={18} /> Nova Autorização
          </button>
        )}
      </div>
      
      {/* Regras e Check-in */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 bg-gradient-to-br from-white to-blue-50/30">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          🌊 Check-in e Regras para Locação Temporária e Empréstimos de Uso do Apartamento
        </h2>
        
        <div className="space-y-4 text-slate-600">
          <p className="text-sm font-medium">
            Para que sua estadia (ou de seus hóspedes) ocorra sem imprevistos, atente-se às nossas normas:
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-100">
              <h3 className="text-blue-700 font-bold text-sm flex items-center gap-2 mb-2">
                🕒 Prazo para Autorização
              </h3>
              <p className="text-xs leading-relaxed">
                Envie os dados dos hóspedes através deste portal com 48h de antecedência. <br />
                <strong className="text-slate-800">A portaria não está autorizada a liberar acessos sem o prévio registro operacional.</strong>
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h3 className="text-amber-700 font-bold text-sm flex items-center gap-2 mb-2">
                📌 Lembretes de Ouro:
              </h3>
              <ul className="text-[11px] leading-relaxed space-y-1.5 text-slate-700 mb-3">
                <li className="flex gap-2"><span>•</span> <span><strong>Áreas de Lazer:</strong> O uso da Piscina, Academia e Salões é restrito a proprietários.</span></li>
                <li className="flex gap-2"><span>•</span> <span><strong>Visual Externo:</strong> Toalhas e roupas não devem ser estendidas nas sacadas.</span></li>
                <li className="flex gap-2"><span>•</span> <span><strong>Pós-Praia:</strong> Use o Elevador de Serviço. Lembre-se de usar o chuveiro externo para retirar a areia e secar-se antes de subir.</span></li>
                <li className="flex gap-2"><span>•</span> <span><strong>Garagem:</strong> Local exclusivo para veículos. Objetos de praia devem ser guardados dentro do apartamento.</span></li>
              </ul>
              
              <div className="pt-2 border-t border-amber-200 mt-2 text-[10px] text-amber-900/80">
                <p className="font-bold mb-1 underline">Telefones Úteis:</p>
                <div className="grid grid-cols-2 gap-2">
                  <p>Portaria: <strong>(12) 2134-0416</strong></p>
                  <p>Zelador: <strong>(12) 99156-9883</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {currentUser?.role !== 'MORADOR' && (
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
            className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-w-52">
            <option value="">Todos os apartamentos</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
          </select>
        )}
        
        <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
            <input type="checkbox" checked={statusFilter.aguardando} onChange={e => setStatusFilter(prev => ({ ...prev, aguardando: e.target.checked }))} className="w-4 h-4 rounded text-blue-600" />
            Aguardando
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
            <input type="checkbox" checked={statusFilter.ativo} onChange={e => setStatusFilter(prev => ({ ...prev, ativo: e.target.checked }))} className="w-4 h-4 rounded text-blue-600" />
            Ativo
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
            <input type="checkbox" checked={statusFilter.expirado} onChange={e => setStatusFilter(prev => ({ ...prev, expirado: e.target.checked }))} className="w-4 h-4 rounded text-blue-600" />
            Expirado
          </label>
        </div>

        <span className="text-slate-400 text-sm ml-auto">{filtered.length} registro(s)</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                <th className="p-4 font-semibold">Apartamento</th>
                <th className="p-4 font-semibold">Pessoa Autorizada</th>
                <th className="p-4 font-semibold">CPF</th>
                <th className="p-4 font-semibold">RG</th>
                <th className="p-4 font-semibold">Período</th>
                <th className="p-4 font-semibold">Garagem</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="p-10 text-center text-slate-400">Carregando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-slate-400">Nenhuma autorização cadastrada.</td></tr>
              ) : paginated.map(a => {
                const status = getStatus(a.entryDate, a.exitDate);
                const isExpanded = expandedRow === a.id;
                return (
                  <>
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                          <Building size={14} /> {a.unit?.number} - {a.unit?.block}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-1.5 group justify-between">
                          <span>{a.name}</span>
                          <button
                            onClick={() => handleCopy(`${a.id}-name`, a.name)}
                            className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 opacity-60 hover:opacity-100 flex-shrink-0"
                            title="Copiar Nome"
                          >
                            {copiedKey === `${a.id}-name` ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">
                        {a.cpf ? (
                          <div className="flex items-center gap-1.5 group justify-between">
                            <span>{a.cpf}</span>
                            <button
                              onClick={() => handleCopy(`${a.id}-cpf`, a.cpf)}
                              className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 opacity-60 hover:opacity-100 flex-shrink-0"
                              title="Copiar CPF"
                            >
                              {copiedKey === `${a.id}-cpf` ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {a.rg ? (
                          <div className="flex items-center gap-1.5 group justify-between">
                            <span>{a.rg}</span>
                            <button
                              onClick={() => handleCopy(`${a.id}-rg`, a.rg)}
                              className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 opacity-60 hover:opacity-100 flex-shrink-0"
                              title="Copiar RG"
                            >
                              {copiedKey === `${a.id}-rg` ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(a.entryDate)} → {formatDate(a.exitDate)}
                      </td>
                      <td className="p-4">
                        {a.hasGarageAccess
                          ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><Car size={13} /> {a.vehiclePlate || 'Sim'}</span>
                          : <span className="text-slate-400 text-xs">Não</span>}
                      </td>
                      <td className="p-4">
                        {status
                          ? <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[status]}`}>{statusLabel[status]}</span>
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="p-4">
                          <div className="flex justify-center items-center gap-2">
                            {a.companions.length > 0 && (
                              <button onClick={() => setExpandedRow(isExpanded ? null : a.id)}
                                title="Acompanhantes"
                                className="text-slate-500 hover:text-blue-600 transition flex items-center gap-0.5 text-xs">
                                <Users size={15} />
                                <span>{a.companions.length}</span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            )}

                            {/* Lupa para visualizar (Todos os perfis) */}
                            <button onClick={() => openReport(a)} title="Visualizar Detalhes" className="text-emerald-600 hover:scale-110 transition">
                              <Search size={18} />
                            </button>

                            <button onClick={() => generatePDF(a)} title="Gerar PDF" className="text-red-500 hover:scale-110 transition">
                              <FileText size={18} />
                            </button>
                            
                            {currentUser?.role !== 'PORTEIRO' && currentUser?.role !== 'CONSELHO' && (
                              <>
                                <button onClick={() => openEdit(a)} title="Editar" className="text-blue-500 hover:scale-110 transition"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(a.id, a.name)} title="Excluir" className="text-red-500 hover:scale-110 transition"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                      </td>
                    </tr>
                    {isExpanded && a.companions.length > 0 && (
                      <tr key={`${a.id}-companions`} className="bg-blue-50/40 border-b border-slate-100">
                        <td colSpan={8} className="px-8 py-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Acompanhantes</p>
                          <div className="flex flex-wrap gap-3">
                            {a.companions.map((c, i) => (
                              <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
                                <span className="font-medium text-slate-700">{c.name}</span>
                                {c.cpf && <span className="text-slate-400 ml-2 font-mono text-xs">CPF: {c.cpf}</span>}
                                {c.rg && <span className="text-slate-400 ml-2 text-xs">RG: {c.rg}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm border border-slate-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
            {/* Header */}
            <div className={`${isReportMode ? 'bg-emerald-600' : 'bg-blue-600'} p-5 rounded-t-2xl text-white flex justify-between items-center`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {isReportMode ? <FileText size={20} /> : <ShieldCheck size={20} />} 
                {isReportMode ? 'Relatório de Autorização' : isEditMode ? 'Editar Autorização' : 'Nova Autorização'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={22} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Apartamento */}
              <div>
                <label className={lbl}>Apartamento *</label>
                <select required className={`${inp} ${(currentUser?.role === 'MORADOR' || isReportMode) ? 'bg-slate-100 cursor-not-allowed' : ''}`} value={formData.unitId}
                  onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                  disabled={currentUser?.role === 'MORADOR' || isReportMode}>
                  <option value="">Selecione o apartamento</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.number} - {u.block}</option>)}
                </select>
              </div>

              {/* Dados do Solicitante (Apenas no modo consulta/relatório) */}
              {isReportMode && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Dados do Solicitante (Responsável)</p>
                  {(() => {
                    const viewingAuth = list.find(a => a.id === formData.id);
                    if (!viewingAuth) return null;
                    const residents = (viewingAuth as any).unit?.residents || [];
                    const req = residents.find((r: any) => r.cpf === viewingAuth.requesterCpf) || residents[0];
                    if (!req) return <p className="text-xs text-slate-400 italic">Informações do proprietário não encontradas</p>;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Nome</span>
                          <span className="font-semibold text-slate-700">{req.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">E-mail</span>
                          <span className="text-slate-600">{req.email || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Telefone</span>
                          <span className="text-slate-600">{req.ddd ? `(${req.ddd}) ${req.phone}` : (req.phone || '—')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Unidade</span>
                          <span className="text-slate-600">{(viewingAuth as any).unit?.number} - {(viewingAuth as any).unit?.block}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Dados pessoais */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-600 mb-3">Pessoa Autorizada</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={lbl}>Nome completo *</label>
                    <input required type="text" className={`${inp} ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode} placeholder="Nome da pessoa autorizada"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <label className={lbl}>CPF</label>
                    <input type="text" className={`${inp} ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode} placeholder="000.000.000-00"
                      value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                  </div>
                  <div>
                    <label className={lbl}>RG</label>
                    <input type="text" className={`${inp} ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode} placeholder="RG"
                      value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} />
                  </div>
                  <div>
                    <label className={lbl}>Telefone</label>
                    <div className="flex gap-2">
                      <input type="text" className={`${inp} w-20 ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode} placeholder="DDD"
                        value={formData.ddd} onChange={e => setFormData({ ...formData, ddd: e.target.value })} />
                      <input type="text" className={`${inp} ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode} placeholder="Número"
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Garagem */}
              <div className="border-t border-slate-100 pt-4">
                <label className={`flex items-center gap-3 select-none ${isReportMode ? 'cursor-default' : 'cursor-pointer'}`}>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.hasGarageAccess ? 'bg-blue-600' : 'bg-slate-300'} ${isReportMode ? 'opacity-70' : ''}`}
                    onClick={() => !isReportMode && setFormData({ ...formData, hasGarageAccess: !formData.hasGarageAccess })}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.hasGarageAccess ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Car size={16} /> Autorizado a utilizar vaga de garagem</span>
                </label>

                {formData.hasGarageAccess && (
                  <div className="grid grid-cols-3 gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className={lbl}>Placa *</label>
                      <input type="text" className={`${inp} ${isReportMode ? 'bg-white cursor-default' : ''}`} readOnly={isReportMode} placeholder="ABC-1234"
                        value={formData.vehiclePlate}
                        onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                      <label className={lbl}>Marca/Modelo</label>
                      <input type="text" className={`${inp} ${isReportMode ? 'bg-white cursor-default' : ''}`} readOnly={isReportMode} placeholder="Ex: HONDA CIVIC"
                        value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                      <label className={lbl}>Cor</label>
                      <input type="text" className={`${inp} ${isReportMode ? 'bg-white cursor-default' : ''}`} readOnly={isReportMode} placeholder="Ex: PRATA"
                        value={formData.vehicleColor} onChange={e => setFormData({ ...formData, vehicleColor: e.target.value.toUpperCase() })} />
                    </div>
                  </div>
                )}
              </div>

              {/* Acompanhantes */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5"><Users size={15} /> Acompanhantes</p>
                  {!isReportMode && (
                    <button type="button" onClick={addCompanion}
                      className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition font-medium flex items-center gap-1">
                      <Plus size={13} /> Adicionar
                    </button>
                  )}
                </div>
                {companions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg">Nenhum acompanhante adicionado</p>
                )}
                <div className="space-y-3">
                  {companions.map((c, i) => (
                    <div key={i} className="grid grid-cols-8 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 items-end">
                      <div className="col-span-3">
                        <label className={lbl}>Nome *</label>
                        <input required type="text" className={`${inp} ${isReportMode ? 'bg-white cursor-default' : ''}`} readOnly={isReportMode} placeholder="Nome completo"
                          value={c.name} onChange={e => updateCompanion(i, 'name', e.target.value.toUpperCase())} />
                      </div>
                      <div className="col-span-2">
                        <label className={lbl}>CPF</label>
                        <input type="text" className={`${inp} ${isReportMode ? 'bg-white cursor-default' : ''}`} readOnly={isReportMode} placeholder="CPF"
                          value={c.cpf} onChange={e => updateCompanion(i, 'cpf', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className={lbl}>RG</label>
                        <input type="text" className={`${inp} ${isReportMode ? 'bg-white cursor-default' : ''}`} readOnly={isReportMode} placeholder="RG"
                          value={c.rg} onChange={e => updateCompanion(i, 'rg', e.target.value)} />
                      </div>
                      {!isReportMode && (
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeCompanion(i)}
                            className="text-red-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50">
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Período */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-600 mb-3">Período de Permanência</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Data de Entrada *</label>
                    <input required type="date" className={`${inp} ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode}
                      value={formData.entryDate} onChange={e => setFormData({ ...formData, entryDate: e.target.value })} />
                  </div>
                  <div>
                    <label className={lbl}>Data de Saída *</label>
                    <input required type="date" className={`${inp} ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode}
                      value={formData.exitDate} onChange={e => setFormData({ ...formData, exitDate: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="border-t border-slate-100 pt-4">
                <label className={lbl}>Observações</label>
                <textarea rows={3} className={`${inp} resize-none ${isReportMode ? 'bg-slate-50 cursor-default' : ''}`} readOnly={isReportMode} placeholder="Informações adicionais..."
                  value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition text-sm font-medium">
                  {isReportMode ? 'Fechar' : 'Cancelar'}
                </button>
                {!isReportMode && (
                  <button type="submit" disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 text-sm disabled:opacity-60">
                    {saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Autorização'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Badge */}
      <div className="mt-12 text-center pb-8">
        <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
