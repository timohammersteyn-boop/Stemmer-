import React, { useState } from 'react';
import {
  Download,
  X,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Globe,
  Share2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface PwaInstallOverlayProps {
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstallPwa: () => void;
}

export const PwaInstallOverlay: React.FC<PwaInstallOverlayProps> = ({
  onClose,
  isInstallable,
  isInstalled,
  onInstallPwa,
}) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenStandalone = () => {
    if (typeof window !== 'undefined') {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0f0f14] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-850 bg-[#121218]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-tech font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                PWA App Installieren
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8px] font-mono font-bold">
                  CHROME
                </span>
              </h2>
              <span className="font-mono text-[9px] text-zinc-400 block">
                Schubertgrv als eigenständige Vollbild-App
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {isInstalled ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-mono text-xs font-bold block">Bereits als App installiert!</span>
                <span className="font-mono text-[10px] text-emerald-400/80 block">
                  Du kannst Schubertgrv direkt von deinem Homescreen oder App-Drawer starten.
                </span>
              </div>
            </div>
          ) : isInstallable ? (
            <button
              onClick={onInstallPwa}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono text-xs font-black uppercase tracking-wider active:scale-[0.98] transition shadow-[0_0_16px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>DIREKT IN CHROME INSTALLIEREN</span>
            </button>
          ) : null}

          {/* Direct PWA URL Box */}
          <div className="p-3 bg-[#15151c] rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                Direkte App-Adresse (URL)
              </span>
              <span className="text-[8.5px] font-mono text-zinc-500">
                Im neuen Tab öffnen
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#0a0a0e] p-2 rounded-lg border border-zinc-850">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-transparent font-mono text-[10px] text-zinc-200 outline-none select-all truncate"
                title="PWA Applet URL"
              />
              <button
                onClick={handleCopyUrl}
                className={`px-2.5 py-1 rounded-md font-mono text-[9px] font-bold flex items-center gap-1 transition active:scale-95 shrink-0 border ${
                  copied
                    ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                }`}
                title="Adresse in Zwischenablage kopieren"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'KOPIERT!' : 'KOPIEREN'}</span>
              </button>
            </div>

            <button
              onClick={handleOpenStandalone}
              className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>IM NEUEN VOLLBILD-TAB ÖFFNEN</span>
            </button>
          </div>

          {/* Android Chrome Step-by-Step Guide */}
          <div className="p-3 bg-[#131319] rounded-xl border border-zinc-800 space-y-2.5">
            <span className="font-mono text-[9.5px] text-zinc-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              Installation in Chrome auf Android:
            </span>

            <ol className="space-y-2 text-zinc-300 font-mono text-[10px] leading-relaxed list-decimal list-inside">
              <li className="bg-zinc-900/60 p-1.5 rounded-md border border-zinc-850">
                Öffne die kopierte Adresse oben in einem <strong>neuen Chrome-Tab</strong> (nicht im Studio-Iframe).
              </li>
              <li className="bg-zinc-900/60 p-1.5 rounded-md border border-zinc-850">
                Tippe oben rechts auf die <strong>drei Punkte (⋮)</strong> des Chrome-Menüs.
              </li>
              <li className="bg-zinc-900/60 p-1.5 rounded-md border border-zinc-850">
                Wähle <strong>"App installieren"</strong> oder <strong>"Zum Startbildschirm hinzufügen"</strong>.
              </li>
              <li className="bg-zinc-900/60 p-1.5 rounded-md border border-zinc-850 text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                Fertig! Die App startet nun mit Nothing-Icon im Vollbildmodus.
              </li>
            </ol>
          </div>

          {/* iOS Safari Info */}
          <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-850/80 text-zinc-400 font-mono text-[9px] flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>
              <strong>iOS Safari:</strong> Teilen-Symbol (Viereck mit Pfeil) ➔ &quot;Zum Home-Bildschirm&quot;.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-850 bg-[#121218] flex items-center justify-between">
          <span className="font-mono text-[9px] text-zinc-500">
            Offline-Support via Service Worker aktiviert
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[9.5px] font-bold transition active:scale-95"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
