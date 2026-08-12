import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { FiscalizacaoView } from './components/FiscalizacaoView';
import { FeirasView } from './components/FeirasView';
import { AgendaView } from './components/AgendaView';
import { MasterView } from './components/MasterView';
import { ProcessosView } from './components/ProcessosView';
import { LoginModal, TrocaSenhaModal } from './components/Modals';

import {
  PortalButton,
  UserProfile,
  EscalaItem,
  FeiranteItem,
  RecadoMural,
  ChatMessage,
  FiscalizacaoItem,
  ProcessoItem
} from './types';

import {
  INITIAL_USERS,
  INITIAL_ESCALA,
  INITIAL_FEIRAS,
  INITIAL_MURAL,
  INITIAL_CHAT,
  INITIAL_FISCALIZACOES,
  INITIAL_PROCESSOS
} from './data/mockData';

import {
  fetchOperadoresFromSupabase,
  saveOperadorToSupabase,
  deleteOperadorFromSupabase,
  seedInitialOperadoresIfEmpty,
  fetchFiscalizacoesFromSupabase,
  saveFiscalizacaoToSupabase
} from './lib/supabaseService';

import {
  fetchProcessosFromSheets,
  saveProcessoToSheets
} from './lib/googleSheetsService';

const PORTAL_BUTTONS: PortalButton[] = [
  { id: 'pref', nome: 'Prefeitura', url: 'https://www.bc.sc.gov.br/', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/brasao__1_-removebg-preview%20(1).avif', acao: 'link' },
  { id: 'proc', nome: 'Processos', url: 'https://script.google.com/macros/s/AKfycbyaTV2FDyJ2-tC5l7OXiEvD5DVw2QxH_CHO_rHKmdnYxu8bqDQapmP5K9h6C5TEaWWXTQ/exec', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/processos.avif', acao: 'link' },
  { id: 'tproc', nome: 'Teste Processo', url: '', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/processos.avif', acao: 'view', view: 'processos', badgetext: 'SHEETS', somenteMaster: true },
  { id: '1doc', nome: '1Doc', url: 'https://bc.1doc.com.br/b.php?pg=o/login&n=3', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/1Doc.avif', acao: 'link' },
  { id: 'fisc', nome: 'FISCALIZAÇÃO', url: '', img: 'shield', acao: 'view', view: 'fiscalizacao' },
  { id: 'agen', nome: 'AGENDA', url: '', img: 'calendar', acao: 'view', view: 'agenda' },
  { id: 'feir', nome: 'FEIRAS', url: '', img: 'tent', acao: 'view', view: 'feiras' },
  { id: 'ahgo', nome: 'Ahgora', url: 'https://app.ahgora.com.br/externo/index/prefeiturabc', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/sistemadepontobiometrico.avif', acao: 'link' },
  { id: 'mail', nome: 'BC Mail', url: 'https://mail.bc.sc.gov.br/', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/email.institucional.avif', acao: 'link' },
  { id: 'cnpj', nome: 'CNPJ', url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/cnpj_edited.avif', acao: 'link' },
  { id: 'debi', nome: 'Débitos', url: 'https://cidadao.bc.sc.gov.br/cidadao/balneario_camboriu/portal/servicos/debitos?params=NA%3D%3D', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/consultadedebitos.avif', acao: 'link' },
  { id: 'domm', nome: 'DOM', url: 'https://diariomunicipal.sc.gov.br/?r=site/portal&codigoEntidade=31', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/diario-.avif', acao: 'link' },
  { id: 'epub', nome: 'e-Publica', url: 'https://epublica.bc.sc.gov.br/epublica/web/#/balneario_camboriu/login', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/e%20publica.avif', acao: 'link' },
  { id: 'geoo', nome: 'GEO+', url: 'https://geo.bc.sc.gov.br/login', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/geoprocessamento.avif', acao: 'link' },
  { id: 'labo', nome: 'Laboratório', url: 'https://script.google.com/macros/s/AKfycby8SSrv45Hvn7dISRonoyaoe0ffLu8xtwzTB2lWZL09RSqHN-j9RfyDfDHP31nEnVC-Aw/exec', img: 'lab-icon', acao: 'link' },
  { id: 'leis', nome: 'Leis', url: 'https://leismunicipais.com.br/legislacao-municipal/4511/leis-de-balneario-camboriu', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/leismunicipais.avif', acao: 'link' },
  { id: 'mapa', nome: 'Mapa', url: 'https://www.google.com.br/maps', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/mapa.avif', acao: 'link' },
  { id: 'regi', nome: 'Regin', url: 'http://200.19.203.151:8080/SiarcoWeb/loginAction.do', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/regin.avif', acao: 'link' },
  { id: 'rhwb', nome: 'RH Web', url: 'https://folhaweb.bc.sc.gov.br/e-servidor/web/#/login', img: 'https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/rhweb.avif', acao: 'link' }
];

export default function App() {
  // Navigation & View
  const [currentView, setCurrentView] = useState<'home' | 'feiras' | 'agenda' | 'master' | 'fiscalizacao' | 'processos'>('home');

  // App State with Persistence
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('visa_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('visa_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals
  const [loginOpen, setLoginOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('visa_current_user');
    return !saved;
  });
  const [trocaSenhaOpen, setTrocaSenhaOpen] = useState(false);

  const [escala, setEscala] = useState<EscalaItem[]>(() => {
    const saved = localStorage.getItem('visa_escala');
    return saved ? JSON.parse(saved) : INITIAL_ESCALA;
  });

  const [feiras, setFeiras] = useState<FeiranteItem[]>(() => {
    const saved = localStorage.getItem('visa_feiras');
    return saved ? JSON.parse(saved) : INITIAL_FEIRAS;
  });

  const [fiscalizacoes, setFiscalizacoes] = useState<FiscalizacaoItem[]>(() => {
    const saved = localStorage.getItem('visa_fiscalizacoes');
    return saved ? JSON.parse(saved) : INITIAL_FISCALIZACOES;
  });

  const [processos, setProcessos] = useState<ProcessoItem[]>(() => {
    const saved = localStorage.getItem('visa_processos');
    return saved ? JSON.parse(saved) : INITIAL_PROCESSOS;
  });

  const [mural, setMural] = useState<RecadoMural[]>(() => {
    const saved = localStorage.getItem('visa_mural');
    return saved ? JSON.parse(saved) : INITIAL_MURAL;
  });

  const [chat, setChat] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('visa_chat');
    return saved ? JSON.parse(saved) : INITIAL_CHAT;
  });

  // Sync com Supabase no carregamento
  useEffect(() => {
    async function loadSupabaseData() {
      const remoteUsers = await fetchOperadoresFromSupabase();
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      } else {
        // Se a tabela no Supabase estiver vazia, popula com os usuários padrão
        await seedInitialOperadoresIfEmpty(INITIAL_USERS);
      }

      // Carrega fiscalizações do Supabase se existirem
      const remoteFisc = await fetchFiscalizacoesFromSupabase();
      if (remoteFisc && remoteFisc.length > 0) {
        setFiscalizacoes(remoteFisc);
      }

      // Carrega processos do Google Sheets se existirem
      const remoteProc = await fetchProcessosFromSheets();
      if (remoteProc && remoteProc.length > 0) {
        setProcessos(remoteProc);
        localStorage.setItem('visa_processos', JSON.stringify(remoteProc));
      }
    }
    loadSupabaseData();
  }, []);

  // LocalStorage Effects
  useEffect(() => {
    localStorage.setItem('visa_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('visa_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('visa_current_user');
      setLoginOpen(true);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('visa_escala', JSON.stringify(escala));
  }, [escala]);

  useEffect(() => {
    localStorage.setItem('visa_feiras', JSON.stringify(feiras));
  }, [feiras]);

  useEffect(() => {
    localStorage.setItem('visa_fiscalizacoes', JSON.stringify(fiscalizacoes));
  }, [fiscalizacoes]);

  useEffect(() => {
    localStorage.setItem('visa_mural', JSON.stringify(mural));
  }, [mural]);

  useEffect(() => {
    localStorage.setItem('visa_chat', JSON.stringify(chat));
  }, [chat]);

  // Handlers
  const handleToggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: currentUser ? currentUser.nome_completo.split(' ')[0] : 'Operador',
      role: currentUser ? currentUser.cargo : 'AGENTE',
      time: timeStr,
      text
    };
    setChat((prev) => [...prev, newMsg]);
  };

  const handleSaveFeirante = (item: FeiranteItem) => {
    setFeiras((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  const handleSyncFeirantesFromSheets = (items: FeiranteItem[]) => {
    setFeiras(items);
    localStorage.setItem('visa_feiras', JSON.stringify(items));
  };

  const handleSaveEscalaItem = (item: EscalaItem) => {
    setEscala((prev) => [item, ...prev]);
  };

  const handleDeleteEscalaItem = (itemId: string) => {
    setEscala((prev) => prev.filter((x) => x.id !== itemId));
  };

  const handleSaveRecado = (recado: RecadoMural) => {
    setMural((prev) => {
      const idx = prev.findIndex((x) => x.id === recado.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = recado;
        return copy;
      }
      return [recado, ...prev];
    });
  };

  const handleDeleteRecado = (recadoId: string) => {
    setMural((prev) => prev.filter((x) => x.id !== recadoId));
  };

  const handleSaveFiscalizacao = async (item: FiscalizacaoItem) => {
    setFiscalizacoes((prev) => [item, ...prev]);
    await saveFiscalizacaoToSupabase(item);
  };

  const handleSaveUser = async (user: UserProfile) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        return copy;
      }
      return [...prev, user];
    });
    // Salva ou atualiza no Supabase e re-busca a lista atualizada
    await saveOperadorToSupabase(user);
    const remote = await fetchOperadoresFromSupabase();
    if (remote && remote.length > 0) {
      setUsers(remote);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    // Exclui do Supabase em segundo plano
    deleteOperadorFromSupabase(userId);
  };

  const handleSaveProcesso = async (item: ProcessoItem) => {
    setProcessos((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      let updated: ProcessoItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = item;
      } else {
        updated = [item, ...prev];
      }
      localStorage.setItem('visa_processos', JSON.stringify(updated));
      return updated;
    });

    // Envia automaticamente para a Planilha do Google Sheets (Apps Script)
    await saveProcessoToSheets(item);
  };

  const handleDeleteProcesso = (id: string) => {
    setProcessos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('visa_processos', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetSystemData = () => {
    setUsers(INITIAL_USERS);
    setEscala(INITIAL_ESCALA);
    setFeiras(INITIAL_FEIRAS);
    setFiscalizacoes(INITIAL_FISCALIZACOES);
    setProcessos(INITIAL_PROCESSOS);
    setMural(INITIAL_MURAL);
    setChat(INITIAL_CHAT);
    localStorage.clear();
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden text-slate-900 dark:text-slate-100 font-sans text-center">
      {/* Shell Container */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header Bar */}
        <Header
          currentUser={currentUser}
          users={users}
          onSelectUser={(user) => setCurrentUser(user)}
          onOpenTrocaSenha={() => setTrocaSenhaOpen(true)}
          onLogout={() => {
            setCurrentUser(null);
            setLoginOpen(true);
          }}
          onToggleDarkMode={handleToggleDarkMode}
          onGoHome={() => setCurrentView('home')}
        />

        {/* Main Workspace Layout */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Collapsible Hover Sidebar */}
          <Sidebar
            buttons={PORTAL_BUTTONS}
            currentView={currentView}
            currentUser={currentUser}
            onNavigate={(v) => setCurrentView(v)}
            onOpenExternal={handleOpenExternal}
          />

          {/* Main Display Area */}
          <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex flex-col relative">
            <div className="flex-1 p-4 pb-28 md:p-6">
              {currentView === 'home' && (
                <HomeView
                  buttons={PORTAL_BUTTONS}
                  escala={escala}
                  users={users}
                  mural={mural}
                  chat={chat}
                  currentUser={currentUser}
                  onNavigate={(v) => setCurrentView(v)}
                  onOpenExternal={handleOpenExternal}
                  onSendMessage={handleSendMessage}
                />
              )}

              {currentView === 'fiscalizacao' && (
                <FiscalizacaoView
                  fiscalizacoes={fiscalizacoes}
                  currentUser={currentUser}
                  onSaveFiscalizacao={handleSaveFiscalizacao}
                />
              )}

              {currentView === 'feiras' && (
                <FeirasView
                  feiras={feiras}
                  onSaveFeirante={handleSaveFeirante}
                  onSyncFeirantesFromSheets={handleSyncFeirantesFromSheets}
                />
              )}

              {currentView === 'agenda' && (
                <AgendaView escala={escala} onSaveEscalaItem={handleSaveEscalaItem} />
              )}

              {currentView === 'processos' && (
                <ProcessosView
                  processos={processos}
                  currentUser={currentUser}
                  users={users}
                  onSaveProcesso={handleSaveProcesso}
                  onDeleteProcesso={handleDeleteProcesso}
                />
              )}

              {currentView === 'master' && (
                <MasterView
                  currentUser={currentUser}
                  users={users}
                  onSaveUser={handleSaveUser}
                  onDeleteUser={handleDeleteUser}
                  escala={escala}
                  onSaveEscalaItem={handleSaveEscalaItem}
                  onDeleteEscalaItem={handleDeleteEscalaItem}
                  mural={mural}
                  onSaveRecado={handleSaveRecado}
                  onDeleteRecado={handleDeleteRecado}
                  fiscalizacoes={fiscalizacoes}
                  feiras={feiras}
                  onResetSystemData={handleResetSystemData}
                />
              )}
            </div>

            {/* Footer Bar */}
            <Footer />
          </main>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={loginOpen}
        users={users}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setLoginOpen(false);
        }}
      />

      <TrocaSenhaModal
        isOpen={trocaSenhaOpen}
        currentUser={currentUser}
        onSaveUser={handleSaveUser}
        onClose={() => setTrocaSenhaOpen(false)}
      />
    </div>
  );
}
