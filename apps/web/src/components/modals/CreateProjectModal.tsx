import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import type { ProjectType } from '../../types';
import { X, FolderPlus } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const createProject = useSynapseStore((s) => s.createProject);

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('software');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    createProject({
      name: name.trim(),
      type,
      status: 'active',
      description: description.trim(),
      tags,
      workspace_id: '',
    });

    setName('');
    setDescription('');
    setTagsInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-border bg-surface-2/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Создать новый проект</h3>
              <p className="text-xs text-text-muted">Пространство для графа знаний и документации</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-3 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Название проекта:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Synapse NextGen Core..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Тип проекта:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'software', label: 'Software 💻' },
                { id: 'hardware', label: 'Hardware 🔌' },
                { id: 'hybrid', label: 'Hybrid ⚡' },
                { id: 'research', label: 'Research 🔬' },
              ].map((pt) => {
                const isSelected = type === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setType(pt.id as ProjectType)}
                    className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/20 text-accent font-bold shadow'
                        : 'border-border bg-surface-2 text-text-muted hover:text-text-main'
                    }`}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Описание:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание целей и задач проекта..."
              className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Теги (через запятую):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ai, graph, react, go"
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-main text-xs font-semibold rounded-xl"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all"
            >
              Создать проект
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
