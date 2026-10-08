import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  hardwareMode?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  hardwareMode = false,
}) => {
  return (
    <div
      className={`relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-[#08080a] text-zinc-100 ${
        hardwareMode ? 'font-mono contrast-125' : ''
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Background Subtle Nothing-style Dot Grid Pattern */}
      <div className="absolute inset-0 bg-dot-grid-subtle pointer-events-none opacity-40 z-0" />

      {/* Main App Content Viewport */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};
