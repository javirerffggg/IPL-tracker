import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Shield, Footprints, Crosshair, Lock, Info, Calendar } from 'lucide-react';
import { SessionLog, Phase } from '../types';
import { ZONES, PHASE_TRANSLATIONS, PHASE_CONFIG } from '../constants';

interface CalendarViewProps {
  startDate: string;
  logs: SessionLog[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ startDate, logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- Helper Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    // Shift so 0 is Monday, 6 is Sunday to match Spanish week
    return day === 0 ? 6 : day - 1; 
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setSelectedDate(newDate); // Reset selection to start of new month view
  };

  // --- Grid Generation ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const slots = [];
  for (let i = 0; i < firstDay; i++) slots.push(null);
  for (let i = 1; i <= daysInMonth; i++) slots.push(new Date(year, month, i));

  // --- Tactical Logic Per Day ---
  const getTacticalStatus = (date: Date) => {
    const start = new Date(startDate);
    const d = new Date(date); d.setHours(0,0,0,0);
    const s = new Date(start); s.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    
    const diffTime = d.getTime() - s.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { type: 'PRE_OPS', label: 'PRE-OPERATIVO', icon: Lock, color: 'text-gray-600' };

    const weekIndex = Math.floor(diffDays / 7);
    
    // Determine Phase
    let phase = Phase.ATTACK;
    if (weekIndex >= 12) phase = Phase.TRANSITION;
    if (weekIndex >= 24) phase = Phase.MAINTENANCE;

    // Phase specific active logic
    let isActiveWeek = true;
    let isShoulderWeek = false;

    if (phase === Phase.ATTACK) {
        isShoulderWeek = (weekIndex % 3 === 0);
    } else if (phase === Phase.TRANSITION) {
        isActiveWeek = (weekIndex % 2 !== 0);
        isShoulderWeek = true;
    } else if (phase === Phase.MAINTENANCE) {
        isActiveWeek = (d.getDate() <= 7 && d.getMonth() !== 7); // First week only, not August
    }

    const dayOfWeek = d.getDay(); // 0 Sun, 1 Mon
    let sessionType = null;
    let zones = [];
    let icon = null;

    if (isActiveWeek) {
        if (dayOfWeek === 1) {
            sessionType = 'LOWER';
            zones = ZONES.LOWER;
            icon = Footprints;
        } else if (dayOfWeek === 0) {
            sessionType = 'UPPER';
            zones = isShoulderWeek ? [...ZONES.UPPER, ...ZONES.SHOULDER_ADDON] : ZONES.UPPER;
            icon = isShoulderWeek ? Crosshair : Shield;
        }
    }

    // Check Log
    const log = logs.find(l => {
        const ld = new Date(l.date);
        return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
    });

    const isToday = d.getTime() === today.getTime();
    const isPast = d < today;
    const isSelected = d.getTime() === new Date(selectedDate).setHours(0,0,0,0);

    return {
        date: d,
        weekIndex,
        phase,
        sessionType,
        zones,
        icon,
        isToday,
        isPast,
        isSelected,
        log,
        isActiveWeek,
        diffDays
    };
  };

  // --- Phase Context for Header ---
  const currentMonthPhase = useMemo(() => {
     // Check the middle of the month to determine dominant phase
     const midMonth = new Date(year, month, 15);
     return getTacticalStatus(midMonth).phase;
  }, [year, month]);

  const activeStats = getTacticalStatus(selectedDate);
  const ActiveIcon = activeStats.icon; // Assign to PascalCase variable for rendering
  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  return (
    <div className="space-y-4">
        {/* 1. Navigation & Phase Context */}
        <div className="bg-black border border-gray-800 rounded overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-tactical-800/50">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded text-gray-400"><ChevronLeft /></button>
                <div className="text-center">
                    <div className="font-bold text-xl text-white tracking-widest font-mono uppercase">{monthNames[month]} {year}</div>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded text-gray-400"><ChevronRight /></button>
            </div>
            
            {/* Phase Progress Bar */}
            <div className="px-4 py-2 border-t border-gray-800 flex justify-between items-center text-[10px] font-mono bg-black">
                 <span className="text-gray-500">FASE ACTIVA:</span>
                 <span className={`font-bold uppercase tracking-wider ${
                     currentMonthPhase === Phase.ATTACK ? 'text-red-400' :
                     currentMonthPhase === Phase.TRANSITION ? 'text-yellow-400' : 'text-blue-400'
                 }`}>
                     {PHASE_TRANSLATIONS[currentMonthPhase]}
                 </span>
            </div>
            <div className="h-1 w-full flex bg-gray-900">
                <div className={`h-full transition-all duration-500 ${
                     currentMonthPhase === Phase.ATTACK ? 'bg-red-900 w-1/3' :
                     currentMonthPhase === Phase.TRANSITION ? 'bg-yellow-900 w-2/3' : 'bg-blue-900 w-full'
                }`}></div>
            </div>
        </div>

        {/* 2. Tactical Grid */}
        <div>
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] mb-2 text-gray-500 uppercase tracking-widest">
                <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div className="text-red-800">Dom</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {slots.map((date, i) => {
                    if (!date) return <div key={i} className="aspect-square bg-transparent"></div>;
                    
                    const status = getTacticalStatus(date);
                    const dayNum = date.getDate();
                    const StatusIcon = status.icon; // Assign to PascalCase variable
                    
                    let bgClass = 'bg-tactical-800/30';
                    let borderClass = 'border-transparent';
                    let textClass = 'text-gray-600';
                    let iconColor = 'text-gray-700';

                    // Selection
                    if (status.isSelected) {
                        bgClass = 'bg-white/10';
                        borderClass = 'border-white';
                    } else if (status.isToday) {
                        borderClass = 'border-tactical-green';
                    }

                    // Session Logic
                    if (status.sessionType) {
                        if (status.log) {
                            // Completed
                            bgClass = status.isSelected ? 'bg-tactical-green/30' : 'bg-tactical-green/10';
                            textClass = 'text-tactical-green';
                            iconColor = 'text-tactical-green';
                        } else if (status.isPast) {
                            // Missed
                            textClass = 'text-red-900';
                            iconColor = 'text-red-900';
                            bgClass = status.isSelected ? 'bg-red-900/20' : 'bg-red-900/5';
                        } else {
                            // Future
                            textClass = 'text-white';
                            iconColor = status.sessionType === 'LOWER' ? 'text-blue-400' : 'text-yellow-400';
                            bgClass = status.isSelected ? 'bg-gray-700' : 'bg-gray-800';
                        }
                    }

                    return (
                        <div 
                            key={i} 
                            onClick={() => setSelectedDate(date)}
                            className={`aspect-square rounded-sm border ${borderClass} ${bgClass} flex flex-col items-center justify-between p-1 cursor-pointer transition-colors relative group`}
                        >
                            <span className={`${textClass} text-[10px] font-mono leading-none self-start`}>{dayNum}</span>
                            
                            <div className="flex-1 flex items-center justify-center">
                                {status.log ? <Check size={14} className="text-tactical-green" /> : 
                                 StatusIcon ? <StatusIcon size={14} className={iconColor} strokeWidth={2} /> : null
                                }
                            </div>

                            {/* Tiny indicator for today */}
                            {status.isToday && <div className="absolute top-1 right-1 w-1 h-1 bg-tactical-green rounded-full"></div>}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 3. Mission Detail Panel (Interactive) */}
        {/* Removed animate-scanline to prevent movement */}
        <div className="bg-black border border-gray-800 p-4 min-h-[140px] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                 {ActiveIcon ? <ActiveIcon size={80} /> : <Calendar size={80} />}
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-2">
                    <div>
                        <h3 className="text-white font-mono font-bold text-lg uppercase">
                            {activeStats.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long'})}
                        </h3>
                        <div className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">
                            SEMANA {activeStats.weekIndex + 1} // {PHASE_TRANSLATIONS[activeStats.phase]}
                        </div>
                    </div>
                    {activeStats.log && (
                        <div className="bg-tactical-green/20 text-tactical-green px-2 py-1 rounded text-[10px] font-mono font-bold border border-tactical-green">
                            CUMPLIDO
                        </div>
                    )}
                </div>

                <div className="font-mono text-sm space-y-2">
                    {activeStats.sessionType ? (
                        <>
                            <div className="flex items-center gap-2 text-white">
                                <span className="text-gray-500 text-[10px] uppercase w-16">MISIÓN:</span>
                                <span className="font-bold">{activeStats.sessionType === 'LOWER' ? 'TREN INFERIOR' : 'TREN SUPERIOR'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-white">
                                <span className="text-gray-500 text-[10px] uppercase w-16 mt-1">ZONAS:</span>
                                <span className="text-xs leading-relaxed text-gray-300">{activeStats.zones.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white mt-2">
                                <span className="text-gray-500 text-[10px] uppercase w-16">TIEMPO:</span>
                                <span className="text-tactical-green">
                                    {activeStats.sessionType === 'LOWER' ? '~40 MIN' : '~20 MIN'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 mt-4 text-gray-500">
                             <div className="flex items-center gap-2">
                                <Info size={16} />
                                <span>NO HAY OPERACIONES PROGRAMADAS.</span>
                             </div>
                             <p className="text-xs pl-6">
                                {activeStats.phase === Phase.TRANSITION && !activeStats.isActiveWeek ? 
                                    "SEMANA DE DESCANSO (Fase de Transición)." : 
                                    "Día de recuperación y mantenimiento de piel."}
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
