/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MapPin, 
  User,
  X,
  Bell,
  BellOff,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Subject, ScheduleItem, DayOfWeek } from './types';

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: '022B10051 LOGÍSTICA (1)', color: '#8b5cf6', teacher: 'Profesor de Logística', room: 'AULA 6 FACEN' },
  { id: '2', name: '022B10052 PERITAJE CONTABLE (1)', color: '#3b82f6', teacher: 'Profesor de Peritaje', room: 'AULA 9 FACEN' },
  { id: '3', name: '022B10039 CONTABILIDAD SUPERIOR II (4)', color: '#f59e0b', teacher: 'Profesor de Contabilidad', room: 'AULA 4/5 FACEN' },
];

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  // Lunes
  { id: 's1', subjectId: '1', day: 'Lunes', startTime: '21:00', endTime: '23:00' },
  // Martes
  { id: 's2', subjectId: '2', day: 'Martes', startTime: '18:00', endTime: '20:00' },
  // Jueves
  { id: 's3', subjectId: '3', day: 'Jueves', startTime: '16:00', endTime: '18:00', room: 'AULA 4 FACEN' },
  { id: 's4', subjectId: '2', day: 'Jueves', startTime: '20:00', endTime: '22:00' },
  // Viernes
  { id: 's5', subjectId: '1', day: 'Viernes', startTime: '20:00', endTime: '23:00' },
  // Sábado
  { id: 's6', subjectId: '3', day: 'Sábado', startTime: '18:00', endTime: '21:00', room: 'AULA 5 FACEN' },
];

const formatTo12h = (time: string) => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('subjects');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SUBJECTS;
      }
    } catch (e) {
      console.error('Error loading subjects from localStorage:', e);
    }
    return DEFAULT_SUBJECTS;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('schedule');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SCHEDULE;
      }
    } catch (e) {
      console.error('Error loading schedule from localStorage:', e);
    }
    return DEFAULT_SCHEDULE;
  });
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [now, setNow] = useState(new Date());

  // Tick every 30 seconds to update 'Live' status
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isLive = (item: ScheduleItem) => {
    const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    if (item.day !== currentDay) return false;

    const currentT = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    const startT = startH * 60 + startM;
    const endT = endH * 60 + endM;

    return currentT >= startT && currentT < endT;
  };

  const liveSubjectIds = useMemo(() => {
    return new Set(schedule.filter(isLive).map(item => item.subjectId));
  }, [schedule, now]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [schedule]);

  // Notification Logic
  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      sendPassiveNotification();
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notifPermission === 'granted') {
      new Notification(title, { 
        body,
        icon: '/assets/margarita.jpeg'
      });
    }
  };

  const sendPassiveNotification = () => {
    const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const todaysClasses = schedule.filter(item => item.day === today);
    if (todaysClasses.length > 0) {
      const classNames = todaysClasses.map(item => subjects.find(s => s.id === item.subjectId)?.name).filter(Boolean).join(', ');
      sendNotification('Resumen del Día', `Clases para hoy (${today}): ${classNames}`);
    } else {
      sendNotification('Resumen del Día', `No tienes clases programadas para hoy (${today}). Disfruta!`);
    }
  };

  // Alert System (Check every minute)
  useEffect(() => {
    if (notifPermission !== 'granted') return;

    const notified15m = new Set<string>(); // Keep track in session to avoid double alerts

    const checkAlarms = () => {
      const now = new Date();
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
      const currentTimeStr = now.toTimeString().slice(0, 5); // HH:mm
      
      const in15Min = new Date(now.getTime() + 15 * 60000);
      const in15MinTimeStr = in15Min.toTimeString().slice(0, 5);

      schedule.forEach(item => {
        if (item.day === currentDay && item.startTime === in15MinTimeStr && !notified15m.has(item.id)) {
          const sub = subjects.find(s => s.id === item.subjectId);
          sendNotification('¡Alerta de Clase!', `Tu clase de ${sub?.name || 'Materia'} comienza en 15 minutos (${item.startTime}).`);
          notified15m.add(item.id);
        }
      });
    };

    const interval = setInterval(checkAlarms, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [notifPermission, schedule, subjects]);

  // Initial passive alarm on load if granted
  useEffect(() => {
    if (notifPermission === 'granted') {
      sendPassiveNotification();
    }
  }, []);

  const activeSubjectIdsForSelectedDay = useMemo(() => {
    return new Set(schedule.filter(item => item.day === selectedDay).map(item => item.subjectId));
  }, [schedule, selectedDay]);

  const handleAddSubject = (subject: Subject) => {
    if (editingSubject) {
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? subject : s));
      setEditingSubject(null);
    } else {
      setSubjects(prev => [...prev, subject]);
    }
    setIsSubjectModalOpen(false);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setSchedule(prev => prev.filter(item => item.subjectId !== id));
  };

  const handleAddScheduleItem = (item: ScheduleItem) => {
    setSchedule(prev => [...prev, item]);
    setIsScheduleModalOpen(false);
  };

  const handleRemoveScheduleItem = (id: string) => {
    setSchedule(prev => prev.filter(item => item.id !== id));
  };

  const exportData = () => {
    const data = { subjects, schedule };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horario_respaldo_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.subjects && data.schedule) {
          setSubjects(data.subjects);
          setSchedule(data.schedule);
          alert('Horario restaurado con éxito');
        }
      } catch (err) {
        alert('Error al importar el archivo. Asegúrate de que es un respaldo válido.');
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (confirm('¿Estás seguro de que quieres restablecer todo el horario? Se perderán tus cambios actuales.')) {
      setSubjects(DEFAULT_SUBJECTS);
      setSchedule(DEFAULT_SCHEDULE);
      localStorage.removeItem('subjects');
      localStorage.removeItem('schedule');
      setIsSettingsModalOpen(false);
      alert('Horario restablecido a los valores por defecto.');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="p-6 pt-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold font-display tracking-tight">Horario</h1>
            <p className="text-white/60 font-medium">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={requestPermission}
              className={`w-12 h-12 glass-card flex items-center justify-center transition-colors ${notifPermission === 'granted' ? 'text-green-400' : 'text-white/40'}`}
              title="Activar Notificaciones"
            >
              {notifPermission === 'granted' ? <Bell size={24} /> : <BellOff size={24} />}
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-12 h-12 glass-card flex items-center justify-center text-white/60 hover:text-white transition-colors"
              title="Configuración"
            >
              <Settings size={22} />
            </button>
            <button 
              onClick={() => { setEditingSubject(null); setIsSubjectModalOpen(true); }}
              className="w-12 h-12 glass-card flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-6 space-y-8">
        
        {/* Day Selector */}
        <section>
          <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedDay === day 
                    ? 'bg-white text-black scale-105 shadow-xl' 
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </section>

        {/* Subjects Dashboard */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display uppercase tracking-widest text-white/40 px-1">Materias</h2>
          <div className="grid grid-cols-2 gap-4">
            {subjects.length === 0 && (
              <div className="col-span-2 py-8 text-center glass-card border-dashed">
                <p className="text-white/40 text-sm">No hay materias registradas</p>
              </div>
            )}
            {subjects.map((subject) => (
              <motion.div 
                layout
                key={subject.id} 
                className="glass-card p-4 relative group overflow-hidden"
              >
                <div className="mb-2 flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className={`status-dot ${activeSubjectIdsForSelectedDay.has(subject.id) ? 'active' : ''}`} style={{ color: subject.color }}></div>
                    {liveSubjectIds.has(subject.id) && (
                      <span className="flex items-center text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-sm animate-pulse">
                        <Zap size={6} className="mr-0.5 fill-current" /> VIVO
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingSubject(subject); setIsSubjectModalOpen(true); }} className="p-1 hover:text-white/80"><Edit3 size={14} /></button>
                    <button onClick={() => handleRemoveSubject(subject.id)} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="font-bold truncate" title={subject.name}>{subject.name}</h3>
                {subject.teacher && <p className="text-xs text-white/40 truncate"><User size={10} className="inline mr-1" />{subject.teacher}</p>}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Selected Day Schedule */}
        <section className="space-y-4 pb-12">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold font-display uppercase tracking-widest text-white/40">Horario de {selectedDay}</h2>
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              className="text-xs font-bold text-white/60 hover:text-white flex items-center"
            >
              <Plus size={14} className="mr-1" /> AGREGAR
            </button>
          </div>
          
          <div className="space-y-3">
            {schedule.filter(item => item.day === selectedDay).length === 0 ? (
              <div className="py-12 text-center bg-white/5 rounded-2xl border border-white/10">
                <p className="text-white/30 text-sm">Sin clases programadas</p>
              </div>
            ) : (
              schedule
                .filter(item => item.day === selectedDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((item) => {
                  const subject = subjects.find(s => s.id === item.subjectId);
                  const displayRoom = item.room || subject?.room;
                  const itemIsLive = isLive(item);
                  
                  return (
                    <div key={item.id} className={`glass-card p-4 flex items-center space-x-4 relative overflow-hidden ${itemIsLive ? 'ring-2 ring-red-500/50 bg-red-500/5' : ''}`}>
                      {itemIsLive && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg flex items-center">
                          <Zap size={8} className="mr-1 fill-current" /> EN VIVO
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center w-20 border-r border-white/10 pr-4">
                        <span className="text-[11px] font-bold text-white/60 whitespace-nowrap">{formatTo12h(item.startTime)}</span>
                        <span className="text-[9px] text-white/30 whitespace-nowrap">{formatTo12h(item.endTime)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm flex items-center">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: subject?.color || '#fff' }}></span>
                          {subject?.name || 'Materia eliminada'}
                        </h4>
                        <div className="flex space-x-3 mt-1">
                          {displayRoom && <span className="text-xs text-white/40 flex items-center"><MapPin size={10} className="mr-1" />{displayRoom}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveScheduleItem(item.id)} className="text-white/20 hover:text-red-400">
                        <X size={16} />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isSubjectModalOpen && (
          <SubjectFormModal 
            onClose={() => { setIsSubjectModalOpen(false); setEditingSubject(null); }}
            onSave={handleAddSubject}
            initialData={editingSubject}
          />
        )}
        {isScheduleModalOpen && (
          <ScheduleFormModal 
            subjects={subjects}
            day={selectedDay}
            onClose={() => setIsScheduleModalOpen(false)}
            onSave={handleAddScheduleItem}
          />
        )}
        {isSettingsModalOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsModalOpen(false)}
            onExport={exportData}
            onImport={importData}
            onReset={resetData}
          />
        )}
      </AnimatePresence>

      {/* Galaxy A05 Frame Simulation Note */}
      <div className="fixed bottom-0 left-0 right-0 p-2 text-center bg-black/80 backdrop-blur-xs text-[10px] text-white/20 border-t border-white/5 pointer-events-none">
        Horario para mi amada
      </div>
    </div>
  );
}

function SubjectFormModal({ onClose, onSave, initialData }: { onClose: () => void, onSave: (s: Subject) => void, initialData: Subject | null }) {
  const [name, setName] = useState(initialData?.name || '');
  const [teacher, setTeacher] = useState(initialData?.teacher || '');
  const [room, setRoom] = useState(initialData?.room || '');
  const [color, setColor] = useState(initialData?.color || '#3b82f6');

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="glass-card w-full max-w-md p-6 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-display">{initialData ? 'Editar Materia' : 'Nueva Materia'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <input 
            placeholder="Nombre de la materia" 
            className="glass-input w-full" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
          <input 
            placeholder="Profesor (opcional)" 
            className="glass-input w-full" 
            value={teacher} 
            onChange={e => setTeacher(e.target.value)} 
          />
          <input 
            placeholder="Salón (opcional)" 
            className="glass-input w-full" 
            value={room} 
            onChange={e => setRoom(e.target.value)} 
          />
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave({ id: initialData?.id || Math.random().toString(36).substr(2, 9), name, teacher, room, color })}
          disabled={!name}
          className="w-full py-4 rounded-xl bg-white text-black font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {initialData ? 'Guardar Cambios' : 'Crear Materia'}
        </button>
      </motion.div>
    </motion.div>
  );
}

function ScheduleFormModal({ subjects, day, onClose, onSave }: { subjects: Subject[], day: DayOfWeek, onClose: () => void, onSave: (item: ScheduleItem) => void }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="glass-card w-full max-w-md p-6 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-display">Programar Clase</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Materia</label>
            <select 
              className="glass-input w-full appearance-none"
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              <option value="" disabled>Selecciona una materia</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1 text-[10px]">Inicio</label>
              <input 
                type="time" 
                className="glass-input w-full"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1 text-[10px]">Fin</label>
              <input 
                type="time" 
                className="glass-input w-full"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Salón (opcional)</label>
            <input 
              placeholder="Ej: AULA 4 FACEN"
              className="glass-input w-full"
              value={room}
              onChange={e => setRoom(e.target.value)}
            />
            <p className="text-[10px] text-white/30 pl-1">Si se deja vacío, se usará el salón predeterminado de la materia.</p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl text-center">
            <p className="text-sm text-white/60">Programando para el día <span className="text-white font-bold">{day}</span></p>
          </div>
        </div>

        <button 
          onClick={() => onSave({ id: Math.random().toString(36).substr(2, 9), subjectId, day, startTime, endTime, room: room || undefined })}
          disabled={!subjectId}
          className="w-full py-4 rounded-xl bg-white text-black font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          Programar
        </button>
      </motion.div>
    </motion.div>
  );
}

function SettingsModal({ onClose, onExport, onImport, onReset }: { onClose: () => void, onExport: () => void, onImport: (e: ChangeEvent<HTMLInputElement>) => void, onReset: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-sm p-6 space-y-8"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-display">Configuración</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onExport}
            className="w-full py-4 px-6 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"
          >
            <div className="flex items-center">
              <Download size={20} className="mr-3 text-white/40 group-hover:text-white" />
              <span className="font-bold">Exportar Respaldo</span>
            </div>
          </button>

          <label className="w-full py-4 px-6 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group cursor-pointer">
            <div className="flex items-center">
              <Upload size={20} className="mr-3 text-white/40 group-hover:text-white" />
              <span className="font-bold">Importar Respaldo</span>
            </div>
            <input type="file" accept=".json" className="hidden" onChange={onImport} />
          </label>

          <div className="pt-4 border-t border-white/5">
            <button 
              onClick={onReset}
              className="w-full py-4 px-6 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-colors group"
            >
              <div className="flex items-center">
                <RotateCcw size={20} className="mr-3 opacity-60 group-hover:opacity-100" />
                <span className="font-bold">Reiniciar Todo</span>
              </div>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">Horario Galaxy v1.1</p>
      </motion.div>
    </motion.div>
  );
}
