import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Lock, Unlock, ArrowLeftRight } from 'lucide-react';

export interface TransportBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  isSyncLocked?: boolean;
  onToggleSync?: () => void;
  onSwapDecks?: () => void;
  masterBpm?: number;
  secondTrackBpm?: number;
  secondTrackTitle?: string;
  className?: string;
  size?: 'normal' | 'large';
  masterDeck?: 'A' | 'B';
  onSelectMasterDeck?: (deck: 'A' | 'B') => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  isSyncLocked = false,
  onToggleSync,
  onSwapDecks,
  masterBpm = 128.0,
  secondTrackBpm = 125.0,
  secondTrackTitle,
  className = '',
  size = 'normal',
  masterDeck = 'A',
  onSelectMasterDeck,
}) => {
  const isLarge = size === 'large';

  return (
    <div
      className={`w-full flex flex-col items-center justify-center select-none transition-all duration-200 p-1.5 rounded-2xl ${
        masterDeck === 'A'
          ? 'shadow-[0_0_24px_rgba(59,130,246,0.14)]'
          : 'shadow-[0_0_24px_rgba(249,115,22,0.16)]'
      } ${className}`}
    >
      {/* Dual Deck Sync Status Strip */}
      {onToggleSync && (
        <div
          onClick={onToggleSync}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleSync();
            }
          }}
          className={`group flex items-center gap-2 mb-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer text-[9px] font-mono select-none active:scale-[0.98] ${
            masterDeck === 'A'
              ? 'bg-[#091424]/95 border-blue-500/50 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.25)]'
              : 'bg-[#1e0e05]/95 border-orange-500/50 text-orange-300 shadow-[0_0_14px_rgba(249,115,22,0.25)]'
          }`}
          title={
            isSyncLocked
              ? `SYNC LOCKED: ${masterDeck === 'A' ? 'Deck B synchronisiert mit Master Deck A' : 'Deck A synchronisiert mit Master Deck B'} bei ${masterBpm.toFixed(1)} BPM`
              : `SYNC OFF: Klicke, um BPM zwischen Decks anzugleichen`
          }
        >
          {/* Deck A Tag */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMasterDeck?.('A');
            }}
            className={`flex items-center gap-1 px-1.5 py-0.2 rounded transition ${
              masterDeck === 'A'
                ? 'bg-blue-500/25 text-blue-200 border border-blue-500/60 font-extrabold shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                : 'text-zinc-500 hover:text-blue-300'
            }`}
            title="Klicke, um DECK A als Master festzulegen"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                masterDeck === 'A' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,1)] animate-pulse' : 'bg-blue-900'
              }`}
            />
            <span className="font-bold text-[8px]">DECK A</span>
            <span className="font-extrabold">{masterBpm.toFixed(1)}</span>
            {masterDeck === 'A' && (
              <span className="text-[7px] px-1 py-0 rounded bg-blue-500/30 font-black">MASTER</span>
            )}
          </button>

          {/* Sync Status Badge with Lock indicator */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.2 rounded font-bold text-[8px] tracking-wider transition-colors ${
              isSyncLocked
                ? masterDeck === 'A'
                  ? 'bg-blue-500/25 text-blue-200 border border-blue-500/60 shadow-[0_0_6px_rgba(59,130,246,0.35)]'
                  : 'bg-orange-500/25 text-orange-200 border border-orange-500/60 shadow-[0_0_6px_rgba(249,115,22,0.35)]'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60 group-hover:text-zinc-300'
            }`}
          >
            {isSyncLocked ? (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    masterDeck === 'A' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,1)]' : 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,1)]'
                  }`}
                />
                <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                <span>SYNC LOCKED</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                <Unlock className="w-2.5 h-2.5 text-zinc-500" />
                <span>SYNC OFF</span>
              </>
            )}
          </div>

          {/* Quick Swap Pill in Status Ribbon */}
          {onSwapDecks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwapDecks();
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-zinc-800/90 hover:bg-cyan-950/70 hover:border-cyan-500/50 border border-zinc-700/60 text-cyan-400 hover:text-cyan-300 transition text-[7.5px] font-bold tracking-wider active:scale-95"
              title="Tausche Deck A und Deck B (Instant Swap)"
              aria-label="Swap Deck A and Deck B"
            >
              <ArrowLeftRight className="w-2.5 h-2.5" />
              <span>SWAP</span>
            </button>
          )}

          {/* Deck B Tag */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMasterDeck?.('B');
            }}
            className={`flex items-center gap-1 px-1.5 py-0.2 rounded transition ${
              masterDeck === 'B'
                ? 'bg-orange-500/25 text-orange-200 border border-orange-500/60 font-extrabold shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                : 'text-zinc-500 hover:text-orange-300'
            }`}
            title="Klicke, um DECK B als Master festzulegen"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                masterDeck === 'B' ? 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,1)] animate-pulse' : 'bg-orange-950'
              }`}
            />
            <span className="font-bold text-[8px]">DECK B</span>
            <span className="font-extrabold">{secondTrackBpm.toFixed(1)}</span>
            {masterDeck === 'B' && (
              <span className="text-[7px] px-1 py-0 rounded bg-orange-500/30 font-black">MASTER</span>
            )}
            {secondTrackTitle && (
              <span className="text-zinc-500 max-w-[60px] truncate text-[8px] hidden sm:inline">
                {secondTrackTitle}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main Transport Controls Row */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 max-w-full px-1">
        {/* Previous / Return Track Button */}
        <button
          onClick={onPrev}
          className={`rounded-full bg-[#131317] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition shadow-sm shrink-0 ${
            isLarge ? 'w-13 h-13 sm:w-15 sm:h-15' : 'w-11 h-11 sm:w-12 sm:h-12'
          }`}
          aria-label="Previous Track / Return to CUE"
          title="Previous Track / Return to CUE"
        >
          <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current stroke-none" />
        </button>

        {/* Dominant Tactile Play / Pause Button with Master Deck Glow */}
        <button
          onClick={onTogglePlay}
          className={`rounded-full flex items-center justify-center transition-all duration-100 active:scale-95 shadow-lg shrink-0 ${
            isPlaying
              ? masterDeck === 'A'
                ? 'bg-blue-500 text-white shadow-[0_0_26px_rgba(59,130,246,0.65)] border border-blue-400 ring-2 ring-blue-400/40'
                : 'bg-orange-500 text-white shadow-[0_0_26px_rgba(249,115,22,0.65)] border border-orange-400 ring-2 ring-orange-400/40'
              : 'bg-zinc-100 text-zinc-950 shadow-[0_0_16px_rgba(255,255,255,0.2)] hover:bg-white'
          } ${isLarge ? 'w-15 h-15 sm:w-18 sm:h-18' : 'w-13 h-13 sm:w-15 sm:h-15'}`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current stroke-none" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current stroke-none ml-0.5" />
          )}
        </button>

        {/* Next Track Button */}
        <button
          onClick={onNext}
          className={`rounded-full bg-[#131317] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition shadow-sm shrink-0 ${
            isLarge ? 'w-13 h-13 sm:w-15 sm:h-15' : 'w-11 h-11 sm:w-12 sm:h-12'
          }`}
          aria-label="Next Track"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current stroke-none" />
        </button>

        {/* Dedicated SYNC Button with Visual Lock Status Indicator */}
        {onToggleSync && (
          <button
            onClick={onToggleSync}
            className={`relative rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all duration-100 active:scale-95 border select-none shrink-0 ${
              isSyncLocked
                ? 'bg-[#1b0d11] text-rose-300 border-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.35)]'
                : 'bg-[#131317] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700 shadow-sm'
            } ${isLarge ? 'w-13 h-13 sm:w-15 sm:h-15' : 'w-11 h-11 sm:w-13 sm:h-12'}`}
            aria-label={isSyncLocked ? 'Sync Locked' : 'Sync Unlock'}
            title={
              isSyncLocked
                ? `SYNC LOCKED: Deck B synchronisiert auf ${masterBpm.toFixed(1)} BPM (Klicke zum Entsperren)`
                : `SYNC: Klicke, um Deck B (${secondTrackBpm.toFixed(1)} BPM) an Master Deck A (${masterBpm.toFixed(1)} BPM) anzugleichen`
            }
          >
            {/* Visual Lock Status Indicator LED Dot & Icon */}
            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
              <span
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-150 block ${
                  isSyncLocked
                    ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,1)] animate-pulse'
                    : 'bg-zinc-700 border border-zinc-600/60'
                }`}
              />
              {isSyncLocked ? (
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400 stroke-[2.5]" />
              ) : (
                <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-500 stroke-[2]" />
              )}
            </div>

            {/* SYNC Button Text in Nothing Monospace */}
            <span
              className={`font-mono text-[8.5px] sm:text-[10px] font-black tracking-wider sm:tracking-widest leading-none ${
                isSyncLocked ? 'text-white' : 'text-zinc-300'
              }`}
            >
              SYNC
            </span>

            {/* Lock Status Micro Readout */}
            <span
              className={`font-mono text-[6.5px] sm:text-[7px] font-bold tracking-wider uppercase mt-0.5 leading-none ${
                isSyncLocked ? 'text-rose-400' : 'text-zinc-500'
              }`}
            >
              {isSyncLocked ? 'LOCK' : 'OFF'}
            </span>

            {/* Subtle active halo ring when locked */}
            {isSyncLocked && (
              <span className="absolute -inset-0.5 rounded-xl sm:rounded-2xl border border-rose-500/30 pointer-events-none animate-pulse" />
            )}
          </button>
        )}

        {/* Dedicated SWAP Button: Instantly swaps Deck A and Deck B */}
        {onSwapDecks && (
          <button
            onClick={onSwapDecks}
            className={`relative rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all duration-100 active:scale-95 border select-none bg-[#131317] text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-800/80 hover:border-cyan-500/60 hover:shadow-[0_0_14px_rgba(6,182,212,0.25)] shadow-sm shrink-0 ${
              isLarge ? 'w-13 h-13 sm:w-15 sm:h-15' : 'w-11 h-11 sm:w-13 sm:h-12'
            }`}
            aria-label="Swap Deck A and Deck B"
            title="SWAP: Tauscht den geladenen Track sofort zwischen Deck A und Deck B"
          >
            {/* Visual Indicator Cyan LED Dot & Icon */}
            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
              <ArrowLeftRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
            </div>

            {/* SWAP Button Text in Nothing Monospace */}
            <span className="font-mono text-[8.5px] sm:text-[10px] font-black tracking-wider sm:tracking-widest leading-none text-zinc-100">
              SWAP
            </span>

            {/* Micro Sublabel */}
            <span className="font-mono text-[6.5px] sm:text-[7px] font-bold tracking-wider text-cyan-400 uppercase mt-0.5 leading-none">
              A ⇄ B
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
