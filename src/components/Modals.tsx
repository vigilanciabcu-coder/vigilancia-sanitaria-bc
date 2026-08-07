import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, users, onLoginSuccess }) => {
  const [email, setEmail] = useState('fiscal@bc.sc.gov.br');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (matched) {
      const expectedPassword = matched.senha || '123456';
      if (password === expectedPassword || password === '123456') {
        onLoginSuccess(matched);
      } else {
        setErrorMsg(`Senha incorreta para ${matched.nome_completo.split(' ')[0]}. Tente a senha inicial (123456) ou solicite ao Master.`);
      }
    } else {
      setErrorMsg('Operador não encontrado. Selecione um operador abaixo ou tente fiscal@bc.sc.gov.br');
    }
  };

  return (
    <section className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 text-center text-slate-900 dark:text-white">
        <img
          src="https://wcbzmpnvcjamlgljsksk.supabase.co/storage/v1/object/public/public-assets/logo_bc.avif"
          alt="Prefeitura de Balneário Camboriú"
          className="h-16 mx-auto mb-4"
        />
        <h2 className="text-xl font-black uppercase text-blue-900 dark:text-blue-400 mb-1">
          Portal Vigilância Sanitária
        </h2>
        <p className="text-xs text-slate-500 mb-6">Acesso restrito a Fiscais e Agentes DVIS</p>

        {errorMsg && (
          <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-xl mb-4">{errorMsg}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase block text-left mb-1">E-mail Operador</label>
            <input
              type="email"
              required
              placeholder="fiscal@bc.sc.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 text-center font-bold w-full border rounded-xl dark:bg-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase block text-left mb-1">Senha</label>
            <input
              type="password"
              required
              placeholder="Senha de Acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 text-center font-bold w-full border rounded-xl dark:bg-slate-700"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition uppercase tracking-widest text-xs cursor-pointer mt-2"
          >
            Acessar Sistema
          </button>
        </form>
      </div>
    </section>
  );
};

interface TrocaSenhaModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onSaveUser: (u: UserProfile) => void;
  onClose: () => void;
}

export const TrocaSenhaModal: React.FC<TrocaSenhaModalProps> = ({
  isOpen,
  currentUser,
  onSaveUser,
  onClose
}) => {
  const [newPass, setNewPass] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.trim()) return;

    if (currentUser) {
      const updated = { ...currentUser, senha: newPass.trim() };
      onSaveUser(updated);
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setNewPass('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1500] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 text-center text-slate-900 dark:text-white shadow-2xl">
        <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase italic mb-4">
          Alterar Senha Operacional
        </h2>

        {success ? (
          <p className="text-emerald-600 font-bold text-xs py-4">Senha alterada com sucesso!</p>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Digite a nova senha"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="p-3 text-center font-bold border rounded-xl w-full dark:bg-slate-700"
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl shadow-xl transition uppercase text-xs cursor-pointer"
            >
              Salvar Nova Senha
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-slate-500 font-bold uppercase text-xs mt-2 cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
