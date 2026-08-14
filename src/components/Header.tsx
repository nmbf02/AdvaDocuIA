import React from 'react';
import { FileText, Sparkles, FolderOpen, RotateCcw, Settings } from 'lucide-react';

interface HeaderProps {
  onLoadPreset: () => void;
  onReset: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  logoDataUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadPreset,
  onReset,
  onOpenHistory,
  onOpenSettings,
  historyCount,
  logoDataUrl
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0A3D62]/92 text-white backdrop-blur-md sticky-bar relative">
      <div className="max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-xl shadow-sm border border-white/80 shrink-0">
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Logo corporativo"
                  className="h-7 sm:h-8 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-[#0A3D62]">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#2ECC71]" />
                  <span className="text-base sm:text-xl tracking-[0.14em]">ADVANSYS</span>
                </div>
              )}
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Generador de documentos</p>
              <p className="text-[11px] text-blue-200/80 leading-tight">Propuestas técnicas · Word</p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onOpenHistory}
              className="relative inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/18 text-white transition-colors border border-white/15"
              title="Ver documentos guardados"
            >
              <FolderOpen className="w-4 h-4 sm:mr-1.5 text-blue-200" />
              <span className="hidden sm:inline">Historial</span>
              {historyCount > 0 && (
                <span className="ml-1 sm:ml-1.5 bg-[#2ECC71] text-slate-950 font-bold text-[10px] min-w-[1.15rem] px-1.5 py-0.5 rounded-full text-center">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/18 text-white transition-colors border border-white/15"
              title="Logo y ajustes de la aplicación"
            >
              <Settings className="w-4 h-4 sm:mr-1.5 text-[#2ECC71]" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>

            <button
              onClick={onLoadPreset}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-xl bg-transparent hover:bg-white/10 text-blue-100 hover:text-white transition-colors border border-white/10"
              title="Cargar un ejemplo para practicar"
            >
              <Sparkles className="w-4 h-4 sm:mr-1.5 text-emerald-300" />
              <span className="hidden lg:inline">Ver ejemplo</span>
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-xl bg-transparent hover:bg-red-900/40 text-slate-300 hover:text-red-100 transition-colors border border-white/10"
              title="Vaciar el formulario y empezar de cero"
            >
              <RotateCcw className="w-4 h-4 sm:mr-1" />
              <span className="hidden lg:inline">Empezar de cero</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
