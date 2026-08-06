import React, { useState } from 'react';
import { EscalaItem } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

interface AgendaViewProps {
  escala: EscalaItem[];
  onSaveEscalaItem: (item: EscalaItem) => void;
}

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO'
];

export const AgendaView: React.FC<AgendaViewProps> = ({ escala, onSaveEscalaItem }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form for new event
  const [eventForm, setEventForm] = useState({
    tipo: 'PLANTAO' as 'PLANTAO' | 'EVENTO' | 'FERIADO' | 'FACULTATIVO',
    servidores: '',
    descricao: ''
  });

  const changeMonth = (delta: number) => {
    let newM = currentMonth + delta;
    let newY = currentYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setCurrentMonth(newM);
    setCurrentYear(newY);
  };

  // Calendar Calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handleDayClick = (dStr: string) => {
    setSelectedDate(dStr);
    setEventForm({ tipo: 'PLANTAO', servidores: '', descricao: '' });
    setModalOpen(true);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !eventForm.servidores.trim()) return;

    const newItem: EscalaItem = {
      id: `esc-${Date.now()}`,
      data: selectedDate,
      tipo: eventForm.tipo,
      servidores: eventForm.servidores.toUpperCase(),
      descricao: eventForm.descricao
    };

    onSaveEscalaItem(newItem);
    setModalOpen(false);
  };

  // Get items for specific date
  const getItemsForDate = (dStr: string) => {
    return escala.filter((x) => x.data === dStr);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8" /> Agenda Operacional e Escala
        </h2>

        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => changeMonth(-1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-full font-black flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-black text-indigo-900 dark:text-indigo-300 w-32 uppercase text-xs">
            {MONTH_NAMES[currentMonth]}
          </span>

          <button
            onClick={() => changeMonth(1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-full font-black flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
            className="bg-transparent font-black uppercase text-xs w-20 outline-none"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-500 uppercase tracking-wider">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sáb</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner">
        {/* Empty slots for week padding */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-100/50 dark:bg-slate-900/40 h-28 rounded-xl opacity-30"></div>
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const fullDateISO = `${currentYear}-${monthStr}-${dayStr}`;

          const dayItems = getItemsForDate(fullDateISO);
          const isToday = fullDateISO === new Date().toISOString().split('T')[0];

          return (
            <div
              key={`day-${dayNum}`}
              onClick={() => handleDayClick(fullDateISO)}
              className={`dia-calendario rounded-xl p-2 transition flex flex-col justify-start relative ${
                isToday ? 'border-2 border-indigo-600 dark:border-indigo-400 font-extrabold' : ''
              }`}
            >
              <span className={`text-[11px] font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {dayNum}
              </span>

              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={`tag-evento tipo-${item.tipo.toLowerCase()} text-[8px] p-1 rounded font-black tracking-tight`}
                  >
                    <b>{item.tipo}:</b> {item.servidores}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail / Add Event Modal */}
      {modalOpen && selectedDate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase">
                Escala do Dia {selectedDate.split('-').reverse().join('/')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-red-500 font-black text-xl">
                ✕
              </button>
            </div>

            {/* List Existing Events */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {getItemsForDate(selectedDate).map((evt) => (
                <div key={evt.id} className={`p-2.5 rounded-xl text-xs font-bold tag-evento tipo-${evt.tipo.toLowerCase()}`}>
                  <p className="font-black text-sm">{evt.tipo}: {evt.servidores}</p>
                  {evt.descricao && <p className="text-[10px] opacity-80 mt-0.5">{evt.descricao}</p>}
                </div>
              ))}
              {getItemsForDate(selectedDate).length === 0 && (
                <p className="text-xs text-slate-400 italic">Nenhuma escala cadastrada para esta data.</p>
              )}
            </div>

            {/* Form to Add New */}
            <form onSubmit={handleAddEvent} className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
              <h4 className="text-xs font-black uppercase text-slate-500">Adicionar Servidores / Plantão</h4>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Tipo de Evento</label>
                <select
                  value={eventForm.tipo}
                  onChange={(e) => setEventForm({ ...eventForm, tipo: e.target.value as any })}
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
                  placeholder="Ex: CARLOS SILVA / ANA OLIVEIRA"
                  value={eventForm.servidores}
                  onChange={(e) => setEventForm({ ...eventForm, servidores: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Descrição / Rota</label>
                <input
                  type="text"
                  placeholder="Ex: Plantão Noturno Orla"
                  value={eventForm.descricao}
                  onChange={(e) => setEventForm({ ...eventForm, descricao: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 uppercase"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black rounded-xl bg-indigo-600 text-white uppercase shadow"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
