import React from 'react';

interface ArtificialHorizonProps {
  pitch: number; // -90 to 90 degrees
  roll: number; // -180 to 180 degrees
}

export default function ArtificialHorizon({ pitch = 0, roll = 0 }: ArtificialHorizonProps) {
  // Clamp values
  const clampedPitch = Math.max(-90, Math.min(90, pitch));
  const clampedRoll = ((roll + 180) % 360) - 180;

  const size = 240;
  const center = size / 2;
  const skyHeight = center + (clampedPitch * center) / 90;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
    >
      {/* Define clipping path for circular view */}
      <defs>
        <clipPath id="ahClip">
          <circle cx={center} cy={center} r={center - 2} />
        </clipPath>
      </defs>

      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={center - 2}
        fill="#0f172a"
        stroke="#64748b"
        strokeWidth="2"
      />

      {/* Rotated horizon group */}
      <g clipPath="url(#ahClip)">
        <g
          transform={`translate(${center}, ${center}) rotate(${clampedRoll}) translate(${-center}, ${-center})`}
        >
          {/* Sky (blue) */}
          <rect x="0" y="0" width={size} height={skyHeight} fill="#3b82f6" opacity="0.6" />

          {/* Ground (brown) */}
          <rect x="0" y={skyHeight} width={size} height={size - skyHeight} fill="#92400e" opacity="0.6" />

          {/* Horizon line */}
          <line
            x1="0"
            y1={skyHeight}
            x2={size}
            y2={skyHeight}
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Pitch ladder lines */}
          {[...Array(9)].map((_, i) => {
            const offset = (i - 4) * 10;
            const y = skyHeight - offset * 2;
            const isHalf = i % 2 === 1;
            const length = isHalf ? 20 : 40;

            return (
              <g key={i}>
                <line
                  x1={center - length / 2}
                  y1={y}
                  x2={center + length / 2}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  opacity={isHalf ? 0.4 : 0.8}
                />
                {!isHalf && offset !== 0 && (
                  <>
                    <text
                      x={center - length / 2 - 15}
                      y={y + 4}
                      fontSize="10"
                      fill="#e2e8f0"
                      textAnchor="end"
                    >
                      {offset}
                    </text>
                    <text
                      x={center + length / 2 + 15}
                      y={y + 4}
                      fontSize="10"
                      fill="#e2e8f0"
                      textAnchor="start"
                    >
                      {offset}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </g>

      {/* Fixed center crosshair */}
      <g>
        <circle cx={center} cy={center} r="4" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1={center - 15} y1={center} x2={center - 8} y2={center} stroke="#e2e8f0" strokeWidth="2" />
        <line x1={center + 8} y1={center} x2={center + 15} y2={center} stroke="#e2e8f0" strokeWidth="2" />
        <line x1={center} y1={center + 8} x2={center} y2={center + 15} stroke="#e2e8f0" strokeWidth="2" />
      </g>

      {/* Roll indicator - Top pointer */}
      <g>
        {/* Roll arc background */}
        <path
          d={`M ${center - 40} 10 A 40 40 0 0 1 ${center + 40} 10`}
          fill="none"
          stroke="#64748b"
          strokeWidth="1"
          opacity="0.3"
        />
        {/* Roll indicator marks */}
        {[0, 15, 30, 45, 60, 75, 90].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = center + 38 * Math.cos(rad - Math.PI / 2);
          const y1 = 10 + 38 * Math.sin(rad - Math.PI / 2);
          const x2 = center + 32 * Math.cos(rad - Math.PI / 2);
          const y2 = 10 + 32 * Math.sin(rad - Math.PI / 2);
          return (
            <line key={`roll-${angle}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="1" opacity="0.5" />
          );
        })}
        {/* Current roll indicator needle */}
        <g transform={`rotate(${clampedRoll} ${center} 10)`}>
          <polygon points={`${center},2 ${center - 4},10 ${center + 4},10`} fill="#f59e0b" />
        </g>
      </g>
    </svg>
  );
}
