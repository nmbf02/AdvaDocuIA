import React from 'react';
import { DocumentTable } from '../types';
import { Plus, Trash2, Table2, Columns3, Rows3 } from 'lucide-react';

interface DocumentTablesEditorProps {
  tables: DocumentTable[];
  onChange: (tables: DocumentTable[]) => void;
  compact?: boolean;
  getTagIndex?: (localIndex: number) => number;
}

export function createEmptyDocumentTable(index: number): DocumentTable {
  return {
    id: `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `Tabla ${index}`,
    headers: ['Columna 1', 'Columna 2', 'Columna 3'],
    rows: [
      ['', '', ''],
      ['', '', ''],
    ],
  };
}

export function tableTag(index1: number): string {
  return `[TABLA_${index1}]`;
}

export const DocumentTablesEditor: React.FC<DocumentTablesEditorProps> = ({
  tables,
  onChange,
  compact,
  getTagIndex,
}) => {
  const updateTable = (index: number, patch: Partial<DocumentTable>) => {
    onChange(tables.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const updateHeader = (ti: number, ci: number, value: string) => {
    const headers = [...tables[ti].headers];
    headers[ci] = value;
    updateTable(ti, { headers });
  };

  const updateCell = (ti: number, ri: number, ci: number, value: string) => {
    const rows = tables[ti].rows.map((row, r) => (r === ri ? row.map((c, col) => (col === ci ? value : c)) : row));
    updateTable(ti, { rows });
  };

  const addRow = (ti: number) => {
    const cols = tables[ti].headers.length || 1;
    updateTable(ti, { rows: [...tables[ti].rows, Array(cols).fill('')] });
  };

  const addCol = (ti: number) => {
    const t = tables[ti];
    updateTable(ti, {
      headers: [...t.headers, `Columna ${t.headers.length + 1}`],
      rows: t.rows.map((row) => [...row, '']),
    });
  };

  const removeCol = (ti: number, ci: number) => {
    const t = tables[ti];
    if (t.headers.length <= 1) return;
    updateTable(ti, {
      headers: t.headers.filter((_, i) => i !== ci),
      rows: t.rows.map((row) => row.filter((_, i) => i !== ci)),
    });
  };

  const removeRow = (ti: number, ri: number) => {
    if (tables[ti].rows.length <= 1) return;
    updateTable(ti, { rows: tables[ti].rows.filter((_, i) => i !== ri) });
  };

  return (
    <div className="space-y-4">
      {tables.length === 0 && !compact && (
        <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-3">
          Aún no hay tablas. Usa <strong>Insertar tabla</strong> en cualquier sección o pulsa el botón de abajo.
        </p>
      )}

      {tables.map((table, ti) => (
        <div key={table.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] font-bold bg-[#0A3D62] text-white px-2 py-0.5 rounded shrink-0">
                {tableTag(getTagIndex ? getTagIndex(ti) : ti + 1)}
              </span>
              <input
                type="text"
                value={table.title}
                onChange={(e) => updateTable(ti, { title: e.target.value })}
                className="flex-1 min-w-0 px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded text-[#0A3D62]"
                placeholder="Título de la tabla"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => addRow(ti)}
                className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded"
                title="Agregar fila"
              >
                <Rows3 className="w-3 h-3 mr-1" />
                Fila
              </button>
              <button
                type="button"
                onClick={() => addCol(ti)}
                className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded"
                title="Agregar columna"
              >
                <Columns3 className="w-3 h-3 mr-1" />
                Columna
              </button>
              <button
                type="button"
                onClick={() => onChange(tables.filter((_, i) => i !== ti))}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Eliminar tabla"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-xs">
              <thead>
                <tr>
                  {table.headers.map((h, ci) => (
                    <th key={ci} className="border border-slate-300 bg-[#0A3D62] p-0 relative">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHeader(ti, ci, e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent text-white font-semibold placeholder:text-blue-200 focus:outline-none"
                      />
                      {table.headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCol(ti, ci)}
                          className="absolute top-0.5 right-0.5 text-blue-200 hover:text-white"
                          title="Quitar columna"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    {table.headers.map((_, ci) => (
                      <td key={ci} className="border border-slate-300 p-0">
                        <input
                          type="text"
                          value={row[ci] || ''}
                          onChange={(e) => updateCell(ti, ri, ci, e.target.value)}
                          className="w-full px-2 py-1.5 bg-transparent text-slate-800 focus:outline-none focus:bg-white"
                          placeholder="—"
                        />
                      </td>
                    ))}
                    <td className="border-0 w-8 p-0.5">
                      <button
                        type="button"
                        onClick={() => removeRow(ti, ri)}
                        disabled={table.rows.length <= 1}
                        className="p-1 text-slate-300 hover:text-red-600 disabled:opacity-20"
                        title="Quitar fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!compact && (
      <button
        type="button"
        onClick={() => onChange([...tables, createEmptyDocumentTable(tables.length + 1)])}
        className="inline-flex items-center px-3 py-2 text-xs font-bold text-[#0A3D62] bg-white hover:bg-blue-50 border border-slate-300 rounded-xl"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Nueva tabla
      </button>
      )}
    </div>
  );
};

export const InsertTableButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors"
    title="Agregar una tabla en este apartado, sin salir del editor"
  >
    <Table2 className="w-3 h-3 mr-1" />
    Insertar tabla
  </button>
);
