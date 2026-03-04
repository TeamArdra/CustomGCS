import React from 'react';

interface CompassProps {
  heading: number; // 0-360 degrees
}

export default function Compass({ heading = 0 }: CompassProps) {
  const size = 150;
  const center = size / 2;
  const radius = size / 2 - 10;

  // Cardinal directions
  const directions = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];

  // Intercardinal directions
  const intercardinals = [
    { label: 'NE', angle: 45 },
    { label: 'SE', angle: 135 },
    { label: 'SW', angle: 225 },
    { label: 'NW', angle: 315 },
  ];

  const normalizedHeading = ((heading % 360) + 360) % 360;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="bg-slate-900/80 rounded-full border-2 border-slate-700"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
      >
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="#0f172a" stroke="#64748b" strokeWidth="1" />

        {/* Degree markers */}
        {[...Array(36)].map((_, i) => {
          const angle = i * 10;
          const rad = (angle - 90) * (Math.PI / 180);
          const isMajor = i % 3 === 0;
          const startRadius = radius - (isMajor ? 12 : 6);
          const endRadius = radius - 2;

          const x1 = center + startRadius * Math.cos(rad);
          const y1 = center + startRadius * Math.sin(rad);
          const x2 = center + endRadius * Math.cos(rad);
          const y2 = center + endRadius * Math.sin(rad);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#64748b"
              strokeWidth={isMajor ? 1.5 : 0.8}
              opacity={isMajor ? 0.8 : 0.4}
            />
          );
        })}

        {/* Cardinal directions */}
        {directions.map((dir) => {
          const rad = (dir.angle - 90) * (Math.PI / 180);
          const x = center + (radius - 22) * Math.cos(rad);
          const y = center + (radius - 22) * Math.sin(rad);

          return (
            <text
              key={dir.label}
              x={x}
              y={y}
              fontSize="14"
              fill="#10b981"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {dir.label}
            </text>
          );
        })}

        {/* Intercardinal directions */}
        {intercardinals.map((dir) => {
          const rad = (dir.angle - 90) * (Math.PI / 180);
          const x = center + (radius - 22) * Math.cos(rad);
          const y = center + (radius - 22) * Math.sin(rad);

          return (
            <text
              key={dir.label}
              x={x}
              y={y}
              fontSize="10"
              fill="#64748b"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity="0.7"
            >
              {dir.label}
            </text>
          );
        })}

        {/* Heading indicator (needle) */}
        <g transform={`rotate(${normalizedHeading} ${center} ${center})`}>
          {/* Forward direction (red) */}
          <polygon
            points={`${center},${center - radius + 15} ${center - 6},${center - 10} ${center + 6},${center - 10}`}
            fill="#ef4444"
          />
          {/* Tail (gray) */}
          <polygon
            points={`${center},${center + radius - 15} ${center - 4},${center + 8} ${center + 4},${center + 8}`}
            fill="#64748b"
          />
        </g>

        {/* Center dot */}
        <circle cx={center} cy={center} r="4" fill="#e2e8f0" />
      </svg>
      <div className="text-center text-xs">
        <p className="font-bold text-slate-100">{normalizedHeading.toFixed(0)}°</p>
        <p className="text-slate-500">
          {normalizedHeading < 45 || normalizedHeading >= 315
            ? 'N'
            : normalizedHeading < 135
            ? 'E'
            : normalizedHeading < 225
            ? 'S'
            : 'W'}
        </p>
      </div>
    </div>
  );
}
