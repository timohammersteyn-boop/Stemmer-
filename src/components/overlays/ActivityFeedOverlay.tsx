import React, { useState, useRef, useEffect } from 'react';
import { ActivityLogItem } from '../../types';
import { ChevronLeft, X, Terminal, Trash2, Copy, Check, Filter } from 'lucide-react';

interface ActivityFeedOverlayProps {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
  onClose: () => void;
}

export const ActivityFeedOverlay: React.FC<ActivityFeedOverlayProps> = ({
  logs,
  onClearLogs,
  onClose,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = ['ALL', 'LOAD', 'PLAY', 'CUE', 'FX', 'MUTE', 'PAD', 'BANK', 'TEMPO', 'MIDI'];

  const filteredLogs = logs.filter(
    (item) => filter === 'ALL' || item.category === filter
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.time}] [${l.category.padEnd(5)}] ${l.message}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'LOAD':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'PLAY':
      case 'LOOP':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CUE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'FX':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'MUTE':
      case 'SOLO':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'PAD':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'BANK':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'TEMPO':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'MIDI':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c]/90 backdrop-blur-md flex flex-col p-3.5 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-500 stroke-[2]" />
            <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-zinc-200">
              ACTIVITY FEED
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {logs.length} EVENTS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy Log */}
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] active:scale-95 transition"
            title="Log in Zwischenablage kopieren"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'KOPIERT' : 'KOPIEREN'}</span>
          </button>

          {/* Clear Log */}
          <button
            onClick={onClearLogs}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-rose-400 active:scale-95 transition"
            title="Log leeren"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto py-2 shrink-0 no-scrollbar">
        {categories.map((c) => {
          const isSelected = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase shrink-0 transition active:scale-95 border ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                  : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Minimalist Text-Based Log Console */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#0a0a0d] border border-zinc-800/90 rounded-xl p-2.5 space-y-1.5 font-mono text-xs shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-12">
            <Terminal className="w-6 h-6 mb-2 opacity-40" />
            <span className="text-[11px] uppercase tracking-wider block">Keine Aktionen protokolliert</span>
            <span className="text-[9px] text-zinc-700 block mt-0.5">
              Führe DJ-Aktionen wie Cue, FX, Fader oder Pad-Triggers aus
            </span>
          </div>
        ) : (
          filteredLogs.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-zinc-900/60 transition font-mono leading-relaxed border-b border-zinc-900/60"
            >
              {/* Timestamp */}
              <span className="text-zinc-500 text-[10px] shrink-0 font-medium select-none pt-0.5">
                {item.time}
              </span>

              {/* Category Pill */}
              <span
                className={`text-[9px] px-1 py-0.2 rounded border uppercase font-bold shrink-0 tracking-wider ${getBadgeColor(
                  item.category
                )}`}
              >
                {item.category}
              </span>

              {/* Log Message */}
              <span className="text-zinc-200 text-[11px] break-words flex-1">
                {item.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="pt-2 flex items-center justify-between font-mono text-[9px] text-zinc-500 shrink-0 select-none">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ECHTZEIT-FEED AKTIV • AUTOMATISCHE PROTOKOLLIERUNG
        </span>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white uppercase font-bold tracking-wider"
        >
          SCHLIEßEN [ESC]
        </button>
      </div>
    </div>
  );
};
