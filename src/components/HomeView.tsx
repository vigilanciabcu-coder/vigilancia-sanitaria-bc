import React, { useState, useEffect } from 'react';
import { PortalButton, EscalaItem, UserProfile, RecadoMural, ChatMessage } from '../types';
import { ShieldCheck, Calendar, Send, Info, Crown, ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeViewProps {
  buttons: PortalButton[];
  escala: EscalaItem[];
  users: UserProfile[];
  mural: RecadoMural[];
  chat: ChatMessage[];
  currentUser: UserProfile | null;
  onNavigate: (view: 'home' | 'feiras' | 'agenda' | 'master' | 'fiscalizacao' | 'processos') => void;
  onOpenExternal: (url: string) => void;
  onSendMessage: (text: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  buttons,
  escala,
  users,
  mural,
  chat,
  currentUser,
  onNavigate,
  onOpenExternal,
  onSendMessage,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [muralIndex, setMuralIndex] = useState(0);

  // Auto-rotate mural every 5 seconds if there are 3 or more items
  useEffect(() => {
    if (mural.length <= 2) return;
    const interval = setInterval(() => {
      setMuralIndex((prev) => (prev + 1) % mural.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mural.length]);

  const visibleMural =
    mural.length <= 2
      ? mural
      : [
          mural[muralIndex % mural.length],
          mural[(muralIndex + 1) % mural.length],
        ].filter(Boolean);

  const todayISO = new Date().toISOString().split('T')[0];
  const todayDay = new Date().getDate();
  const todayMonth = new Date().getMonth();

  const isMasterOrDirector = currentUser?.cargo === 'MASTER' || currentUser?.cargo === 'DIRETOR';

  const visibleButtons = buttons.filter((b) => {
    if (b.somenteMaster || b.nome.toLowerCase().includes('teste')) {
      return isMasterOrDirector;
    }
    return true;
  });

  // Find plantão
  const todayPlantao = escala.find((e) => e.data === todayISO && e.tipo === 'PLANTAO');
  const nextPlantao = escala
    .filter((e) => e.data >= todayISO && e.tipo === 'PLANTAO')
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  // Find birthdays automatically from registered operators (users)
  const aniversariantesHoje = users.filter((u) => {
    if (!u.data_nascimento) return false;
    const parts = u.data_nascimento.split('-');
    if (parts.length < 3) return false;
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    return birthMonth === todayMonth && birthDay === todayDay;
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const renderCardGraphic = (b: PortalButton) => {
    if (b.img === 'shield') {
      return (
        <div className="relative flex items-center justify-center">
          <ShieldCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-bounce">
            LIVE
          </span>
        </div>
      );
    }
    if (b.img === 'calendar') {
      return (
        <div className="calendar-icon">
          <div className="calendar-icon-header"></div>
          <span className="calendar-icon-day">{todayDay}</span>
        </div>
      );
    }
    if (b.img === 'tent') {
      return (
        <svg viewBox="0 0 24 24" className="h-12 w-12 fill-blue-600 dark:fill-blue-400">
          <path d="M12 2L2 7v2h20V7L12 2zm-7.5 9v11h3V11h-3zm6 0v11h3V11h-3zm6 0v11h3V11h-3z" />
        </svg>
      );
    }
    if (b.img === 'lab-icon') {
      return <span className="text-4xl">🔬</span>;
    }
    if (b.id === 'pref' || b.img.includes('brasao')) {
      return <img src={b.img} alt={b.nome} className="h-16 max-h-16 w-auto object-contain scale-125 transition-transform" />;
    }
    return <img src={b.img} alt={b.nome} className="h-12 w-auto object-contain" />;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Central App Grid */}
      <div className="flex-1 py-2">
        {/* Master Banner if user is MASTER/DIRETOR */}
        {isMasterOrDirector && (
          <div
            onClick={() => onNavigate('master')}
            className="mb-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-4 rounded-2xl border-2 border-amber-400/80 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl cursor-pointer hover:scale-[1.01] transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 text-slate-950 p-2.5 rounded-xl shadow">
                <Crown className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-black uppercase text-sm text-amber-300 flex items-center gap-2">
                  Painel Master & Diretoria DVIS
                </h3>
                <p className="text-[11px] text-slate-300">
                  Controle total do sistema: Cadastre Operadores, controle a Agenda, Mural de Recados e Aniversários.
                </p>
              </div>
            </div>
            <button className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl uppercase shadow transition cursor-pointer shrink-0">
              Acessar Painel Master →
            </button>
          </div>
        )}

        <div className="mb-4 text-left">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
            Serviços e Módulos Operacionais
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecione um módulo para acesso direto às ferramentas municipais e de fiscalização sanitária.
          </p>
        </div>

        <div className="grid-portal">
          {visibleButtons.map((b) => (
            <div
              key={b.id}
              onClick={() => {
                if (b.acao === 'link') {
                  onOpenExternal(b.url);
                } else if (b.view) {
                  onNavigate(b.view);
                }
              }}
              className={`card-app relative ${
                b.view === 'fiscalizacao'
                  ? 'border-2 border-emerald-500 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : b.id === 'tproc'
                  ? 'border-2 border-amber-500 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : ''
              }`}
            >
              {b.badgetext && (
                <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                  {b.badgetext}
                </span>
              )}
              <div className="flex justify-center items-center h-14 w-full">
                {renderCardGraphic(b)}
              </div>
              <h3 className="card-title">{b.nome}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (Plantão, Aniversariantes, Mural, Chat) */}
      <div className="w-full lg:w-[320px] flex flex-col gap-4">
        {/* Plantão Box */}
        <section className="bg-gradient-to-br from-blue-700 to-blue-900 p-5 rounded-2xl text-white shadow-md text-left relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-20">
            <Calendar className="w-16 h-16" />
          </div>
          <h2 className="text-xs font-black uppercase mb-1 border-b border-blue-400/50 pb-1 tracking-widest text-blue-100 flex items-center justify-between">
            <span>Plantão DVIS</span>
            <span className="text-[9px] bg-blue-500/50 px-2 py-0.5 rounded-full">HOJE</span>
          </h2>
          <p id="txt-escala-status" className="text-[10px] font-bold text-blue-200 uppercase mb-1 mt-2">
            {todayPlantao
              ? 'ESCALA ATIVA'
              : nextPlantao
              ? `PRÓXIMO: ${nextPlantao.data.split('-').reverse().slice(0, 2).join('/')}`
              : 'SEM ESCALA'}
          </p>
          <p id="txt-escala-nomes" className="text-base font-black leading-tight uppercase text-white">
            {todayPlantao ? todayPlantao.servidores : nextPlantao ? nextPlantao.servidores : '---'}
          </p>
        </section>

        {/* Aniversariantes Box */}
        <section className="bg-gradient-to-br from-indigo-700 via-purple-800 to-pink-800 p-4 rounded-2xl text-white shadow-md text-left relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-indigo-400/40 pb-1.5 mb-2">
            <h2 className="text-[10px] font-black uppercase tracking-wider text-indigo-100 flex items-center gap-1">
              <span>🎂 Aniversariantes do Dia</span>
            </h2>
            <span className="text-[8px] bg-pink-500/80 font-black px-2 py-0.5 rounded-full uppercase shadow">
              Automático
            </span>
          </div>

          {aniversariantesHoje.length > 0 ? (
            <div className="my-2">
              <p className="text-[9px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                <span>🎉 HOJE É DIA DE FESTA!</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {aniversariantesHoje.map((a) => {
                  const diaMes = a.data_nascimento?.split('-').reverse().slice(0, 2).join('/');
                  return (
                    <span
                      key={a.id}
                      className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg uppercase shadow flex items-center gap-1"
                    >
                      🎈 {a.nome_completo.split(' ')[0]} ({diaMes})
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs font-bold text-indigo-100 mt-1">
              Nenhum aniversariante hoje.
            </p>
          )}
        </section>

        {/* Mural de Recados */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
            <h2 className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Mural Informativo
            </h2>
            {mural.length > 2 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMuralIndex((prev) => (prev - 1 + mural.length) % mural.length)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-bold text-slate-400">
                  {muralIndex + 1}/{mural.length}
                </span>
                <button
                  type="button"
                  onClick={() => setMuralIndex((prev) => (prev + 1) % mural.length)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title="Próximo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div id="lista-recados-home" className="space-y-2.5 transition-all duration-300">
            {visibleMural.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-black text-slate-800 dark:text-white uppercase">
                    {m.titulo}
                  </span>
                  <span
                    className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      m.prioridade === 'URGENTE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}
                  >
                    {m.prioridade}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-snug">
                  {m.conteudo}
                </p>
                <div className="mt-1.5 text-[8px] text-slate-400 flex justify-between">
                  <span>{m.autor}</span>
                  <span>{m.data}</span>
                </div>
              </div>
            ))}
            {mural.length === 0 && (
              <p className="text-xs text-slate-400 py-2">Nenhum aviso no mural.</p>
            )}
          </div>
        </section>

        {/* Realtime Chat */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm text-left min-h-[260px]">
          <h2 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 border-b pb-2 mb-2 flex items-center justify-between">
            <span>Comunicação Interna</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </h2>

          <div className="chat-container mb-2 p-2 max-h-[160px] overflow-y-auto space-y-2">
            {chat.map((msg) => (
              <div
                key={msg.id}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
              >
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                  <span className="text-blue-600 dark:text-blue-400">{msg.sender} ({msg.role})</span>
                  <span className="text-[8px] text-slate-400">{msg.time}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Digite sua mensagem ao vivo..."
              className="flex-1 py-1.5 px-3 text-[10px] border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg font-black text-xs flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
