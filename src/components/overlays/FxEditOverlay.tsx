import React from 'react';
import { FXState } from '../../types';
import { ChevronLeft, X } from 'lucide-react';
import { FlatKnob } from '../FlatKnob';

interface FxEditOverlayProps {
  fx: FXState;
  onUpdateFX: (updates: Partial<FXState>) => void;
  onClose: () => void;
}

export const FxEditOverlay: React.FC<FxEditOverlayProps> = ({
  fx,
  onUpdateFX,
  onClose,
}) => {
  const divisions: ('1/8' | '1/4' | '1/2' | '1')[] = ['1/8', '1/4', '1/2', '1'];

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] flex flex-col p-4 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-zinc-200">
          {fx.type} DEEP EDIT
        </span>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* FX Trail Visualizer */}
      <div className="my-4 h-24 bg-[#111116] rounded-2xl border border-zinc-800 p-3 flex items-center justify-between gap-1 overflow-hidden">
        {Array.from({ length: 48 }).map((_, i) => {
          const decay = Math.exp(-i / 14);
          const height = (15 + Math.sin(i * 0.7) * 40) * decay;
          return (
            <div
              key={i}
              className="flex-1 bg-emerald-400/80 rounded-full shadow-[0_0_4px_rgba(52,211,153,0.3)]"
              style={{
                height: `${Math.max(8, height)}%`,
                opacity: 0.2 + decay * 0.8,
              }}
            />
          );
        })}
      </div>

      {/* 3 Main Dials: TIME, FEEDBACK, MIX */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="flex flex-col items-center bg-[#131318] p-3 rounded-2xl border border-zinc-800">
          <FlatKnob
            value={fx.timeDivision === '1/8' ? 25 : fx.timeDivision === '1/4' ? 50 : fx.timeDivision === '1/2' ? 75 : 100}
            onChange={(v) => {
              const div = v < 35 ? '1/8' : v < 65 ? '1/4' : v < 85 ? '1/2' : '1';
              onUpdateFX({ timeDivision: div });
            }}
            size="md"
            accentColor="#4ade80"
          />
          <span className="font-mono text-[10px] font-bold text-zinc-400 mt-2 uppercase">TIME</span>
          <span className="font-mono text-xs font-bold text-zinc-100">{fx.timeDivision}</span>
        </div>

        <div className="flex flex-col items-center bg-[#131318] p-3 rounded-2xl border border-zinc-800">
          <FlatKnob
            value={fx.secondaryParam}
            onChange={(v) => onUpdateFX({ secondaryParam: v })}
            size="md"
            accentColor="#38bdf8"
          />
          <span className="font-mono text-[10px] font-bold text-zinc-400 mt-2 uppercase">FEEDBACK</span>
          <span className="font-mono text-xs font-bold text-zinc-100">{fx.secondaryParam}%</span>
        </div>

        <div className="flex flex-col items-center bg-[#131318] p-3 rounded-2xl border border-zinc-800">
          <FlatKnob
            value={fx.amount}
            onChange={(v) => onUpdateFX({ amount: v })}
            size="md"
            accentColor="#f4f4f5"
          />
          <span className="font-mono text-[10px] font-bold text-zinc-400 mt-2 uppercase">MIX</span>
          <span className="font-mono text-xs font-bold text-zinc-100">{fx.amount}%</span>
        </div>
      </div>

      {/* Beat Sync & Division Selector */}
      <div className="p-4 bg-[#121216] rounded-2xl border border-zinc-800 my-2">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold text-zinc-300 uppercase">
            BPM TEMPO SYNC
          </span>
          <button
            onClick={() => onUpdateFX({ sync: !fx.sync })}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition border ${
              fx.sync
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            {fx.sync ? 'SYNCED' : 'FREE'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {divisions.map((d) => {
            const isSel = fx.timeDivision === d;
            return (
              <button
                key={d}
                onClick={() => onUpdateFX({ timeDivision: d })}
                className={`py-2 rounded-xl font-mono text-xs font-bold transition active:scale-95 border ${
                  isSel
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Close Button */}
      <div className="mt-auto">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold tracking-widest uppercase active:scale-[0.98] transition shadow-md"
        >
          ANWENDEN & SCHLIEßEN
        </button>
      </div>
    </div>
  );
};
