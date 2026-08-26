import React, { useEffect, useState } from 'react';
import { AgentConfig, AgentUnderstanding, getEffectiveAgentConfig } from '../types';
import { readApiJson } from '../utils/apiJson';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, X, Check } from 'lucide-react';

export type InterviewDocType = 'proposal' | 'technical' | 'slides';

const STARTER_QUESTIONS: Record<InterviewDocType, string[]> = {
  proposal: [
    '¿Quién es el cliente y cómo se llama el proyecto o ticket?',
    '¿Cuál es la premisa? (contexto, sistema actual y qué se necesita)',
    '¿Cuál es la incidencia o problema a resolver?',
    '¿Qué cuestionantes, excepciones o riesgos hay?',
    '¿Cómo es el flujo actual, paso a paso?',
  ],
  technical: [
    '¿Qué sistema, módulo o ticket documentas?',
    '¿Cuál es la ruta de acceso o pantalla en el sistema?',
    '¿Cuál es el flujo operativo interno esperado?',
    '¿Qué diseño de interfaz o estructura de datos aplica?',
    '¿Hay consideraciones técnicas, de seguridad o de código?',
  ],
  slides: [
    '¿Para quién es la presentación y cuál es el título?',
    '¿Cuál es el mensaje o problema central?',
    '¿Qué beneficios o alcance debe destacar?',
    '¿Qué solución o pasos mostrar?',
    '¿Cuál es el cierre o los próximos pasos?',
  ],
};

export function buildNotesFromInterview(
  questions: string[],
  answers: string[],
  understanding: AgentUnderstanding | null
): string {
  const premisa = [understanding?.objetivo, understanding?.alcance, answers[1] || answers[0]]
    .filter((x) => x && String(x).trim())
    .join('\n\n');
  const incidencia = [understanding?.reglas, answers[2]].filter((x) => x && String(x).trim()).join('\n\n');
  const cuestionantes = [understanding?.pendientes, answers[3]].filter((x) => x && String(x).trim()).join('\n\n');
  const flujo = [understanding?.supuestos, answers[4]].filter((x) => x && String(x).trim()).join('\n\n');
  const parts: string[] = [];
  if (premisa.trim()) parts.push(`1. PREMISA:\n${premisa.trim()}`);
  if (incidencia.trim()) parts.push(`2. INCIDENCIA:\n${incidencia.trim()}`);
  if (cuestionantes.trim()) parts.push(`3. CUESTIONANTES:\n${cuestionantes.trim()}`);
  if (flujo.trim()) parts.push(`4. FLUJO ACTUAL:\n${flujo.trim()}`);
  if (!parts.length) {
    return questions
      .map((q, i) => (answers[i]?.trim() ? `${q}\n${answers[i].trim()}` : ''))
      .filter(Boolean)
      .join('\n\n');
  }
  return parts.join('\n\n');
}

interface AgentInterviewModalProps {
  isOpen: boolean;
  documentType: InterviewDocType;
  agentConfig: AgentConfig;
  onClose: () => void;
  onProceed: (payload: {
    notes: string;
    answers: string[];
    questions: string[];
    understanding: AgentUnderstanding | null;
  }) => void;
}

export const AgentInterviewModal: React.FC<AgentInterviewModalProps> = ({
  isOpen,
  documentType,
  agentConfig,
  onClose,
  onProceed,
}) => {
  const agent = getEffectiveAgentConfig(agentConfig);
  const [phase, setPhase] = useState<'questions' | 'understanding'>('questions');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [understanding, setUnderstanding] = useState<AgentUnderstanding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const list = STARTER_QUESTIONS[documentType] || STARTER_QUESTIONS.proposal;
    setPhase('questions');
    setQuestions(list);
    setAnswers(list.map(() => ''));
    setIndex(0);
    setUnderstanding(null);
    setError(null);
    setLoading(false);
  }, [isOpen, documentType]);

  const loadUnderstanding = async () => {
    setLoading(true);
    setError(null);
    const joined = questions
      .map((q, i) => `P: ${q}\nR: ${answers[i]?.trim() || '(sin respuesta)'}`)
      .join('\n\n');
    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'understand',
          rawRequirements: joined,
          metadata: {},
          agentConfig: agent,
          answers: questions.map((q, i) => ({ question: q, answer: answers[i] || '' })),
        }),
      });
      const data = await readApiJson(response);
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo armar el resumen.');
      }
      setUnderstanding(data.understanding);
      setPhase('understanding');
    } catch (err: any) {
      setUnderstanding({
        objetivo: answers[1] || answers[0] || '',
        alcance: answers[0] || '',
        reglas: answers[2] || '',
        supuestos: answers[4] || '',
        pendientes: answers[3] || '',
      });
      setPhase('understanding');
      setError(err?.message ? `${err.message} Se muestra un resumen con tus respuestas.` : null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = questions.length;
  const currentQ = questions[index] || '';
  const isLast = index >= total - 1;
  const typeLabel =
    documentType === 'technical'
      ? 'Doc. técnica'
      : documentType === 'slides'
        ? 'Diapositivas'
        : 'Propuesta';

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-white/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold">Antes de escribir · {typeLabel}</h2>
              <p className="text-[11px] text-blue-200 truncate">
                {phase === 'questions'
                  ? `Pregunta ${Math.min(index + 1, total)} de ${total}`
                  : 'Confirma lo entendido'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {phase === 'questions' && total > 0 && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-[#2ECC71] transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-2 rounded-lg">{error}</div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-600 py-10 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#0A3D62]" />
              <span>Redactando lo entendido...</span>
            </div>
          )}

          {!loading && phase === 'questions' && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#0A3D62] leading-snug block">{currentQ}</label>
              <textarea
                rows={5}
                value={answers[index] || ''}
                onChange={(e) => {
                  const next = [...answers];
                  next[index] = e.target.value;
                  setAnswers(next);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800"
                placeholder="Escribe tu respuesta"
                autoFocus
              />
            </div>
          )}

          {!loading && phase === 'understanding' && understanding && (
            <div className="space-y-3 text-xs text-slate-700">
              <p className="text-slate-500">Revisa el resumen. Al continuar se cargan las notas del documento para que completes el análisis.</p>
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3">
                <span className="font-bold text-[#0A3D62] block mb-1">Objetivo</span>
                {understanding.objetivo || '—'}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="font-bold text-[#0A3D62] block mb-1">Alcance</span>
                {understanding.alcance || '—'}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="font-bold text-[#0A3D62] block mb-1">Reglas</span>
                {understanding.reglas || '—'}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="font-bold text-[#0A3D62] block mb-1">Supuestos</span>
                {understanding.supuestos || '—'}
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <span className="font-bold text-amber-900 block mb-1">Pendientes</span>
                {understanding.pendientes || '—'}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 px-5 border-t border-slate-200 flex items-center justify-between gap-2">
          {phase === 'questions' ? (
            <>
              <button
                type="button"
                disabled={index === 0 || loading}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (isLast) void loadUnderstanding();
                  else setIndex((i) => i + 1);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl flex items-center gap-1.5"
              >
                {isLast ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Ver lo entendido
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPhase('questions')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  onProceed({
                    notes: buildNotesFromInterview(questions, answers, understanding),
                    answers,
                    questions,
                    understanding,
                  })
                }
                className="px-4 py-2 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl"
              >
                Continuar al documento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
