import React, { useState, useEffect, useRef } from 'react';
import { quickDropApi } from '../../api/quickdrop';
import type { QuickDropItem } from '../../api/quickdrop';
import { synapseWs } from '../../api/websocket';
import type { WsEvent } from '../../api/websocket';
import { Copy, Check, Pin, Trash2 } from 'lucide-react';

export const QuickDropView: React.FC = () => {
  const [items, setItems] = useState<QuickDropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'code' | 'link'>('text');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await quickDropApi.list();
      setItems(data);
    } catch (e) {
      console.error('Failed to load quick drops', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();

    // Subscribe to real-time Quick Drop events from WS
    const unsub = synapseWs.subscribe((event: WsEvent) => {
      if (event.type === 'quick_drop_created' && event.data) {
        setItems((prev) => [event.data, ...prev.filter((i) => i.id !== event.data.id)]);
      } else if (event.type === 'quick_drop_deleted') {
        const id = event.data?.id;
        if (id) {
          setItems((prev) => prev.filter((i) => i.id !== id));
        } else if (event.data?.cleared === 'unpinned') {
          setItems((prev) => prev.filter((i) => i.is_pinned));
        }
      } else if (event.type === 'quick_drop_pinned' && event.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === event.data.id ? { ...i, is_pinned: event.data.is_pinned } : i))
        );
      }
    });

    // Global Paste Listener
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check for image files pasted
      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleFileUpload(file);
          return;
        }
      }

      // 2. Check for text/code/urls if focused on dropzone or body
      const text = clipboardData.getData('text');
      if (text && document.activeElement === document.body) {
        e.preventDefault();
        let detectedType: 'text' | 'code' | 'link' = 'text';
        if (text.startsWith('http://') || text.startsWith('https://')) {
          detectedType = 'link';
        } else if (text.includes('{') || text.includes('function') || text.includes('const ') || text.includes('import ')) {
          detectedType = 'code';
        }
        await handleCreate(text, detectedType);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      unsub();
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const handleCreate = async (content?: string, type?: 'text' | 'code' | 'link') => {
    const textToSend = content || inputText;
    if (!textToSend.trim()) return;

    try {
      const item = await quickDropApi.create({
        type: type || inputType,
        content: textToSend,
      });
      setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
      if (!content) setInputText('');
    } catch (e) {
      console.error('Failed to create quick drop', e);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const item = await quickDropApi.upload(file);
      setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePin = async (id: string) => {
    try {
      const updated = await quickDropApi.togglePin(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (e) {
      console.error('Failed to toggle pin', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await quickDropApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error('Failed to delete item', e);
    }
  };

  const handleClearUnpinned = async () => {
    if (!confirm('Clear all unpinned items?')) return;
    try {
      await quickDropApi.clearUnpinned();
      setItems((prev) => prev.filter((i) => i.is_pinned));
    } catch (e) {
      console.error('Failed to clear unpinned', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] text-zinc-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-950/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            📋
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Universal Quick Drop
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                PC ↔ Mobile Live
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Instant cross-device clipboard, code snippets & screenshots</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearUnpinned}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition"
          >
            Clear Unpinned
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 transition flex items-center gap-1.5"
          >
            📎 Upload File / Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-5xl w-full mx-auto gap-6">
        {/* Fast Input / Paste Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className={`relative rounded-xl border p-4 transition ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-zinc-800 bg-zinc-900/50 focus-within:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              {(['text', 'code', 'link'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setInputType(t)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition uppercase ${
                    inputType === t
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Press Ctrl+V anywhere to paste</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder={
              inputType === 'code'
                ? 'Paste code snippet here... (Ctrl+Enter to drop)'
                : inputType === 'link'
                ? 'Paste URL link here...'
                : 'Type or paste quick note... (Ctrl+Enter to drop)'
            }
            rows={3}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none font-mono"
          />

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800/60">
            <span className="text-xs text-zinc-500">
              {uploading ? 'Uploading media...' : 'Drag & drop image or file here'}
            </span>
            <button
              onClick={() => handleCreate()}
              disabled={!inputText.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-xs font-medium text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
            >
              Drop to Phone ⚡
            </button>
          </div>
        </div>

        {/* Stream of Dropped Items */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-medium">
            <span>Recent Drops ({items.length})</span>
            <span>Real-time Sync Active</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">Loading Quick Drops...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="text-sm font-medium text-zinc-300">Quick Drop is Empty</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Paste text with <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-400">Ctrl+V</code> or drop a photo from your phone to share instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`group relative rounded-xl border p-4 flex flex-col justify-between transition ${
                      item.is_pinned
                        ? 'border-indigo-500/40 bg-indigo-950/10'
                        : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                            item.type === 'code'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : item.type === 'link'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : item.type === 'image'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePin(item.id)}
                          title={item.is_pinned ? 'Unpin' : 'Pin'}
                          className={`p-1.5 rounded hover:bg-zinc-800 transition ${
                            item.is_pinned ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                          className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="my-2">
                      {item.type === 'image' ? (
                        <div className="rounded-lg overflow-hidden border border-zinc-800 max-h-60 bg-black/50 flex items-center justify-center">
                          <img
                            src={item.content.startsWith('http') ? item.content : `http://87.58.204.138${item.content}`}
                            alt="Quick Drop"
                            className="max-h-60 w-auto object-contain"
                          />
                        </div>
                      ) : item.type === 'code' ? (
                        <pre className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                          <code>{item.content}</code>
                        </pre>
                      ) : item.type === 'link' ? (
                        <a
                          href={item.content}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:underline break-all text-sm font-medium flex items-center gap-1.5"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words leading-relaxed font-sans">
                          {item.content}
                        </p>
                      )}
                    </div>

                    {/* Footer / Copy Action */}
                    <div className="pt-2 mt-2 border-t border-zinc-800/40 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {item.type === 'text' || item.type === 'code' ? `${item.content.length} chars` : ''}
                      </span>

                      <button
                        onClick={() => handleCopy(item.id, item.content)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                          isCopied
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                        }`}
                        title={isCopied ? 'Copied' : 'Copy'}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};