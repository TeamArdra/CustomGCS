import React from 'react';

interface SpeedTapeProps {
  airSpeed: number;
  groundSpeed: number;
}

export default function SpeedTape({ airSpeed = 0, groundSpeed = 0 }: SpeedTapeProps) {
  const width = 80;
  const height = 200;
  const center = height / 2;

  // Show speed from (airSpeed - 20) to (airSpeed + 20)
  const minSpeed = Math.floor((airSpeed - 20) / 5) * 5;
  const maxSpeed = Math.ceil((airSpeed + 20) / 5) * 5;

  const ticks = [];
  for (let speed = minSpeed; speed <= maxSpeed; speed += 5) {
    const offset = (speed - airSpeed) * 2; // pixels per m/s
    const y = center + offset;
    ticks.push({
      speed,
      y,
      isMajor: speed % 10 === 0,
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
          <g key={tick.speed}>
            {/* Tick line */}
            <line
              x1={5}
              y1={tick.y}
              x2={tick.isMajor ? width - 10 : width - 20}
              y2={tick.y}
              stroke="#64748b"
              strokeWidth="1"
              opacity={tick.isMajor ? 0.8 : 0.4}
            />
            {/* Label */}
            {tick.isMajor && (
              <text
                x={width - 5}
                y={tick.y + 4}
                fontSize="11"
                fill="#e2e8f0"
                textAnchor="end"
                fontWeight="bold"
              >
                {tick.speed}
              </text>
            )}
          </g>
        ))}

        {/* Center reference line */}
        <rect x="0" y={center - 1} width={width} height="2" fill="#06b6d4" opacity="0.8" />

        {/* Ground speed indicator (secondary) */}
        {Math.abs(groundSpeed - airSpeed) > 0.5 && (
          <line
            x1="0"
            y1={center + (groundSpeed - airSpeed) * 2}
            x2={width}
            y2={center + (groundSpeed - airSpeed) * 2}
            stroke="#ec4899"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.6"
          />
        )}
      </svg>
      <div className="text-center text-xs">
        <p className="font-bold text-slate-100">{airSpeed.toFixed(1)} m/s</p>
        <p className="text-slate-500">GND: {groundSpeed.toFixed(1)}</p>
      </div>
    </div>
  );
}
