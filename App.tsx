import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Shield, Activity, MessageSquare, Menu, X, Trophy, Trash2, Calendar as CalendarIcon, Download } from 'lucide-react';
import { INITIAL_START_DATE, INITIAL_ACHIEVEMENTS, RANKS_THRESHOLDS, ZONES, PHASE_CONFIG, RANK_TRANSLATIONS, PHASE_TRANSLATIONS, WEEKLY_INTEL } from './constants';
import { AppState, Rank, Phase, SessionLog } from './types';
import { SessionMode } from './components/SessionMode';
import { CalendarView } from './components/CalendarView';
import { BodyHeatmap } from './components/BodyHeatmap';
import { getMissionBriefing, chatWithIntelOfficer } from './services/geminiService';
import { fetchWeatherData } from './services/weatherService';

// --- Improved Components ---

// HudCard with Tactical Corners
const HudCard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`relative bg-tactical-800 border border-gray-800 p-4 ${className}`}>
    {/* Decorative Corners */}
    <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-tactical-green"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-tactical-green"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-tactical-green"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-tactical-green"></div>
    
    {title && (
      <div className="mb-3 border-b border-gray-800 pb-1">
         <h3 className="text-xs font-mono text-tactical-green uppercase tracking-widest">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

// Retro Segmented Progress Bar
const RetroProgressBar: React.FC<{ value: number; max: number; label?: string; color?: string }> = ({ value, max, label, color = 'bg-tactical-green' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const segments = 20;
  const filledSegments = Math.round((pct / 100) * segments);

  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono uppercase tracking-wider"><span>{label}</span><span>{Math.round(pct)}%</span></div>}
      <div className="flex gap-0.5 h-3">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 ${i < filledSegments ? color : 'bg-gray-800'} transition-colors duration-300`}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Long Press Button for Destructive Actions
const LongPressButton: React.FC<{ onLongPress: () => void; label: string; icon: React.ReactNode, className?: string }> = ({ onLongPress, label, icon, className }) => {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startPress = () => {
    setPressing(true);
    setProgress(0);
    intervalRef.current = window.setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onLongPress();
          return 100;
        }
        return p + 2; // Speed
      });
    }, 20);
  };

  const endPress = () => {
    setPressing(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <button 
      onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
      onTouchStart={startPress} onTouchEnd={endPress}
      className={`relative overflow-hidden active:scale-95 transition-transform select-none ${className}`}
    >
      <div className="absolute inset-0 bg-red-900/30" style={{ width: `${progress}%` }}></div>
      <div className="relative z-10 flex items-center justify-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </button>
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
        darkMode: true,
        vibrationIntensity: 'HIGH'
      },
      logs: [],
      achievements: INITIAL_ACHIEVEMENTS,
      totalSavings: 0
    };
  });

  const [view, setView] = useState<'DASHBOARD' | 'INTEL' | 'PROFILE' | 'SETTINGS' | 'PLAN'>('DASHBOARD');
  const [sessionActive, setSessionActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [weather, setWeather] = useState<{ uv: number, temp: number } | null>(null);
  const [briefing, setBriefing] = useState<string>("Cargando briefing táctico...");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Swipe Logic Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Notifications Request on Mount & PWA Install Listener
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const sendNotification = (title: string, body: string) => {
      if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: '/icon.png' });
      }
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
  };

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
    const startMidnight = new Date(start); startMidnight.setHours(0,0,0,0);
    const nowMidnight = new Date(now); nowMidnight.setHours(0,0,0,0);

    const diffTime = nowMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    const dayOfWeek = now.getDay();
    const month = now.getMonth();

    let phase = Phase.ATTACK;
    if (weekIndex >= 12) phase = Phase.TRANSITION;
    if (weekIndex >= 24) phase = Phase.MAINTENANCE;

    let isActiveWeek = true;
    let statusMessage = "OPERATIVO";
    let isShoulderWeek = false;

    if (phase === Phase.ATTACK) {
       isShoulderWeek = (weekIndex % 3 === 0);
    } 
    else if (phase === Phase.TRANSITION) {
       isActiveWeek = (weekIndex % 2 !== 0);
       isShoulderWeek = true;
       if (!isActiveWeek) statusMessage = "SEMANA DE DESCANSO";
    } 
    else if (phase === Phase.MAINTENANCE) {
       if (month === 7) { 
         isActiveWeek = false;
         statusMessage = "VACACIONES DE AGOSTO";
       } else {
         const dayOfMonth = now.getDate();
         isActiveWeek = (dayOfMonth <= 7);
         if (!isActiveWeek) statusMessage = "EN ESPERA (MANTENIMIENTO)";
       }
    }

    if (diffDays < 0) {
      statusMessage = "PRE-OPERATIVO";
      isActiveWeek = false;
    }

    let nextSessionData = { date: '', zones: [] as string[], type: '' };
    
    if (!isActiveWeek) {
        nextSessionData = { date: 'EN ESPERA', zones: [], type: statusMessage };
    } else {
        if (dayOfWeek === 0) {
            nextSessionData = { date: 'HOY (DOMINGO)', zones: isShoulderWeek ? [...ZONES.UPPER, ...ZONES.SHOULDER_ADDON] : ZONES.UPPER, type: 'TORSO' };
        } else if (dayOfWeek === 1) {
            nextSessionData = { date: 'HOY (LUNES)', zones: ZONES.LOWER, type: 'PIERNAS' };
        } else {
            const daysUntilSun = (7 - dayOfWeek) % 7;
            const nextDate = new Date(now);
            nextDate.setDate(now.getDate() + daysUntilSun);
            nextSessionData = { date: `DOMINGO ${nextDate.getDate()}`, zones: ZONES.UPPER, type: 'PRÓX: TORSO' };
        }
    }

    return { phase, weekIndex, isActiveWeek, nextSessionData, statusMessage };
  }, [state.settings.startDate]);

  // Streak & Greeting
  const streak = useMemo(() => {
    if (state.logs.length === 0) return 0;
    // Simple logic: check continuity of weekly/bi-weekly plans is complex.
    // Instead, just "Days since last op" for display
    const lastLog = new Date(state.logs[0].date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastLog.getTime()) / (1000*3600*24));
    return diff;
  }, [state.logs]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "BUENOS DÍAS, COMANDANTE";
    if (h < 20) return "BUENAS TARDES, COMANDANTE";
    return "TURNO DE NOCHE, COMANDANTE";
  }, []);

  // Effects
  useEffect(() => {
    localStorage.setItem('ipl_elite_data_v2', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const data = await fetchWeatherData(pos.coords.latitude, pos.coords.longitude);
        if (data) {
          setWeather({ uv: data.uvIndex, temp: data.temperature });
          const specificIntel = WEEKLY_INTEL[timeline.weekIndex];
          if (specificIntel) {
            setBriefing(specificIntel);
          } else {
            const text = await getMissionBriefing(rank, timeline.phase, data.uvIndex, timeline.nextSessionData.type);
            setBriefing(text);
          }
        }
      });
    }
  }, [rank, timeline, state.logs]);

  // Handlers
  const handleSessionComplete = (duration: number, zones: string[]) => {
    const newVal = zones.some(z => ZONES.LOWER.includes(z)) ? state.settings.sessionValueLegs : state.settings.sessionValueTorso;
    const newLog: SessionLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationSeconds: duration,
      zones,
      completed: true,
      uvIndex: weather?.uvIndex
    };

    const newAchievements = [...state.achievements];
    if (state.logs.length === 0) newAchievements.find(a => a.id === 'first_blood')!.unlocked = true;
    if (zones.some(z => z.includes('Hombros') || z.includes('Shoulders'))) newAchievements.find(a => a.id === 'sniper')!.unlocked = true;
    if (new Date().getDay() === 1 && zones.some(z => ZONES.LOWER.includes(z))) newAchievements.find(a => a.id === 'blue_monday')!.unlocked = true;
    if (duration > 40 * 60) newAchievements.find(a => a.id === 'endurance')!.unlocked = true;
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
    localStorage.removeItem('ipl_elite_data_v2');
    window.location.reload();
  };

  // Swipe Navigation
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const views: Array<'DASHBOARD' | 'PLAN' | 'INTEL' | 'PROFILE' | 'SETTINGS'> = ['DASHBOARD', 'PLAN', 'INTEL', 'PROFILE', 'SETTINGS'];
    const currentIdx = views.indexOf(view);
    
    if (Math.abs(diff) > 50) { // Threshold
        if (diff > 0 && currentIdx < views.length - 1) {
            setView(views[currentIdx + 1]);
        } else if (diff < 0 && currentIdx > 0) {
            setView(views[currentIdx - 1]);
        }
    }
  };

  // Views
  if (sessionActive) {
    return (
      <SessionMode 
        onComplete={handleSessionComplete}
        onCancel={() => setSessionActive(false)}
        targetZones={timeline.nextSessionData.zones}
        vibrationIntensity={state.settings.vibrationIntensity || 'HIGH'}
      />
    );
  }

  return (
    <div 
        className="min-h-screen font-sans pb-24 selection:bg-tactical-green selection:text-black pt-safe"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar - Now Relative/Normal Flow to scroll away */}
      <header className="w-full bg-tactical-900/90 backdrop-blur border-b border-gray-800 px-4 py-3 pt-safe">
        <div className="max-w-lg mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-tactical-green" size={24} />
            <div>
                <span className="font-mono font-bold tracking-tighter text-lg block leading-none">IPL ELITE</span>
                <span className="text-[9px] text-gray-500 font-mono tracking-widest">SYS.ONLINE</span>
            </div>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 bg-black/95 z-30 p-6 flex flex-col gap-6 font-mono text-xl animate-scanline pt-20">
          {['DASHBOARD', 'PLAN', 'INTEL', 'PROFILE', 'SETTINGS'].map((v) => (
             <button key={v} onClick={() => { setView(v as any); setMenuOpen(false); }} className={`text-left py-4 border-b border-gray-800 hover:text-tactical-green ${view === v ? 'text-tactical-green pl-4 border-l-4 border-l-tactical-green' : 'text-gray-400'}`}>
                {v}
             </button>
          ))}
        </div>
      )}

      {/* Main Content Area - Centered Container */}
      <main className="pt-4 px-4 max-w-lg mx-auto space-y-6">
        
        {/* Greeting Banner */}
        {view === 'DASHBOARD' && (
            <div className="text-[10px] font-mono text-tactical-green/60 text-center tracking-[0.2em] mb-2 border-b border-tactical-green/20 pb-2">
                {greeting}
            </div>
        )}

        {view === 'DASHBOARD' && (
          <>
            {/* Status Card */}
            <div className="grid grid-cols-2 gap-4">
              <HudCard title="RANGO">
                <div className="text-2xl font-bold text-white font-mono">{RANK_TRANSLATIONS[rank]}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">{state.logs.length} MISIONES</div>
              </HudCard>
              <HudCard title="FASE">
                <div className="text-xl font-bold text-tactical-green font-mono">{timeline.phase}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">SEMANA {timeline.weekIndex + 1}</div>
              </HudCard>
            </div>

            {/* Streak Counter */}
             <div className="bg-black border border-gray-800 p-2 flex justify-between items-center rounded-sm">
                 <span className="text-xs text-gray-500 font-mono px-2">ULTIMA OPS:</span>
                 <span className="font-mono text-red-500 font-bold bg-red-900/10 px-2 py-1 rounded text-sm tracking-widest">
                     {streak} DÍAS ATRÁS
                 </span>
             </div>

            {/* Briefing */}
            <HudCard title="BRIEFING" className="border-l-4 border-l-tactical-green">
              <div className="text-sm leading-relaxed text-gray-300 mb-2 font-mono">
                {briefing}
              </div>
              {weather && (
                <div className="flex items-center gap-4 mt-3 text-xs font-mono bg-black/50 p-2 border border-gray-700">
                   <span className={`px-2 py-0.5 rounded ${weather.uv > 3 ? 'bg-red-900 text-red-200' : 'bg-emerald-900 text-emerald-200'}`}>
                     UV: {weather.uv.toFixed(1)}
                   </span>
                   <span>TEMP: {weather.temp}°C</span>
                </div>
              )}
            </HudCard>

            {/* Next Mission CTA */}
            <div className="relative group">
              {timeline.isActiveWeek && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-tactical-green to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              )}
              <button 
                onClick={() => setSessionActive(true)}
                disabled={!timeline.isActiveWeek}
                className={`relative w-full bg-tactical-800 border border-gray-700 p-6 flex items-center justify-between rounded shadow-2xl transition-all ${!timeline.isActiveWeek ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-tactical-700'}`}
              >
                <div className="text-left">
                  <div className="text-xs text-blue-400 font-mono mb-1 tracking-widest">
                    {timeline.isActiveWeek ? `PRÓXIMA OPERACIÓN: ${timeline.nextSessionData.date}` : 'ESTADO DE FLOTA'}
                  </div>
                  <div className="text-2xl font-bold text-white uppercase font-mono">{timeline.nextSessionData.type}</div>
                  <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{timeline.nextSessionData.zones.join(', ')}</div>
                </div>
                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] ${timeline.isActiveWeek ? 'bg-tactical-green' : 'bg-gray-600'}`}>
                  <Activity size={28} />
                </div>
              </button>
            </div>

            {/* ROI Tracker */}
            <HudCard title="INTELIGENCIA FINANCIERA">
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <div className="text-gray-500 text-[10px] font-mono uppercase">AHORRO NETO</div>
                   <div className="text-3xl font-mono text-white tracking-tighter">€{state.totalSavings}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-gray-500 text-[10px] font-mono uppercase">ESTADO</div>
                   <div className={`font-bold font-mono ${state.totalSavings >= state.settings.machineCost ? 'text-tactical-green' : 'text-yellow-500'}`}>
                     {state.totalSavings >= state.settings.machineCost ? 'PROFIT' : 'DEBT'}
                   </div>
                 </div>
               </div>
               <RetroProgressBar 
                 value={state.totalSavings} 
                 max={state.settings.machineCost * 1.2} 
                 label="AMORTIZACIÓN" 
                 color={state.totalSavings >= state.settings.machineCost ? 'bg-tactical-green' : 'bg-yellow-600'}
               />
            </HudCard>
          </>
        )}

        {view === 'PLAN' && (
          <div className="space-y-6">
            <HudCard title="PLAN MAESTRO">
              <CalendarView startDate={state.settings.startDate} logs={state.logs} />
            </HudCard>
            <div className="text-xs text-gray-500 font-mono p-2 border-l-2 border-tactical-green pl-4">
                PROTOCOLO ACTIVO: {PHASE_TRANSLATIONS[timeline.phase]}
            </div>
          </div>
        )}

        {view === 'INTEL' && (
          <div className="h-[calc(100vh-10rem)] flex flex-col">
            <HudCard className="flex-1 flex flex-col mb-4 overflow-hidden" title="CANAL ENCRIPTADO">
               <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-gray-600 text-xs font-mono mt-10">
                      // ENLACE ESTABLECIDO<br/>
                      // ESPERANDO ENTRADA DE TEXTO...
                    </div>
                  )}
                  {chatHistory.map((msg, i) => {
                    const isUser = msg.startsWith('User:');
                    return (
                      <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-sm text-sm font-mono border ${isUser ? 'bg-tactical-800 text-white border-gray-600' : 'bg-tactical-green/10 text-emerald-100 border-tactical-green/30'}`}>
                           <span className="text-[10px] opacity-50 block mb-1">{isUser ? 'CMD' : 'INTEL'} &gt;&gt;</span>
                           {msg.replace(/^(User:|Model:)\s*/, '')}
                        </div>
                      </div>
                    )
                  })}
                  {chatLoading && <div className="text-xs text-tactical-green animate-pulse font-mono">RECIBIENDO TRANSMISIÓN...</div>}
               </div>
            </HudCard>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
               <input 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="COMANDO..."
                 className="flex-1 bg-black border border-gray-700 p-4 text-white focus:border-tactical-green outline-none font-mono text-sm"
               />
               <button type="submit" className="bg-tactical-green text-black px-6 font-bold font-mono hover:bg-emerald-400">TX</button>
            </form>
          </div>
        )}

        {view === 'PROFILE' && (
          <div className="space-y-6">
             <div className="flex items-center gap-6 border-b border-gray-800 pb-6">
                <div className="w-24 h-24 bg-tactical-800 rounded-sm flex items-center justify-center border border-gray-700 shadow-lg">
                  <Shield size={48} className="text-gray-500" />
                </div>
                <div>
                   <h2 className="text-3xl font-bold font-mono tracking-tighter text-white">{RANK_TRANSLATIONS[rank]}</h2>
                   <p className="text-gray-500 font-mono text-xs mt-1">ID: OPS-{state.logs.length.toString().padStart(3, '0')}</p>
                </div>
             </div>
             
             <BodyHeatmap logs={state.logs} />

             <HudCard title="CONDECORACIONES">
                <div className="grid grid-cols-4 gap-3">
                   {state.achievements.map(a => (
                     <div key={a.id} className={`aspect-square rounded-sm flex flex-col items-center justify-center p-1 text-center border ${a.unlocked ? 'bg-tactical-green/10 border-tactical-green text-tactical-green' : 'bg-black border-gray-800 text-gray-800'}`}>
                        <Trophy size={18} className="mb-1" />
                        <span className="text-[7px] font-mono leading-tight uppercase">{a.title}</span>
                     </div>
                   ))}
                </div>
             </HudCard>

             <HudCard title="LOGS DE MISIÓN">
               <div className="space-y-2">
                 {state.logs.slice(0, 5).map(log => (
                   <div key={log.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0 font-mono">
                      <div>
                        <div className="text-white">{new Date(log.date).toLocaleDateString('es-ES', {month:'short', day:'numeric'})}</div>
                        <div className="text-[10px] text-gray-500 uppercase">
                          {log.zones[0]} {log.zones.length > 1 && `+${log.zones.length - 1}`}
                          {log.uvIndex !== undefined && <span className="ml-2 text-blue-500">[UV:{log.uvIndex}]</span>}
                        </div>
                      </div>
                      <div className="text-tactical-green">
                        {Math.floor(log.durationSeconds / 60)}m
                      </div>
                   </div>
                 ))}
                 {state.logs.length === 0 && <div className="text-gray-600 text-xs italic">SIN DATOS</div>}
               </div>
             </HudCard>
          </div>
        )}

        {view === 'SETTINGS' && (
          <div className="space-y-8">
            <HudCard title="PARAMETROS DE MISIÓN">
               <label className="block mb-6">
                 <span className="text-xs text-gray-500 font-mono block mb-2 uppercase">Inicio de Operación</span>
                 <input 
                   type="date" 
                   value={state.settings.startDate.split('T')[0]}
                   onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, startDate: new Date(e.target.value).toISOString() } }))}
                   className="w-full bg-black border border-gray-700 p-3 text-white font-mono rounded-sm focus:border-tactical-green outline-none"
                 />
               </label>
               <div className="grid grid-cols-2 gap-4">
                 <label>
                   <span className="text-xs text-gray-500 font-mono block mb-2 uppercase">Coste Equipo (€)</span>
                   <input 
                     type="number"
                     value={state.settings.machineCost}
                     onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, machineCost: Number(e.target.value) } }))}
                     className="w-full bg-black border border-gray-700 p-3 text-white font-mono rounded-sm"
                   />
                 </label>
                 <label>
                   <span className="text-xs text-gray-500 font-mono block mb-2 uppercase">Valor Sesión (€)</span>
                   <input 
                     type="number"
                     value={state.settings.sessionValueLegs}
                     onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, sessionValueLegs: Number(e.target.value) } }))}
                     className="w-full bg-black border border-gray-700 p-3 text-white font-mono rounded-sm"
                   />
                 </label>
               </div>
            </HudCard>

            <HudCard title="SISTEMA">
                <label className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 font-mono uppercase">Intensidad Haptica</span>
                    <select 
                        value={state.settings.vibrationIntensity || 'HIGH'}
                        onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, vibrationIntensity: e.target.value as 'LOW' | 'HIGH' } }))}
                        className="bg-black border border-gray-700 text-white font-mono text-xs p-2 rounded-sm"
                    >
                        <option value="HIGH">TACTICO (FUERTE)</option>
                        <option value="LOW">SIGILO (SUAVE)</option>
                    </select>
                </label>
            </HudCard>

            {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className="w-full border border-tactical-green bg-tactical-green/10 text-tactical-green p-4 flex items-center justify-center font-bold font-mono tracking-widest hover:bg-tactical-green/20"
              >
                <Download size={16} className="mr-2"/> INSTALAR APP TÁCTICA
              </button>
            )}

            <LongPressButton 
                label="RESET DE FÁBRICA" 
                icon={<Trash2 size={16} />} 
                onLongPress={resetData}
                className="w-full border border-red-900 bg-red-900/10 text-red-500 p-4 flex items-center justify-center font-bold font-mono tracking-widest hover:bg-red-900/20"
            />
            
            <div className="text-center text-[10px] text-gray-800 font-mono pt-4">
              IPL TRACKER ELITE v3.0<br/>
              PROTOCOLO DOMINGO-LUNES
            </div>
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-black border-t border-gray-800 pb-safe z-40 bg-opacity-95 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex justify-around p-2">
          {[
              { id: 'DASHBOARD', icon: Activity, label: 'OPS' },
              { id: 'PLAN', icon: CalendarIcon, label: 'PLAN' },
              { id: 'INTEL', icon: MessageSquare, label: 'INTEL' },
              { id: 'PROFILE', icon: Trophy, label: 'RECORD' },
              { id: 'SETTINGS', icon: Settings, label: 'CONF' },
          ].map((item) => (
              <button 
                  key={item.id}
                  onClick={() => setView(item.id as any)} 
                  className={`flex flex-col items-center p-2 rounded transition-colors ${view === item.id ? 'text-tactical-green' : 'text-gray-600'}`}
              >
                  <item.icon size={20} strokeWidth={view === item.id ? 2.5 : 1.5} />
                  <span className="text-[9px] mt-1 font-mono tracking-wider">{item.label}</span>
              </button>
          ))}
        </div>
      </nav>
    </div>
  );
}