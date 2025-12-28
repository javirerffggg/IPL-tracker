import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Camera, Smartphone, ArrowLeft, RefreshCw } from 'lucide-react';
import { ZONES } from '../constants';

interface SessionModeProps {
  onComplete: (duration: number, zones: string[]) => void;
  onCancel: () => void;
  targetZones: string[];
}

export const SessionMode: React.FC<SessionModeProps> = ({ onComplete, onCancel, targetZones }) => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Metronome State
  const [metronomeActive, setMetronomeActive] = useState(false);
  const metronomeRef = useRef<number | null>(null);

  // Timer
  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Metronome Logic (Haptic)
  useEffect(() => {
    if (metronomeActive && isActive) {
      metronomeRef.current = window.setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate(100); // Tactical Pulse
        }
      }, 3000); // 3 seconds pace
    } else {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    }
    return () => {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, [metronomeActive, isActive]);

  // Camera Logic
  const toggleCamera = async () => {
    if (cameraMode) {
      // Turn off
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setCameraMode(false);
    } else {
      // Turn on
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

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-mono">
      {/* HUD Header */}
      <div className="bg-tactical-900 border-b border-tactical-green/30 p-4 flex justify-between items-center text-tactical-green">
        <button onClick={onCancel} className="p-2 border border-tactical-green/50 rounded hover:bg-tactical-green/20">
          <ArrowLeft size={20} />
        </button>
        <div className="text-2xl font-bold tracking-widest animate-pulse-slow">
          {formatTime(seconds)}
        </div>
        <div className="text-xs text-emerald-700">OPS ACTIVA</div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-tactical-800 overflow-hidden flex flex-col items-center justify-center">
        {cameraMode ? (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {/* Ghost Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-50 border-2 border-red-500/30">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="red" strokeWidth="0.2" strokeDasharray="2" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="red" strokeWidth="0.2" strokeDasharray="2" />
                <rect x="25" y="25" width="50" height="50" stroke="yellow" strokeWidth="0.5" fill="none" />
              </svg>
              <div className="absolute top-4 left-4 text-red-500 text-xs bg-black/50 px-2 py-1">RECONOCIMIENTO FANTASMA ACTIVO</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6 p-6">
             <div className="text-tactical-green/60 text-sm tracking-[0.2em] uppercase mb-4 border-b border-tactical-green/30 pb-2 w-full text-center">
                Objetivos de Misión
             </div>
             <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {targetZones.map(z => (
                  <div key={z} className="bg-tactical-700/50 border-l-4 border-tactical-green p-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-200">{z}</span>
                    <div className="w-3 h-3 bg-tactical-green rounded-full animate-pulse"></div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Control Deck */}
      <div className="bg-tactical-900 border-t border-tactical-green/30 p-6 pb-10">
        <div className="grid grid-cols-4 gap-4 mb-6">
            <button 
              onClick={() => setMetronomeActive(!metronomeActive)}
              className={`flex flex-col items-center justify-center p-3 rounded border ${metronomeActive ? 'border-tactical-green bg-tactical-green/20 text-white' : 'border-gray-700 text-gray-500'}`}
            >
              <Smartphone size={24} />
              <span className="text-[10px] mt-1 uppercase">Ritmo</span>
            </button>
            <button 
              onClick={toggleCamera}
              className={`flex flex-col items-center justify-center p-3 rounded border ${cameraMode ? 'border-tactical-green bg-tactical-green/20 text-white' : 'border-gray-700 text-gray-500'}`}
            >
              <Camera size={24} />
              <span className="text-[10px] mt-1 uppercase">Fantasma</span>
            </button>
        </div>

        <div className="flex items-center justify-center gap-6">
          {!isActive && seconds === 0 ? (
             <button 
             onClick={() => setIsActive(true)}
             className="w-20 h-20 rounded-full bg-tactical-green text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition-transform"
           >
             <Play size={32} fill="currentColor" />
           </button>
          ) : isActive ? (
            <button 
              onClick={() => setIsActive(false)}
              className="w-20 h-20 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] active:scale-95 transition-transform"
            >
              <Pause size={32} fill="currentColor" />
            </button>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={() => setIsActive(true)}
                className="w-16 h-16 rounded-full bg-tactical-green text-black flex items-center justify-center"
              >
                <Play size={24} fill="currentColor" />
              </button>
              <button 
                onClick={() => onComplete(seconds, targetZones)}
                className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-blue-400"
              >
                <Square size={24} fill="currentColor" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};