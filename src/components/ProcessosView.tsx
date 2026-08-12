import React, { useState } from 'react';
import { ProcessoItem, ProcessoStatus, UserProfile } from '../types';
import { BAIRROS_BC } from '../data/mockData';
import { fetchCnpj } from '../lib/cnpjService';
import {
  fetchProcessosFromSheets,
  saveProcessoToSheets,
  PROCESSOS_SHEETS_WEBHOOK_URL
} from '../lib/googleSheetsService';
import {
  Search,
  RotateCcw,
  Save,
  Plus,
  FileText,
  Table,
  BarChart3,
  AlertOctagon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Check,
  X,
  Building2,
  FileCheck,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface ProcessosViewProps {
  processos: ProcessoItem[];
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSaveProcesso: (item: ProcessoItem) => void;
  onDeleteProcesso?: (id: string) => void;
}

export const ProcessosView: React.FC<ProcessosViewProps> = ({
  processos,
  currentUser,
  users,
  onSaveProcesso,
  onDeleteProcesso
}) => {
  // Navigation Tabs: 'cadastro' | 'denuncias' | 'historico' | 'dashboard'
  const [currentTab, setCurrentTab] = useState<'cadastro' | 'denuncias' | 'historico' | 'dashboard'>('cadastro');

  // Search Bar Top Inputs
  const [searchIdInput, setSearchIdInput] = useState('');
  const [searchCnpjInput, setSearchCnpjInput] = useState('');
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [savingSheets, setSavingSheets] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Filter state for Historico tab
  const [historicoSearch, setHistoricoSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  // CNAE List
  const [cnaeInput, setCnaeInput] = useState('');
  const [cnaeList, setCnaeList] = useState<string[]>([
    '1091-1/02 - FABRICAÇÃO DE PRODUTOS DE PADARIA E CONFEITARIA',
    '4721-1/02 - PADARIA E CONFEITARIA COM PREDOMINÂNCIA DE REVENDA'
  ]);

  // Servidores / Fiscais Designados List (Suporta múltiplos servidores)
  const [servidoresDesignados, setServidoresDesignados] = useState<{ id: string; nome: string; matricula: string }[]>([
    {
      id: users.find(u => u.nome_completo === (currentUser?.nome_completo || 'Carlos Eduardo Silva'))?.id || 'u1',
      nome: currentUser?.nome_completo || 'Carlos Eduardo Silva',
      matricula: users.find(u => u.nome_completo === (currentUser?.nome_completo || 'Carlos Eduardo Silva'))?.matricula || 'FIS-4092'
    }
  ]);

  // Main Form Data matching image layout
  const [formData, setFormData] = useState({
    id: '',
    num_processo: `2026/${String(processos.length + 101).padStart(5, '0')}`,
    setor: 'ALIMENTAÇÃO',
    motivacao: 'RENOVAÇÃO DE ALVARÁ',
    dataEntrada: new Date().toISOString().split('T')[0],
    data1Doc: new Date().toISOString().split('T')[0],
    venc1Doc: '2026-12-31',
    prot1Doc: '1DOC-2026-9842',
    pasta: 'A-12',

    cnpjCpf: '63.691.709/0001-09',
    razaoSocial: 'NOSSA PADARIA LTDA',
    nomeFantasia: 'NOSSA PADARIA',

    cep: '88338-200',
    endereco: 'AVENIDA PALESTINA',
    numeroComplemento: '870',
    bairro: 'Nações',

    situacaoCadastral: 'ATIVA',
    motivoSituacao: 'REGULAR PERANTE A RECEITA FEDERAL',
    dataSituacao: '2020-05-15',
    vencLicenca: '2026-12-31',

    descricaoProcesso: 'Solicitação de renovação anual do Alvará Sanitário para manipulação e comércio de produtos alimentícios de panificação e confeitaria.',
    anexosTexto: 'Documentação 1Doc anexada: Manual de Boas Práticas, Atestados de Saúde e Certificado de Desinsetização.',

    fiscalResponsavel: currentUser?.nome_completo || 'Carlos Eduardo Silva',
    detalhesFiscal: 'Encaminhado ao fiscal para inspeção in loco das instalações sanitárias.',
    dataEntregueFiscal: new Date().toISOString().split('T')[0],

    status: 'EM ANÁLISE' as ProcessoStatus,
    observacao: 'AGUARDANDO VISTORIA TÉCNICA',
    agendadoPara: '2026-08-20T14:00',
    conclusao: 'EM ANDAMENTO',
    pas: 'PAS-2026/012'
  });

  // Handle Search by ID
  const handleSearchById = () => {
    if (!searchIdInput.trim()) {
      setSearchNotice('⚠️ Digite o ID do processo.');
      setTimeout(() => setSearchNotice(null), 3000);
      return;
    }
    const found = processos.find(
      (p) => p.id === searchIdInput.trim() || p.num_processo.includes(searchIdInput.trim())
    );
    if (found) {
      loadProcessoIntoForm(found);
      setSearchNotice(`✅ Processo ${found.num_processo} encontrado!`);
    } else {
      setSearchNotice(`❌ Nenhum processo encontrado com ID/Nº "${searchIdInput}".`);
    }
    setTimeout(() => setSearchNotice(null), 4000);
  };

  // Handle Search by CNPJ
  const handleSearchByCnpj = async (cnpjToSearch?: string) => {
    const cleanVal = (cnpjToSearch || searchCnpjInput).replace(/\D/g, '');
    if (cleanVal.length < 11) {
      setSearchNotice('⚠️ Digite um CNPJ ou CPF válido.');
      setTimeout(() => setSearchNotice(null), 3000);
      return;
    }

    setLoadingCnpj(true);
    setSearchNotice('🔍 Consultando base de dados e Receita Federal...');

    try {
      // First check local list
      const foundLocal = processos.find((p) => p.cnpj_cpf.replace(/\D/g, '') === cleanVal);
      if (foundLocal) {
        loadProcessoIntoForm(foundLocal);
        setSearchNotice(`✅ Registro localizado para ${foundLocal.nome_fantasia || foundLocal.razao_social}!`);
        setLoadingCnpj(false);
        setTimeout(() => setSearchNotice(null), 4000);
        return;
      }

      // Fetch from API
      const apiData = await fetchCnpj(cleanVal);
      setFormData((prev) => ({
        ...prev,
        cnpjCpf: cleanVal.length === 14 
          ? cleanVal.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
          : cleanVal,
        razaoSocial: apiData.razao || prev.razaoSocial,
        nomeFantasia: apiData.nome_fantasia || apiData.razao || prev.nomeFantasia,
        endereco: apiData.rua_api || prev.endereco,
        numeroComplemento: apiData.num_api || prev.numeroComplemento,
        bairro: BAIRROS_BC.find(b => b.toLowerCase() === apiData.bairro.toLowerCase()) || apiData.bairro || 'Centro'
      }));

      // Update CNAE list from API
      if (apiData.cnaes && apiData.cnaes.length > 0) {
        setCnaeList(apiData.cnaes);
      } else if (apiData.cnae) {
        setCnaeList([apiData.cnae.toUpperCase()]);
      } else {
        setCnaeList([]);
      }

      setSearchNotice(`✅ Dados da Receita Federal preenchidos para: ${apiData.nome_fantasia || apiData.razao}`);
    } catch (err) {
      console.error(err);
      setSearchNotice('⚠️ Não foi possível consultar o CNPJ.');
    } finally {
      setLoadingCnpj(false);
      setTimeout(() => setSearchNotice(null), 4000);
    }
  };

  const loadProcessoIntoForm = (p: ProcessoItem) => {
    setFormData({
      id: p.id,
      num_processo: p.num_processo,
      setor: 'ALIMENTAÇÃO',
      motivacao: p.assunto || 'VISTORIA / ALVARÁ',
      dataEntrada: p.data_protocolo || new Date().toISOString().split('T')[0],
      data1Doc: p.data_protocolo || new Date().toISOString().split('T')[0],
      venc1Doc: p.validade || '2026-12-31',
      prot1Doc: `1DOC-${p.num_processo.replace('/', '-')}`,
      pasta: 'P-01',

      cnpjCpf: p.cnpj_cpf,
      razaoSocial: p.razao_social,
      nomeFantasia: p.nome_fantasia,

      cep: '88330-000',
      endereco: p.endereco,
      numeroComplemento: 'S/N',
      bairro: p.bairro,

      situacaoCadastral: 'ATIVA',
      motivoSituacao: 'REGULAR',
      dataSituacao: '2021-01-01',
      vencLicenca: p.validade || '2026-12-31',

      descricaoProcesso: p.observacoes || 'Processo de licenciamento e fiscalização sanitária em andamento.',
      anexosTexto: 'Documentação 1Doc anexada ao protocolo.',

      fiscalResponsavel: p.fiscal_responsavel,
      detalhesFiscal: 'Distribuído para acompanhamento técnico.',
      dataEntregueFiscal: p.data_protocolo || new Date().toISOString().split('T')[0],

      status: p.status,
      observacao: 'AGUARDANDO PARECER',
      agendadoPara: '2026-08-25T10:00',
      conclusao: p.status === 'DEFERIDO' ? 'APROVADO' : 'EM ANÁLISE',
      pas: 'PAS-2026/001'
    });
    if (p.cnaes && p.cnaes.length > 0) {
      setCnaeList(p.cnaes);
    } else {
      setCnaeList([]);
    }

    if (p.servidores && p.servidores.length > 0) {
      setServidoresDesignados(p.servidores);
    } else if (p.fiscal_responsavel) {
      const names = p.fiscal_responsavel.split(',').map(s => s.trim()).filter(Boolean);
      const matched = names.map(n => {
        const foundU = users.find(u => u.nome_completo.toLowerCase() === n.toLowerCase());
        return {
          id: foundU?.id || `s-${Math.random()}`,
          nome: n,
          matricula: foundU?.matricula || 'FIS-BC'
        };
      });
      setServidoresDesignados(matched);
    } else {
      setServidoresDesignados([]);
    }

    setCurrentTab('cadastro');
  };

  const handleClearForm = () => {
    setFormData({
      id: '',
      num_processo: `2026/${String(processos.length + 101).padStart(5, '0')}`,
      setor: '...',
      motivacao: '...',
      dataEntrada: '',
      data1Doc: '',
      venc1Doc: '',
      prot1Doc: '',
      pasta: '',

      cnpjCpf: '',
      razaoSocial: '',
      nomeFantasia: '',

      cep: '',
      endereco: '',
      numeroComplemento: '',
      bairro: '...',

      situacaoCadastral: '',
      motivoSituacao: '',
      dataSituacao: '',
      vencLicenca: '',

      descricaoProcesso: '',
      anexosTexto: '',

      fiscalResponsavel: 'Selecione...',
      detalhesFiscal: '',
      dataEntregueFiscal: '',

      status: 'EM ANÁLISE',
      observacao: '...',
      agendadoPara: '',
      conclusao: '...',
      pas: ''
    });
    setCnaeList([]);
    setServidoresDesignados([]);
    setSearchIdInput('');
    setSearchCnpjInput('');
    setSearchNotice('Formulário limpo com sucesso.');
    setTimeout(() => setSearchNotice(null), 3000);
  };

  const handleAddCnae = () => {
    if (cnaeInput.trim()) {
      setCnaeList([...cnaeList, cnaeInput.trim().toUpperCase()]);
      setCnaeInput('');
    }
  };

  const handleRemoveCnae = (index: number) => {
    setCnaeList(cnaeList.filter((_, i) => i !== index));
  };

  const handleAddServidor = (userObj: { id: string; nome_completo: string; matricula?: string }) => {
    if (!servidoresDesignados.some(s => s.id === userObj.id || s.nome.toLowerCase() === userObj.nome_completo.toLowerCase())) {
      const updated = [
        ...servidoresDesignados,
        { id: userObj.id, nome: userObj.nome_completo, matricula: userObj.matricula || 'S/N' }
      ];
      setServidoresDesignados(updated);
      setFormData(prev => ({
        ...prev,
        fiscalResponsavel: updated.map(u => u.nome).join(', ')
      }));
    }
  };

  const handleRemoveServidor = (idOrNome: string) => {
    const updated = servidoresDesignados.filter(s => s.id !== idOrNome && s.nome !== idOrNome);
    setServidoresDesignados(updated);
    setFormData(prev => ({
      ...prev,
      fiscalResponsavel: updated.length > 0 ? updated.map(u => u.nome).join(', ') : 'Selecione...'
    }));
  };

  const handleSyncFromSheets = async () => {
    setSyncingSheets(true);
    setSearchNotice('🔄 Sincronizando com a Planilha do Google Sheets (Apps Script)...');
    try {
      const remote = await fetchProcessosFromSheets();
      if (remote && remote.length > 0) {
        remote.forEach(p => onSaveProcesso(p));
        setSearchNotice(`✅ ${remote.length} processos sincronizados com sucesso da Planilha Google!`);
      } else {
        setSearchNotice('✅ Conexão com Google Sheets ativa! Planilha sem novos registros externos.');
      }
    } catch (err) {
      setSearchNotice('⚠️ Erro ao comunicar com a Planilha Google Sheets.');
    } finally {
      setSyncingSheets(false);
      setTimeout(() => setSearchNotice(null), 5000);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSheets(true);
    setSearchNotice('💾 Salvando no sistema e enviando para o Google Sheets...');

    const fiscalNames = servidoresDesignados.length > 0 
      ? servidoresDesignados.map(s => s.nome).join(', ') 
      : (formData.fiscalResponsavel !== 'Selecione...' ? formData.fiscalResponsavel : 'Carlos Eduardo Silva');

    const itemToSave: ProcessoItem = {
      id: formData.id || `proc-${Date.now()}`,
      num_processo: formData.num_processo,
      data_protocolo: formData.dataEntrada || new Date().toLocaleDateString('pt-BR'),
      cnpj_cpf: formData.cnpjCpf || '00.000.000/0000-00',
      razao_social: formData.razaoSocial || 'EMPRESA REGISTRADA',
      nome_fantasia: formData.nomeFantasia || formData.razaoSocial || 'ESTABELECIMENTO',
      assunto: formData.motivacao !== '...' ? formData.motivacao : 'Alvará Sanitário',
      bairro: formData.bairro !== '...' ? formData.bairro : 'Centro',
      endereco: `${formData.endereco} ${formData.numeroComplemento}`.trim(),
      fiscal_responsavel: fiscalNames,
      status: formData.status,
      validade: formData.vencLicenca || '31/12/2026',
      observacoes: formData.descricaoProcesso,
      cnaes: cnaeList,
      servidores: servidoresDesignados
    };

    onSaveProcesso(itemToSave);

    // Envia diretamente para o Google Apps Script (Sheets)
    await saveProcessoToSheets(itemToSave, formData);

    setSavingSheets(false);
    setSearchNotice(`✅ Processo ${itemToSave.num_processo} salvo no sistema e gravado na Planilha Google Sheets!`);
    setTimeout(() => setSearchNotice(null), 5000);
  };

  // Filtered Historico List
  const filteredHistorico = processos.filter((p) => {
    if (statusFilter !== 'TODOS' && p.status !== statusFilter) return false;
    if (historicoSearch.trim()) {
      const q = historicoSearch.toLowerCase();
      return (
        p.num_processo.toLowerCase().includes(q) ||
        p.cnpj_cpf.toLowerCase().includes(q) ||
        p.razao_social.toLowerCase().includes(q) ||
        p.nome_fantasia.toLowerCase().includes(q) ||
        p.bairro.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#181818] text-slate-100 p-2 md:p-4 font-sans selection:bg-blue-600 selection:text-white">
      {/* ⬛ TOP CONTROL BAR (PIXEL-PERFECT FROM USER SCREENSHOT) */}
      <div className="bg-[#242424] border border-[#333333] rounded-t-md p-2.5 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Left Side: ID and CNPJ Search Inputs */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* ID Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-white uppercase tracking-wider">ID:</span>
            <input
              type="text"
              value={searchIdInput}
              onChange={(e) => setSearchIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchById()}
              className="w-24 bg-white text-black font-bold text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <button
              onClick={handleSearchById}
              className="bg-[#FFCC00] hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded tracking-wider shadow active:scale-95 transition cursor-pointer"
            >
              PESQUISAR
            </button>
          </div>

          <span className="text-slate-500 hidden sm:inline">|</span>

          {/* CNPJ Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-white uppercase tracking-wider">CNPJ:</span>
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              value={searchCnpjInput}
              onChange={(e) => setSearchCnpjInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchByCnpj()}
              className="w-36 md:w-44 bg-white text-black font-bold text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <button
              onClick={() => handleSearchByCnpj()}
              disabled={loadingCnpj}
              className="bg-[#007BFF] hover:bg-blue-600 text-white font-black text-xs px-3 py-1 rounded tracking-wider shadow active:scale-95 transition cursor-pointer flex items-center gap-1"
            >
              {loadingCnpj ? 'BUSCANDO...' : 'OK'}
            </button>
          </div>
        </div>

        {/* Right Side: Navigation Buttons & Google Sheets Sync */}
        <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={handleSyncFromSheets}
            disabled={syncingSheets}
            className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border border-emerald-500 text-xs font-black px-2.5 py-1.5 rounded tracking-wide uppercase transition cursor-pointer shadow flex items-center gap-1"
            title="Sincronizar processos diretamente da Planilha Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingSheets ? 'animate-spin' : ''}`} />
            {syncingSheets ? 'SINCRONIZANDO...' : 'SHEETS'}
          </button>

          <button
            onClick={() => setCurrentTab('cadastro')}
            className={`text-xs font-black px-3.5 py-1.5 rounded tracking-wide uppercase transition cursor-pointer shadow ${
              currentTab === 'cadastro'
                ? 'bg-[#0066CC] text-white border border-blue-400 ring-2 ring-blue-300'
                : 'bg-[#0055A5] text-slate-100 hover:bg-[#0066CC]'
            }`}
          >
            CADASTRO VISA
          </button>

          <button
            onClick={() => setCurrentTab('denuncias')}
            className={`text-xs font-black px-3.5 py-1.5 rounded tracking-wide uppercase transition cursor-pointer shadow ${
              currentTab === 'denuncias'
                ? 'bg-[#0066CC] text-white border border-blue-400 ring-2 ring-blue-300'
                : 'bg-[#0055A5] text-slate-100 hover:bg-[#0066CC]'
            }`}
          >
            DENÚNCIAS
          </button>

          <button
            onClick={() => setCurrentTab('historico')}
            className={`text-xs font-black px-3.5 py-1.5 rounded tracking-wide uppercase transition cursor-pointer shadow ${
              currentTab === 'historico'
                ? 'bg-[#0066CC] text-white border border-blue-400 ring-2 ring-blue-300'
                : 'bg-[#0055A5] text-slate-100 hover:bg-[#0066CC]'
            }`}
          >
            HISTÓRICO
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`text-xs font-black px-3.5 py-1.5 rounded tracking-wide uppercase transition cursor-pointer shadow ${
              currentTab === 'dashboard'
                ? 'bg-[#28783B] text-white border border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-[#20602F] text-emerald-100 hover:bg-[#28783B]'
            }`}
          >
            DASHBOARD
          </button>
        </div>
      </div>

      {/* Search Notice Banner */}
      {searchNotice && (
        <div className="bg-[#2a2a2a] border border-amber-500/50 text-amber-200 px-4 py-2 text-xs font-bold flex items-center justify-between animate-fade-in my-1 rounded">
          <span>{searchNotice}</span>
          <button onClick={() => setSearchNotice(null)} className="text-amber-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 📄 MAIN FORM CONTENT CONTAINER (LIGHT GRAY CONTAINER FROM SCREENSHOT) */}
      {currentTab === 'cadastro' && (
        <div className="bg-[#EAEAEA] text-slate-900 border border-slate-300 rounded-b-md p-3 md:p-5 shadow-2xl space-y-3 font-sans">
          <form onSubmit={handleSaveForm} className="space-y-3">
            {/* ROW 1: SETOR | MOTIVAÇÃO | DATA ENTRADA | DATA 1DOC | VENC. 1DOC | 1DOC (PROT.) | PASTA */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">SETOR</label>
                <select
                  value={formData.setor}
                  onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="...">...</option>
                  <option value="ALIMENTAÇÃO">ALIMENTAÇÃO</option>
                  <option value="SAÚDE">SAÚDE</option>
                  <option value="SANEAMENTO">SANEAMENTO</option>
                  <option value="ENSINO">ENSINO</option>
                  <option value="EVENTOS / FEIRAS">EVENTOS / FEIRAS</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">MOTIVAÇÃO</label>
                <select
                  value={formData.motivacao}
                  onChange={(e) => setFormData({ ...formData, motivacao: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="...">...</option>
                  <option value="SOLICITAÇÃO INICIAL">SOLICITAÇÃO INICIAL</option>
                  <option value="RENOVAÇÃO DE ALVARÁ">RENOVAÇÃO DE ALVARÁ</option>
                  <option value="VISTORIA PREVENTIVA">VISTORIA PREVENTIVA</option>
                  <option value="DENÚNCIA SANITÁRIA">DENÚNCIA SANITÁRIA</option>
                  <option value="ANÁLISE PBA">ANÁLISE PBA</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">DATA ENTRADA</label>
                <input
                  type="date"
                  value={formData.dataEntrada}
                  onChange={(e) => setFormData({ ...formData, dataEntrada: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">DATA 1DOC</label>
                <input
                  type="date"
                  value={formData.data1Doc}
                  onChange={(e) => setFormData({ ...formData, data1Doc: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">VENC. 1DOC</label>
                <input
                  type="date"
                  value={formData.venc1Doc}
                  onChange={(e) => setFormData({ ...formData, venc1Doc: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">1DOC (PROT.)</label>
                <input
                  type="text"
                  placeholder="Ex: 1DOC-9842"
                  value={formData.prot1Doc}
                  onChange={(e) => setFormData({ ...formData, prot1Doc: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">PASTA</label>
                <input
                  type="text"
                  placeholder="Ex: A-12"
                  value={formData.pasta}
                  onChange={(e) => setFormData({ ...formData, pasta: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                />
              </div>
            </div>

            {/* ROW 2: CNPJ / CPF | RAZÃO SOCIAL | NOME FANTASIA */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">CNPJ / CPF</label>
                <input
                  type="text"
                  value={formData.cnpjCpf}
                  onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                  onBlur={(e) => handleSearchByCnpj(e.target.value)}
                  style={{ width: 'calc(100% - 40px)' }}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                />
              </div>

              <div className="md:col-span-5">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">RAZÃO SOCIAL</label>
                <input
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium uppercase"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">NOME FANTASIA</label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
                />
              </div>
            </div>

            {/* ROW 3: CEP | ENDEREÇO (RUA) | Nº / COMPLEMENTO | BAIRRO */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">CEP</label>
                <input
                  type="text"
                  placeholder="88330-000"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  style={{ width: 'calc(100% - 40px)' }}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">ENDEREÇO (RUA)</label>
                <input
                  type="text"
                  placeholder="Nome da rua ou avenida"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium uppercase"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">Nº / COMPLEMENTO</label>
                <input
                  type="text"
                  placeholder="Ex: 870, Sala 02"
                  value={formData.numeroComplemento}
                  onChange={(e) => setFormData({ ...formData, numeroComplemento: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">BAIRRO</label>
                <select
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                >
                  <option value="...">...</option>
                  {BAIRROS_BC.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ROW 4: SITUAÇÃO CADASTRAL | MOTIVO SITUAÇÃO | DATA SITUAÇÃO | VENC. LICENÇA (180D) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">SITUAÇÃO CADASTRAL</label>
                <input
                  type="text"
                  placeholder="Ex: ATIVA / REGULAR"
                  value={formData.situacaoCadastral}
                  onChange={(e) => setFormData({ ...formData, situacaoCadastral: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">MOTIVO SITUAÇÃO</label>
                <input
                  type="text"
                  placeholder="Ex: EM DIA"
                  value={formData.motivoSituacao}
                  onChange={(e) => setFormData({ ...formData, motivoSituacao: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">DATA SITUAÇÃO</label>
                <input
                  type="date"
                  value={formData.dataSituacao}
                  onChange={(e) => setFormData({ ...formData, dataSituacao: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">VENC. LICENÇA (180D)</label>
                <input
                  type="date"
                  value={formData.vencLicenca}
                  onChange={(e) => setFormData({ ...formData, vencLicenca: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* ROW 5: ADICIONAR CNAE SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-dashed border-slate-300 p-2 rounded bg-white/60">
              <div className="md:col-span-3 flex flex-col justify-center gap-1">
                <button
                  type="button"
                  onClick={handleAddCnae}
                  className="w-full border-2 border-blue-600 hover:bg-blue-50 text-blue-700 font-extrabold text-xs py-1.5 px-3 rounded shadow-sm transition uppercase cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> ADICIONAR CNAE
                </button>
                <input
                  type="text"
                  placeholder="CNAE Código / Descrição..."
                  value={cnaeInput}
                  onChange={(e) => setCnaeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCnae())}
                  className="w-full bg-white border border-slate-300 text-xs p-1 rounded font-mono"
                />
              </div>

              <div className="md:col-span-9 bg-white border border-slate-300 rounded p-2.5 min-h-[60px] flex flex-col justify-center gap-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-0.5">
                  <span>CNAEs Cadastrados no CNPJ ({cnaeList.length})</span>
                  <span className="text-[9px] text-blue-600 font-bold">Importados da Receita Federal</span>
                </div>
                {cnaeList.length === 0 ? (
                  <span className="text-slate-400 text-xs italic">Nenhum CNAE cadastrado para este CNPJ. Digite um CNPJ acima ou adicione manualmente.</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cnaeList.map((cnae, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded border flex items-center gap-1.5 shadow-sm transition ${
                          idx === 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300 ring-1 ring-blue-300'
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                          idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {idx === 0 ? 'PRINCIPAL' : 'SECUNDÁRIO'}
                        </span>
                        <span>{cnae}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCnae(idx)}
                          title="Remover CNAE"
                          className="text-slate-400 hover:text-rose-600 font-bold ml-1 transition"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ROW 6: DESCRIÇÃO / OBSERVAÇÕES DO PROCESSO */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-9">
                <textarea
                  rows={2}
                  placeholder="Descrição detalhada do processo ou histórico do protocolo..."
                  value={formData.descricaoProcesso}
                  onChange={(e) => setFormData({ ...formData, descricaoProcesso: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans"
                />
              </div>
              <div className="md:col-span-3">
                <textarea
                  rows={2}
                  placeholder="Informações adicionais do 1Doc / Anexos..."
                  value={formData.anexosTexto}
                  onChange={(e) => setFormData({ ...formData, anexosTexto: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
                />
              </div>
            </div>

            {/* ROW 7: SELEÇÃO DE FISCAIS / SERVIDORES | SERVIDORES DESIGNADOS (COM MATRÍCULA E BOTAO EXCLUIR X) | DATA ENTREGUE FISCAL */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">ADICIONAR FISCAL / SERVIDOR</label>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const selectedUser = users.find(u => u.id === val || u.nome_completo === val);
                      if (selectedUser) {
                        handleAddServidor(selectedUser);
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1.5 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-semibold shadow-sm"
                >
                  <option value="">+ Selecionar Servidor...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome_completo} ({u.matricula || 'Sem Matrícula'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6 bg-white border border-slate-300 rounded p-2 min-h-[42px] flex flex-col justify-center gap-1 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5 border-b border-slate-100 pb-0.5">
                  <span>Servidores Designados ({servidoresDesignados.length})</span>
                  <span className="text-emerald-700">Com Matrícula Funcional</span>
                </div>
                {servidoresDesignados.length === 0 ? (
                  <span className="text-slate-400 text-xs italic">Nenhum servidor atribuído. Selecione no menu ao lado para adicionar 1, 2 ou 3 servidores.</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {servidoresDesignados.map((s) => (
                      <span
                        key={s.id || s.nome}
                        className="bg-slate-50 text-slate-900 border border-slate-300 text-xs font-mono font-bold px-2 py-1 rounded flex items-center gap-1.5 shadow-sm hover:border-slate-400 transition"
                      >
                        <span className="bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                          {s.matricula || 'MAT: S/N'}
                        </span>
                        <span className="font-sans font-bold text-slate-900 text-[11px]">{s.nome}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveServidor(s.id || s.nome)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full w-4 h-4 flex items-center justify-center font-black text-xs transition ml-0.5 cursor-pointer"
                          title={`Remover ${s.nome}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">DATA ENTREGUE FISCAL</label>
                <input
                  type="date"
                  value={formData.dataEntregueFiscal}
                  onChange={(e) => setFormData({ ...formData, dataEntregueFiscal: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1.5 px-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono shadow-sm"
                />
              </div>
            </div>

            {/* ROW 8: STATUS | OBSERVAÇÃO | AGENDADO PARA | CONCLUSÃO | PAS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">STATUS</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProcessoStatus })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-800"
                >
                  <option value="EM ANÁLISE">EM ANÁLISE</option>
                  <option value="DEFERIDO">DEFERIDO</option>
                  <option value="VISTORIA AGENDADA">VISTORIA AGENDADA</option>
                  <option value="PENDENTE DOCS">PENDENTE DOCS</option>
                  <option value="INDEFERIDO">INDEFERIDO</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">OBSERVAÇÃO</label>
                <select
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="...">...</option>
                  <option value="AGUARDANDO VISTORIA TÉCNICA">AGUARDANDO VISTORIA TÉCNICA</option>
                  <option value="AGUARDANDO DOCUMENTAÇÃO">AGUARDANDO DOCUMENTAÇÃO</option>
                  <option value="LAUDO EMISSÃO">LAUDO EMISSÃO</option>
                  <option value="NOTIFICAÇÃO EMITIDA">NOTIFICAÇÃO EMITIDA</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">AGENDADO PARA</label>
                <input
                  type="datetime-local"
                  value={formData.agendadoPara}
                  onChange={(e) => setFormData({ ...formData, agendadoPara: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">CONCLUSÃO</label>
                <select
                  value={formData.conclusao}
                  onChange={(e) => setFormData({ ...formData, conclusao: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="...">...</option>
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                  <option value="APROVADO / EMITIDO">APROVADO / EMITIDO</option>
                  <option value="INDEFERIDO">INDEFERIDO</option>
                  <option value="ARQUIVADO">ARQUIVADO</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase block mb-0.5">PAS</label>
                <input
                  type="text"
                  placeholder="Ex: PAS-2026/012"
                  value={formData.pas}
                  onChange={(e) => setFormData({ ...formData, pas: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs py-1 px-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                />
              </div>
            </div>

            {/* BOTTOM ACTIONS (LIMPAR & SALVAR REGISTRO FROM SCREENSHOT) */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-300">
              <button
                type="button"
                onClick={handleClearForm}
                className="bg-[#D4D4D4] hover:bg-slate-300 text-slate-900 font-extrabold text-xs px-8 py-2.5 rounded shadow transition uppercase cursor-pointer"
              >
                LIMPAR
              </button>

              <button
                type="submit"
                disabled={savingSheets}
                className="bg-[#28783B] hover:bg-[#1e5a2c] disabled:opacity-75 text-white font-extrabold text-sm px-8 md:px-12 py-3 rounded shadow-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-2 active:scale-98"
              >
                <Save className={`w-5 h-5 ${savingSheets ? 'animate-bounce' : ''}`} />
                {savingSheets ? 'ENVIANDO PARA PLANILHA...' : 'SALVAR REGISTRO'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📜 HISTÓRICO TAB */}
      {currentTab === 'historico' && (
        <div className="bg-[#EAEAEA] text-slate-900 border border-slate-300 rounded-b-md p-4 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-md border border-slate-300">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar histórico por nº, CNPJ, razão, bairro..."
                value={historicoSearch}
                onChange={(e) => setHistoricoSearch(e.target.value)}
                className="w-full md:w-80 text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1.5 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filtrar Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1.5 font-bold"
              >
                <option value="TODOS">TODOS OS STATUS</option>
                <option value="DEFERIDO">DEFERIDO</option>
                <option value="EM ANÁLISE">EM ANÁLISE</option>
                <option value="VISTORIA AGENDADA">VISTORIA AGENDADA</option>
                <option value="PENDENTE DOCS">PENDENTE DOCS</option>
                <option value="INDEFERIDO">INDEFERIDO</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-300 overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#242424] text-white font-bold uppercase">
                  <th className="p-2.5 border-b">Processo</th>
                  <th className="p-2.5 border-b">Data</th>
                  <th className="p-2.5 border-b">CNPJ</th>
                  <th className="p-2.5 border-b">Estabelecimento / Razão</th>
                  <th className="p-2.5 border-b">Bairro</th>
                  <th className="p-2.5 border-b">Fiscal</th>
                  <th className="p-2.5 border-b text-center">Status</th>
                  <th className="p-2.5 border-b text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredHistorico.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                      Nenhum processo encontrado no histórico.
                    </td>
                  </tr>
                ) : (
                  filteredHistorico.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/60 transition">
                      <td className="p-2.5 font-mono font-bold text-blue-700">{p.num_processo}</td>
                      <td className="p-2.5 font-mono">{p.data_protocolo}</td>
                      <td className="p-2.5 font-mono">{p.cnpj_cpf}</td>
                      <td className="p-2.5">
                        <div className="font-bold uppercase text-slate-900">{p.nome_fantasia || p.razao_social}</div>
                        <div className="text-[10px] text-slate-500">{p.razao_social}</div>
                      </td>
                      <td className="p-2.5 font-semibold">{p.bairro}</td>
                      <td className="p-2.5">{p.fiscal_responsavel}</td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-300">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => loadProcessoIntoForm(p)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-[11px] transition"
                        >
                          CARREGAR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📊 DASHBOARD TAB */}
      {currentTab === 'dashboard' && (
        <div className="bg-[#EAEAEA] text-slate-900 border border-slate-300 rounded-b-md p-5 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {processos.filter((p) => p.status === 'DEFERIDO').length}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase">Processos Deferidos</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-3">
              <div className="bg-amber-100 text-amber-800 p-3 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {processos.filter((p) => p.status === 'EM ANÁLISE' || p.status === 'VISTORIA AGENDADA').length}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase">Em Análise / Agendados</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-3">
              <div className="bg-purple-100 text-purple-800 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {processos.filter((p) => p.status === 'PENDENTE DOCS').length}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase">Pendentes de Documentos</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-3">
              <div className="bg-rose-100 text-rose-800 p-3 rounded-lg">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {processos.filter((p) => p.status === 'INDEFERIDO').length}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase">Indeferidos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 DENÚNCIAS TAB */}
      {currentTab === 'denuncias' && (
        <div className="bg-[#EAEAEA] text-slate-900 border border-slate-300 rounded-b-md p-5 space-y-4 shadow-xl">
          <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2 mb-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" /> Registro e Triagem de Denúncias Sanitárias
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Módulo de recebimento via Ouvidoria / 1Doc para agendamento de fiscalização emergencial ou de rotina.
            </p>
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, motivacao: 'DENÚNCIA SANITÁRIA', status: 'VISTORIA AGENDADA' }));
                setCurrentTab('cadastro');
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded shadow transition cursor-pointer"
            >
              + ABRIR PROCESSO DE DENÚNCIA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
