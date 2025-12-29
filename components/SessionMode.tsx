import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Camera, Smartphone, ArrowLeft, ThermometerSnowflake, TriangleAlert } from 'lucide-react';

interface SessionModeProps {
  onComplete: (duration: number, zones: string[]) => void;
  onCancel: () => void;
  targetZones: string[];
  vibrationIntensity: 'LOW' | 'HIGH';
}

export const SessionMode: React.FC<SessionModeProps> = ({ onComplete, onCancel, targetZones, vibrationIntensity }) => {
  const [isActive, setIsActive] = useState(false);
  const [isPanic, setIsPanic] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [metronomeActive, setMetronomeActive] = useState(false);
  const metronomeRef = useRef<number | null>(null);

  // --- Haptic Engine ---
  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      if (vibrationIntensity === 'LOW') {
        // Reduce intensity by using shorter patterns or relying on single pulses
        const lowPattern = Array.isArray(pattern) ? pattern.map(p => Math.max(10, p / 2)) : Math.max(10, pattern / 2);
        navigator.vibrate(lowPattern);
      } else {
        navigator.vibrate(pattern);
      }
    }
  };

  useEffect(() => {
    let interval: number;
    if (isActive && !isPanic && !showAbortModal) {
      interval = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPanic, showAbortModal]);

  useEffect(() => {
    if (metronomeActive && isActive && !isPanic && !showAbortModal) {
      metronomeRef.current = window.setInterval(() => {
        vibrate(30);
      }, 3000); 
    } else {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    }
    return () => {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, [metronomeActive, isActive, isPanic, showAbortModal]);

  const toggleCamera = async () => {
    if (cameraMode) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setCameraMode(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setCameraStream(stream);
        setCameraMode(true);
      } catch (err) {
        alert("FALLO EN SENSOR ÓPTICO. PERMISO DENEGADO.");
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const handleStart = () => {
    setIsActive(true);
    vibrate(200);
  };

  const handlePause = () => {
    setIsActive(false);
    vibrate([50, 50]);
  };

  const handlePanic = () => {
    setIsPanic(true);
    setIsActive(false);
    vibrate([500, 100, 500]);
  };

  const resolvePanic = () => {
    setIsPanic(false);
  };

  const handleComplete = () => {
    vibrate([100, 50, 100, 50, 200]);
    onComplete(seconds, targetZones);
  };

  const attemptCancel = () => {
    if (seconds > 0 && !showAbortModal) {
        setShowAbortModal(true);
        setIsActive(false); // Pause timer
    } else {
        onCancel();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex justify-center">
      <div className="w-full max-w-lg h-full flex flex-col font-mono relative bg-black shadow-2xl border-x border-gray-900">
        
        {/* Abort Modal */}
        {showAbortModal && (
            <div className="absolute inset-0 z-[70] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-tactical-800 border-2 border-red-900 p-6 w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                    <TriangleAlert size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2 tracking-widest">ABORTAR MISIÓN</h3>
                    <p className="text-gray-400 text-xs mb-6 font-mono">¿CONFIRMAR RETIRADA? EL PROGRESO ACTUAL SE PERDERÁ.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setShowAbortModal(false)} className="flex-1 bg-gray-800 py-3 text-white text-xs font-bold border border-gray-600">CANCELAR</button>
                        <button onClick={onCancel} className="flex-1 bg-red-900 py-3 text-white text-xs font-bold border border-red-500 hover:bg-red-800">CONFIRMAR</button>
                    </div>
                </div>
            </div>
        )}

        {/* Panic Overlay */}
        {isPanic && (
            <div className="absolute inset-0 z-[60] bg-red-900/95 flex flex-col items-center justify-center p-8 text-center animate-pulse">
            <ThermometerSnowflake size={64} className="text-white mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">ENFRIAMIENTO ACTIVO</h2>
            <p className="text-red-100 text-lg mb-8">ALTO EL FUEGO. Aplica frío local. Respira profundamente.</p>
            <button 
                onClick={resolvePanic}
                className="bg-white text-red-900 px-8 py-4 rounded font-bold text-xl uppercase tracking-widest shadow-lg"
            >
                REANUDAR MISIÓN
            </button>
            </div>
        )}

        {/* HUD Header */}
        <div className="bg-tactical-900 border-b border-tactical-green/30 pt-safe px-4 pb-2 flex justify-between items-center text-tactical-green shrink-0">
            <button onClick={attemptCancel} className="p-2 border border-tactical-green/50 rounded hover:bg-tactical-green/20">
            <ArrowLeft size={20} />
            </button>
            <div className="text-2xl font-bold tracking-widest animate-pulse-slow font-mono">
            {formatTime(seconds)}
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-blink"></div>
                <div className="text-xs text-emerald-700 font-bold">REC</div>
            </div>
        </div>

        {/* Main Viewport (Visuals) */}
        <div className="flex-1 relative bg-tactical-800 overflow-hidden flex flex-col items-center justify-center">
            {cameraMode ? (
            <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none opacity-50 border-2 border-red-500/30">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="red" strokeWidth="0.2" strokeDasharray="2" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="red" strokeWidth="0.2" strokeDasharray="2" />
                    <rect x="25" y="25" width="50" height="50" stroke="yellow" strokeWidth="0.5" fill="none" />
                </svg>
                </div>
            </div>
            ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-4">
                <div className="grid grid-cols-1 gap-3 w-full max-w-md overflow-y-auto max-h-full pb-2">
                    {targetZones.map(z => (
                    <div key={z} className="bg-black/40 border border-tactical-green/30 p-3 flex items-center justify-between rounded-sm">
                        <span className="text-lg font-bold text-gray-200 font-mono uppercase">{z}</span>
                        <div className="w-2 h-2 bg-tactical-green rounded-full shadow-[0_0_10px_#10b981]"></div>
                    </div>
                    ))}
                </div>
            </div>
            )}
        </div>

        {/* Tactical Control Deck */}
        <div className="bg-tactical-900 border-t-2 border-tactical-green/50 p-4 pb-safe h-[45vh] flex flex-col gap-3 shrink-0 relative">
            
            {/* Tools Row */}
            <div className="flex gap-3 h-16 shrink-0">
                <button 
                    onClick={() => setMetronomeActive(!metronomeActive)}
                    className={`flex-1 flex flex-col items-center justify-center rounded border ${metronomeActive ? 'border-tactical-green bg-tactical-green/20 text-white' : 'border-gray-800 bg-gray-900 text-gray-600'}`}
                >
                    <Smartphone size={18} />
                    <span className="text-[9px] mt-1 font-mono">RITMO</span>
                </button>
                <button 
                    onClick={toggleCamera}
                    className={`flex-1 flex flex-col items-center justify-center rounded border ${cameraMode ? 'border-tactical-green bg-tactical-green/20 text-white' : 'border-gray-800 bg-gray-900 text-gray-600'}`}
                >
                    <Camera size={18} />
                    <span className="text-[9px] mt-1 font-mono">VISOR</span>
                </button>
                <button 
                    onClick={handlePanic}
                    className="flex-1 flex flex-col items-center justify-center rounded border border-red-900 bg-red-900/10 text-red-500"
                >
                    <ThermometerSnowflake size={18} />
                    <span className="text-[9px] mt-1 font-mono font-bold">PAUSA</span>
                </button>
            </div>

            {/* Main Fire Control */}
            <div className="flex-1 flex gap-4">
                {!isActive && seconds === 0 ? (
                <button 
                    onClick={handleStart}
                    className="flex-1 bg-tactical-green text-black font-black text-4xl tracking-widest rounded flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] active:bg-emerald-400 transition-colors uppercase"
                >
                    <Play size={48} className="mr-2" /> INICIAR
                </button>
                ) : isActive ? (
                    <button 
                    onClick={handlePause}
                    className="flex-1 bg-yellow-500 text-black font-black text-4xl tracking-widest rounded flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] active:bg-yellow-400 transition-colors uppercase border-4 border-black"
                    >
                    <Pause size={48} className="mr-2" /> PAUSA
                    </button>
                ) : (
                    <div className="flex-1 flex gap-3">
                    <button 
                        onClick={handleStart}
                        className="w-1/3 bg-tactical-green text-black rounded flex items-center justify-center"
                    >
                        <Play size={32} />
                    </button>
                    <button 
                        onClick={handleComplete}
                        className="flex-1 bg-blue-600 text-white font-bold text-2xl tracking-widest rounded flex items-center justify-center border-2 border-blue-400 active:scale-95 transition-transform"
                    >
                        <Square size={24} className="mr-2" /> FIN MISIÓN
                    </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};