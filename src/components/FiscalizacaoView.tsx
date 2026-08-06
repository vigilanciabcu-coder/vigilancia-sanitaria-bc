import React, { useState, useRef } from 'react';
import { FiscalizacaoItem, InspectionCheckitem, InspectionStatus, RiskLevel, InspectionType, UserProfile } from '../types';
import { BAIRROS_BC } from '../data/mockData';
import {
  ShieldCheck,
  PlusCircle,
  MapPin,
  Sparkles,
  Printer,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  UserCheck
} from 'lucide-react';

interface FiscalizacaoViewProps {
  fiscalizacoes: FiscalizacaoItem[];
  currentUser: UserProfile | null;
  onSaveFiscalizacao: (item: FiscalizacaoItem) => void;
}

const CHECKLIST_DEFAULT: Omit<InspectionCheckitem, 'id'>[] = [
  { categoria: 'Higiene e Limpeza', item: 'Limpeza de bancadas, piso e equipamentos de manipulação', status: 'CONFORME' },
  { categoria: 'Higiene e Limpeza', item: 'Lixeiras com tampa acionada por pedal e sacos plásticos', status: 'CONFORME' },
  { categoria: 'Temperatura e Alimentos', item: 'Termômetro em geladeiras/freezeres e controle térmico adequado', status: 'CONFORME' },
  { categoria: 'Temperatura e Alimentos', item: 'Separação de alimentos crus e cozidos (evitar contaminação cruzada)', status: 'CONFORME' },
  { categoria: 'Validade e Procedência', item: 'Produtos dentro do prazo de validade e com rotulagem completa', status: 'CONFORME' },
  { categoria: 'Validade e Procedência', item: 'Comprovação de origem e selo de inspeção para carnes e pescados', status: 'CONFORME' },
  { categoria: 'Licenciamento e Normas', item: 'Alvará de Licença Sanitária exposto em local visível', status: 'CONFORME' },
  { categoria: 'Controle de Pragas', item: 'Comprovante atualizado de desinsetização/desratização por empresa habilitada', status: 'CONFORME' },
  { categoria: 'Manipuladores', item: 'Manipuladores com uniformes claros, limpos e proteção para cabelos (touca)', status: 'CONFORME' }
];

export const FiscalizacaoView: React.FC<FiscalizacaoViewProps> = ({
  fiscalizacoes,
  currentUser,
  onSaveFiscalizacao
}) => {
  const [activeTab, setActiveTab] = useState<'lista' | 'nova' | 'mapa' | 'termo'>('lista');
  const [selectedItem, setSelectedItem] = useState<FiscalizacaoItem | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBairro, setFilterBairro] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpjCpf: '',
    tipo: 'Restaurante / Alimentação',
    bairro: 'Centro',
    endereco: 'Avenida Brasil',
    numero: '100',
    responsavel: '',
    telefone: '',
    tipoVistoria: 'ROTINA' as InspectionType,
    risco: 'MÉDIO' as RiskLevel,
    medidasAdotadas: 'Termo de Notificação Sanitária',
    prazoAdequacaoDias: 3,
    observacoesFiscais: '',
    fotosUrl: [] as string[]
  });

  const [checklists, setChecklists] = useState<InspectionCheckitem[]>(
    CHECKLIST_DEFAULT.map((item, idx) => ({ ...item, id: `chk-new-${idx}` }))
  );

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [signatureInspector, setSignatureInspector] = useState<string>('');
  const [signatureOwner, setSignatureOwner] = useState<string>('');

  // CNPJ Lookup
  const handleBuscarCNPJ = async () => {
    if (!formData.cnpjCpf) return;
    setLoadingCnpj(true);
    try {
      const res = await fetch(`/api/cnpj/${formData.cnpjCpf}`);
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          razaoSocial: data.razao || prev.razaoSocial,
          nomeFantasia: prev.nomeFantasia || data.razao,
          endereco: data.rua_api || prev.endereco,
          numero: data.num_api || prev.numero,
          bairro: prev.bairro
        }));
      }
    } catch (e) {
      console.error('Erro na busca de CNPJ:', e);
    } finally {
      setLoadingCnpj(false);
    }
  };

  // Run AI Legal Analysis
  const handleAnalisarIA = async () => {
    const irregularidades = checklists
      .filter((c) => c.status === 'NAO_CONFORME')
      .map((c) => `${c.categoria}: ${c.item} ${c.observacao ? `(${c.observacao})` : ''}`);

    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoVistoria: formData.tipoVistoria,
          tipoEstabelecimento: `${formData.tipo} - ${formData.nomeFantasia}`,
          irregularidades,
          observacoes: formData.observacoesFiscais,
          risco: formData.risco
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.text || 'Análise concluída.');
      } else {
        setAiAnalysis('Não foi possível conectar ao assistente Gemini. Utilize a fundamentação legal padrão.');
      }
    } catch {
      setAiAnalysis('Análise de RDC executada off-line. Enquadramento legal recomendado: RDC Anvisa nº 216/2004 e Lei de Saúde de BC.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Add Photo
  const handleAddPhotoSample = () => {
    const samples = [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setFormData((prev) => ({
      ...prev,
      fotosUrl: [...prev.fotosUrl, picked]
    }));
  };

  // Submit Inspection
  const handleSubmitNewInspection = (e: React.FormEvent) => {
    e.preventDefault();

    const irregularidades = checklists
      .filter((c) => c.status === 'NAO_CONFORME')
      .map((c) => `${c.item}${c.observacao ? `: ${c.observacao}` : ''}`);

    let status: InspectionStatus = 'CONFORME';
    if (irregularidades.length > 0) {
      if (formData.risco === 'CRÍTICO' || formData.medidasAdotadas.includes('Interdição')) {
        status = 'INTERDITADO';
      } else {
        status = 'NOTIFICADO';
      }
    }

    const newProtocol = `FIS-2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newItem: FiscalizacaoItem = {
      id: `fisc-${Date.now()}`,
      protocolo: newProtocol,
      dataHora: nowStr,
      fiscalId: currentUser?.id || 'f1',
      fiscalNome: currentUser?.nome_completo || 'Carlos Eduardo Silva',
      estabelecimento: {
        nomeFantasia: formData.nomeFantasia || 'Estabelecimento sem nome',
        razaoSocial: formData.razaoSocial || formData.nomeFantasia,
        cnpjCpf: formData.cnpjCpf || '00.000.000/0001-00',
        tipo: formData.tipo,
        bairro: formData.bairro,
        endereco: formData.endereco,
        numero: formData.numero,
        responsavel: formData.responsavel || 'Não informado',
        telefone: formData.telefone || '(47) 3367-0000'
      },
      tipoVistoria: formData.tipoVistoria,
      risco: formData.risco,
      status,
      checklists,
      irregularidadesEncontradas: irregularidades,
      medidasAdotadas: formData.medidasAdotadas,
      prazoAdequacaoDias: formData.prazoAdequacaoDias,
      observacoesFiscais: formData.observacoesFiscais,
      fotosUrl: formData.fotosUrl,
      assinaturaInspector: signatureInspector || 'Assinado Digitalmente por Fiscal DVIS',
      assinaturaResponsavel: signatureOwner || 'Ciente do Responsável Técnico',
      coordenadas: { lat: -26.9922 + (Math.random() - 0.5) * 0.03, lng: -48.6345 + (Math.random() - 0.5) * 0.03 },
      parecerIA: aiAnalysis
    };

    onSaveFiscalizacao(newItem);
    setSelectedItem(newItem);
    setActiveTab('termo');
  };

  // Filtered List
  const filteredList = fiscalizacoes.filter((f) => {
    const matchText =
      f.estabelecimento.nomeFantasia.toLowerCase().includes(filterSearch.toLowerCase()) ||
      f.protocolo.toLowerCase().includes(filterSearch.toLowerCase()) ||
      f.estabelecimento.cnpjCpf.includes(filterSearch);
    const matchBairro = !filterBairro || f.estabelecimento.bairro === filterBairro;
    const matchStatus = !filterStatus || f.status === filterStatus;
    return matchText && matchBairro && matchStatus;
  });

  // Print term
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/40 uppercase tracking-widest flex items-center gap-1.5 inline-flex mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sistema de Vistorias em Tempo Real • DVIS BC
          </span>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tight">
            Fiscalização Sanitária Integrada
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Emissão de Termos de Notificação, Intimação, Autuação e Interdição Cautelar em campo com validação legal e assinatura digital.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('nova')}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-xs uppercase cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Nova Vistoria
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('lista')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'lista'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Vistorias Registradas ({fiscalizacoes.length})
        </button>

        <button
          onClick={() => setActiveTab('nova')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'nova'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Nova Fiscalização em Tempo Real
        </button>

        <button
          onClick={() => setActiveTab('mapa')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'mapa'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" /> Mapa de Campo (BC)
        </button>

        {selectedItem && (
          <button
            onClick={() => setActiveTab('termo')}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'termo'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Printer className="w-4 h-4" /> Termo Oficial #{selectedItem.protocolo}
          </button>
        )}
      </div>

      {/* TAB 1: LISTA DE VISTORIAS */}
      {activeTab === 'lista' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, protocolo ou CNPJ..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div>
              <select value={filterBairro} onChange={(e) => setFilterBairro(e.target.value)} className="w-full">
                <option value="">Todos os Bairros de BC</option>
                {BAIRROS_BC.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full">
                <option value="">Todos os Status</option>
                <option value="CONFORME">CONFORME</option>
                <option value="NOTIFICADO">NOTIFICADO</option>
                <option value="INTERDITADO">INTERDITADO</option>
                <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
              </select>
            </div>

            <div className="flex items-center text-xs text-slate-500 justify-end font-bold">
              <span>Exibindo {filteredList.length} registro(s)</span>
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((f) => (
              <div
                key={f.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 uppercase">
                      {f.protocolo}
                    </span>

                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        f.status === 'CONFORME'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : f.status === 'INTERDITADO'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight uppercase mb-1">
                    {f.estabelecimento.nomeFantasia}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-3">
                    {f.estabelecimento.tipo} • Bairro {f.estabelecimento.bairro}
                  </p>

                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2 mb-3">
                    <p className="truncate">📍 {f.estabelecimento.endereco}, {f.estabelecimento.numero}</p>
                    <p>👨‍💼 Responsável: {f.estabelecimento.responsavel}</p>
                    <p>👮 Fiscal: {f.fiscalNome}</p>
                    <p>🕒 {f.dataHora}</p>
                  </div>

                  {f.irregularidadesEncontradas.length > 0 && (
                    <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[10px] text-red-800 dark:text-red-300 mb-3">
                      <p className="font-black uppercase mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" /> Irregularidades ({f.irregularidadesEncontradas.length}):
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {f.irregularidadesEncontradas.slice(0, 2).map((ir, i) => (
                          <li key={i} className="truncate">{ir}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400">Risco: {f.risco}</span>
                  <button
                    onClick={() => {
                      setSelectedItem(f);
                      setActiveTab('termo');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] px-3 py-1.5 rounded-xl uppercase transition cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" /> Ver Termo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NOVA FISCALIZAÇÃO */}
      {activeTab === 'nova' && (
        <form onSubmit={handleSubmitNewInspection} className="space-y-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg text-slate-900 dark:text-white">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" /> Formulário de Vistoria e Fiscalização em Tempo Real
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Preencha os dados do local, realize o checklist de conformidade e emita o documento oficial com validade fiscal.
            </p>
          </div>

          {/* Secao 1: Dados do Estabelecimento */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-500" /> 1. Identificação do Estabelecimento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">CNPJ / CPF</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="28.910.221/0001-40"
                    value={formData.cnpjCpf}
                    onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                    className="flex-1 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarCNPJ}
                    disabled={loadingCnpj}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition cursor-pointer"
                  >
                    {loadingCnpj ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Buscar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Nome Fantasia / Local</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Quiosque / Restaurante"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Razão Social</label>
                <input
                  type="text"
                  placeholder="Razão social oficial"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Tipo de Atividade</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="Restaurante / Alimentação">Restaurante / Gastronomia</option>
                  <option value="Feira Livre / Ambulante">Feira Livre / Feirante</option>
                  <option value="Supermercado / Açougue">Supermercado / Açougue</option>
                  <option value="Lanchonete / Fast Food">Lanchonete / Fast Food</option>
                  <option value="Drogaria / Farmácia">Drogaria / Farmácia</option>
                  <option value="Hotel / Pousada">Hotel / Pousada</option>
                  <option value="Estética / Salão">Estética / Salão de Beleza</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Bairro (BC)</label>
                <select
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                >
                  {BAIRROS_BC.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase block mb-1">Logradouro / Endereço</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Rua / Avenida"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Nº"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Responsável do Local</label>
                <input
                  type="text"
                  placeholder="Nome do gerente / proprietário"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Telefone Contato</label>
                <input
                  type="text"
                  placeholder="(47) 99999-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Tipo de Vistoria</label>
                <select
                  value={formData.tipoVistoria}
                  onChange={(e) => setFormData({ ...formData, tipoVistoria: e.target.value as InspectionType })}
                >
                  <option value="ROTINA">ROTINA</option>
                  <option value="DENÚNCIA">DENÚNCIA</option>
                  <option value="RENOVAÇÃO">RENOVAÇÃO DE ALVARÁ</option>
                  <option value="REINSPEÇÃO">REINSPEÇÃO</option>
                  <option value="OPERAÇÃO_VERÃO">OPERAÇÃO VERÃO / BLITZ</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Classificação de Risco</label>
                <select
                  value={formData.risco}
                  onChange={(e) => setFormData({ ...formData, risco: e.target.value as RiskLevel })}
                  className="font-bold text-amber-600"
                >
                  <option value="BAIXO">BAIXO RISCO</option>
                  <option value="MÉDIO">MÉDIO RISCO</option>
                  <option value="ALTO">ALTO RISCO</option>
                  <option value="CRÍTICO">CRÍTICO (INTERDIÇÃO)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Secao 2: Checklist Sanitário */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> 2. Roteiro de Inspeção Higiênico-Sanitária
              </span>
              <span className="text-[10px] text-slate-400">RDC Anvisa nº 216/2004</span>
            </h3>

            <div className="space-y-3">
              {checklists.map((chk, index) => (
                <div
                  key={chk.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <span className="text-[8px] font-black uppercase bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {chk.categoria}
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {chk.item}
                    </p>
                    {chk.status === 'NAO_CONFORME' && (
                      <input
                        type="text"
                        placeholder="Detalhes da irregularidade encontrada..."
                        value={chk.observacao || ''}
                        onChange={(e) => {
                          const updated = [...checklists];
                          updated[index].observacao = e.target.value;
                          setChecklists(updated);
                        }}
                        className="mt-2 text-[10px] w-full border-red-300 focus:border-red-500"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...checklists];
                        updated[index].status = 'CONFORME';
                        setChecklists(updated);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                        chk.status === 'CONFORME'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Conforme
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...checklists];
                        updated[index].status = 'NAO_CONFORME';
                        setChecklists(updated);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                        chk.status === 'NAO_CONFORME'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Não Conforme
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...checklists];
                        updated[index].status = 'NAO_APLICA';
                        setChecklists(updated);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                        chk.status === 'NAO_APLICA'
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secao 3: Evidencias Fotográficas & Inteligência Artificial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-500" /> 3. Registro Fotográfico de Campo
              </h3>

              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3">
                <p className="text-xs text-slate-500">Capture ou anexe fotos de não conformidades para instrução do auto.</p>
                <button
                  type="button"
                  onClick={handleAddPhotoSample}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer transition inline-flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" /> Anexar Foto de Evidência
                </button>

                {formData.fotosUrl.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 justify-center">
                    {formData.fotosUrl.map((url, i) => (
                      <img key={i} src={url} alt="Evidência" className="w-20 h-20 object-cover rounded-xl border border-slate-300" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> 4. Assistente IA Gemini de Fundamentação Legal
                </span>
                <button
                  type="button"
                  onClick={handleAnalisarIA}
                  disabled={loadingAi}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1 rounded-lg text-[10px] uppercase transition cursor-pointer flex items-center gap-1"
                >
                  {loadingAi ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Analisar Legislação'}
                </button>
              </h3>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs min-h-[120px]">
                {aiAnalysis ? (
                  <p className="whitespace-pre-wrap text-slate-800 dark:text-amber-100 text-[11px] leading-relaxed">{aiAnalysis}</p>
                ) : (
                  <p className="text-slate-400 text-center italic py-6">
                    Clique em &quot;Analisar Legislação&quot; para gerar automaticamente os enquadramentos legais da RDC 216/2004 Anvisa e Lei Municipal.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Secao 4: Medidas Adotadas e Assinatura */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              5. Decisão Fiscal & Assinatura do Termo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Medida Cautelar / Termo Emitido</label>
                <select
                  value={formData.medidasAdotadas}
                  onChange={(e) => setFormData({ ...formData, medidasAdotadas: e.target.value })}
                >
                  <option value="Termo de Notificação Sanitária">Termo de Notificação (Conforme)</option>
                  <option value="Termo de Intimação com Prazo">Termo de Intimação (Adequação)</option>
                  <option value="Auto de Infração e Autuação">Auto de Infração (Penalidade)</option>
                  <option value="Termo de Interdição Cautelar Parcial">Termo de Interdição Parcial</option>
                  <option value="Termo de Interdição Cautelar Total">Termo de Interdição Total</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Prazo para Adequação (Dias)</label>
                <input
                  type="number"
                  value={formData.prazoAdequacaoDias}
                  onChange={(e) => setFormData({ ...formData, prazoAdequacaoDias: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Assinatura Digital do Responsável</label>
                <input
                  type="text"
                  placeholder="Nome por extenso do responsável legal"
                  value={signatureOwner}
                  onChange={(e) => setSignatureOwner(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase block mb-1">Observações Fiscais do Auto</label>
              <textarea
                rows={3}
                placeholder="Insira detalhes complementares da vistoria..."
                value={formData.observacoesFiscais}
                onChange={(e) => setFormData({ ...formData, observacoesFiscais: e.target.value })}
              />
            </div>
          </div>

          {/* Botao Salvar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-2xl uppercase text-xs cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-3 rounded-2xl uppercase text-xs shadow-xl cursor-pointer transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Emitir e Finalizar Fiscalização
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: MAPA DE CAMPO */}
      {activeTab === 'mapa' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black uppercase text-blue-600 dark:text-blue-400">
                Mapa Operacional de Balneário Camboriú
              </h2>
              <p className="text-xs text-slate-500">Distribuição geográfica das vistorias ativas e interdições.</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black px-3 py-1 rounded-full uppercase">
              Ao Vivo
            </span>
          </div>

          {/* Interactive Map Visual */}
          <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Map Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

            {/* Sea representation */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-950/60 border-l border-blue-800/40 flex items-center justify-center">
              <span className="text-blue-500/40 text-sm font-black uppercase rotate-90 tracking-widest">Oceano Atlântico • Praia Central BC</span>
            </div>

            {/* Pins */}
            {fiscalizacoes.map((f, i) => (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedItem(f);
                  setActiveTab('termo');
                }}
                className="absolute z-20 cursor-pointer group transform -translate-x-1/2 -translate-y-1/2 transition hover:scale-125"
                style={{
                  top: `${25 + (i * 22) % 65}%`,
                  left: `${20 + (i * 18) % 45}%`
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white ${
                    f.status === 'INTERDITADO'
                      ? 'bg-red-600 animate-bounce'
                      : f.status === 'NOTIFICADO'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>

                {/* Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950 text-white p-2 rounded-xl text-[10px] shadow-2xl border border-slate-700 z-50">
                  <p className="font-black uppercase text-blue-400">{f.estabelecimento.nomeFantasia}</p>
                  <p className="text-slate-300">Bairro: {f.estabelecimento.bairro}</p>
                  <p className="font-bold text-amber-400">Status: {f.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TERMO OFICIAL IMPRESSÃO */}
      {activeTab === 'termo' && selectedItem && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">Documento Oficial de Fiscalização Sanitária</span>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2 rounded-xl text-xs uppercase cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Documento
            </button>
          </div>

          {/* Printable Document Box */}
          <div
            id="printable-term"
            className="bg-white text-slate-900 p-8 md:p-12 rounded-3xl border border-slate-300 shadow-2xl max-w-4xl mx-auto space-y-6 font-serif"
          >
            {/* Header Documento */}
            <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
              <div className="flex justify-center items-center gap-4 mb-2">
                <img
                  src="https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/logo_bc.avif"
                  alt="Prefeitura"
                  className="h-14"
                />
                <img
                  src="https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/DVIS.2.avif"
                  alt="DVIS"
                  className="h-14"
                />
              </div>
              <h1 className="text-lg font-black uppercase tracking-tight">PREFEITURA MUNICIPAL DE BALNEÁRIO CAMBORIÚ</h1>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">SECRETARIA MUNICIPAL DE SAÚDE • DIRETORIA DE VIGILÂNCIA SANITÁRIA (DVIS)</h2>
              <div className="inline-block bg-slate-900 text-white font-sans font-black text-xs px-4 py-1 uppercase tracking-widest rounded mt-2">
                {selectedItem.medidasAdotadas.toUpperCase()} #{selectedItem.protocolo}
              </div>
            </div>

            {/* Identificação do Estabelecimento */}
            <div className="font-sans text-xs space-y-2 border-b border-slate-300 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <p><strong>ESTABELECIMENTO:</strong> {selectedItem.estabelecimento.nomeFantasia}</p>
                <p><strong>RAZÃO SOCIAL:</strong> {selectedItem.estabelecimento.razaoSocial}</p>
                <p><strong>CNPJ/CPF:</strong> {selectedItem.estabelecimento.cnpjCpf}</p>
                <p><strong>TIPO ATIVIDADE:</strong> {selectedItem.estabelecimento.tipo}</p>
                <p><strong>ENDEREÇO:</strong> {selectedItem.estabelecimento.endereco}, {selectedItem.estabelecimento.numero} - {selectedItem.estabelecimento.bairro}</p>
                <p><strong>RESPONSÁVEL:</strong> {selectedItem.estabelecimento.responsavel}</p>
                <p><strong>DATA / HORA:</strong> {selectedItem.dataHora}</p>
                <p><strong>NÍVEL DE RISCO:</strong> {selectedItem.risco}</p>
              </div>
            </div>

            {/* Constatações e Irregularidades */}
            <div className="font-sans text-xs space-y-3">
              <h3 className="font-black uppercase text-sm border-b border-slate-200 pb-1">1. CONSTATAÇÕES FISCAIS</h3>
              {selectedItem.irregularidadesEncontradas.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-red-900 bg-red-50 p-3 rounded-lg border border-red-200">
                  {selectedItem.irregularidadesEncontradas.map((ir, i) => (
                    <li key={i}>{ir}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-bold">
                  Nenhuma irregularidade detectada durante a inspeção de rotina. Estabelecimento em conformidade.
                </p>
              )}
            </div>

            {/* Medidas Sanitárias e Prazo */}
            <div className="font-sans text-xs space-y-2">
              <h3 className="font-black uppercase text-sm border-b border-slate-200 pb-1">2. DETERMINAÇÕES SANITÁRIAS</h3>
              <p><strong>MEDIDA ADOTADA:</strong> {selectedItem.medidasAdotadas}</p>
              {selectedItem.prazoAdequacaoDias ? (
                <p><strong>PRAZO CONCEDIDO PARA ADEQUAÇÃO:</strong> {selectedItem.prazoAdequacaoDias} dia(s) a contar do recebimento deste termo.</p>
              ) : null}
              <p><strong>OBSERVAÇÕES:</strong> {selectedItem.observacoesFiscais || 'Conforme disposto na legislação sanitária municipal e federal.'}</p>
            </div>

            {/* Enquadramento Legal */}
            {selectedItem.parecerIA && (
              <div className="font-sans text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <p className="font-black uppercase text-slate-700">3. ENQUADRAMENTO LEGAL E FUNDAMENTAÇÃO</p>
                <p className="whitespace-pre-wrap">{selectedItem.parecerIA}</p>
              </div>
            )}

            {/* Assinaturas */}
            <div className="font-sans pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-900 pt-2">
                <p className="font-black uppercase">{selectedItem.fiscalNome}</p>
                <p className="text-slate-600 text-[10px]">Fiscal de Vigilância Sanitária • DVIS BC</p>
              </div>

              <div className="border-t border-slate-900 pt-2">
                <p className="font-black uppercase">{selectedItem.assinaturaResponsavel || selectedItem.estabelecimento.responsavel}</p>
                <p className="text-slate-600 text-[10px]">Responsável / Representante Legal</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
