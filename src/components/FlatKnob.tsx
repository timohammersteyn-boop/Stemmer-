import React, { useRef, useState, useCallback } from 'react';

interface FlatKnobProps {
  value: number; // 0 to 100
  onChange: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  unit?: string;
  accentColor?: string;
  min?: number;
  max?: number;
  className?: string;
}

export const FlatKnob: React.FC<FlatKnobProps> = ({
  value,
  onChange,
  size = 'md',
  label,
  unit = '%',
  accentColor = '#f4f4f5',
  min = 0,
  max = 100,
  className = '',
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsInteracting(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting) return;
    const deltaY = startYRef.current - e.clientY;
    const sensitivity = size === 'lg' ? 0.4 : 0.6;
    const range = max - min;
    const nextVal = Math.max(min, Math.min(max, Math.round(startValRef.current + deltaY * sensitivity)));
    onChange(nextVal);
  }, [isInteracting, max, min, onChange, size]);

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsInteracting(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Dimensions
  const dim = size === 'lg' ? 200 : size === 'md' ? 88 : 56;
  const stroke = size === 'lg' ? 6 : size === 'md' ? 4 : 3;
  const radius = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc from 135 deg to 405 deg (270 deg total range)
  const angleRange = 270;
  const normalized = (value - min) / (max - min);
  const dashOffset = circumference - (normalized * (angleRange / 360) * circumference);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Knob Touch Target */}
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex items-center justify-center cursor-ns-resize touch-none"
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          className="transform -rotate-[225deg]"
          viewBox={`0 0 ${dim} ${dim}`}
        >
          {/* Background track arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={stroke}
            strokeDasharray={`${circumference * (angleRange / 360)} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth={stroke}
            strokeDasharray={`${circumference * (angleRange / 360)} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-75"
            style={{
              filter: isInteracting ? `drop-shadow(0 0 6px ${accentColor})` : undefined,
            }}
          />
        </svg>

        {/* Center flat disk */}
        <div
          className={`absolute rounded-full bg-[#121215] border border-zinc-800 flex flex-col items-center justify-center transition-transform ${
            isInteracting ? 'scale-95 border-zinc-700' : ''
          }`}
          style={{
            width: dim - stroke * 4 - (size === 'lg' ? 24 : 10),
            height: dim - stroke * 4 - (size === 'lg' ? 24 : 10),
          }}
        >
          {size === 'lg' ? (
            <div className="flex flex-col items-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-zinc-100">
                {value}
                <span className="text-lg font-normal text-zinc-400 ml-0.5">{unit}</span>
              </span>
              {label && (
                <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mt-1">
                  {label}
                </span>
              )}
            </div>
          ) : size === 'md' ? (
            <div className="flex flex-col items-center">
              <span className="font-mono text-xs font-bold text-zinc-200">
                {value}{unit}
              </span>
            </div>
          ) : (
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </div>
      </div>

      {/* Label for sm / md */}
      {size !== 'lg' && label && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mt-1.5 text-center">
          {label}
        </span>
      )}
    </div>
  );
};
