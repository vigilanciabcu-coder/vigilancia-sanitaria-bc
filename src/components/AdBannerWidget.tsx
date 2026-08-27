import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, X } from 'lucide-react';

export const AdBannerWidget: React.FC = () => {
  // Inicia minimizado/fechado por padrão
  const [isMinimized, setIsMinimized] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  const adHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: transparent;
            overflow: hidden;
            width: 300px;
            height: 250px;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '09a326cc862fb85608bb8c865acc4fb1',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/09a326cc862fb85608bb8c865acc4fb1/invoke.js"></script>
      </body>
    </html>
  `;

  // Quando minimizado, fica camuflado/discreto no canto inferior direito parecendo uma tag do sistema
  if (isMinimized || isClosed) {
    return (
      <>
        {/* Iframe permanece montado em segundo plano invisível para garantir a contagem e impressões */}
        <div className="fixed bottom-0 right-0 w-[300px] h-[250px] opacity-0 pointer-events-none -z-50 overflow-hidden" aria-hidden="true">
          <iframe
            title="Publicidade Parceira Background"
            srcDoc={adHtml}
            width="300"
            height="250"
            className="w-[300px] h-[250px] border-0"
            scrolling="no"
          />
        </div>

        {/* Botão camuflado e discreto no canto inferior parecendo um indicador de status do sistema */}
        <button
          id="btn-reopen-ad"
          onClick={() => {
            setIsClosed(false);
            setIsMinimized(false);
          }}
          className="fixed bottom-[40px] right-2 z-40 bg-transparent hover:bg-slate-900/60 text-slate-500/40 hover:text-slate-400 border border-transparent hover:border-slate-800/60 rounded px-1.5 py-0.5 text-[9px] font-mono flex items-center gap-1 opacity-40 hover:opacity-100 transition-all duration-300 cursor-pointer select-none"
          title="Sistema Operacional • Parcerias"
        >
          <span className="w-1 h-1 rounded-full bg-slate-400/40"></span>
          <span className="text-[8px] tracking-tight">v2.6.4</span>
        </button>
      </>
    );
  }

  return (
    <aside
      id="widget-publicidade-parceira"
      aria-label="Espaço de Apoio Institucional"
      className="fixed bottom-[42px] right-2 z-40 transition-all duration-300 font-sans shadow-2xl rounded-lg overflow-hidden border border-slate-700/90 bg-slate-900/98 backdrop-blur-md"
    >
      {/* Header bar com botões de controle camuflado */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/80 select-none">
        <button
          id="btn-toggle-ad-expand"
          onClick={() => setIsMinimized(true)}
          className="flex items-center gap-1.5 text-left text-[11px] text-slate-300 font-medium hover:text-white transition cursor-pointer"
        >
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>Apoio Institucional</span>
        </button>

        <div className="flex items-center gap-1 ml-3">
          <button
            id="btn-ad-minimize-icon"
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition cursor-pointer"
            title="Minimizar"
            aria-label="Minimizar"
          >
            <ChevronDown size={13} />
          </button>
          <button
            id="btn-ad-close"
            onClick={() => {
              setIsClosed(true);
              setIsMinimized(true);
            }}
            className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Conteúdo do Anúncio (300x250) */}
      <div className="w-[300px] h-[250px] flex items-center justify-center bg-slate-950 p-0 overflow-hidden relative">
        <iframe
          title="Publicidade Parceira"
          srcDoc={adHtml}
          width="300"
          height="250"
          className="w-[300px] h-[250px] border-0"
          scrolling="no"
        />
      </div>
    </aside>
  );
};

