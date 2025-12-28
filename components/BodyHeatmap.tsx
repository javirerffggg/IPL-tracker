import React from 'react';
import { SessionLog } from '../types';
import { ZONES } from '../constants';

interface BodyHeatmapProps {
  logs: SessionLog[];
}

export const BodyHeatmap: React.FC<BodyHeatmapProps> = ({ logs }) => {
  // Calculate frequency per zone group
  const counts = {
    upper: logs.filter(l => l.zones.some(z => ZONES.UPPER.includes(z))).length,
    lower: logs.filter(l => l.zones.some(z => ZONES.LOWER.includes(z))).length,
    shoulders: logs.filter(l => l.zones.some(z => ZONES.SHOULDER_ADDON.some(sz => z.includes(sz.split(' ')[0])))).length
  };

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-800 text-gray-600 border-gray-700';
    if (count < 5) return 'bg-tactical-green/30 text-tactical-green border-tactical-green/50';
    if (count < 12) return 'bg-tactical-green/60 text-white border-tactical-green';
    return 'bg-tactical-green text-black border-white';
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-tactical-800/50 rounded border border-gray-800 p-4 flex flex-col items-center justify-center gap-2 font-mono">
       <div className="absolute top-2 left-2 text-[10px] text-gray-500">MAPA DE CALOR BIOLÓGICO</div>
       
       {/* Head (Decorative) */}
       <div className="w-16 h-16 border-2 border-gray-700 rounded-sm flex items-center justify-center mb-2 opacity-50">
          <span className="text-[8px]">CASCO</span>
       </div>

       {/* Upper Body Row */}
       <div className="flex gap-2 w-full justify-center">
          {/* Shoulders Left */}
          <div className={`w-12 h-24 border-2 rounded-sm flex items-center justify-center writing-vertical ${getColor(counts.shoulders)}`}>
             <span className="text-[10px] -rotate-90">HOMB</span>
          </div>
          
          {/* Torso */}
          <div className={`w-24 h-24 border-2 rounded-sm flex flex-col items-center justify-center ${getColor(counts.upper)}`}>
             <span className="text-xs font-bold">TORSO</span>
             <span className="text-[10px] mt-1">{counts.upper} Ops</span>
          </div>

           {/* Shoulders Right */}
           <div className={`w-12 h-24 border-2 rounded-sm flex items-center justify-center writing-vertical ${getColor(counts.shoulders)}`}>
             <span className="text-[10px] rotate-90">BRAZ</span>
          </div>
       </div>

       {/* Lower Body */}
       <div className="flex gap-2 w-full justify-center">
          <div className={`w-24 h-32 border-2 rounded-sm flex flex-col items-center justify-center ${getColor(counts.lower)}`}>
              <span className="text-xs font-bold">PIERNAS</span>
              <span className="text-[10px] mt-1">{counts.lower} Ops</span>
          </div>
       </div>

       <div className="flex gap-4 mt-4 text-[9px] text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-800 border border-gray-600"></div>Sin Datos</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-tactical-green/30 border border-tactical-green"></div>Iniciado</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-tactical-green border border-white"></div>Elite</div>
       </div>
    </div>
  );
};