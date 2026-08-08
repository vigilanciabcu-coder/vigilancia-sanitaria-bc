import React, { useState, useEffect } from 'react';
import { FeiranteItem } from '../types';
import { BAIRROS_BC } from '../data/mockData';
import { Plus, Edit2, Search, X, Check, RefreshCw, FileSpreadsheet, ExternalLink, Settings } from 'lucide-react';
import {
  fetchFeirantesFromSheets,
  saveFeiranteToSheets,
  getSheetsWebhookUrl,
  setSheetsWebhookUrl
} from '../lib/googleSheetsService';

interface FeirasViewProps {
  feiras: FeiranteItem[];
  onSaveFeirante: (item: FeiranteItem) => void;
  onSyncFeirantesFromSheets?: (items: FeiranteItem[]) => void;
}

export const FeirasView: React.FC<FeirasViewProps> = ({
  feiras,
  onSaveFeirante,
  onSyncFeirantesFromSheets
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [sheetsNotice, setSheetsNotice] = useState<string | null>(null);
  const [configUrlModal, setConfigUrlModal] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState(() => getSheetsWebhookUrl());

  // Sincronização inicial ao carregar a tela
  useEffect(() => {
    handleSyncFromSheets(true);
  }, []);

  const handleSyncFromSheets = async (silent = false) => {
    setSyncingSheets(true);
    try {
      const dataFromSheets = await fetchFeirantesFromSheets();
      if (dataFromSheets && dataFromSheets.length > 0) {
        if (onSyncFeirantesFromSheets) {
          onSyncFeirantesFromSheets(dataFromSheets);
        }
        if (!silent) {
          setSheetsNotice(`✨ ${dataFromSheets.length} feirantes sincronizados diretamente do Google Sheets!`);
          setTimeout(() => setSheetsNotice(null), 4000);
        }
      } else if (!silent) {
        setSheetsNotice('⚠️ Nenhuma planilha retornou dados ou o Webhook Google Sheets não respondeu.');
        setTimeout(() => setSheetsNotice(null), 4000);
      }
    } catch (e) {
      if (!silent) console.warn('Erro ao sincronizar planilha:', e);
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleSaveWebhookUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setSheetsWebhookUrl(webhookUrlInput);
    setConfigUrlModal(false);
    setSheetsNotice('URL do Webhook do Google Sheets atualizada!');
    setTimeout(() => setSheetsNotice(null), 3000);
    handleSyncFromSheets(false);
  };

  const [formItem, setFormItem] = useState<Partial<FeiranteItem>>({
    id: '',
    data_prot: '',
    num_prot: '',
    feira: '',
    pasta: '',
    cpf: '',
    nome_pf: '',
    produtos: '',
    validade: '',
    rua: '',
    num: '',
    bairro: 'Centro',
    vinculo: 'NÃO',
    func: '1',
    abertura: '',
    cnpj: '',
    razao: '',
    rua_api: '',
    num_api: '',
    municipio: 'BALNEÁRIO CAMBORIÚ',
    estado: 'SC',
    cnae: '',
    alvara: 'SIM'
  });

  const [selectedFeirasOpts, setSelectedFeirasOpts] = useState<string[]>([]);

  const openNewForm = () => {
    setFormItem({
      id: '',
      data_prot: new Date().toISOString().split('T')[0],
      num_prot: `2026/${Math.floor(1000 + Math.random() * 9000)}`,
      feira: '',
      pasta: 'A-01',
      cpf: '',
      nome_pf: '',
      produtos: '',
      validade: '2026-12-31',
      rua: '',
      num: '',
      bairro: 'Centro',
      vinculo: 'NÃO',
      func: '1',
      abertura: new Date().getFullYear().toString(),
      cnpj: '',
      razao: '',
      rua_api: '',
      num_api: '',
      municipio: 'BALNEÁRIO CAMBORIÚ',
      estado: 'SC',
      cnae: '',
      alvara: 'SIM'
    });
    setSelectedFeirasOpts([]);
    setModalOpen(true);
  };

  const openEditForm = (item: FeiranteItem) => {
    setFormItem(item);
    const opts = item.feira ? item.feira.split(', ').map((s) => s.trim()) : [];
    setSelectedFeirasOpts(opts);
    setModalOpen(true);
  };

  const toggleFeiraOpt = (val: string) => {
    const exists = selectedFeirasOpts.some((x) => x.toLowerCase() === val.toLowerCase());
    if (exists) {
      setSelectedFeirasOpts(selectedFeirasOpts.filter((x) => x.toLowerCase() !== val.toLowerCase()));
    } else {
      setSelectedFeirasOpts([...selectedFeirasOpts, val]);
    }
  };

  const handleBuscarCNPJ = async () => {
    const rawVal = formItem.cnpj || '';
    const cleanVal = rawVal.replace(/\D/g, '');
    if (!cleanVal) return;

    setLoadingCnpj(true);
    try {
      const res = await fetch(`/api/cnpj/${cleanVal}`);
      if (res.ok) {
        const d = await res.json();
        setFormItem((prev) => ({
          ...prev,
          razao: d.razao || `ESTABELECIMENTO (${cleanVal}) LTDA`,
          nome_pf: d.responsavel || d.razao || prev.nome_pf || 'PROPRIETÁRIO CADASTRADO',
          municipio: d.municipio || 'BALNEÁRIO CAMBORIÚ',
          estado: d.estado || 'SC',
          rua_api: d.rua_api || 'AVENIDA BRASIL',
          num_api: d.num_api || '100',
          bairro: d.bairro || 'Centro',
          cnae: d.cnae || '5611-2/01 Serviços de Alimentação'
        }));
      }
    } catch {
      setFormItem((prev) => ({
        ...prev,
        razao: `ESTABELECIMENTO (${cleanVal}) LTDA`,
        rua_api: 'AVENIDA BRASIL',
        num_api: '100',
        municipio: 'BALNEÁRIO CAMBORIÚ',
        estado: 'SC'
      }));
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToUse = formItem.id || String(Date.now());
    const feiraStr = selectedFeirasOpts.join(', ');

    const updated: FeiranteItem = {
      id: idToUse,
      data_prot: formItem.data_prot || '',
      num_prot: formItem.num_prot || '',
      feira: feiraStr,
      pasta: formItem.pasta || '',
      cpf: formItem.cpf || '',
      nome_pf: formItem.nome_pf || '',
      produtos: formItem.produtos || '',
      validade: formItem.validade || '',
      rua: formItem.rua || '',
      num: formItem.num || '',
      bairro: formItem.bairro || 'Centro',
      vinculo: formItem.vinculo || 'NÃO',
      func: formItem.func || '',
      abertura: formItem.abertura || '',
      cnpj: formItem.cnpj || '',
      razao: formItem.razao || '',
      rua_api: formItem.rua_api || '',
      num_api: formItem.num_api || '',
      municipio: formItem.municipio || 'BALNEÁRIO CAMBORIÚ',
      estado: formItem.estado || 'SC',
      cnae: formItem.cnae || '',
      alvara: formItem.alvara || 'SIM'
    };

    onSaveFeirante(updated);

    // Salva no Google Sheets via Webhook
    const savedSheets = await saveFeiranteToSheets(updated);
    if (savedSheets) {
      setSheetsNotice(`✅ Feirante "${updated.nome_pf}" salvo com sucesso no Google Sheets!`);
    } else {
      setSheetsNotice(`💾 Feirante "${updated.nome_pf}" salvo localmente!`);
    }
    setTimeout(() => setSheetsNotice(null), 4000);

    setModalOpen(false);
  };

  const filteredFeiras = feiras.filter(
    (f) =>
      f.nome_pf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.num_prot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.produtos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.feira.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 uppercase italic flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-blue-600 dark:fill-blue-400">
              <path d="M12 2L2 7v2h20V7L12 2zm-7.5 9v11h3V11h-3zm6 0v11h3V11h-3zm6 0v11h3V11h-3z" />
            </svg>
            Gestão de Feiras e Ambulantes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Sincronizado automaticamente com a Planilha Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar feirante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full text-xs"
            />
          </div>

          {/* Sincronizar com Google Sheets */}
          <button
            type="button"
            onClick={() => handleSyncFromSheets(false)}
            disabled={syncingSheets}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-3 rounded-2xl shadow uppercase text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            title="Atualizar dados da planilha do Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${syncingSheets ? 'animate-spin' : ''}`} />
            {syncingSheets ? 'Sincronizando...' : 'Google Sheets'}
          </button>

          {/* Configurar Webhook URL */}
          <button
            type="button"
            onClick={() => setConfigUrlModal(true)}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold p-3 rounded-2xl transition cursor-pointer shrink-0"
            title="Configurar URL do Webhook do Google Sheets"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={openNewForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-3 rounded-2xl shadow-lg uppercase text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Cadastro
          </button>
        </div>
      </div>

      {sheetsNotice && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-bold transition flex items-center justify-between">
          <span>{sheetsNotice}</span>
          <button onClick={() => setSheetsNotice(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm text-center">
        <table className="w-full text-left text-[10px] whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800 font-black uppercase text-slate-500">
            <tr>
              <th className="p-3 text-center">ID</th>
              <th className="p-3">Data Prot.</th>
              <th className="p-3">Nº Prot.</th>
              <th className="p-3">Feiras Autorizadas</th>
              <th className="p-3">Pasta</th>
              <th className="p-3">Feirante</th>
              <th className="p-3">Produtos</th>
              <th className="p-3">Validade</th>
              <th className="p-3">Rua / Local</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredFeiras.length > 0 ? (
              filteredFeiras.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openEditForm(r)}
                  className="hover:bg-blue-50 dark:hover:bg-slate-800 border-b dark:border-slate-800 cursor-pointer transition-colors text-left"
                >
                  <td className="p-3 text-[10px] text-slate-500 text-center font-mono">{r.id}</td>
                  <td className="p-3 text-[10px]">{r.data_prot}</td>
                  <td className="p-3 text-[10px] font-bold text-blue-600 dark:text-blue-400">{r.num_prot}</td>
                  <td className="p-3 text-[10px] font-bold text-amber-600 uppercase">{r.feira || '---'}</td>
                  <td className="p-3 text-[10px] font-bold">{r.pasta}</td>
                  <td className="p-3 text-[10px] font-bold uppercase">{r.nome_pf}</td>
                  <td className="p-3 text-[10px] truncate max-w-[150px]">{r.produtos}</td>
                  <td className="p-3 text-[10px]">{r.validade}</td>
                  <td className="p-3 text-[10px]">{r.rua || '---'}</td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-bold p-1">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                  Nenhum feirante encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl border dark:border-slate-700 p-6 md:p-8 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
              <h2 className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 uppercase italic flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-blue-600 dark:fill-blue-400 shrink-0">
                  <path d="M12 2L2 7v2h20V7L12 2zm-7.5 9v11h3V11h-3zm6 0v11h3V11h-3zm6 0v11h3V11h-3z" />
                </svg>
                <span>{formItem.id ? 'Editar Cadastro de Feirante' : 'Novo Cadastro de Feirante'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-red-500 font-black text-2xl hover:text-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <input type="hidden" value={formItem.id || ''} />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase block mb-1">Data Protocolo</label>
                  <input
                    type="date"
                    value={formItem.data_prot || ''}
                    onChange={(e) => setFormItem({ ...formItem, data_prot: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase block mb-1">Nº Protocolo</label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={formItem.num_prot || ''}
                    onChange={(e) => setFormItem({ ...formItem, num_prot: e.target.value })}
                  />
                </div>

                <div className="md:col-span-8 bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center flex flex-col justify-center">
                  <label className="text-[10px] font-black uppercase mb-1 block text-blue-600 dark:text-blue-400">
                    Feiras Autorizadas
                  </label>
                  <div className="flex flex-row items-center justify-between sm:justify-center gap-2 md:gap-4 whitespace-nowrap overflow-x-auto px-1">
                    {['DA CULTURA', 'DO PESCADOR', 'DA ORLA', 'DA RUA 200'].map((fOpt) => (
                      <label key={fOpt} className="flex items-center gap-1 text-[10px] font-bold cursor-pointer whitespace-nowrap shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedFeirasOpts.some((x) => x.toLowerCase() === fOpt.toLowerCase())}
                          onChange={() => toggleFeiraOpt(fOpt)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="uppercase">{fOpt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase block mb-1">Pasta VISA</label>
                  <input
                    type="text"
                    placeholder="P-000"
                    value={formItem.pasta || ''}
                    onChange={(e) => setFormItem({ ...formItem, pasta: e.target.value })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold uppercase block mb-1">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formItem.cpf || ''}
                    onChange={(e) => setFormItem({ ...formItem, cpf: e.target.value })}
                  />
                </div>

                <div className="md:col-span-7">
                  <label className="text-[10px] font-bold uppercase block mb-1">Nome Pessoa Física</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo do Feirante"
                    value={formItem.nome_pf || ''}
                    onChange={(e) => setFormItem({ ...formItem, nome_pf: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                <div className="md:col-span-9">
                  <label className="text-[10px] font-bold uppercase block mb-1">Produtos Autorizados</label>
                  <input
                    type="text"
                    placeholder="Ex: Artesanatos, Pães, Queijos, Hortifrúti"
                    value={formItem.produtos || ''}
                    onChange={(e) => setFormItem({ ...formItem, produtos: e.target.value })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold uppercase block mb-1">Validade Autorização</label>
                  <input
                    type="date"
                    value={formItem.validade || ''}
                    onChange={(e) => setFormItem({ ...formItem, validade: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                <div className="md:col-span-8">
                  <label className="text-[10px] font-bold uppercase block mb-1">Endereço (Rua)</label>
                  <input
                    type="text"
                    placeholder="Rua / Avenida"
                    value={formItem.rua || ''}
                    onChange={(e) => setFormItem({ ...formItem, rua: e.target.value })}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold uppercase block mb-1">Nº / Complemento</label>
                  <input
                    type="text"
                    placeholder="Nº, Apto, Sala"
                    value={formItem.num || ''}
                    onChange={(e) => setFormItem({ ...formItem, num: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                <div className="md:col-span-5">
                  <label className="text-[10px] font-bold uppercase block mb-1">Bairro</label>
                  <select
                    value={formItem.bairro || 'Centro'}
                    onChange={(e) => setFormItem({ ...formItem, bairro: e.target.value })}
                  >
                    {BAIRROS_BC.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold uppercase block mb-1">Vínculo Comercial (CNPJ)</label>
                  <select
                    value={formItem.vinculo || 'NÃO'}
                    onChange={(e) => setFormItem({ ...formItem, vinculo: e.target.value as 'SIM' | 'NÃO' })}
                  >
                    <option value="NÃO">NÃO</option>
                    <option value="SIM">SIM</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase block mb-1">Nº Funcionários</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formItem.func || ''}
                    onChange={(e) => setFormItem({ ...formItem, func: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase block mb-1">Ano Abertura</label>
                  <input
                    type="number"
                    placeholder="AAAA"
                    value={formItem.abertura || ''}
                    onChange={(e) => setFormItem({ ...formItem, abertura: e.target.value })}
                  />
                </div>
              </div>

              {formItem.vinculo === 'SIM' && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-700/50 border border-blue-200 dark:border-slate-600 space-y-4">
                  <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">
                    Dados da Pessoa Jurídica (CNPJ)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1">CNPJ</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={formItem.cnpj || ''}
                          onChange={(e) => setFormItem({ ...formItem, cnpj: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleBuscarCNPJ();
                            }
                          }}
                          onBlur={() => {
                            if ((formItem.cnpj || '').replace(/\D/g, '').length >= 11 && !formItem.razao) {
                              handleBuscarCNPJ();
                            }
                          }}
                          placeholder="00.000.000/0001-00"
                        />
                        <button
                          type="button"
                          onClick={handleBuscarCNPJ}
                          disabled={loadingCnpj}
                          className="bg-blue-600 text-white px-3 rounded-lg text-[10px] font-black uppercase"
                        >
                          {loadingCnpj ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'API'}
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase block mb-1">Razão Social</label>
                      <input
                        type="text"
                        value={formItem.razao || ''}
                        onChange={(e) => setFormItem({ ...formItem, razao: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1">Alvará Sanitário</label>
                      <select
                        value={formItem.alvara || 'SIM'}
                        onChange={(e) =>
                          setFormItem({ ...formItem, alvara: e.target.value as 'SIM' | 'NÃO' | 'EM ANDAMENTO' })
                        }
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                        <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1">Município</label>
                      <input
                        type="text"
                        value={formItem.municipio || ''}
                        onChange={(e) => setFormItem({ ...formItem, municipio: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase block mb-1">CNAE Principal</label>
                      <input
                        type="text"
                        value={formItem.cnae || ''}
                        onChange={(e) => setFormItem({ ...formItem, cnae: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t dark:border-slate-700 flex justify-center">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-20 rounded-2xl shadow-xl transition uppercase tracking-widest text-xs cursor-pointer"
                >
                  SALVAR CADASTRO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuração do Google Sheets Webhook */}
      {configUrlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-left shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Configurar Webhook Google Sheets
              </h3>
              <button onClick={() => setConfigUrlModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Informe a URL do App Script (Macro do Google Sheets) responsável por receber e ler os cadastros de feirantes em tempo real:
            </p>

            <form onSubmit={handleSaveWebhookUrl} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">URL do Webhook (Google Apps Script /exec)</label>
                <input
                  type="text"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full text-xs font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfigUrlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow uppercase"
                >
                  Salvar e Testar Sincronia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
