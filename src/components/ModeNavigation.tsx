import React, { useState, useEffect } from 'react';
import { ScreenMode } from '../types';
import {
  Layers,
  Sliders,
  Grid3X3,
  Sparkles,
  Scissors,
  Repeat,
  Radio,
  Library,
  GraduationCap,
  Settings,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ModeNavigationProps {
  currentMode: ScreenMode;
  onSelectMode: (mode: ScreenMode) => void;
  className?: string;
  hardwareMode?: boolean;
  isPerformanceView?: boolean;
  onTogglePerformanceView?: () => void;
}

interface ScreenTabConfig {
  id: ScreenMode;
  label: string;
  badge: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  bank: 'PERFORMANCE' | 'STUDIO';
}

export const ALL_10_SCREENS: ScreenTabConfig[] = [
  // BANK 1: PERFORMANCE (1-5)
  {
    id: 'STEMS',
    label: 'STEMS',
    badge: '01',
    icon: Layers,
    accentColor: '#f43f5e',
    bank: 'PERFORMANCE',
  },
  {
    id: 'MIX',
    label: 'MIXER',
    badge: '02',
    icon: Sliders,
    accentColor: '#06b6d4',
    bank: 'PERFORMANCE',
  },
  {
    id: 'PAD',
    label: 'PADS',
    badge: '03',
    icon: Grid3X3,
    accentColor: '#10b981',
    bank: 'PERFORMANCE',
  },
  {
    id: 'MACRO_FX',
    label: 'MACRO FX',
    badge: '04',
    icon: Sparkles,
    accentColor: '#a855f7',
    bank: 'PERFORMANCE',
  },
  {
    id: 'SLICER',
    label: 'SLICER',
    badge: '05',
    icon: Scissors,
    accentColor: '#eab308',
    bank: 'PERFORMANCE',
  },

  // BANK 2: STUDIO & WORKFLOW (6-10)
  {
    id: 'LOOP_RECORDER',
    label: 'LOOP REC',
    badge: '06',
    icon: Repeat,
    accentColor: '#f97316',
    bank: 'STUDIO',
  },
  {
    id: 'MASTER_RECORDER',
    label: 'MASTER REC',
    badge: '07',
    icon: Radio,
    accentColor: '#ef4444',
    bank: 'STUDIO',
  },
  {
    id: 'LIBRARY',
    label: 'LIBRARY',
    badge: '08',
    icon: Library,
    accentColor: '#38bdf8',
    bank: 'STUDIO',
  },
  {
    id: 'SCHOOL',
    label: 'DJ SCHOOL',
    badge: '09',
    icon: GraduationCap,
    accentColor: '#34d399',
    bank: 'STUDIO',
  },
  {
    id: 'SETTINGS',
    label: 'SETTINGS',
    badge: '10',
    icon: Settings,
    accentColor: '#a1a1aa',
    bank: 'STUDIO',
  },
];

export const ModeNavigation: React.FC<ModeNavigationProps> = ({
  currentMode,
  onSelectMode,
  className = '',
  hardwareMode = false,
  isPerformanceView = false,
  onTogglePerformanceView,
}) => {
  // Normalize legacy 'FX' to 'MACRO_FX'
  const normalizedMode: ScreenMode = currentMode === 'FX' ? 'MACRO_FX' : currentMode;

  const currentTab = ALL_10_SCREENS.find((s) => s.id === normalizedMode);
  const activeBankFromMode = currentTab?.bank || 'PERFORMANCE';

  const [activeBank, setActiveBank] = useState<'PERFORMANCE' | 'STUDIO'>(activeBankFromMode);
  const [showOverviewDrawer, setShowOverviewDrawer] = useState<boolean>(false);

  // Sync bank tab when currentMode changes externally
  useEffect(() => {
    if (currentTab) {
      setActiveBank(currentTab.bank);
    }
  }, [normalizedMode, currentTab]);

  const displayedModes = isPerformanceView
    ? ALL_10_SCREENS.filter((s) => s.bank === 'PERFORMANCE')
    : ALL_10_SCREENS.filter((s) => s.bank === activeBank);

  const handleBankToggle = (bank: 'PERFORMANCE' | 'STUDIO') => {
    triggerHaptic('tap');
    setActiveBank(bank);
    // If current mode is not in this bank, switch to first screen of this bank
    const inBank = ALL_10_SCREENS.filter((s) => s.bank === bank);
    if (!inBank.some((s) => s.id === normalizedMode)) {
      onSelectMode(inBank[0].id);
    }
  };

  const handleModeClick = (modeId: ScreenMode) => {
    triggerHaptic('tap');
    onSelectMode(modeId);
    setShowOverviewDrawer(false);
  };

  return (
    <nav
      className={`w-full bg-[#08080b] border-t border-zinc-900/90 px-2 pt-1 pb-1.5 select-none z-30 shrink-0 ${className}`}
      aria-label="10 Screen Pro DJ Navigation"
    >
      {/* Top Ribbon: Bank A/B Switcher (PERFORMANCE vs STUDIO) + 10 Screens Overview Drawer Toggle */}
      {!isPerformanceView && (
        <div className="flex items-center justify-between max-w-lg mx-auto mb-1 px-1">
          <div className="flex items-center gap-1 bg-[#121217] p-0.5 rounded-lg border border-zinc-800/80">
            <button
              onClick={() => handleBankToggle('PERFORMANCE')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[9px] font-bold tracking-wider uppercase transition active:scale-95 ${
                activeBank === 'PERFORMANCE'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600/60 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span>PERF (1-5)</span>
            </button>

            <button
              onClick={() => handleBankToggle('STUDIO')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[9px] font-bold tracking-wider uppercase transition active:scale-95 ${
                activeBank === 'STUDIO'
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-600/60 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
              <span>STUDIO (6-10)</span>
            </button>
          </div>

          {/* 10-Screen Matrix Quick Jumper */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              setShowOverviewDrawer(!showOverviewDrawer);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono text-[9px] font-bold uppercase transition active:scale-95 ${
              showOverviewDrawer
                ? 'bg-zinc-800 text-white border-zinc-600'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Alle 10 App-Screens in der Matrix-Übersicht anzeigen"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>10 SCREENS</span>
          </button>
        </div>
      )}

      {/* 10-Screen Quick Jumper Drawer (Flyout when clicking 10 SCREENS) */}
      {showOverviewDrawer && (
        <div className="max-w-lg mx-auto mb-2 p-2 bg-[#0c0c11] border border-zinc-800 rounded-xl shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-zinc-800/80">
            <span className="font-mono text-[9px] font-black uppercase text-zinc-400 tracking-wider">
              10 App Screens Architektur (D2 Pro Controller)
            </span>
            <button
              onClick={() => setShowOverviewDrawer(false)}
              className="text-zinc-500 hover:text-white font-mono text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {ALL_10_SCREENS.map((s) => {
              const isActive = normalizedMode === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleModeClick(s.id)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition active:scale-95 ${
                    isActive
                      ? 'bg-zinc-800 text-white border-zinc-500 shadow-md ring-1 ring-white/20'
                      : 'bg-[#14141a] text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <span
                    className="font-mono text-[7.5px] px-1 rounded font-black mb-0.5"
                    style={{ color: s.accentColor }}
                  >
                    {s.badge}
                  </span>
                  <Icon className="w-4 h-4 mb-0.5" style={{ color: isActive ? s.accentColor : undefined }} />
                  <span className="font-mono text-[8px] font-bold truncate max-w-full">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary 5-Button Bank Navigation Grid */}
      <div className="grid gap-1 max-w-lg mx-auto items-center grid-cols-5">
        {displayedModes.map((mode) => {
          const isActive = normalizedMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode.id)}
              className={`flex flex-col items-center justify-center rounded-xl transition-all duration-100 ${
                hardwareMode ? 'h-14' : 'h-12'
              } ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              } active:scale-95 relative group`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Screen number index badge */}
              <span className="absolute top-1 left-1.5 font-mono text-[7.5px] text-zinc-600 group-hover:text-zinc-400">
                {mode.badge}
              </span>

              <div className="relative flex items-center justify-center mt-1">
                <Icon
                  className={`${hardwareMode ? 'w-5 h-5' : 'w-4 h-4'} ${
                    isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'
                  }`}
                  style={{ color: isActive ? mode.accentColor : undefined }}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: mode.accentColor,
                      boxShadow: `0 0 8px ${mode.accentColor}`,
                    }}
                  />
                )}
              </div>
              <span
                className={`font-mono tracking-wider mt-0.5 uppercase text-center ${
                  hardwareMode ? 'text-[10px] font-bold' : 'text-[8.5px] font-semibold'
                } ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}
              >
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
