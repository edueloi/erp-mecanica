import React from 'react';
import { motion } from 'motion/react';

interface FuelLevelProps {
  value: string; // EMPTY, RESERVE, 1/4, 1/2, 3/4, FULL
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const LEVELS = [
  { id: 'EMPTY',   label: 'E',  angle: 180 },
  { id: 'RESERVE', label: 'R',  angle: 144 },
  { id: '1/4',     label: '¼',  angle: 108 },
  { id: '1/2',     label: '½',  angle:  72 },
  { id: '3/4',     label: '¾',  angle:  36 },
  { id: 'FULL',    label: 'F',  angle:   0 },
];

const CX = 150;
const CY = 148;

function pt(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

function tickColor(tickAngle: number, needleAngle: number): string {
  const active = tickAngle >= needleAngle; // filled from 180 down to needle
  if (!active) return '#334155';
  if (tickAngle >= 144) return '#ef4444'; // E zone – red
  if (tickAngle >= 72)  return '#f59e0b'; // R–½  – amber
  return '#22c55e';                        // ½–F  – green
}

function levelColor(id: string) {
  if (id === 'EMPTY')   return '#ef4444';
  if (id === 'RESERVE') return '#f97316';
  if (id === '1/4')     return '#f59e0b';
  if (id === '1/2')     return '#84cc16';
  return '#22c55e';
}

function levelLabel(id: string) {
  if (id === 'EMPTY')   return 'Tanque Vazio';
  if (id === 'RESERVE') return 'Reserva';
  if (id === '1/4')     return 'Quarto do Tanque';
  if (id === '1/2')     return 'Meio Tanque';
  if (id === '3/4')     return 'Três Quartos';
  return 'Tanque Cheio';
}

// Number of tick steps across 180°
const TOTAL_STEPS = 60;

export default function FuelLevel({ value, onChange, readOnly }: FuelLevelProps) {
  const currentIdx = LEVELS.findIndex(l => l.id === value);
  const current    = LEVELS[Math.max(0, currentIdx)];
  const needleAngle = current.angle;
  const color = levelColor(value);

  // Needle geometry
  const R_NEEDLE_TIP  = 88;
  const R_NEEDLE_BACK = 18;
  const tipPt    = pt(needleAngle, R_NEEDLE_TIP);
  const backPt   = pt(needleAngle + 180, R_NEEDLE_BACK);
  const leftPt   = pt(needleAngle + 90,  6);
  const rightPt  = pt(needleAngle - 90,  6);

  return (
    <div className="w-full">
      <div className="relative bg-slate-950 rounded-3xl px-4 pt-4 pb-3 shadow-2xl border border-slate-800 overflow-hidden select-none">
        {/* Ambient glow */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-16 blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: color }}
        />

        <svg viewBox="0 0 300 175" className="w-full" style={{ maxHeight: 175 }}>

          {/* ── Outer dashed decorative ring ── */}
          {Array.from({ length: 80 }).map((_, i) => {
            const a = 180 - (i / 79) * 180;
            const o = pt(a, 128);
            const ii = pt(a, 124);
            return (
              <line key={`dash-${i}`}
                x1={o.x} y1={o.y} x2={ii.x} y2={ii.y}
                stroke={i % 2 === 0 ? '#1e293b' : 'transparent'}
                strokeWidth={2} strokeLinecap="round"
              />
            );
          })}

          {/* ── Tick marks ── */}
          {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => {
            const a = 180 - (i / TOTAL_STEPS) * 180;
            const isLevel = LEVELS.some(l => l.angle === Math.round(a));
            const isMid   = !isLevel && i % 10 === 5;
            const tickLen = isLevel ? 20 : isMid ? 13 : 8;
            const rOuter = 118;
            const rInner = rOuter - tickLen;
            const o = pt(a, rOuter);
            const inn = pt(a, rInner);
            const stroke = tickColor(a, needleAngle);
            return (
              <line key={`tick-${i}`}
                x1={o.x} y1={o.y} x2={inn.x} y2={inn.y}
                stroke={stroke}
                strokeWidth={isLevel ? 2.5 : isMid ? 1.8 : 1.2}
                strokeLinecap="round"
              />
            );
          })}

          {/* ── Arc background strip ── */}
          {(() => {
            const segs: React.ReactNode[] = [];
            const steps = 120;
            for (let i = 0; i < steps; i++) {
              const a1 = 180 - (i / steps) * 180;
              const a2 = 180 - ((i + 1) / steps) * 180;
              const p1 = pt(a1, 98);
              const p2 = pt(a2, 98);
              const stroke = tickColor(a1, needleAngle);
              segs.push(
                <line key={`arc-${i}`}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={stroke} strokeWidth={6} strokeLinecap="round"
                  opacity={0.25}
                />
              );
            }
            return segs;
          })()}

          {/* ── Needle ── */}
          <motion.polygon
            points={`${tipPt.x},${tipPt.y} ${leftPt.x},${leftPt.y} ${backPt.x},${backPt.y} ${rightPt.x},${rightPt.y}`}
            fill={color}
            filter={`drop-shadow(0 0 6px ${color})`}
            initial={false}
            animate={{ fill: color }}
            transition={{ duration: 0.5 }}
          />

          {/* ── Pivot cap ── */}
          <circle cx={CX} cy={CY} r={10} fill="#0f172a" stroke={color} strokeWidth={2.5} />
          <circle cx={CX} cy={CY} r={4}  fill={color} />

          {/* ── Level labels at major ticks ── */}
          {LEVELS.map(lvl => {
            const pos = pt(lvl.angle, 136);
            const isActive = LEVELS.findIndex(l => l.id === lvl.id) <= currentIdx;
            return (
              <text key={lvl.id}
                x={pos.x} y={pos.y + 4}
                textAnchor="middle" fontSize="10" fontWeight="900"
                fill={isActive ? tickColor(lvl.angle, needleAngle) : '#334155'}
                style={{ cursor: readOnly ? 'default' : 'pointer', fontFamily: 'system-ui' }}
                onClick={() => !readOnly && onChange?.(lvl.id)}
              >
                {lvl.label}
              </text>
            );
          })}

          {/* ── E / F labels ── */}
          <text x="16" y={CY + 8} fontSize="14" fontWeight="900" fill="#ef4444"  textAnchor="middle" style={{ fontFamily: 'system-ui' }}>E</text>
          <text x="284" y={CY + 8} fontSize="14" fontWeight="900" fill="#22c55e" textAnchor="middle" style={{ fontFamily: 'system-ui' }}>F</text>

          {/* ── Fuel pump icon ── */}
          <g transform={`translate(${CX + 22}, ${CY + 4})`} opacity="0.45">
            <rect x="0" y="-10" width="10" height="14" rx="1.5" fill="white" />
            <rect x="1.5" y="-8.5" width="7" height="5.5" rx="1" fill="#0f172a" />
            <rect x="10" y="-8" width="4" height="8" rx="1" fill="white" />
            <line x1="10" y1="-5" x2="14" y2="-5" stroke="white" strokeWidth="1.5" />
          </g>

        </svg>

        {/* ── Clickable level buttons ── */}
        {!readOnly && (
          <div className="flex gap-1 mt-1 px-1">
            {LEVELS.map(lvl => {
              const isSelected = lvl.id === value;
              const btnColor = levelColor(lvl.id);
              return (
                <button key={lvl.id} onClick={() => onChange?.(lvl.id)}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black transition-all border"
                  style={{
                    backgroundColor: isSelected ? btnColor : 'transparent',
                    borderColor: isSelected ? btnColor : '#1e293b',
                    color: isSelected ? '#fff' : '#475569',
                    boxShadow: isSelected ? `0 0 10px ${btnColor}55` : 'none',
                  }}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Status label ── */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>
            {levelLabel(value)}
          </span>
        </div>
      </div>
    </div>
  );
}
