import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, User, Repeat } from 'lucide-react';
import { api } from '../services/api';
import { Appointment, Patient } from '../types';

interface AgendaViewProps {
  patients: Patient[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({ patients }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = toISODate(new Date(year, month, 1));
      const endDate = toISODate(new Date(year, month + 1, 0));

      try {
        const data = await api.getAppointmentsRange(startDate, endDate);
        setMonthAppointments(data);
      } catch (e) {
        console.error("Erro ao carregar agenda", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthData();
  }, [currentMonth]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(newDate);
  };

  const handleAddAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientIdRaw = fd.get('patientId');
    const time = fd.get('time') as string;
    const type = fd.get('type') as string;
    const notes = fd.get('notes') as string;
    const weeksRaw = fd.get('weeks');

    const patientIdInt = patientIdRaw ? parseInt(patientIdRaw.toString(), 10) : 0;
    const patient = patients.find(p => p.id === patientIdInt);

    if (!patientIdInt || !patient) {
        alert("Erro: Paciente inválido selecionado.");
        return;
    }

    const baseApp = {
      time,
      patientId: patientIdInt,
      patientName: patient.name,
      type,
      notes
    };

    setLoading(true);

    try {
        const promises = [];

        if (isRecurring) {
            const weeks = weeksRaw ? parseInt(weeksRaw.toString(), 10) : 4;
            const [y, m, d] = selectedDate.split('-').map(Number);

            for (let i = 0; i < weeks; i++) {
                const nextDate = new Date(y, m - 1, d + (i * 7));
                const dateStr = toISODate(nextDate);

                promises.push(api.createAppointment({
                    ...baseApp,
                    date: dateStr,
                    isRecurring: true
                }));
            }
        } else {
            promises.push(api.createAppointment({
                ...baseApp,
                date: selectedDate
            }));
        }

        await Promise.all(promises);
        setShowAddModal(false);
        setIsRecurring(false);

        // Refresh Agenda
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startDate = toISODate(new Date(year, month, 1));
        const endDate = toISODate(new Date(year, month + 1, 0));
        const data = await api.getAppointmentsRange(startDate, endDate);
        setMonthAppointments(data);
        alert(isRecurring ? 'Agendamentos recorrentes criados!' : 'Agendamento criado!');

    } catch (err: any) {
        console.error("Erro ao criar agendamentos", err);
        alert("Erro ao salvar agendamento: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(confirm("Deseja cancelar este agendamento?")) {
      try {
          await api.deleteAppointment(id);
          setMonthAppointments(prev => prev.filter(app => app.id !== id));
      } catch (err) {
          alert("Erro ao excluir agendamento.");
      }
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(toISODate(new Date(year, month, i)));
  }

  const selectedDayAppointments = monthAppointments.filter(app => app.date === selectedDate);
  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    monthAppointments.forEach(app => {
        if (!map[app.date]) map[app.date] = [];
        map[app.date].push(app);
    });
    return map;
  }, [monthAppointments]);

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedDateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="animate-in fade-in flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{monthLabel}</h2>
            <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded text-teal-700"><ChevronLeft size={20}/></button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded text-teal-700"><ChevronRight size={20}/></button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                    <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {calendarDays.map((dateStr, i) => {
                    if (!dateStr) return <div key={`empty-${i}`} className="bg-gray-50/50 min-h-[80px] border-b border-r border-gray-100"></div>;
                    const dayNum = parseInt(dateStr.split('-')[2]);
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === toISODate(new Date());
                    const apps = appointmentsByDay[dateStr] || [];

                    return (
                        <div
                            key={dateStr}
                            onClick={() => { setSelectedDate(dateStr); setShowAddModal(true); }}
                            className={`min-h-[80px] p-2 border-b border-r border-gray-100 cursor-pointer transition-colors relative hover:bg-gray-50
                                ${isSelected ? 'bg-teal-50 ring-2 ring-inset ring-teal-500 z-10' : ''}
                            `}
                        >
                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                                ${isToday ? 'bg-teal-600 text-white' : 'text-gray-700'}
                            `}>
                                {dayNum}
                            </span>
                            <div className="flex flex-col gap-1">
                                {apps.slice(0, 3).map((_, idx) => (
                                    <div key={idx} className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-full opacity-60"></div>
                                    </div>
                                ))}
                                {apps.length > 3 && <span className="text-[10px] text-gray-400 font-bold">+{apps.length - 3}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col">
          <div className="flex justify-between items-center mb-4">
               <div>
                   <h3 className="font-bold text-gray-800 text-lg">Agenda do Dia</h3>
                   <p className="text-xs text-gray-500 capitalize">{selectedDateLabel}</p>
               </div>
               <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 shadow-sm"><Plus size={16}/> Agendar</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 min-h-[300px] overflow-hidden flex flex-col">
              {loading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm gap-2">
                       Carregando...
                  </div>
              ) : selectedDayAppointments.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                      <Calendar size={32} className="mb-2 opacity-20"/>
                      <p className="text-sm">Sem agendamentos.</p>
                  </div>
              ) : (
                  <div className="overflow-y-auto p-2 space-y-2">
                      {selectedDayAppointments.map(app => (
                          <div key={app.id} className="p-3 rounded-lg border border-gray-100 bg-white hover:border-teal-200 hover:shadow-sm transition-all group">
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-teal-50 text-teal-700 font-bold px-2 py-1 rounded text-sm border border-teal-100">
                                          {app.time}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800 text-sm">{app.patientName}</p>
                                          <p className="text-xs text-gray-500 flex items-center gap-1">
                                            {app.isRecurring && <Repeat size={10} className="text-teal-600"/>}
                                            {app.type}
                                          </p>
                                      </div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X size={14}/>
                                  </button>
                              </div>
                              {app.notes && (
                                  <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500 flex items-start gap-1">
                                      <span className="font-semibold">Nota:</span> {app.notes}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {showAddModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Agendar: {selectedDate.split('-')[2]}/{selectedDate.split('-')[1]}</h2>
                   <button onClick={() => { setShowAddModal(false); setIsRecurring(false); }} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
               </div>
               <form onSubmit={handleAddAppointment}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Paciente</label>
                    <select name="patientId" required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500">
                       <option value="">Selecione...</option>
                       {patients.filter(p => p.status !== 'archived').map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Horário</label>
                          <input className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" name="time" type="time" required />
                      </div>
                      <div className="mb-4">
                         <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                         <select name="type" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500">
                            <option>Sessão</option>
                            <option>Avaliação</option>
                            <option>Retorno</option>
                         </select>
                      </div>
                  </div>
                  <div className="mb-4">
                     <label className="block text-sm font-bold text-gray-700 mb-1">Observação</label>
                     <input className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" name="notes" placeholder="Ex: Trazer exames" />
                  </div>

                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                          />
                          <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Repeat size={14}/> Repetir semanalmente</span>
                      </label>

                      {isRecurring && (
                          <div className="mt-3">
                              <label className="block text-sm font-bold text-gray-700 mb-1">Por quantas semanas?</label>
                              <input
                                name="weeks"
                                type="number"
                                min="2"
                                max="12"
                                defaultValue="4"
                                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Agendamentos automáticos no mesmo horário.
                              </p>
                          </div>
                      )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t">
                      <button type="button" onClick={() => { setShowAddModal(false); setIsRecurring(false); }} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50">{loading ? 'Salvando...' : 'Confirmar'}</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};