import React, { useState, useRef } from 'react';
import { Download, Upload, ShieldCheck, FileJson, AlertCircle, CheckCircle2, RotateCcw, Database, HardDrive, RefreshCw, X } from 'lucide-react';
import { SavedProposal, BrandingSettings } from '../types';
import { exportAppBackup, parseAndValidateBackup, AppBackupData } from '../utils/backupManager';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedProposal[];
  branding?: BrandingSettings | null;
  currentDraft?: any | null;
  theme?: 'light' | 'dark';
  onRestoreBackup: (backup: AppBackupData, mode: 'merge' | 'replace') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  history,
  branding,
  currentDraft,
  theme,
  onRestoreBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<AppBackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportAppBackup(history, branding, currentDraft, theme);
      setSuccessMessage('¡Copia de seguridad descargada exitosamente en formato JSON!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(`No se pudo generar la copia de seguridad: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Por favor selecciona un archivo con extensión .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateBackup(content);
      if (result.success && result.data) {
        setImportPreview(result.data);
      } else {
        setErrorMessage(result.error || 'Archivo de respaldo no válido.');
        setImportPreview(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo desde tu equipo.');
      setImportPreview(null);
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!importPreview) return;
    try {
      onRestoreBackup(importPreview, restoreMode);
      setSuccessMessage(
        restoreMode === 'replace'
          ? `¡Se han restaurado ${importPreview.history.length} documentos reemplazando el historial anterior!`
          : `¡Se han combinado ${importPreview.history.length} documentos con tu historial actual!`
      );
      setImportPreview(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Error al restaurar: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#0A3D62] text-white p-4 px-6 flex items-center justify-between border-b border-[#1E5F8A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/10">
              <Database className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Copia de Seguridad y Restauración</h2>
              <p className="text-[11px] text-blue-200">
                Exporta o importa todo tu historial de propuestas, doc. técnicas y ajustes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* EXPORT SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#0A3D62]" />
                  <h3 className="text-sm font-bold text-slate-900">1. Descargar Copia de Seguridad (Backup)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Guarda un archivo <strong>.JSON</strong> en tu computadora con todo tu historial de documentos ({history.length} guardados), logos, títulos personalizados y el borrador activo.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    <HardDrive className="w-3.5 h-3.5 text-[#0A3D62]" />
                    {history.length} documentos en historial
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Ajustes de marca incluidos
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#2ECC71]" />
                <span>Descargar Backup</span>
              </button>
            </div>
          </div>

          {/* IMPORT SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">2. Restaurar o Subir Copia de Seguridad</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Selecciona un archivo <strong>.JSON</strong> de backup que hayas descargado anteriormente para recuperar tus documentos aunque hayas limpiado la caché o cambiado de navegador.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,application/json"
              className="hidden"
            />

            {!importPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#0A3D62] bg-white rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50/20 group"
              >
                <FileJson className="w-8 h-8 mx-auto text-slate-400 group-hover:text-[#0A3D62] transition-colors mb-2" />
                <p className="text-xs font-bold text-slate-800 group-hover:text-[#0A3D62]">
                  Haz clic aquí para seleccionar tu archivo de respaldo (.json)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Compatible con backups generados por ADVANSYS Document Generator
                </p>
              </div>
            ) : (
              <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Archivo de respaldo reconocido</h4>
                      <p className="text-[11px] text-slate-500">
                        Exportado el: {new Date(importPreview.exportDate).toLocaleString('es-DO')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100"
                  >
                    Cambiar archivo
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-semibold">Documentos en archivo</span>
                    <span className="text-sm font-bold text-[#0A3D62]">
                      {importPreview.history.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-semibold">Borrador actual</span>
                    <span className="text-sm font-bold text-slate-800">
                      {importPreview.draft ? 'Sí incluido' : 'No'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Ajustes y Marca</span>
                    <span className="text-sm font-bold text-slate-800">
                      {importPreview.settings ? 'Incluidos' : 'Por defecto'}
                    </span>
                  </div>
                </div>

                {/* Mode Selector: Merge vs Replace */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-800 block">¿Cómo deseas restaurar los datos?</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'border-[#0A3D62] bg-blue-50/50 ring-1 ring-[#0A3D62]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-[#0A3D62] focus:ring-[#0A3D62]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Combinar (Recomendado)</span>
                        <span className="text-slate-500 text-[11px]">
                          Agrega los documentos del backup sin borrar los que ya tengas en pantalla.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        restoreMode === 'replace'
                          ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Reemplazar todo</span>
                        <span className="text-slate-500 text-[11px]">
                          Sobrescribe completamente el historial actual con el del archivo.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Action button to proceed */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="px-4 py-2 bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Confirmar y Restaurar Datos</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-[11px] text-[#0A3D62]">
            <ShieldCheck className="w-4 h-4 text-[#0A3D62] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Consejo de seguridad:</strong> Te recomendamos descargar un backup periódico de tus propuestas cada semana o antes de limpiar la caché del navegador para tener tus trabajos siempre respaldados y seguros.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
