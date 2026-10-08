import React from 'react';
import { ReactiveHudEvent } from '../../services/torsoS4AudioEngine';
import { Sparkles, Activity, Check, Radio } from 'lucide-react';

interface ReactiveHudOverlayProps {
  hudEvent: ReactiveHudEvent | null;
}

export const ReactiveHudOverlay: React.FC<ReactiveHudOverlayProps> = ({ hudEvent }) => {
  if (!hudEvent) return null;

  // 1. PLAYLIST IMPORTED ANIMATION STATE
  if (hudEvent.isPlaylistImported) {
    const updatedStems = hudEvent.updatedStemIds && hudEvent.updatedStemIds.length > 0
      ? hudEvent.updatedStemIds
      : ['a_drums', 'a_bass', 'a_music', 'a_vocal', 'b_drums', 'b_bass', 'b_music', 'b_vocal'];

    const formatStemName = (id: string) => {
      const parts = id.split('_');
      const zone = (parts[0] || 'A').toUpperCase();
      const role = (parts[1] || 'STEM').toUpperCase();
      const roleMap: Record<string, string> = {
        DRUMS: 'DRM',
        BASS: 'BAS',
        MUSIC: 'LEAD',
        VOCAL: 'VOX',
      };
      return `${zone}.${roleMap[role] || role}`;
    };

    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-200">
        <div className="bg-[#0B0B0C]/95 backdrop-blur-md border-2 border-[#00E5FF] shadow-[0_0_32px_rgba(0,229,255,0.45)] px-5 py-3 flex flex-col gap-2.5 font-mono min-w-[340px] max-w-lg">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-[#00E5FF]/30 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#00E5FF]/20 border border-[#00E5FF] text-[#00E5FF] animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[#00E5FF] font-black text-xs tracking-widest uppercase flex items-center gap-1.5">
                  AI STORYTELLER // PLAYLIST IMPORTED
                  <span className="inline-block w-1.5 h-1.5 bg-[#00E676] rounded-full animate-ping" />
                </span>
                <span className="text-[10px] text-[#E4E7EB] font-bold">
                  {hudEvent.valueDisplay}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#161719] border border-[#00E5FF]/50 text-[#00E5FF] text-[9px] font-bold tracking-wider">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>SYNC LOCKED</span>
            </div>
          </div>

          {/* Stem Target Matrix Blip Highlight Badges */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[9px] text-[#8E9296]">
              <span className="font-bold tracking-wider">UPDATED STEM CHANNELS:</span>
              <span className="text-[#00E676] font-bold">HARMONIC FLOW COMMITTED</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {updatedStems.map((stemId) => (
                <div
                  key={stemId}
                  className="flex items-center justify-between px-1.5 py-1 bg-[#161719] border border-[#00E5FF] text-[#00E5FF] text-[9px] font-extrabold shadow-[0_0_8px_rgba(0,229,255,0.25)] animate-pulse"
                >
                  <span className="truncate">{formatStemName(stemId)}</span>
                  <Check className="w-2.5 h-2.5 shrink-0 text-[#00E676]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. STANDARD HARDWARE / ZEN PARAMETER POP-UP HUD
  return (
    <div className="fixed top-14 right-6 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-[#0B0B0C]/95 backdrop-blur-sm border border-[#00E5FF] px-4 py-2 shadow-2xl flex items-center gap-3 font-mono">
        <div className="w-2 h-2 bg-[#00E5FF] animate-pulse" />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8E9296] font-bold">
            {hudEvent.stemId ? `[${hudEvent.stemId.toUpperCase()}]` : ''} {hudEvent.paramName}:
          </span>
          <span className="text-[#00E5FF] font-extrabold text-sm tracking-wider">
            {hudEvent.valueDisplay}
          </span>
          {hudEvent.modSymbol && (
            <span
              style={{ color: hudEvent.modColor || '#00E5FF' }}
              className="text-xs font-bold ml-1"
            >
              {hudEvent.modSymbol}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
