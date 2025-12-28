import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Shield, Activity, DollarSign, MessageSquare, Menu, X, Trophy, Save, Trash2 } from 'lucide-react';
import { INITIAL_START_DATE, INITIAL_ACHIEVEMENTS, RANKS_THRESHOLDS, ZONES, PHASE_CONFIG, RANK_TRANSLATIONS, PHASE_TRANSLATIONS, WEEKLY_INTEL } from './constants';
import { AppState, Rank, Phase, SessionLog } from './types';
import { SessionMode } from './components/SessionMode';
import { getMissionBriefing, chatWithIntelOfficer } from './services/geminiService';
import { fetchWeatherData } from './services/weatherService';

// --- Utility Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`bg-tactical-800 border border-gray-800 rounded-sm p-4 ${className}`}>
    {title && <h3 className="text-xs font-mono text-tactical-green uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">{title}</h3>}
    {children}
  </div>
);

const ProgressBar: React.FC<{ value: number; max: number; label?: string; color?: string }> = ({ value, max, label, color = 'bg-tactical-green' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono"><span>{label}</span><span>{Math.round(pct)}%</span></div>}
      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  // State
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('ipl_elite_data_v2');
    return saved ? JSON.parse(saved) : {
      settings: {
        startDate: INITIAL_START_DATE,
        machineCost: 349,
        sessionValueLegs: 60,
        sessionValueTorso: 50,
        darkMode: true
      },
      logs: [],
      achievements: INITIAL_ACHIEVEMENTS,
      totalSavings: 0
    };
  });

  const [view, setView] = useState<'DASHBOARD' | 'INTEL' | 'PROFILE' | 'SETTINGS'>('DASHBOARD');
  const [sessionActive, setSessionActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [weather, setWeather] = useState<{ uv: number, temp: number } | null>(null);
  const [briefing, setBriefing] = useState<string>("Cargando briefing táctico...");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Derived State
  const rank = useMemo(() => {
    const count = state.logs.length;
    let currentRank = Rank.RECRUIT;
    (Object.keys(RANKS_THRESHOLDS) as Rank[]).forEach(r => {
      if (count >= RANKS_THRESHOLDS[r]) currentRank = r;
    });
    return currentRank;
  }, [state.logs.length]);

  const timeline = useMemo(() => {
    const start = new Date(state.settings.startDate);
    const now = new Date();
    // Reset hours to compare dates only
    const startMidnight = new Date(start); startMidnight.setHours(0,0,0,0);
    const nowMidnight = new Date(now); nowMidnight.setHours(0,0,0,0);

    const diffTime = nowMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
    const month = now.getMonth(); // 0 = Jan, 7 = Aug

    // Determine Phase
    let phase = Phase.ATTACK;
    if (weekIndex >= 12) phase = Phase.TRANSITION;
    if (weekIndex >= 24) phase = Phase.MAINTENANCE;

    // Determine Activity Status
    let isActiveWeek = true;
    let statusMessage = "OPERATIVO";
    let isShoulderWeek = false;

    if (phase === Phase.ATTACK) {
       // Shoulders: Weeks 1 (0), 4 (3), 7 (6), 10 (9). Pattern: index % 3 === 0
       isShoulderWeek = (weekIndex % 3 === 0);
    } 
    else if (phase === Phase.TRANSITION) {
       // Logic: Week 12 (Index 12) is Rest. Week 13 (Index 13) is Active.
       // Odd indices from start are active in this phase context?
       // Start date + 12 weeks.
       // Let's match user plan:
       // Mar 22 (W12): Rest. Mar 29 (W13): Fire.
       // So if weekIndex is odd (13, 15...), it's active.
       isActiveWeek = (weekIndex % 2 !== 0);
       isShoulderWeek = true; // Always included in active transition weeks
       if (!isActiveWeek) statusMessage = "SEMANA DE DESCANSO (RECUPERACIÓN)";
    } 
    else if (phase === Phase.MAINTENANCE) {
       if (month === 7) { // August
         isActiveWeek = false;
         statusMessage = "VACACIONES DE AGOSTO - ALTO EL FUEGO";
       } else {
         // Active only first week of month approx (Days 1-7)
         const dayOfMonth = now.getDate();
         isActiveWeek = (dayOfMonth <= 7);
         if (!isActiveWeek) statusMessage = "VIGILANCIA (ESPERANDO PRIMER FINDE MES)";
       }
    }

    if (diffDays < 0) {
      statusMessage = "CUENTA ATRÁS PARA OPERACIÓN";
      isActiveWeek = false;
    }

    // Determine Session Type for Today
    let nextSessionData = { date: '', zones: [] as string[], type: '' };
    
    if (!isActiveWeek) {
        nextSessionData = { date: 'EN ESPERA', zones: [], type: statusMessage };
    } else {
        if (dayOfWeek === 0) { // Sunday
            nextSessionData = { 
                date: 'HOY (DOMINGO)', 
                zones: isShoulderWeek ? [...ZONES.UPPER, ...ZONES.SHOULDER_ADDON] : ZONES.UPPER, 
                type: 'TORSO (PRECISIÓN)' 
            };
        } else if (dayOfWeek === 1) { // Monday
            nextSessionData = { 
                date: 'HOY (LUNES)', 
                zones: ZONES.LOWER, 
                type: 'PIERNAS (FUERZA BRUTA)' 
            };
        } else {
            // Future
            const daysUntilSun = (7 - dayOfWeek) % 7;
            const nextDate = new Date(now);
            nextDate.setDate(now.getDate() + daysUntilSun);
            nextSessionData = { 
                date: `DOMINGO ${nextDate.getDate()}`, 
                zones: ZONES.UPPER, 
                type: 'PRÓX: TORSO' 
            };
        }
    }

    return { phase, weekIndex, isActiveWeek, nextSessionData, statusMessage };
  }, [state.settings.startDate]);

  // Effects
  useEffect(() => {
    localStorage.setItem('ipl_elite_data_v2', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    // Geolocation & Weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const data = await fetchWeatherData(pos.coords.latitude, pos.coords.longitude);
        if (data) {
          setWeather({ uv: data.uvIndex, temp: data.temperature });
          
          // Use specific intel if available, otherwise AI
          const specificIntel = WEEKLY_INTEL[timeline.weekIndex];
          if (specificIntel) {
            setBriefing(specificIntel);
          } else {
            // Fallback to AI for generic weeks or maintenance
            const text = await getMissionBriefing(rank, timeline.phase, data.uvIndex, timeline.nextSessionData.type);
            setBriefing(text);
          }
        }
      });
    }
  }, [rank, timeline]);

  // Handlers
  const handleSessionComplete = (duration: number, zones: string[]) => {
    const newVal = zones.some(z => ZONES.LOWER.includes(z)) 
      ? state.settings.sessionValueLegs 
      : state.settings.sessionValueTorso;

    const newLog: SessionLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationSeconds: duration,
      zones,
      completed: true
    };

    // Unlock logic
    const newAchievements = [...state.achievements];
    // First Blood
    if (state.logs.length === 0) newAchievements.find(a => a.id === 'first_blood')!.unlocked = true;
    // Sniper
    if (zones.some(z => z.includes('Hombros') || z.includes('Shoulders'))) newAchievements.find(a => a.id === 'sniper')!.unlocked = true;
    // Blue Monday
    const day = new Date().getDay();
    if (day === 1 && zones.some(z => ZONES.LOWER.includes(z))) newAchievements.find(a => a.id === 'blue_monday')!.unlocked = true;

    // Endurance
    if (duration > 40 * 60) newAchievements.find(a => a.id === 'endurance')!.unlocked = true;
    // ROI
    const newSavings = state.totalSavings + newVal;
    if (newSavings >= state.settings.machineCost) newAchievements.find(a => a.id === 'roi_breached')!.unlocked = true;

    setState(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs],
      achievements: newAchievements,
      totalSavings: newSavings
    }));
    
    setSessionActive(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, `User: ${userMsg}`]);
    setChatLoading(true);
    
    const response = await chatWithIntelOfficer(userMsg, chatHistory);
    setChatHistory(prev => [...prev, `User: ${userMsg}`, `Model: ${response}`]);
    setChatLoading(false);
  };

  const resetData = () => {
    if (confirm("ZONA DE PELIGRO: ¿BORRAR TODOS LOS DATOS? ESTO NO SE PUEDE DESHACER.")) {
      localStorage.removeItem('ipl_elite_data_v2');
      window.location.reload();
    }
  };

  // Views
  if (sessionActive) {
    return (
      <SessionMode 
        onComplete={handleSessionComplete}
        onCancel={() => setSessionActive(false)}
        targetZones={timeline.nextSessionData.zones}
      />
    );
  }

  return (
    <div className="min-h-screen bg-tactical-900 text-gray-200 font-sans pb-20 selection:bg-tactical-green selection:text-black">
      {/* Top Bar */}
      <header className="fixed top-0 w-full bg-tactical-900/90 backdrop-blur border-b border-gray-800 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="text-tactical-green" size={24} />
          <span className="font-mono font-bold tracking-tighter text-lg">IPL ELITE</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 bg-black/95 z-30 p-6 flex flex-col gap-6 font-mono text-xl animate-scanline">
          <button onClick={() => { setView('DASHBOARD'); setMenuOpen(false); }} className="text-left py-4 border-b border-gray-800 hover:text-tactical-green">DASHBOARD</button>
          <button onClick={() => { setView('INTEL'); setMenuOpen(false); }} className="text-left py-4 border-b border-gray-800 hover:text-tactical-green">OFICIAL DE INTELIGENCIA (IA)</button>
          <button onClick={() => { setView('PROFILE'); setMenuOpen(false); }} className="text-left py-4 border-b border-gray-800 hover:text-tactical-green">HOJA DE SERVICIO</button>
          <button onClick={() => { setView('SETTINGS'); setMenuOpen(false); }} className="text-left py-4 border-b border-gray-800 hover:text-tactical-green">AJUSTES</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pt-20 px-4 max-w-lg mx-auto space-y-6">
        
        {view === 'DASHBOARD' && (
          <>
            {/* Status Card */}
            <div className="grid grid-cols-2 gap-4">
              <Card title="RANGO">
                <div className="text-2xl font-bold text-white">{RANK_TRANSLATIONS[rank]}</div>
                <div className="text-xs text-gray-500">{state.logs.length} MISIONES COMPLETADAS</div>
              </Card>
              <Card title="FASE">
                <div className="text-2xl font-bold text-tactical-green">{PHASE_TRANSLATIONS[timeline.phase]}</div>
                <div className="text-xs text-gray-500">SEMANA {timeline.weekIndex + 1}</div>
              </Card>
            </div>

            {/* Briefing */}
            <Card title="BRIEFING DE MISIÓN" className="border-l-4 border-l-tactical-green">
              <div className="text-sm leading-relaxed text-gray-300 mb-2 font-mono">
                {briefing}
              </div>
              {weather && (
                <div className="flex items-center gap-4 mt-3 text-xs font-mono bg-black/30 p-2 rounded">
                   <span className={`px-2 py-0.5 rounded ${weather.uv > 3 ? 'bg-red-900 text-red-200' : 'bg-emerald-900 text-emerald-200'}`}>
                     ÍNDICE UV: {weather.uv.toFixed(1)}
                   </span>
                   <span>{weather.temp}°C</span>
                </div>
              )}
            </Card>

            {/* Next Mission CTA */}
            <div className="relative group">
              {timeline.isActiveWeek && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-tactical-green to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              )}
              <button 
                onClick={() => setSessionActive(true)}
                disabled={!timeline.isActiveWeek}
                className={`relative w-full bg-tactical-800 border border-gray-700 p-6 flex items-center justify-between rounded shadow-2xl transition-all ${!timeline.isActiveWeek ? 'opacity-50 cursor-not-allowed' : 'hover:bg-tactical-700'}`}
              >
                <div className="text-left">
                  <div className="text-xs text-blue-400 font-mono mb-1">
                    {timeline.isActiveWeek ? `PRÓXIMA OPERACIÓN: ${timeline.nextSessionData.date}` : 'ESTADO DE FLOTA'}
                  </div>
                  <div className="text-xl font-bold text-white uppercase">{timeline.nextSessionData.type}</div>
                  <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{timeline.nextSessionData.zones.join(', ')}</div>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] ${timeline.isActiveWeek ? 'bg-tactical-green' : 'bg-gray-600'}`}>
                  <Activity size={24} />
                </div>
              </button>
            </div>

            {/* ROI Tracker */}
            <Card title="INTELIGENCIA FINANCIERA">
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <div className="text-gray-400 text-xs">AHORRO NETO</div>
                   <div className="text-2xl font-mono text-white">€{state.totalSavings}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-gray-400 text-xs">ESTADO ROI</div>
                   <div className={`font-bold ${state.totalSavings >= state.settings.machineCost ? 'text-tactical-green' : 'text-yellow-500'}`}>
                     {state.totalSavings >= state.settings.machineCost ? 'BENEFICIO' : 'RECUPERACIÓN'}
                   </div>
                 </div>
               </div>
               <ProgressBar 
                 value={state.totalSavings} 
                 max={state.settings.machineCost * 1.5} 
                 label={`PUNTO EQUILIBRIO: €${state.settings.machineCost}`} 
                 color={state.totalSavings >= state.settings.machineCost ? 'bg-tactical-green' : 'bg-yellow-600'}
               />
            </Card>
          </>
        )}

        {view === 'INTEL' && (
          <div className="h-[calc(100vh-8rem)] flex flex-col">
            <Card className="flex-1 flex flex-col mb-4 overflow-hidden" title="ENLACE SEGURO">
               <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-gray-600 text-sm mt-10">
                      Enlace establecido. Esperando entrada.<br/>
                      Pregunte sobre el Protocolo Domingo-Lunes.
                    </div>
                  )}
                  {chatHistory.map((msg, i) => {
                    const isUser = msg.startsWith('User:');
                    return (
                      <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded text-sm ${isUser ? 'bg-tactical-700 text-white' : 'bg-tactical-green/10 text-emerald-100 border border-tactical-green/30'}`}>
                           {msg.replace(/^(User:|Model:)\s*/, '')}
                        </div>
                      </div>
                    )
                  })}
                  {chatLoading && <div className="text-xs text-tactical-green animate-pulse">DESCIFRANDO RESPUESTA...</div>}
               </div>
            </Card>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
               <input 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Introducir consulta..."
                 className="flex-1 bg-black border border-gray-700 p-3 rounded text-white focus:border-tactical-green outline-none font-mono text-sm"
               />
               <button type="submit" className="bg-tactical-green text-black px-4 rounded font-bold">ENVIAR</button>
            </form>
          </div>
        )}

        {view === 'PROFILE' && (
          <div className="space-y-6">
             <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                <div className="w-20 h-20 bg-tactical-700 rounded-full flex items-center justify-center border-2 border-gray-600">
                  <Shield size={40} className="text-gray-400" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold">{RANK_TRANSLATIONS[rank]}</h2>
                   <p className="text-gray-400 font-mono text-xs">ID: OPS-{state.logs.length.toString().padStart(3, '0')}</p>
                </div>
             </div>

             <Card title="MEDALLAS Y CINTAS">
                <div className="grid grid-cols-4 gap-4">
                   {state.achievements.map(a => (
                     <div key={a.id} className={`aspect-square rounded flex flex-col items-center justify-center p-2 text-center border ${a.unlocked ? 'bg-tactical-green/10 border-tactical-green text-tactical-green' : 'bg-black border-gray-800 text-gray-700 grayscale'}`}>
                        <Trophy size={16} className="mb-1" />
                        <span className="text-[8px] font-mono leading-tight">{a.title}</span>
                     </div>
                   ))}
                </div>
             </Card>

             <Card title="REGISTROS RECIENTES">
               <div className="space-y-2">
                 {state.logs.slice(0, 5).map(log => (
                   <div key={log.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                      <div>
                        <div className="text-white">{new Date(log.date).toLocaleDateString('es-ES')}</div>
                        <div className="text-xs text-gray-500">{log.zones.join(', ')}</div>
                      </div>
                      <div className="font-mono text-tactical-green">
                        {Math.floor(log.durationSeconds / 60)}m
                      </div>
                   </div>
                 ))}
                 {state.logs.length === 0 && <div className="text-gray-600 text-xs italic">No hay registros de combate.</div>}
               </div>
             </Card>
          </div>
        )}

        {view === 'SETTINGS' && (
          <div className="space-y-6">
            <Card title="CONFIGURACIÓN DE OPERACIÓN">
               <label className="block mb-4">
                 <span className="text-xs text-gray-400 block mb-1">FECHA DE INICIO DE OPERACIÓN</span>
                 <input 
                   type="date" 
                   value={state.settings.startDate.split('T')[0]}
                   onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, startDate: new Date(e.target.value).toISOString() } }))}
                   className="w-full bg-black border border-gray-700 p-2 text-white font-mono rounded"
                 />
               </label>
               <div className="grid grid-cols-2 gap-4">
                 <label>
                   <span className="text-xs text-gray-400 block mb-1">COSTE DEL DISPOSITIVO (€)</span>
                   <input 
                     type="number"
                     value={state.settings.machineCost}
                     onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, machineCost: Number(e.target.value) } }))}
                     className="w-full bg-black border border-gray-700 p-2 text-white font-mono rounded"
                   />
                 </label>
                 <label>
                   <span className="text-xs text-gray-400 block mb-1">VALOR DE SESIÓN (€)</span>
                   <input 
                     type="number"
                     value={state.settings.sessionValueLegs}
                     onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, sessionValueLegs: Number(e.target.value) } }))}
                     className="w-full bg-black border border-gray-700 p-2 text-white font-mono rounded"
                   />
                 </label>
               </div>
            </Card>

            <button onClick={resetData} className="w-full border border-red-900 text-red-700 p-4 rounded flex items-center justify-center gap-2 hover:bg-red-900/20">
              <Trash2 size={16} />
              <span className="font-mono font-bold">RESTABLECER FÁBRICA</span>
            </button>
            
            <div className="text-center text-xs text-gray-700 font-mono pt-10">
              IPL TRACKER ELITE v2.5<br/>
              PROTOCOLO DOMINGO-LUNES
            </div>
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-black border-t border-gray-800 flex justify-around p-3 pb-6 z-40">
        <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center ${view === 'DASHBOARD' ? 'text-tactical-green' : 'text-gray-600'}`}>
          <Activity size={20} />
          <span className="text-[10px] mt-1 font-mono">OPS</span>
        </button>
        <button onClick={() => setView('INTEL')} className={`flex flex-col items-center ${view === 'INTEL' ? 'text-tactical-green' : 'text-gray-600'}`}>
          <MessageSquare size={20} />
          <span className="text-[10px] mt-1 font-mono">INTEL</span>
        </button>
        <button onClick={() => setView('PROFILE')} className={`flex flex-col items-center ${view === 'PROFILE' ? 'text-tactical-green' : 'text-gray-600'}`}>
          <Trophy size={20} />
          <span className="text-[10px] mt-1 font-mono">RECORD</span>
        </button>
        <button onClick={() => setView('SETTINGS')} className={`flex flex-col items-center ${view === 'SETTINGS' ? 'text-tactical-green' : 'text-gray-600'}`}>
          <Settings size={20} />
          <span className="text-[10px] mt-1 font-mono">CONFIG</span>
        </button>
      </nav>
    </div>
  );
}