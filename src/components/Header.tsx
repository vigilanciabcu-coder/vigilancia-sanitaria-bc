import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Crown, UserCheck, ChevronDown, LogOut, Key } from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenTrocaSenha: () => void;
  onLogout: () => void;
  onToggleDarkMode: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  onOpenTrocaSenha,
  onLogout,
  onToggleDarkMode,
  onGoHome,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const masterUser = users.find((u) => u.cargo === 'MASTER') || users.find((u) => u.cargo === 'DIRETOR');

  return (
    <header className="h-24 bg-white dark:bg-slate-900 border-b dark:border-slate-800 grid grid-cols-3 items-center px-4 md:px-8 z-50 shrink-0 shadow-xs relative">
      {/* Logos Left */}
      <div className="flex items-center space-x-2 md:space-x-3 text-left">
        <img
          src="https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/brasao__1_-removebg-preview%20(1).avif"
          alt="Prefeitura Balneário Camboriú"
          onClick={onGoHome}
          className="h-10 md:h-14 w-auto object-contain cursor-pointer hover:scale-105 transition"
        />
        <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
        <img
          src="https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/DVIS.2.avif"
          alt="Diretoria de Vigilância Sanitária - DVIS"
          onClick={onGoHome}
          className="h-10 md:h-14 w-auto object-contain cursor-pointer hover:scale-105 transition"
        />
      </div>

      {/* Title Center */}
      <div className="flex flex-col items-center">
        <span className="font-black text-blue-900 dark:text-blue-400 uppercase text-[10px] md:text-xl lg:text-2xl tracking-tighter whitespace-nowrap">
          Vigilância Sanitária e Ambiental
        </span>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={onToggleDarkMode}
            className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-full border dark:border-slate-700 uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Tema 🌓
          </button>
        </div>
      </div>

      {/* User Info Right */}
      <div className="flex flex-col items-end leading-tight text-right relative">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="cursor-pointer group bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/80 dark:hover:bg-slate-800 p-2 md:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-2.5 shadow-2xs hover:shadow-xs"
          title="Clique para alterar senha ou sair do sistema"
        >
          <div className="text-right">
            {/* Nome Completo do Servidor */}
            <p className="text-xs md:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center justify-end gap-1">
              {currentUser ? currentUser.nome_completo : 'NENHUM USUÁRIO LOGADO'}
              <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-transform" />
            </p>
            {/* Função / Cargo e Matrícula */}
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5">
              {currentUser
                ? `${currentUser.cargo}${currentUser.matricula ? ` - MAT. ${currentUser.matricula}` : ''}`
                : 'VISA BC'}
            </p>
          </div>

          {/* Botão Azul com Inicial do Servidor */}
          <div className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs group-hover:scale-105 transition shrink-0">
            {currentUser ? currentUser.nome_completo.charAt(0) : '?'}
          </div>
        </div>

        {/* Dropdown Menu ao clicar no Perfil */}
        {dropdownOpen && (
          <div className="absolute right-0 top-16 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[1000] p-3 text-left space-y-2">
            {/* Info do usuário logado */}
            {currentUser && (
              <div className="px-2.5 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700/80 mb-1">
                <p className="text-[9px] font-black uppercase text-slate-400">Servidor Conectado</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate">{currentUser.nome_completo}</p>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                  {currentUser.cargo} {currentUser.matricula ? `• Mat. ${currentUser.matricula}` : ''}
                </p>
              </div>
            )}

            {/* Direct Actions: Alterar Senha e Sair */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenTrocaSenha();
                }}
                className="w-full p-2.5 rounded-xl bg-blue-50 dark:bg-slate-700/60 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center gap-2.5 transition cursor-pointer"
              >
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <Key className="w-4 h-4" />
                </div>
                <span>Alterar Minha Senha</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="w-full p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center gap-2.5 transition cursor-pointer"
              >
                <div className="p-1.5 bg-red-600 text-white rounded-lg">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Sair / Deslogar do Sistema</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

