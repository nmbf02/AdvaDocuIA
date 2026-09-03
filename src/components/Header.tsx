import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  FolderOpen,
  RotateCcw,
  Settings,
  Home,
  Sun,
  Moon,
  MoreVertical,
  FilePlus,
  Database,
} from 'lucide-react';

interface HeaderProps {
  onNewDocument?: () => void;
  onLoadPreset: () => void;
  onReset: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenBackup?: () => void;
  onRevertToSaved?: () => void;
  hasSavedVersion?: boolean;
  onGoHome?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  historyCount: number;
  logoDataUrl?: string;
  projectName?: string;
  documentKind?: 'proposal' | 'technical' | 'notes';
  autoBackupActive?: boolean;
  autoBackupFrequency?: string;
  dailyBackupActive?: boolean;
  dailyBackupTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDocument,
  onLoadPreset,
  onReset,
  onOpenHistory,
  onOpenSettings,
  onOpenBackup,
  onRevertToSaved,
  hasSavedVersion = true,
  onGoHome,
  theme = 'light',
  onToggleTheme,
  historyCount,
  logoDataUrl,
  projectName,
  documentKind = 'proposal',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const docLabel = projectName
    ? projectName
    : documentKind === 'notes'
      ? 'Notas'
      : documentKind === 'technical'
        ? 'Doc. técnica'
        : 'Propuesta';

  const ghost =
    'h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 cursor-pointer';
  const iconOnly =
    'h-9 w-9 inline-flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 cursor-pointer';

  return (
    <header className="sticky top-0 z-50 bg-[#0A3D62] text-white">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-5">
        <div className="h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-2 shrink-0 cursor-pointer"
              title="Inicio"
            >
              {logoDataUrl ? (
                <img src={logoDataUrl} alt="Advansys" className="h-7 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="flex items-center gap-1.5 font-black text-sm tracking-wider">
                  <FileText className="w-4 h-4 text-[#2ECC71]" />
                  <span className="hidden sm:inline">ADVANSYS</span>
                </span>
              )}
            </button>
            <span className="hidden sm:block text-white/25">/</span>
            <span className="hidden sm:block text-sm text-white/80 truncate max-w-[280px] lg:max-w-[420px]">
              {docLabel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onNewDocument && (
              <button
                type="button"
                onClick={onNewDocument}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold bg-[#2ECC71] text-slate-950 hover:bg-[#27ae60] cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            )}
            <button type="button" onClick={onOpenHistory} className={ghost} title="Historial">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden md:inline">Historial</span>
              {historyCount > 0 && (
                <span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={iconOnly}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                className={`${iconOnly} ${isMenuOpen ? 'bg-white/15' : ''}`}
                title="Más"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-[80]">
                  {onGoHome && (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onGoHome();
                      }}
                    >
                      <Home className="w-4 h-4 text-slate-500" />
                      Inicio
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Ajustes
                  </button>
                  {onOpenBackup && (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenBackup();
                      }}
                    >
                      <Database className="w-4 h-4 text-slate-500" />
                      Copias
                    </button>
                  )}
                  {documentKind !== 'notes' && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLoadPreset();
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-slate-500" />
                        Cargar demo
                      </button>
                      {onRevertToSaved && hasSavedVersion && (
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onRevertToSaved();
                          }}
                        >
                          <RotateCcw className="w-4 h-4 text-slate-500" />
                          Último guardado
                        </button>
                      )}
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onReset();
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Limpiar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
