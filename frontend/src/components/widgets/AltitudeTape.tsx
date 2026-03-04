import React from 'react';

interface AltitudeTapeProps {
  altitude: number;
  climbRate: number;
}

export default function AltitudeTape({ altitude = 0, climbRate = 0 }: AltitudeTapeProps) {
  const width = 80;
  const height = 200;
  const center = height / 2;

  // Show altitude from (altitude - 50) to (altitude + 50)
  const minAlt = Math.floor((altitude - 50) / 10) * 10;
  const maxAlt = Math.ceil((altitude + 50) / 10) * 10;

  const ticks = [];
  for (let alt = minAlt; alt <= maxAlt; alt += 10) {
    const offset = (alt - altitude) * 2; // pixels per meter
    const y = center + offset;
    ticks.push({
      alt,
      y,
      isMajor: alt % 20 === 0,
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-slate-900/80 rounded border border-slate-700"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
      >
        {/* Background */}
        <rect width={width} height={height} fill="#0f172a" />

        {/* Grid lines and values */}
        {ticks.map((tick) => (
          <g key={tick.alt}>
            {/* Tick line */}
            <line
              x1={tick.isMajor ? 10 : 20}
              y1={tick.y}
              x2={width - 5}
              y2={tick.y}
              stroke="#64748b"
              strokeWidth="1"
              opacity={tick.isMajor ? 0.8 : 0.4}
            />
            {/* Label */}
            {tick.isMajor && (
              <text
                x="5"
                y={tick.y + 4}
                fontSize="11"
                fill="#e2e8f0"
                textAnchor="end"
                fontWeight="bold"
              >
                {tick.alt}
              </text>
            )}
          </g>
        ))}

        {/* Center reference line */}
        <rect x="0" y={center - 1} width={width} height="2" fill="#10b981" opacity="0.8" />

        {/* Climb rate indicator */}
        {climbRate !== 0 && (
          <g>
            <line
              x1={width - 8}
              y1={center - climbRate * 10}
              x2={width - 3}
              y2={center - climbRate * 10}
              stroke="#f59e0b"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      <div className="text-center text-xs">
        <p className="font-bold text-slate-100">{altitude.toFixed(1)} m</p>
        <p className="text-slate-500">{climbRate.toFixed(1)} m/s</p>
      </div>
    </div>
  );
}
