import React from 'react';
import type { SynapseNode } from '../../types';
import {
  Trash2,
  CheckSquare,
  Square,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import { useSynapseStore } from '../../store/synapseStore';
import { CustomSelect } from '../ui/CustomSelect';

interface TypeFieldsProps {
  node: SynapseNode;
  isEditable: boolean;
  onUpdateMeta: (newMeta: any) => void;
}

export const TypeFields: React.FC<TypeFieldsProps> = ({ node, isEditable, onUpdateMeta }) => {
  const meta = (node.meta || {}) as any;
  const allNodes = useSynapseStore((s) => s.nodes);

  // 1. SOLUTION
  if (node.type === 'solution') {
    const pros = meta.pros || [];
    const cons = meta.cons || [];
    const status = meta.status || 'considering';

    const addPro = (text: string) => {
      if (!text.trim()) return;
      onUpdateMeta({ ...meta, pros: [...pros, text.trim()] });
    };

    const removePro = (index: number) => {
      onUpdateMeta({ ...meta, pros: pros.filter((_: any, i: number) => i !== index) });
    };

    const addCon = (text: string) => {
      if (!text.trim()) return;
      onUpdateMeta({ ...meta, cons: [...cons, text.trim()] });
    };

    const removeCon = (index: number) => {
      onUpdateMeta({ ...meta, cons: cons.filter((_: any, i: number) => i !== index) });
    };

    return (
      <div className="space-y-4 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-semibold text-text-muted">Статус решения:</label>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'considering', label: 'В рассмотрении 🟡', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
              { id: 'accepted', label: 'Принято ✅', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
              { id: 'rejected', label: 'Отклонено ❌', color: 'border-red-500 text-red-400 bg-red-500/10' },
            ].map((st) => (
              <button
                key={st.id}
                disabled={!isEditable}
                onClick={() => onUpdateMeta({ ...meta, status: st.id })}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                  status === st.id ? `${st.color} font-bold shadow-sm` : 'border-border text-text-muted hover:text-text-main'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {status === 'rejected' && (
          <div>
            <label className="text-xs font-semibold text-red-400 block mb-1">Причина отклонения:</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.rejection_reason || ''}
              onChange={(e) => onUpdateMeta({ ...meta, rejection_reason: e.target.value })}
              placeholder="Почему решение не подошло..."
              className="w-full bg-surface border border-red-500/40 rounded-lg px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-red-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* PROS */}
          <div className="bg-surface/80 p-3 rounded-lg border border-emerald-500/20">
            <h5 className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
              <span>Плюсы ({pros.length})</span>
            </h5>
            <ul className="space-y-1.5">
              {pros.map((p: string, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs text-text-main bg-surface-2 px-2 py-1 rounded">
                  <span className="leading-tight">+ {p}</span>
                  {isEditable && (
                    <button onClick={() => removePro(i)} className="text-text-muted hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {isEditable && (
              <input
                type="text"
                placeholder="+ Добавить плюс и нажать Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addPro((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="mt-2 w-full bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* CONS */}
          <div className="bg-surface/80 p-3 rounded-lg border border-red-500/20">
            <h5 className="text-xs font-bold text-red-400 mb-2 flex items-center justify-between">
              <span>Минусы ({cons.length})</span>
            </h5>
            <ul className="space-y-1.5">
              {cons.map((c: string, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs text-text-main bg-surface-2 px-2 py-1 rounded">
                  <span className="leading-tight">- {c}</span>
                  {isEditable && (
                    <button onClick={() => removeCon(i)} className="text-text-muted hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {isEditable && (
              <input
                type="text"
                placeholder="+ Добавить минус и нажать Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCon((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="mt-2 w-full bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-red-500"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. FEATURE
  if (node.type === 'feature') {
    const priority = meta.priority || 'medium';
    const status = meta.status || 'planned';
    const criteria = meta.acceptance_criteria || [];

    const toggleCriteria = (id: string) => {
      if (!isEditable) return;
      onUpdateMeta({
        ...meta,
        acceptance_criteria: criteria.map((c: any) =>
          c.id === id ? { ...c, done: !c.done } : c
        ),
      });
    };

    const addCriterion = (text: string) => {
      if (!text.trim()) return;
      const newCrit = { id: `ac-${Date.now()}`, text: text.trim(), done: false };
      onUpdateMeta({ ...meta, acceptance_criteria: [...criteria, newCrit] });
    };

    const removeCriterion = (id: string) => {
      onUpdateMeta({
        ...meta,
        acceptance_criteria: criteria.filter((c: any) => c.id !== id),
      });
    };

    return (
      <div className="space-y-4 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1.5">Приоритет (Priority):</label>
            <div className="flex items-center gap-1">
              {[
                { id: 'critical', label: 'Critical 🔥', color: 'text-red-400 border-red-500 bg-red-500/10' },
                { id: 'high', label: 'High ⚡', color: 'text-amber-400 border-amber-500 bg-amber-500/10' },
                { id: 'medium', label: 'Medium 🔹', color: 'text-blue-400 border-blue-500 bg-blue-500/10' },
                { id: 'low', label: 'Low ⚪', color: 'text-zinc-400 border-zinc-500 bg-zinc-500/10' },
              ].map((p) => (
                <button
                  key={p.id}
                  disabled={!isEditable}
                  onClick={() => onUpdateMeta({ ...meta, priority: p.id })}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                    priority === p.id ? `${p.color} font-bold` : 'border-border text-text-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1.5">Статус разработки:</label>
            <div className="flex items-center gap-1">
              {[
                { id: 'planned', label: 'Запланировано', color: 'text-zinc-400 border-zinc-500 bg-zinc-500/10' },
                { id: 'in_progress', label: 'В работе 🚀', color: 'text-indigo-400 border-indigo-500 bg-indigo-500/10' },
                { id: 'done', label: 'Готово ✅', color: 'text-emerald-400 border-emerald-500 bg-emerald-500/10' },
              ].map((s) => (
                <button
                  key={s.id}
                  disabled={!isEditable}
                  onClick={() => onUpdateMeta({ ...meta, status: s.id })}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                    status === s.id ? `${s.color} font-bold` : 'border-border text-text-muted'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-text-main flex items-center justify-between mb-2">
            <span>Критерии приемки (Acceptance Criteria):</span>
            <span className="text-[11px] font-mono text-text-muted">
              {criteria.filter((c: any) => c.done).length} / {criteria.length} выполнено
            </span>
          </label>
          <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-border">
            {criteria.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-surface-2 transition-colors"
              >
                <button
                  disabled={!isEditable}
                  onClick={() => toggleCriteria(item.id)}
                  className="flex items-center gap-2 text-left flex-1"
                >
                  {item.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                  <span className={`text-xs ${item.done ? 'line-through text-text-muted' : 'text-text-main'}`}>
                    {item.text}
                  </span>
                </button>
                {isEditable && (
                  <button onClick={() => removeCriterion(item.id)} className="text-text-muted hover:text-red-400 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {isEditable && (
              <input
                type="text"
                placeholder="+ Добавить критерий приемки и нажать Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCriterion((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full mt-2 bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. RISK
  if (node.type === 'risk') {
    const probability = meta.probability || 'medium';
    const impact = meta.impact || 'high';
    const status = meta.status || 'open';

    return (
      <div className="space-y-4 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Вероятность (Probability):</label>
            <CustomSelect
              disabled={!isEditable}
              value={probability}
              onChange={(val) => onUpdateMeta({ ...meta, probability: val })}
              options={[
                { value: 'low', label: 'Низкая (Low)' },
                { value: 'medium', label: 'Средняя (Medium)' },
                { value: 'high', label: 'Высокая (High)' },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Влияние (Impact):</label>
            <CustomSelect
              disabled={!isEditable}
              value={impact}
              onChange={(val) => onUpdateMeta({ ...meta, impact: val })}
              options={[
                { value: 'low', label: 'Низкое (Low)' },
                { value: 'medium', label: 'Среднее (Medium)' },
                { value: 'high', label: 'Критическое (High)' },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Статус риска:</label>
            <CustomSelect
              disabled={!isEditable}
              value={status}
              onChange={(val) => onUpdateMeta({ ...meta, status: val })}
              options={[
                { value: 'open', label: 'Открыт (Open ⚠️)' },
                { value: 'mitigated', label: 'Митигирован (Mitigated 🛡️)' },
                { value: 'closed', label: 'Закрыт (Closed ✅)' },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-main block mb-1">
            План снижения риска (Mitigation Plan):
          </label>
          <textarea
            disabled={!isEditable}
            rows={2}
            value={meta.mitigation || ''}
            onChange={(e) => onUpdateMeta({ ...meta, mitigation: e.target.value })}
            placeholder="Какие действия предпринимаются для нейтрализации риска..."
            className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>
    );
  }

  // 4. TEST
  if (node.type === 'test') {
    const status = meta.status || 'pending';
    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-text-muted">Результат прогона:</label>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'pass', label: 'PASS ✅', color: 'text-emerald-400 border-emerald-500 bg-emerald-500/10' },
              { id: 'fail', label: 'FAIL ❌', color: 'text-red-400 border-red-500 bg-red-500/10' },
              { id: 'pending', label: 'PENDING ⏳', color: 'text-amber-400 border-amber-500 bg-amber-500/10' },
            ].map((st) => (
              <button
                key={st.id}
                disabled={!isEditable}
                onClick={() => onUpdateMeta({ ...meta, status: st.id })}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                  status === st.id ? `${st.color} font-bold shadow` : 'border-border text-text-muted'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Ожидаемый результат (Expected):</label>
            <textarea
              disabled={!isEditable}
              rows={2}
              value={meta.expected || ''}
              onChange={(e) => onUpdateMeta({ ...meta, expected: e.target.value })}
              placeholder="Что должно произойти..."
              className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Фактический результат (Actual):</label>
            <textarea
              disabled={!isEditable}
              rows={2}
              value={meta.actual || ''}
              onChange={(e) => onUpdateMeta({ ...meta, actual: e.target.value })}
              placeholder="Что произошло на самом деле..."
              className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. BENCHMARK
  if (node.type === 'benchmark') {
    const metricKey = meta.metric_key || 'latency';

    // Find other benchmarks with the same metric_key in the project for comparison chart
    const peerBenchmarks = allNodes.filter(
      (n) => n.type === 'benchmark' && (n.meta as any)?.metric_key === metricKey
    );

    return (
      <div className="space-y-4 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Ключ метрики:</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.metric_key || ''}
              onChange={(e) => onUpdateMeta({ ...meta, metric_key: e.target.value })}
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-cyan-300 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Значение:</label>
            <input
              type="number"
              disabled={!isEditable}
              value={meta.metric_value ?? ''}
              onChange={(e) => onUpdateMeta({ ...meta, metric_value: parseFloat(e.target.value) || 0 })}
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-main font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Единица (Unit):</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.unit || ''}
              onChange={(e) => onUpdateMeta({ ...meta, unit: e.target.value })}
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-main font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Модель / Версия:</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.model || ''}
              onChange={(e) => onUpdateMeta({ ...meta, model: e.target.value })}
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-main"
            />
          </div>
        </div>

        {/* Hardware & Dataset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Окружение / Hardware:</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.hardware || ''}
              onChange={(e) => onUpdateMeta({ ...meta, hardware: e.target.value })}
              placeholder="e.g. VPS 1 vCPU / 1GB RAM"
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-main"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Датасет / Условия:</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.dataset || ''}
              onChange={(e) => onUpdateMeta({ ...meta, dataset: e.target.value })}
              placeholder="e.g. 100 concurrent WS subscribers"
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-main"
            />
          </div>
        </div>

        {/* Comparison Visualizer */}
        {peerBenchmarks.length > 0 && (
          <div className="bg-surface p-3.5 rounded-lg border border-cyan-500/30 mt-3">
            <h6 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-3">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Сравнение по метрике «{metricKey}»</span>
            </h6>
            <div className="space-y-2">
              {peerBenchmarks.map((bm) => {
                const val = (bm.meta as any)?.metric_value || 0;
                const maxVal = Math.max(...peerBenchmarks.map((b) => (b.meta as any)?.metric_value || 1));
                const percent = Math.min(100, Math.max(10, (val / maxVal) * 100));
                const isCurrent = bm.id === node.id;
                return (
                  <div key={bm.id} className="text-xs">
                    <div className="flex justify-between text-text-muted mb-0.5">
                      <span className={isCurrent ? 'font-bold text-cyan-300' : ''}>
                        {bm.display_id}: {bm.title} {isCurrent && '(Текущий)'}
                      </span>
                      <span className="font-mono text-text-main font-semibold">
                        {val} {(bm.meta as any)?.unit}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCurrent ? 'bg-cyan-400 shadow-glow-sm' : 'bg-cyan-700/60'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. LINK
  if (node.type === 'link') {
    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-text-muted block mb-1">URL адрес:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled={!isEditable}
                value={meta.url || ''}
                onChange={(e) => onUpdateMeta({ ...meta, url: e.target.value })}
                placeholder="https://..."
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-main focus:border-blue-400"
              />
              {meta.url && (
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-surface hover:bg-surface-3 border border-border rounded-lg text-text-muted hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Источник (Source):</label>
            <CustomSelect
              disabled={!isEditable}
              value={meta.source || 'other'}
              onChange={(val) => onUpdateMeta({ ...meta, source: val })}
              options={[
                { value: 'miro', label: 'Miro 🗺️' },
                { value: 'figma', label: 'Figma 🎨' },
                { value: 'notion', label: 'Notion 📓' },
                { value: 'gdocs', label: 'Google Docs 📄' },
                { value: 'telegram', label: 'Telegram 💬' },
                { value: 'other', label: 'Другое 🔗' },
              ]}
            />
          </div>
        </div>

        {meta.preview_url && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border">
            <img src={meta.preview_url} alt="Preview" className="w-full h-36 object-cover" />
          </div>
        )}
      </div>
    );
  }

  // 7. LESSON
  if (node.type === 'lesson') {
    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div>
          <label className="text-xs font-semibold text-amber-400 block mb-1">1. С чем столкнулись (Problem Encountered):</label>
          <textarea
            disabled={!isEditable}
            rows={2}
            value={meta.problem_encountered || ''}
            onChange={(e) => onUpdateMeta({ ...meta, problem_encountered: e.target.value })}
            className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-amber-400 block mb-1">2. Первопричина (Root Cause):</label>
          <textarea
            disabled={!isEditable}
            rows={2}
            value={meta.root_cause || ''}
            onChange={(e) => onUpdateMeta({ ...meta, root_cause: e.target.value })}
            className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-amber-400 block mb-1">3. Примененное решение (Solution Applied):</label>
          <textarea
            disabled={!isEditable}
            rows={2}
            value={meta.solution_applied || ''}
            onChange={(e) => onUpdateMeta({ ...meta, solution_applied: e.target.value })}
            className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:border-amber-500"
          />
        </div>
      </div>
    );
  }

  // 8. COMPONENT
  if (node.type === 'component') {
    const techStack = meta.tech_stack || [];
    const responsibilities = meta.responsibilities || [];

    const addTech = (t: string) => {
      if (!t.trim()) return;
      onUpdateMeta({ ...meta, tech_stack: [...techStack, t.trim()] });
    };

    const removeTech = (index: number) => {
      onUpdateMeta({ ...meta, tech_stack: techStack.filter((_: any, i: number) => i !== index) });
    };

    const addResp = (r: string) => {
      if (!r.trim()) return;
      onUpdateMeta({ ...meta, responsibilities: [...responsibilities, r.trim()] });
    };

    const removeResp = (index: number) => {
      onUpdateMeta({ ...meta, responsibilities: responsibilities.filter((_: any, i: number) => i !== index) });
    };

    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1.5">Технологический стек (Tech Stack):</label>
          <div className="flex flex-wrap items-center gap-1.5">
            {techStack.map((tech: string, i: number) => (
              <span key={i} className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded text-xs border border-border text-text-main">
                {tech}
                {isEditable && (
                  <button onClick={() => removeTech(i)} className="text-text-muted hover:text-red-400">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))}
            {isEditable && (
              <input
                type="text"
                placeholder="+ Добавить стек..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTech((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="bg-surface border border-border rounded px-2 py-0.5 text-xs text-text-main placeholder-text-muted focus:outline-none"
              />
            )}
          </div>
        </div>

        <div className="pt-2">
          <label className="text-xs font-semibold text-text-muted block mb-1.5">Зоны ответственности (Responsibilities):</label>
          <ul className="space-y-1">
            {responsibilities.map((resp: string, i: number) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs text-text-main bg-surface px-2 py-1 rounded">
                <span>⚙️ {resp}</span>
                {isEditable && (
                  <button onClick={() => removeResp(i)} className="text-text-muted hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isEditable && (
            <input
              type="text"
              placeholder="+ Добавить зону ответственности..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addResp((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              className="mt-1.5 w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-main placeholder-text-muted focus:outline-none"
            />
          )}
        </div>
      </div>
    );
  }

  // 9. PROBLEM
  if (node.type === 'problem') {
    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div>
          <label className="text-xs font-semibold text-red-400 block mb-1">Целевая аудитория (Target Audience):</label>
          <input
            type="text"
            disabled={!isEditable}
            value={meta.target_audience || ''}
            onChange={(e) => onUpdateMeta({ ...meta, target_audience: e.target.value })}
            placeholder="Кто страдает от проблемы..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-main focus:border-red-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-red-400 block mb-1">Ценность решения (Value / Impact):</label>
          <input
            type="text"
            disabled={!isEditable}
            value={meta.value || ''}
            onChange={(e) => onUpdateMeta({ ...meta, value: e.target.value })}
            placeholder="Что даст устранение проблемы..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-main focus:border-red-500"
          />
        </div>
      </div>
    );
  }

  // 10. DECISION
  if (node.type === 'decision') {
    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div>
          <label className="text-xs font-semibold text-emerald-400 block mb-1">Обоснование решения (Rationale):</label>
          <textarea
            disabled={!isEditable}
            rows={2}
            value={meta.rationale || ''}
            onChange={(e) => onUpdateMeta({ ...meta, rationale: e.target.value })}
            placeholder="Почему было утверждено именно это решение..."
            className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-text-muted">Дата утверждения:</label>
          <input
            type="date"
            disabled={!isEditable}
            value={meta.decided_at || ''}
            onChange={(e) => onUpdateMeta({ ...meta, decided_at: e.target.value })}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-text-main"
          />
        </div>
      </div>
    );
  }

  // 11. DEPLOYMENT
  if (node.type === 'deployment') {
    return (
      <div className="space-y-3 bg-surface-2/60 p-4 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Этап развертывания (Stage):</label>
            <input
              type="text"
              disabled={!isEditable}
              value={meta.stage || 'Production'}
              onChange={(e) => onUpdateMeta({ ...meta, stage: e.target.value })}
              className="bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-main"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Статус:</label>
            <button
              disabled={!isEditable}
              onClick={() => onUpdateMeta({ ...meta, status: meta.status === 'done' ? 'pending' : 'done' })}
              className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                meta.status === 'done'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500'
              }`}
            >
              {meta.status === 'done' ? 'РАЗВЕРНУТО ✅' : 'ОЖИДАЕТ ⏳'}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">Инструкции деплоя:</label>
          <textarea
            disabled={!isEditable}
            rows={2}
            value={meta.instructions || ''}
            onChange={(e) => onUpdateMeta({ ...meta, instructions: e.target.value })}
            placeholder="Команды запуска (e.g. docker compose up -d)..."
            className="w-full font-mono bg-surface border border-border rounded-lg p-2 text-xs text-sky-300"
          />
        </div>
      </div>
    );
  }

  // 12. LOG
  if (node.type === 'log') {
    return (
      <div className="flex items-center gap-4 bg-surface-2/60 p-3 rounded-xl border border-border">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">Затраченное время (минуты):</label>
          <input
            type="number"
            disabled={!isEditable}
            value={meta.duration_min || 0}
            onChange={(e) => onUpdateMeta({ ...meta, duration_min: parseInt(e.target.value, 10) || 0 })}
            className="bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-main font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">Категория работ:</label>
          <input
            type="text"
            disabled={!isEditable}
            value={meta.category || ''}
            onChange={(e) => onUpdateMeta({ ...meta, category: e.target.value })}
            placeholder="e.g. Frontend Development"
            className="bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-main"
          />
        </div>
      </div>
    );
  }

  return null;
};
