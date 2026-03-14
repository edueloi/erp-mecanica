import React from 'react';
import { motion } from 'motion/react';

interface FuelLevelProps {
  value: string; // EMPTY, RESERVE, 1/4, 1/2, 3/4, FULL
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const LEVELS = [
  { id: 'EMPTY',   label: 'E',   angle: 180 },
  { id: 'RESERVE', label: 'R',   angle: 144 },
  { id: '1/4',     label: '¼',   angle: 108 },
  { id: '1/2',     label: '½',   angle:  72 },
  { id: '3/4',     label: '¾',   angle:  36 },
  { id: 'FULL',    label: 'F',   angle:   0 },
];

// Center and radius of the semicircle
const CX = 150;
const CY = 138;
const R_OUTER = 108;
const R_INNER = 72;
const R_TICK_OUTER = 118;
const R_TICK_INNER = 96;
const R_LABEL = 132;

function toPoint(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CY - r * Math.sin(rad),
  };
}

function describeArc(startAngle: number, endAngle: number, r: number, innerR: number) {
  // startAngle > endAngle (e.g. 180 → 0) going clockwise in math = counterclockwise in SVG (Y-down)
  // We want arcs to travel through the TOP of the semicircle: use sweep-flag=0 on outer, 1 on inner return
  const s = toPoint(startAngle, r);
  const e = toPoint(endAngle, r);
  const si = toPoint(startAngle, innerR);
  const ei = toPoint(endAngle, innerR);
  // For arcs spanning ≤180° going from high angle to low angle through the top,
  // large-arc-flag = 0 always (we never span more than 180° in one segment)
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 0 0 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${innerR} ${innerR} 0 0 1 ${si.x} ${si.y}`,
    'Z',
  ].join(' ');
}

function describeFullSemiArc(r: number, innerR: number) {
  // Full 180° semicircle from left (180°) to right (0°) through top
  // Need two arcs because a single 180° arc is ambiguous (large=0 or 1 both work)
  const leftOuter = toPoint(180, r);
  const topOuter = toPoint(90, r);
  const rightOuter = toPoint(0, r);
  const leftInner = toPoint(180, innerR);
  const topInner = toPoint(90, innerR);
  const rightInner = toPoint(0, innerR);
  return [
    `M ${leftOuter.x} ${leftOuter.y}`,
    `A ${r} ${r} 0 0 0 ${topOuter.x} ${topOuter.y}`,
    `A ${r} ${r} 0 0 0 ${rightOuter.x} ${rightOuter.y}`,
    `L ${rightInner.x} ${rightInner.y}`,
    `A ${innerR} ${innerR} 0 0 1 ${topInner.x} ${topInner.y}`,
    `A ${innerR} ${innerR} 0 0 1 ${leftInner.x} ${leftInner.y}`,
    'Z',
  ].join(' ');
}

// Zone colors
const ZONE_SEGMENTS = [
  { from: 180, to: 144, color: '#ef4444' }, // E → R  (red)
  { from: 144, to:  72, color: '#f59e0b' }, // R → ½  (amber)
  { from:  72, to:   0, color: '#22c55e' }, // ½ → F  (green)
];

function levelColor(id: string) {
  if (id === 'EMPTY') return '#ef4444';
  if (id === 'RESERVE') return '#f97316';
  if (id === '1/4') return '#f59e0b';
  if (id === '1/2') return '#84cc16';
  return '#22c55e';
}

export default function FuelLevel({ value, onChange, readOnly }: FuelLevelProps) {
  const currentIdx = LEVELS.findIndex(l => l.id === value);
  const current = LEVELS[currentIdx] ?? LEVELS[0];
  const needleAngle = current.angle;
  const color = levelColor(value);

  // Needle tip and base
  const tip = toPoint(needleAngle, R_INNER - 6);
  const baseL = toPoint(needleAngle + 90, 7);
  const baseR = toPoint(needleAngle - 90, 7);

  return (
    <div className="w-full">
      {/* Gauge card */}
      <div className="relative bg-slate-950 rounded-3xl p-4 pb-3 shadow-2xl border border-slate-800 overflow-hidden select-none">
        {/* Ambient glow behind gauge */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 blur-3xl opacity-30 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: color }}
        />

        <svg
          viewBox="0 0 300 160"
          className="w-full"
          style={{ maxHeight: 160 }}
        >
          {/* ── Background ring ── */}
          <path
            d={describeFullSemiArc(R_OUTER, R_INNER)}
            fill="#1e293b"
          />

          {/* ── Colored zone segments ── */}
          {ZONE_SEGMENTS.map((seg, i) => (
            <path
              key={i}
              d={describeArc(seg.from, seg.to, R_OUTER, R_INNER)}
              fill={seg.color}
              opacity={0.18}
            />
          ))}

          {/* ── Active fill arc (from EMPTY to current level) ── */}
          {currentIdx > 0 && (
            <motion.path
              d={needleAngle === 0
                ? describeFullSemiArc(R_OUTER, R_INNER)
                : describeArc(180, needleAngle, R_OUTER, R_INNER)}
              fill={color}
              opacity={0.55}
              initial={false}
              animate={{ opacity: 0.55 }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* ── Tick marks ── */}
          {LEVELS.map((lvl) => {
            const o = toPoint(lvl.angle, R_TICK_OUTER);
            const i = toPoint(lvl.angle, R_TICK_INNER);
            const isActive = LEVELS.findIndex(l => l.id === lvl.id) <= currentIdx;
            return (
              <line
                key={lvl.id}
                x1={o.x} y1={o.y}
                x2={i.x} y2={i.y}
                stroke={isActive ? color : '#334155'}
                strokeWidth={lvl.id === 'EMPTY' || lvl.id === 'FULL' ? 3 : 2}
                strokeLinecap="round"
              />
            );
          })}

          {/* ── Tick labels ── */}
          {LEVELS.map((lvl) => {
            const pos = toPoint(lvl.angle, R_LABEL);
            const isActive = LEVELS.findIndex(l => l.id === lvl.id) <= currentIdx;
            return (
              <text
                key={lvl.id}
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill={isActive ? color : '#475569'}
                style={{ cursor: readOnly ? 'default' : 'pointer', fontFamily: 'system-ui' }}
                onClick={() => !readOnly && onChange?.(lvl.id)}
              >
                {lvl.label}
              </text>
            );
          })}

          {/* ── Needle ── */}
          <motion.polygon
            points={`${tip.x},${tip.y} ${baseL.x},${baseL.y} ${baseR.x},${baseR.y}`}
            fill={color}
            initial={false}
            animate={{ fill: color }}
            transition={{ duration: 0.4 }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />

          {/* ── Center cap ── */}
          <circle cx={CX} cy={CY} r={9} fill="#0f172a" stroke={color} strokeWidth={2.5} />
          <circle cx={CX} cy={CY} r={3} fill={color} />

          {/* ── E / F labels at ends ── */}
          <text x="18" y={CY + 5} fontSize="13" fontWeight="900" fill="#ef4444" textAnchor="middle" style={{ fontFamily: 'system-ui' }}>E</text>
          <text x="282" y={CY + 5} fontSize="13" fontWeight="900" fill="#22c55e" textAnchor="middle" style={{ fontFamily: 'system-ui' }}>F</text>

          {/* ── Fuel pump icon (simple path) at bottom center ── */}
          <g transform={`translate(${CX - 8}, ${CY + 14})`} opacity="0.35">
            <rect x="2" y="0" width="10" height="13" rx="1.5" fill="white" />
            <rect x="4" y="2" width="6" height="5" rx="1" fill="#0f172a" />
            <rect x="12" y="2" width="4" height="7" rx="1" fill="white" />
            <line x1="12" y1="5" x2="16" y2="5" stroke="white" strokeWidth="1.5" />
          </g>
        </svg>

        {/* ── Clickable level buttons (below gauge) ── */}
        {!readOnly && (
          <div className="flex justify-between gap-1 mt-1 px-1">
            {LEVELS.map((lvl, idx) => {
              const isSelected = lvl.id === value;
              return (
                <button
                  key={lvl.id}
                  onClick={() => onChange?.(lvl.id)}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black transition-all border"
                  style={{
                    backgroundColor: isSelected ? color : 'transparent',
                    borderColor: isSelected ? color : '#1e293b',
                    color: isSelected ? '#fff' : '#475569',
                    boxShadow: isSelected ? `0 0 10px ${color}55` : 'none',
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
            {value === 'EMPTY' ? 'Tanque Vazio'
              : value === 'RESERVE' ? 'Reserva'
              : value === '1/4' ? 'Quarto do Tanque'
              : value === '1/2' ? 'Meio Tanque'
              : value === '3/4' ? 'Três Quartos'
              : 'Tanque Cheio'}
          </span>
        </div>
      </div>
    </div>
  );
}
