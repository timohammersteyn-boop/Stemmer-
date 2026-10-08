import React from 'react';
import { ActivityLogItem } from '../types';
import { Terminal } from 'lucide-react';

interface ActivityTickerProps {
  lastLog?: ActivityLogItem;
  onOpenFeed: () => void;
  className?: string;
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({
  lastLog,
  onOpenFeed,
  className = '',
}) => {
  if (!lastLog) return null;

  return (
    <div
      onClick={onOpenFeed}
      className={`group cursor-pointer flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#121217]/90 hover:bg-[#181820] border border-zinc-800/80 hover:border-zinc-700 shadow-md backdrop-blur-md transition-all active:scale-95 select-none ${className}`}
      title="Activity Feed öffnen"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
      <span className="font-mono text-[9px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-wider shrink-0">
        [{lastLog.category}]
      </span>
      <span className="font-mono text-[10px] text-zinc-300 group-hover:text-white truncate max-w-[190px]">
        {lastLog.message}
      </span>
      <Terminal className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-0.5" />
    </div>
  );
};
