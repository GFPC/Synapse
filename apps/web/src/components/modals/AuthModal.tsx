import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import { X, Lock, Mail, User as UserIcon, Server, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const isAuthModalOpen = useSynapseStore((s) => s.isAuthModalOpen);
  const setIsAuthModalOpen = useSynapseStore((s) => s.setIsAuthModalOpen);
  const backendConnected = useSynapseStore((s) => s.backendConnected);
  const loginUser = useSynapseStore((s) => s.loginUser);
  const registerUser = useSynapseStore((s) => s.registerUser);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const logoutUser = useSynapseStore((s) => s.logoutUser);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex@synapse.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        if (!name.trim()) {
          setError('Пожалуйста, укажите имя');
          setIsLoading(false);
          return;
        }
        await registerUser(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации. Проверьте данные.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await loginUser(demoEmail, 'password123');
    } catch {
      try {
        const demoName = demoEmail.split('@')[0];
        await registerUser(demoName, demoEmail, 'password123');
      } catch (e: any) {
        setError(e.message || 'Не удалось войти');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface-2/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">
                {backendConnected ? 'Go Backend Подключен' : 'Авторизация & Бэкенд'}
              </h3>
              <p className="text-[11px] text-text-muted">http://localhost:3000 (Echo + PostgreSQL)</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-3 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Backend Status Box */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              backendConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {backendConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {backendConnected ? 'Сервер активен (Port 3000)' : 'Сервер недоступен (Офлайн режим)'}
              </span>
            </div>
            <span className="font-mono text-[10px] bg-surface/60 px-2 py-0.5 rounded border border-border">
              v1.0 Go
            </span>
          </div>

          {/* Current Logged In Info */}
          {currentUser && (
            <div className="bg-surface-2 p-3 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=u'}
                  alt=""
                  className="w-8 h-8 rounded-full border border-border"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text-main truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-text-muted truncate">{currentUser.email}</div>
                </div>
              </div>

              <button
                onClick={logoutUser}
                className="px-2.5 py-1 text-[11px] font-semibold text-text-muted hover:text-red-400 hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-red-500/30"
              >
                Выйти
              </button>
            </div>
          )}

          {/* Quick Demo Switchers */}
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase block mb-1.5">
              Быстрый вход под тестовым аккаунтом:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('alex@synapse.dev')}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-left transition-colors"
              >
                <div className="text-xs font-bold text-text-main">👑 Alex (Owner)</div>
                <div className="text-[10px] text-text-muted">alex@synapse.dev</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('maria@synapse.dev')}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-left transition-colors"
              >
                <div className="text-xs font-bold text-text-main">✍️ Maria (Editor)</div>
                <div className="text-[10px] text-text-muted">maria@synapse.dev</div>
              </button>
            </div>
          </div>

          {/* Tab: Login / Register */}
          <div className="flex bg-surface-2 rounded-xl p-1 border border-border">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-surface text-text-main shadow' : 'text-text-muted hover:text-white'
              }`}
            >
              Вход по паролю
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-surface text-text-main shadow' : 'text-text-muted hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1">Имя:</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Алексей Смирнов"
                    className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main focus:border-accent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-text-muted block mb-1">Email:</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@synapse.dev"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-text-muted block mb-1">Пароль:</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main focus:border-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-accent/20 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Подключение...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
