import React from 'react';
import { FileText, Sparkles, FolderOpen, RotateCcw, ShieldCheck, Download } from 'lucide-react';

interface HeaderProps {
  onLoadPreset: () => void;
  onReset: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadPreset,
  onReset,
  onOpenHistory,
  historyCount
}) => {
  return (
    <header className="bg-[#0A3D62] text-white shadow-lg border-b border-[#1E5F8A]">
      <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center space-x-1.5 font-bold tracking-tight text-[#0A3D62]">
                <FileText className="w-5 h-5 text-[#2ECC71]" />
                <span className="text-xl tracking-wider">ADVANSYS</span>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="text-xs bg-[#1E5F8A] text-emerald-300 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#2ECC71]/30">
                DocGen AI Platform
              </span>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onLoadPreset}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1E5F8A] hover:bg-[#236e9f] text-white transition-colors border border-blue-400/30 shadow-sm"
              title="Cargar datos de prueba de un proyecto bancario de Advansys"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Cargar Ejemplo</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 shadow-sm"
              title="Ver documentos generados anteriormente"
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
              <span>Historial</span>
              {historyCount > 0 && (
                <span className="ml-1.5 bg-[#2ECC71] text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/50 hover:bg-red-900/40 text-slate-300 hover:text-red-200 transition-colors border border-slate-700/60"
              title="Limpiar todos los campos"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
