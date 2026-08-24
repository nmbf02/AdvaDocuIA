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
  ChevronDown,
  FilePlus,
  HelpCircle,
  Check,
  Palette,
  Database
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
  autoBackupActive = true,
  autoBackupFrequency = '5m',
  dailyBackupActive = false,
  dailyBackupTime = '18:00',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0A3D62] text-white border-b border-white/10 shadow-md">
      <div className="max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-2 min-w-0">
          
          {/* LEFT: Logo & Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer focus:outline-none shrink-0"
              title="Ir a pantalla de inicio"
            >
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Advansys"
                  className="h-7 sm:h-8 w-auto max-w-[130px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-1.5 font-black tracking-wider text-white text-base">
                  <div className="p-1 rounded-md bg-white/10 border border-white/15">
                    <FileText className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <span className="tracking-[0.12em] hidden sm:inline">ADVANSYS</span>
                </div>
              )}
            </button>

            {/* Subtle separator & Project Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs text-blue-200/70 border-l border-white/15 pl-3 min-w-0">
              <span className="text-white/40">/</span>
              <span className="text-blue-100 font-medium truncate max-w-[240px] lg:max-w-[360px]">
                {projectName
                  ? projectName
                  : documentKind === 'notes'
                    ? 'Libre escritura'
                    : documentKind === 'technical'
                    ? 'Doc. Técnica Interna'
                    : 'Nueva Propuesta Técnica'}
              </span>
            </div>
          </div>

          {/* RIGHT: Compact, Organized Action Hub */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar">
            
            {/* GROUP 1: Document Actions (Nuevo + Historial) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* 1. New Document Button */}
              {onNewDocument && (
                <button
                  type="button"
                  onClick={onNewDocument}
                  className="h-8 sm:h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 hover:text-white transition-all shadow-xs cursor-pointer active:scale-95 border border-[#27ae60]"
                  title="Crear un nuevo documento (te preguntará si deseas guardar el actual)"
                >
                  <FilePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              )}

              {/* 2. Historial Button */}
              <button
                type="button"
                onClick={onOpenHistory}
                className="h-8 sm:h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 active:bg-white/20 text-white transition-all border border-white/15 cursor-pointer"
                title="Ver historial de documentos guardados"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden sm:inline">Historial</span>
                {historyCount > 0 && (
                  <span className="bg-[#2ECC71] text-slate-950 font-black text-[10px] min-w-[1.2rem] h-4 px-1 rounded-full flex items-center justify-center">
                    {historyCount}
                  </span>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-white/20 mx-0.5 hidden xs:block" />

            {/* GROUP 2: System & Config (Ajustes + Copias) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* 3. Settings Button */}
              <button
                type="button"
                onClick={onOpenSettings}
                className="h-8 sm:h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 active:bg-white/20 text-white transition-all border border-white/15 cursor-pointer"
                title="Personalizar logo, títulos y encabezados"
              >
                <Settings className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden md:inline">Ajustes</span>
              </button>

              {/* 4. Backup Center Button */}
              {onOpenBackup && (
                <button
                  type="button"
                  onClick={onOpenBackup}
                  className="h-8 sm:h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 active:bg-white/20 text-white transition-all border border-white/15 cursor-pointer relative"
                  title={`Centro de Copias de Seguridad (${autoBackupActive ? `Auto: ${autoBackupFrequency}` : 'Auto pausado'}${dailyBackupActive ? ` • Diario: ${dailyBackupTime}` : ''})`}
                >
                  <Database className="w-3.5 h-3.5 text-[#2ECC71]" />
                  <span className="hidden lg:inline">Copias / Backup</span>
                  {autoBackupActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse hidden sm:inline-block" title="Autoguardado por intervalo activo"></span>
                  ) : dailyBackupActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse hidden sm:inline-block" title={`Autoguardado diario a las ${dailyBackupTime} activo`}></span>
                  ) : null}
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-white/20 mx-0.5" />

            {/* GROUP 3: Theme & More Options */}
            <div className="flex items-center gap-1">
              {/* 5. Theme Toggle Icon */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl text-blue-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
                  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-200" />
                  )}
                </button>
              )}

              {/* 6. More Options Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`h-8 sm:h-9 inline-flex items-center justify-center gap-0.5 px-2 sm:px-2.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isMenuOpen 
                      ? 'bg-white/25 text-white border-white/30' 
                      : 'bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white border-white/15'
                  }`}
                  title="Más opciones y acciones de documento"
                  aria-expanded={isMenuOpen}
                >
                  <MoreVertical className="w-4 h-4" />
                  <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Panel */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Acciones de Documento
                    </div>

                    {onNewDocument && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNewDocument();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                      >
                        <FilePlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="font-bold leading-none">Nuevo Documento</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Crear propuesta o especificación</p>
                        </div>
                      </button>
                    )}

                    {onGoHome && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onGoHome();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-[#0A3D62] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Home className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                        <div>
                          <p className="font-semibold leading-none">Inicio / Bienvenida</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Elegir nuevo o continuar</p>
                        </div>
                      </button>
                    )}

                    {onRevertToSaved && hasSavedVersion && documentKind !== 'notes' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onRevertToSaved();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-[#0A3D62] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                        <div>
                          <p className="font-semibold leading-none">Volver al último guardado</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Recuperar versión guardada</p>
                        </div>
                      </button>
                    )}

                    {documentKind !== 'notes' && (
                    <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLoadPreset();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-semibold leading-none">Cargar Ejemplo Demo</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Llenar datos de prueba</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onReset();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <div>
                        <p className="font-semibold leading-none">Limpiar Formulario</p>
                        <p className="text-[10px] text-red-500/80 dark:text-red-400/80 mt-0.5">Empezar documento de cero</p>
                      </div>
                    </button>
                    </>
                    )}

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {onOpenBackup && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenBackup();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-[#0A3D62] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Database className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                        <div>
                          <p className="font-semibold leading-none">Copia de Seguridad</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Exportar o importar historial</p>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-semibold leading-none">Identidad y Encabezados</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Logo y títulos del banner</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
