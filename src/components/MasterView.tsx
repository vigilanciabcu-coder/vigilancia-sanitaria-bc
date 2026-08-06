import React, { useState } from 'react';
import { UserProfile, UserRole, EscalaItem, RecadoMural, FiscalizacaoItem, FeiranteItem } from '../types';
import {
  UserCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Megaphone,
  Cake,
  Settings,
  Crown,
  BarChart3,
  Download,
  RotateCcw,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface MasterViewProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSaveUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  escala: EscalaItem[];
  onSaveEscalaItem: (item: EscalaItem) => void;
  onDeleteEscalaItem: (itemId: string) => void;
  mural: RecadoMural[];
  onSaveRecado: (recado: RecadoMural) => void;
  onDeleteRecado: (recadoId: string) => void;
  fiscalizacoes: FiscalizacaoItem[];
  feiras: FeiranteItem[];
  onResetSystemData?: () => void;
}

export const MasterView: React.FC<MasterViewProps> = ({
  currentUser,
  users,
  onSaveUser,
  onDeleteUser,
  escala,
  onSaveEscalaItem,
  onDeleteEscalaItem,
  mural,
  onSaveRecado,
  onDeleteRecado,
  fiscalizacoes,
  feiras,
  onResetSystemData
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'escala' | 'mural' | 'birthdays' | 'system'>('users');

  // --- TAB 1: USERS FORM STATE ---
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    nome_completo: '',
    email: '',
    data_nascimento: '1990-01-01',
    cargo: 'FISCAL' as UserRole,
    matricula: '',
    senha: '123456'
  });

  const handleEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setUserForm({
      nome_completo: u.nome_completo,
      email: u.email,
      data_nascimento: u.data_nascimento || '1990-01-01',
      cargo: u.cargo,
      matricula: u.matricula || '',
      senha: u.senha || '123456'
    });
  };

  const handleClearUserForm = () => {
    setEditingUserId(null);
    setUserForm({
      nome_completo: '',
      email: '',
      data_nascimento: '1990-01-01',
      cargo: 'FISCAL',
      matricula: '',
      senha: '123456'
    });
  };

  const handleResetUserPassword = (u: UserProfile) => {
    const updated = { ...u, senha: '123456' };
    onSaveUser(updated);
    setResetMessage(`Senha do operador ${u.nome_completo.split(' ')[0]} redefinida com sucesso para 123456!`);
    setTimeout(() => setResetMessage(null), 4000);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nome_completo.trim()) return;

    const userToSave: UserProfile = {
      id: editingUserId || `u-${Date.now()}`,
      email: userForm.email || `${userForm.nome_completo.toLowerCase().replace(/\s+/g, '.')}@bc.sc.gov.br`,
      nome_completo: userForm.nome_completo.toUpperCase(),
      data_nascimento: userForm.data_nascimento,
      cargo: userForm.cargo,
      matricula: userForm.matricula || `FIS-${Math.floor(1000 + Math.random() * 9000)}`,
      senha: userForm.senha || '123456'
    };

    onSaveUser(userToSave);
    setResetMessage(
      editingUserId
        ? `Operador ${userToSave.nome_completo.split(' ')[0]} atualizado com sucesso!`
        : `Novo operador ${userToSave.nome_completo.split(' ')[0]} cadastrado com a senha inicial: ${userToSave.senha}!`
    );
    setTimeout(() => setResetMessage(null), 4000);
    handleClearUserForm();
  };

  // --- TAB 2: ESCALA FORM STATE ---
  const [escalaForm, setEscalaForm] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'PLANTAO' as 'PLANTAO' | 'EVENTO' | 'FERIADO' | 'FACULTATIVO',
    servidores: '',
    descricao: ''
  });

  const handleAddEscalaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalaForm.servidores.trim()) return;

    const newItem: EscalaItem = {
      id: `esc-${Date.now()}`,
      data: escalaForm.data,
      tipo: escalaForm.tipo,
      servidores: escalaForm.servidores.toUpperCase(),
      descricao: escalaForm.descricao
    };

    onSaveEscalaItem(newItem);
    setEscalaForm({
      data: new Date().toISOString().split('T')[0],
      tipo: 'PLANTAO',
      servidores: '',
      descricao: ''
    });
  };

  // --- TAB 3: MURAL FORM STATE ---
  const [editingRecadoId, setEditingRecadoId] = useState<string | null>(null);
  const [muralForm, setMuralForm] = useState({
    titulo: '',
    conteudo: '',
    prioridade: 'NORMAL' as 'NORMAL' | 'URGENTE' | 'ALERTA',
    autor: currentUser ? currentUser.nome_completo : 'DIRETORIA DVIS'
  });

  const handleSaveMuralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!muralForm.titulo.trim() || !muralForm.conteudo.trim()) return;

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const newRecado: RecadoMural = {
      id: editingRecadoId || `rec-${Date.now()}`,
      titulo: muralForm.titulo.toUpperCase(),
      conteudo: muralForm.conteudo,
      prioridade: muralForm.prioridade,
      autor: muralForm.autor || (currentUser ? currentUser.nome_completo : 'DIRETORIA DVIS'),
      cargo: currentUser ? currentUser.cargo : 'DIRETOR',
      data: todayStr
    };

    onSaveRecado(newRecado);
    setEditingRecadoId(null);
    setMuralForm({
      titulo: '',
      conteudo: '',
      prioridade: 'NORMAL',
      autor: currentUser ? currentUser.nome_completo : 'DIRETORIA DVIS'
    });
  };

  const handleEditRecado = (r: RecadoMural) => {
    setEditingRecadoId(r.id);
    setMuralForm({
      titulo: r.titulo,
      conteudo: r.conteudo,
      prioridade: r.prioridade,
      autor: r.autor
    });
  };

  // --- TAB 4: BIRTHDAY PUBLICATOR ---
  const [publishedSuccess, setPublishedSuccess] = useState<string | null>(null);

  const handlePostBirthdayMural = (u: UserProfile) => {
    const firstName = u.nome_completo.split(' ')[0];
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const bdayRecado: RecadoMural = {
      id: `bday-${Date.now()}`,
      titulo: `🎂 FELIZ ANIVERSÁRIO - ${firstName.toUpperCase()}`,
      conteudo: `Desejamos um excelente aniversário e muitas felicidades ao nosso servidor(a) ${u.nome_completo} (${u.cargo})! Homenagem da Diretoria e Equipe DVIS/BC. 🎉🎈`,
      prioridade: 'ALERTA',
      autor: currentUser ? currentUser.nome_completo : 'DIRETORIA DVIS',
      cargo: 'DIRETOR',
      data: todayStr
    };

    onSaveRecado(bdayRecado);
    setPublishedSuccess(`Felicitação para ${firstName} publicada no Mural Oficial!`);
    setTimeout(() => setPublishedSuccess(null), 3000);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const fullBackup = {
      data_exportacao: new Date().toISOString(),
      usuarios: users,
      escalas: escala,
      mural,
      fiscalizacoes,
      feiras
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_visa_bc_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calculate birthdays
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth();
  const currentDay = todayDate.getDate();

  const birthdayList = users.map((u) => {
    if (!u.data_nascimento) return { ...u, isToday: false, month: -1, day: -1 };
    const parts = u.data_nascimento.split('-');
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const isToday = m === currentMonth && d === currentDay;
    return { ...u, isToday, month: m, day: d };
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 text-left pb-20">
      {/* Top Banner Header */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <Crown className="w-64 h-64 text-amber-400" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow">
                <Crown className="w-3.5 h-3.5" /> MASTER / DIRETORIA
              </span>
              <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                Portal de Administração Integral
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">
              Painel de Controle Total do Sistema
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Gerencie operadores, cargos, agenda de plantões, mural informativo, aniversários da equipe e relatórios globais de fiscalização.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-right">
            <p className="text-[10px] text-blue-200 uppercase font-black">Operador Responsável</p>
            <p className="text-sm font-black uppercase text-white">{currentUser?.nome_completo || 'ADMINISTRADOR MASTER'}</p>
            <span className="text-[9px] bg-purple-500/80 text-white font-extrabold px-2 py-0.5 rounded uppercase inline-block mt-0.5">
              {currentUser?.cargo || 'MASTER'}
            </span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10 relative z-10">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Operadores & Cargos
          </button>

          <button
            onClick={() => setActiveTab('escala')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'escala'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Agenda & Escalas
          </button>

          <button
            onClick={() => setActiveTab('mural')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'mural'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" /> Mural de Recados
          </button>

          <button
            onClick={() => setActiveTab('birthdays')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'birthdays'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <Cake className="w-4 h-4" /> Aniversariantes
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'system'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Métricas & Sistema
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* TAB 1: OPERADORES & CARGOS                                */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-900 dark:text-white">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase italic flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-600" /> Cadastro e Permissões de Operadores
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cadastre servidores e defina seus cargos (AGENTE, FISCAL, DIRETOR, MASTER) para liberação de acessos no portal.
              </p>
            </div>
            <span className="text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-xl uppercase">
              {users.length} Servidores
            </span>
          </div>

          {resetMessage && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-black rounded-xl uppercase flex items-center justify-between shadow">
              <span>✅ {resetMessage}</span>
              <button onClick={() => setResetMessage(null)} className="text-xs cursor-pointer font-bold">✕</button>
            </div>
          )}

          <form onSubmit={handleSaveUserSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                {editingUserId ? '✏️ Editar Operador' : '➕ Novo Operador'}
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Senha Padrão Inicial: <b className="text-blue-600 dark:text-blue-400 font-mono">123456</b>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={userForm.nome_completo}
                  onChange={(e) => setUserForm({ ...userForm, nome_completo: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">E-mail Operador</label>
                <input
                  type="email"
                  placeholder="fiscal@bc.sc.gov.br"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Data Nascimento</label>
                <input
                  type="date"
                  value={userForm.data_nascimento}
                  onChange={(e) => setUserForm({ ...userForm, data_nascimento: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Matrícula</label>
                <input
                  type="text"
                  placeholder="FIS-4092"
                  value={userForm.matricula}
                  onChange={(e) => setUserForm({ ...userForm, matricula: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1 text-amber-600 dark:text-amber-400">Senha Acesso</label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={userForm.senha}
                  onChange={(e) => setUserForm({ ...userForm, senha: e.target.value })}
                  className="font-mono font-bold text-center border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6">
                <label className="text-[10px] font-bold uppercase block mb-1">Cargo / Função Administrativa</label>
                <select
                  value={userForm.cargo}
                  onChange={(e) => setUserForm({ ...userForm, cargo: e.target.value as UserRole })}
                >
                  <option value="AGENTE">AGENTE DE FISCALIZAÇÃO</option>
                  <option value="FISCAL">FISCAL SANITÁRIO</option>
                  <option value="DIRETOR">DIRETOR DVIS</option>
                  <option value="MASTER">ADMINISTRADOR MASTER</option>
                </select>
              </div>

              <div className="md:col-span-6 flex justify-end gap-2 pt-2 md:pt-0">
                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleClearUserForm}
                    className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> {editingUserId ? 'Atualizar Operador' : 'Cadastrar Operador com Senha'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-[10px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <span className="text-sm">🔑</span>
              <div>
                <p className="font-extrabold uppercase">Instruções de Acesso & Senha:</p>
                <p>
                  Todo novo usuário é criado com a senha inicial <b>123456</b> (ou a configurada no campo acima). O operador pode alterar a própria senha a qualquer momento clicando em <b>&quot;Senha&quot;</b> no topo da página. Se o operador esquecer a senha, você como <b>Master</b> pode clicar em <b>&quot;Resetar Senha&quot;</b> na tabela abaixo para restaurar o acesso para <b>123456</b> instantaneamente.
                </p>
              </div>
            </div>
          </form>

          {/* Users List Table */}
          <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-black uppercase text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">Nome do Servidor</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Data Nasc.</th>
                  <th className="p-3">Cargo / Função</th>
                  <th className="p-3">Senha Atual</th>
                  <th className="p-3 text-center">Ações de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black uppercase text-slate-800 dark:text-white">{u.nome_completo}</td>
                    <td className="p-3 text-slate-500">{u.email}</td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{u.matricula || '---'}</td>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">
                      {u.data_nascimento ? u.data_nascimento.split('-').reverse().slice(0, 2).join('/') : '---'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-md font-black text-[9px] uppercase ${
                          u.cargo === 'MASTER'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : u.cargo === 'DIRETOR'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {u.cargo}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-black text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {u.senha || '123456'}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => handleResetUserPassword(u)}
                        className="text-amber-700 dark:text-amber-300 hover:bg-amber-200 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 font-extrabold px-2 py-1 rounded-lg text-[9px] uppercase transition cursor-pointer inline-flex items-center gap-1 shadow-xs"
                        title="Redefinir senha deste usuário para 123456"
                      >
                        🔑 Resetar (123456)
                      </button>
                      <button
                        onClick={() => handleEditUser(u)}
                        className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                        title="Editar operador e senha"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      {users.length > 1 && (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Excluir operador"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AGENDA & ESCALAS                                    */}
      {/* ========================================================= */}
      {activeTab === 'escala' && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-900 dark:text-white">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase italic flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" /> Gestão da Agenda e Plantões
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Adicione, modifique ou remova escalas de plantão, blitz e eventos diretamente no calendário oficial da DVIS.
              </p>
            </div>
            <span className="text-xs font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-xl uppercase">
              {escala.length} Escalas
            </span>
          </div>

          <form onSubmit={handleAddEscalaSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
              ➕ Cadastrar Nova Escala / Plantão
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Data do Evento/Plantão</label>
                <input
                  type="date"
                  required
                  value={escalaForm.data}
                  onChange={(e) => setEscalaForm({ ...escalaForm, data: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Tipo de Escala</label>
                <select
                  value={escalaForm.tipo}
                  onChange={(e) => setEscalaForm({ ...escalaForm, tipo: e.target.value as any })}
                >
                  <option value="PLANTAO">PLANTÃO</option>
                  <option value="EVENTO">EVENTO / BLITZ</option>
                  <option value="FERIADO">FERIADO</option>
                  <option value="FACULTATIVO">PONTO FACULTATIVO</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Servidores Escalados</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CARLOS SILVA / ANA PAULA"
                  value={escalaForm.servidores}
                  onChange={(e) => setEscalaForm({ ...escalaForm, servidores: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Descrição / Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Plantão Noturno Orla"
                  value={escalaForm.descricao}
                  onChange={(e) => setEscalaForm({ ...escalaForm, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Salvar Escala na Agenda
              </button>
            </div>
          </form>

          {/* List Escalas */}
          <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-black uppercase text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Servidores Escalados</th>
                  <th className="p-3">Descrição / Detalhes</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {escala.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-indigo-600 dark:text-indigo-400">
                      {item.data.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tag-evento tipo-${item.tipo.toLowerCase()}`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-bold uppercase text-slate-800 dark:text-slate-100">{item.servidores}</td>
                    <td className="p-3 text-slate-500">{item.descricao || '---'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteEscalaItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Remover Escala"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MURAL DE RECADOS                                   */}
      {/* ========================================================= */}
      {activeTab === 'mural' && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-900 dark:text-white">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-amber-600 dark:text-amber-400 uppercase italic flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-amber-600" /> Controle do Mural Oficial de Recados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Publique avisos importantes, alertas de fiscalização e comunicado da diretoria visíveis na tela inicial do sistema.
              </p>
            </div>
            <span className="text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-xl uppercase">
              {mural.length} Recados
            </span>
          </div>

          <form onSubmit={handleSaveMuralSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
              {editingRecadoId ? '✏️ Editar Recado do Mural' : '📢 Publicar Novo Comunicado'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase block mb-1">Título do Recado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: REUNIÃO GERAL DE METAS DVIS"
                  value={muralForm.titulo}
                  onChange={(e) => setMuralForm({ ...muralForm, titulo: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Prioridade</label>
                <select
                  value={muralForm.prioridade}
                  onChange={(e) => setMuralForm({ ...muralForm, prioridade: e.target.value as any })}
                >
                  <option value="NORMAL">NORMAL (INFORMATIVO)</option>
                  <option value="ALERTA">ALERTA (IMPORTANTE)</option>
                  <option value="URGENTE">URGENTE (AÇÃO IMEDIATA)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Assinado Por</label>
                <input
                  type="text"
                  value={muralForm.autor}
                  onChange={(e) => setMuralForm({ ...muralForm, autor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase block mb-1">Conteúdo do Mensagem</label>
              <textarea
                rows={3}
                required
                placeholder="Escreva a mensagem que aparecerá para toda a equipe..."
                value={muralForm.conteudo}
                onChange={(e) => setMuralForm({ ...muralForm, conteudo: e.target.value })}
                className="w-full p-3 text-xs border rounded-xl dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingRecadoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecadoId(null);
                    setMuralForm({ titulo: '', conteudo: '', prioridade: 'NORMAL', autor: currentUser?.nome_completo || 'DIRETORIA' });
                  }}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> {editingRecadoId ? 'Atualizar Recado' : 'Publicar no Mural'}
              </button>
            </div>
          </form>

          {/* List Mural */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {mural.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative text-left">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white uppercase">{m.titulo}</span>
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                      m.prioridade === 'URGENTE'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : m.prioridade === 'ALERTA'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {m.prioridade}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">{m.conteudo}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Por: {m.autor}</span>
                  <span>{m.data}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRecado(m)}
                      className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteRecado(m.id)}
                      className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ANIVERSARIANTES                                    */}
      {/* ========================================================= */}
      {activeTab === 'birthdays' && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-900 dark:text-white">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-pink-600 dark:text-pink-400 uppercase italic flex items-center gap-2">
                <Cake className="w-6 h-6 text-pink-600" /> Controle de Aniversariantes da DVIS
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Acompanhe as datas comemorativas dos servidores e envie felicitações automáticas ao Mural de Recados com um único clique.
              </p>
            </div>
          </div>

          {publishedSuccess && (
            <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 p-3 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2 border border-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {publishedSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdayList.map((u) => (
              <div
                key={u.id}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                  u.isToday
                    ? 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500 dark:border-pink-500 shadow-md ring-2 ring-pink-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white uppercase">{u.nome_completo}</span>
                    {u.isToday && (
                      <span className="bg-pink-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase animate-bounce">
                        HOJE! 🎈
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">{u.cargo}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Aniversário: <b className="text-pink-600 dark:text-pink-400">{u.data_nascimento ? u.data_nascimento.split('-').reverse().slice(0, 2).join('/') : 'Não informada'}</b>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      (Ano de nascimento omitido por privacidade)
                    </span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <button
                    onClick={() => handlePostBirthdayMural(u)}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] px-3 py-2 rounded-xl uppercase shadow transition cursor-pointer flex items-center gap-1"
                  >
                    🎉 Parabenizar no Mural
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      handleEditUser(u);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Editar Data
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MÉTRICAS & CONTROLE DO SISTEMA                     */}
      {/* ========================================================= */}
      {activeTab === 'system' && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-900 dark:text-white space-y-8">
          <div>
            <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase italic flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" /> Resumo Geral e Métricas de Operação
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Estatísticas completas de todos os registros e ações do sistema municipal de vigilância sanitária.
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-800">
              <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Total de Operadores</p>
              <p className="text-3xl font-black text-blue-900 dark:text-blue-200 mt-1">{users.length}</p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800">
              <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Escalas Cadastradas</p>
              <p className="text-3xl font-black text-indigo-900 dark:text-indigo-200 mt-1">{escala.length}</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Autos de Vistoria</p>
              <p className="text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1">{fiscalizacoes.length}</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-5 rounded-2xl border border-amber-200 dark:border-amber-800">
              <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Feirantes Cadastrados</p>
              <p className="text-3xl font-black text-amber-900 dark:text-amber-200 mt-1">{feiras.length}</p>
            </div>
          </div>

          {/* Admin Tools */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" /> Ferramentas do Administrador Master
            </h3>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExportBackup}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase shadow transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Exportar Backup do Sistema (JSON)
              </button>

              {onResetSystemData && (
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja restaurar os dados iniciais de demonstração do sistema?')) {
                      onResetSystemData();
                    }
                  }}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase shadow transition cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Restaurar Dados Iniciais de Fábrica
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
