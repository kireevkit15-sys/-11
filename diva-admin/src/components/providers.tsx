'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X, Loader2 } from 'lucide-react';

// ===================== Тосты =====================
type ToastType = 'success' | 'error' | 'info';
interface ToastAction {
  label: string;
  onClick: () => void;
}
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

let _toastId = 0;

type ToastFn = (type: ToastType, message: string, action?: ToastAction) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within AdminProviders');
  return ctx;
}

const TOAST_STYLES: Record<ToastType, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'ring-emerald-200 dark:ring-emerald-500/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: XCircle, ring: 'ring-red-200 dark:ring-red-500/30', iconColor: 'text-red-600 dark:text-red-400' },
  info: { icon: Info, ring: 'ring-brand-200 dark:ring-brand-500/30', iconColor: 'text-brand-600 dark:text-brand-400' },
};

// ===================== Confirm =====================
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within AdminProviders');
  return ctx;
}

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const toast = useCallback<ToastFn>((type, message, action) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, type, message, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), action ? 7000 : 3500);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmState({ opts, resolve })),
    [],
  );

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {/* Toast viewport */}
        <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5">
          {toasts.map((t) => {
            const s = TOAST_STYLES[t.type];
            const Icon = s.icon;
            return (
              <div
                key={t.id}
                className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg ring-1 dark:border-slate-700 dark:bg-slate-900 ${s.ring}`}
              >
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${s.iconColor}`} />
                <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action?.onClick();
                      setToasts((prev) => prev.filter((x) => x.id !== t.id));
                    }}
                    className="flex-shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Confirm dialog */}
        {confirmState && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="animate-overlay-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => closeConfirm(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="animate-dialog-in relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    confirmState.opts.danger ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' : 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {confirmState.opts.title ?? 'Подтвердите действие'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{confirmState.opts.message}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => closeConfirm(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {confirmState.opts.cancelText ?? 'Отмена'}
                </button>
                <button
                  onClick={() => closeConfirm(true)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                    confirmState.opts.danger
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800'
                  }`}
                >
                  {confirmState.opts.confirmText ?? 'Подтвердить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export { Loader2 };
