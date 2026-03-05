import React from 'react';
import { motion } from 'motion/react';

interface FuelLevelProps {
  value: string; // EMPTY, RESERVE, 1/4, 1/2, 3/4, FULL
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const LEVELS = [
  { id: 'EMPTY', label: 'E', color: '#ef4444' },
  { id: 'RESERVE', label: 'R', color: '#f59e0b' },
  { id: '1/4', label: '1/4', color: '#f59e0b' },
  { id: '1/2', label: '1/2', color: '#10b981' },
  { id: '3/4', label: '3/4', color: '#10b981' },
  { id: 'FULL', label: 'F', color: '#10b981' },
];

export default function FuelLevel({ value, onChange, readOnly }: FuelLevelProps) {
  const currentIndex = LEVELS.findIndex(l => l.id === value);

  return (
    <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden border-4 border-slate-800">
      {/* Dashboard glow */}
      <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
      
      <div className="relative flex flex-col items-center">
        <div className="w-full flex justify-between items-end h-20 px-2">
          {LEVELS.map((level, idx) => {
            const isActive = idx <= currentIndex;
            const isTarget = idx === currentIndex;
            
            return (
              <button
                key={level.id}
                disabled={readOnly}
                onClick={() => onChange?.(level.id)}
                className="flex flex-col items-center gap-3 group relative cursor-pointer disabled:cursor-default"
                style={{ width: `${100 / LEVELS.length}%` }}
              >
                {/* Tick */}
                <div className={`w-1 h-3 rounded-full transition-all ${isActive ? 'bg-white' : 'bg-slate-700'}`} />
                
                {/* Level Bar Segment */}
                <div className="w-full h-8 px-1">
                  <motion.div 
                    animate={{ 
                      backgroundColor: isActive ? level.color : '#1e293b',
                      boxShadow: isTarget ? `0 0 15px ${level.color}` : 'none'
                    }}
                    className={`w-full h-full rounded-md transition-all ${isTarget ? 'scale-y-110' : ''}`}
                  />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-black transition-all ${isActive ? 'text-white' : 'text-slate-600'}`}>
                  {level.label}
                </span>

                {/* Needle Indicator */}
                {isTarget && (
                  <motion.div 
                    layoutId="needle"
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
                    initial={false}
                  >
                     <div className="w-4 h-4 bg-white rounded-full border-4 border-slate-900 shadow-xl" />
                     <div className="w-1 h-8 bg-white" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* Gauge Background Curve */}
        <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
           <motion.div 
             animate={{ width: `${((currentIndex + 1) / LEVELS.length) * 100}%`, backgroundColor: LEVELS[currentIndex]?.color || '#1e293b' }}
             className="h-full transition-all duration-500"
           />
        </div>

        <div className="mt-8 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fuel Indicator System</span>
        </div>
      </div>
    </div>
  );
}
