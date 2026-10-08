import React from 'react';
import { X, Sliders, Eye, EyeOff, Check } from 'lucide-react';

interface ScreenEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
  showMiniWaveforms: boolean;
  onToggleShowMiniWaveforms: () => void;
  showEqDetails: boolean;
  onToggleShowEqDetails: () => void;
  showLiveModulations: boolean;
  onToggleShowLiveModulations: () => void;
  showSpectralGraphs: boolean;
  onToggleShowSpectralGraphs: () => void;
}

export const ScreenEditorModal: React.FC<ScreenEditorModalProps> = ({
  isOpen,
  onClose,
  zenMode,
  onToggleZenMode,
  showMiniWaveforms,
  onToggleShowMiniWaveforms,
  showEqDetails,
  onToggleShowEqDetails,
  showLiveModulations,
  onToggleShowLiveModulations,
  showSpectralGraphs,
  onToggleShowSpectralGraphs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none font-mono">
      <div className="w-full max-w-md bg-[#0B0B0C] border border-[#282A2E] p-4 flex flex-col gap-4 text-[#E4E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#282A2E]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-bold tracking-wider text-[#F9F6F0]">
              SCREEN EDITOR // ZEN-MODE CONFIGURATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#161719] border border-[#282A2E] text-[#8E9296] hover:text-[#E4E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Torso Zen Architecture Explainer */}
        <div className="p-2.5 bg-[#161719] border border-[#282A2E] text-[10px] text-[#8E9296] leading-relaxed">
          <strong className="text-[#E4E7EB]">HARDWARE PURITY PRINCIPLE:</strong> When UI elements are toggled off or Zen Mode is engaged, all audio filters, granular clouds, and modulations continue running at full fidelity in the background. If a physical knob or MIDI CC is moved, the <strong>2000ms Reactive HUD</strong> will momentarily display the adjustment.
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2">
          {/* Master Zen Mode */}
          <div className="flex items-center justify-between p-2.5 bg-[#161719] border border-[#282A2E]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#F9F6F0]">MASTER ZEN MODE</span>
              <span className="text-[9px] text-[#8E9296]">Minimalist focus &bull; Hide non-essential visual meters</span>
            </div>
            <button
              onClick={onToggleZenMode}
              className={`px-3 py-1 text-[10px] font-bold border transition-colors ${
                zenMode
                  ? 'bg-[#00E676] text-[#0B0B0C] border-[#00E676]'
                  : 'bg-[#0B0B0C] text-[#8E9296] border-[#282A2E]'
              }`}
            >
              {zenMode ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
            </button>
          </div>

          {/* Mini Waveforms */}
          <div className="flex items-center justify-between p-2.5 bg-[#0B0B0C] border border-[#282A2E]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#E4E7EB]">MINI STEM WAVEFORMS</span>
              <span className="text-[9px] text-[#8E9296]">Overview waveforms inside channel strips</span>
            </div>
            <button
              onClick={onToggleShowMiniWaveforms}
              className={`px-3 py-1 text-[10px] font-bold border ${
                showMiniWaveforms
                  ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                  : 'bg-[#161719] text-[#8E9296] border-[#282A2E]'
              }`}
            >
              {showMiniWaveforms ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>

          {/* Live Modulation Indicators */}
          <div className="flex items-center justify-between p-2.5 bg-[#0B0B0C] border border-[#282A2E]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#E4E7EB]">LIVE MODULATION TRAILS</span>
              <span className="text-[9px] text-[#8E9296]">Dynamic geometric arcs (▲, ■, ⬡, ●) on dials</span>
            </div>
            <button
              onClick={onToggleShowLiveModulations}
              className={`px-3 py-1 text-[10px] font-bold border ${
                showLiveModulations
                  ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                  : 'bg-[#161719] text-[#8E9296] border-[#282A2E]'
              }`}
            >
              {showLiveModulations ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>

          {/* EQ / Filter Details */}
          <div className="flex items-center justify-between p-2.5 bg-[#0B0B0C] border border-[#282A2E]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#E4E7EB]">EQ CURVE OVERLAYS</span>
              <span className="text-[9px] text-[#8E9296]">Inline frequency graphs on stem mixer</span>
            </div>
            <button
              onClick={onToggleShowEqDetails}
              className={`px-3 py-1 text-[10px] font-bold border ${
                showEqDetails
                  ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                  : 'bg-[#161719] text-[#8E9296] border-[#282A2E]'
              }`}
            >
              {showEqDetails ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#E4E7EB] text-[#0B0B0C] font-bold text-xs tracking-wider border border-[#E4E7EB] hover:bg-white transition-colors"
        >
          CONFIRM & APPLY TO RUNTIME
        </button>
      </div>
    </div>
  );
};
