import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { SessionLog, Phase } from '../types';

interface CalendarViewProps {
  startDate: string;
  logs: SessionLog[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ startDate, logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Generate grid slots
  const slots = [];
  // Empty slots for start
  for (let i = 0; i < firstDay; i++) {
    slots.push(null);
  }
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    slots.push(new Date(year, month, i));
  }

  const getDayStatus = (date: Date) => {
    const start = new Date(startDate);
    // Reset hours for accurate diff
    const d = new Date(date); d.setHours(0,0,0,0);
    const s = new Date(start); s.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    
    const diffTime = d.getTime() - s.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Before operation start
    if (diffDays < 0) return { type: 'FUTURE', isSession: false };

    const weekIndex = Math.floor(diffDays / 7);
    
    // Determine Phase based on original logic
    let phase = Phase.ATTACK;
    if (weekIndex >= 12) phase = Phase.TRANSITION;
    if (weekIndex >= 24) phase = Phase.MAINTENANCE;

    let isActiveWeek = true;
    if (phase === Phase.TRANSITION) {
        // Week 12 (Index 12) is REST. Week 13 (Index 13) is FIRE.
        // Even indices are Rest, Odd are Active in Transition phase relative to start.
        isActiveWeek = (weekIndex % 2 !== 0);
    } else if (phase === Phase.MAINTENANCE) {
        if (date.getMonth() === 7) { // August
            isActiveWeek = false;
        } else {
            // First 7 days of the month only
            isActiveWeek = (date.getDate() <= 7);
        }
    }

    // Protocol: Sunday (0) and Monday (1) are active session days
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon
    const isSessionDay = isActiveWeek && (dayOfWeek === 0 || dayOfWeek === 1);
    
    // Check log
    const log = logs.find(l => {
        const ld = new Date(l.date);
        return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
    });

    return {
        isSession: isSessionDay,
        isCompleted: !!log,
        phase,
        isPast: d < today,
        isToday: d.getTime() === today.getTime()
    };
  };

  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center bg-tactical-800 p-4 rounded border border-gray-800">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded text-gray-400"><ChevronLeft /></button>
            <div className="text-center">
                <div className="font-bold text-xl text-white tracking-wider">{monthNames[month]}</div>
                <div className="text-xs text-tactical-green font-mono">{year}</div>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded text-gray-400"><ChevronRight /></button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs mb-2 text-gray-600">
            <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div className="text-red-900">D</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
            {slots.map((date, i) => {
                if (!date) return <div key={i} className="aspect-square"></div>;
                
                const status = getDayStatus(date);
                const dayNum = date.getDate();
                
                let bgClass = 'bg-tactical-800/50';
                let textClass = 'text-gray-600';
                let borderClass = 'border-transparent';
                
                if (status.isToday) {
                    borderClass = 'border-tactical-green border-2';
                }

                if (status.isSession) {
                    if (status.isCompleted) {
                        bgClass = 'bg-tactical-green/20';
                        textClass = 'text-tactical-green';
                    } else if (status.isPast) {
                        bgClass = 'bg-red-900/20';
                        textClass = 'text-red-500';
                    } else {
                        // Future Session
                        bgClass = 'bg-blue-900/20';
                        textClass = 'text-blue-400';
                    }
                } else if (status.isCompleted) {
                    // Completed on a non-session day (extra credit)
                    bgClass = 'bg-yellow-900/20';
                    textClass = 'text-yellow-500';
                }

                return (
                    <div key={i} className={`aspect-square rounded border ${borderClass} ${bgClass} flex flex-col items-center justify-center relative p-1`}>
                        <span className={`${textClass} text-xs font-mono font-bold`}>{dayNum}</span>
                        <div className="mt-1 h-3 flex items-center justify-center">
                            {status.isCompleted ? <Check size={12} className={textClass} /> : 
                             (status.isSession && status.isPast) ? <X size={12} className={textClass} /> :
                             (status.isSession) ? <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> : null
                            }
                        </div>
                    </div>
                );
            })}
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 text-[9px] text-gray-500 font-mono mt-4 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tactical-green"></div>CUMPLIDO</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>FALLADO</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>OBJETIVO</div>
        </div>
    </div>
  );
};