import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  X, 
  Trash2, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export type FeedbackTone = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmOptions {
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: FeedbackTone;
  badge?: string;
  icon?: 'trash' | 'alert' | 'help' | 'shield';
}

export interface AlertModalOptions {
  title?: string;
  message: string;
  detail?: string;
  buttonLabel?: string;
  tone?: FeedbackTone;
  badge?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface FeedbackContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  alert: (options: AlertModalOptions | string) => Promise<void>;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

// Global standalone emitters for non-hook usage
type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;
type AlertFn = (options: AlertModalOptions | string) => Promise<void>;
type ToastFn = (type: ToastType, message: string, title?: string, duration?: number) => void;

let globalConfirm: ConfirmFn | null = null;
let globalAlert: AlertFn | null = null;
let globalToast: ToastFn | null = null;

export const confirmAction = (options: ConfirmOptions | string): Promise<boolean> => {
  if (globalConfirm) {
    return globalConfirm(options);
  }
  // Fallback to native if provider not mounted yet
  const message = typeof options === 'string' ? options : options.message;
  return Promise.resolve(window.confirm(message));
};

export const showAlertModal = (options: AlertModalOptions | string): Promise<void> => {
  if (globalAlert) {
    return globalAlert(options);
  }
  const message = typeof options === 'string' ? options : options.message;
  window.alert(message);
  return Promise.resolve();
};

export const showToast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToast) globalToast('success', message, title, duration);
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToast) globalToast('error', message, title, duration);
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToast) globalToast('warning', message, title, duration);
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToast) globalToast('info', message, title, duration);
  }
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  // Alert Modal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertModalOptions;
    resolve: () => void;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const alertBtnRef = useRef<HTMLButtonElement | null>(null);

  // Toast handler
  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirm handler
  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        options: opts,
        resolve: (result: boolean) => {
          setConfirmState(null);
          resolve(result);
        }
      });
    });
  }, []);

  // Alert handler
  const alertModal = useCallback((options: AlertModalOptions | string): Promise<void> => {
    const opts: AlertModalOptions = typeof options === 'string' ? { message: options } : options;
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        options: opts,
        resolve: () => {
          setAlertState(null);
          resolve();
        }
      });
    });
  }, []);

  // Register globals
  useEffect(() => {
    globalConfirm = confirm;
    globalAlert = alertModal;
    globalToast = (type, msg, title, dur) => addToast(type, msg, title, dur);
    return () => {
      globalConfirm = null;
      globalAlert = null;
      globalToast = null;
    };
  }, [confirm, alertModal, addToast]);

  // Keyboard accessibility: ESC and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (confirmState?.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          confirmState.resolve(false);
        }
      } else if (alertState?.isOpen) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          alertState.resolve();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState, alertState]);

  // Auto-focus buttons when modal opens
  useEffect(() => {
    if (confirmState?.isOpen) {
      // Focus cancel button by default for safety on danger, or confirm button for primary
      const timer = setTimeout(() => {
        if (confirmState.options.tone === 'danger') {
          cancelBtnRef.current?.focus();
        } else {
          confirmBtnRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [confirmState?.isOpen, confirmState?.options.tone]);

  useEffect(() => {
    if (alertState?.isOpen) {
      const timer = setTimeout(() => {
        alertBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [alertState?.isOpen]);

  const toastMethods = {
    success: (msg: string, title?: string, dur?: number) => addToast('success', msg, title, dur),
    error: (msg: string, title?: string, dur?: number) => addToast('error', msg, title, dur),
    warning: (msg: string, title?: string, dur?: number) => addToast('warning', msg, title, dur),
    info: (msg: string, title?: string, dur?: number) => addToast('info', msg, title, dur),
  };

  return (
    <FeedbackContext.Provider value={{ confirm, alert: alertModal, toast: toastMethods }}>
      {children}

      {/* CONFIRM MODAL */}
      {confirmState?.isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm motion-backdrop animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => confirmState.resolve(false)}
        >
          <div 
            className={`bg-white dark:bg-[#161b22] rounded-[10px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col motion-modal animate-in zoom-in-95 duration-200 ${
              confirmState.options.tone === 'danger'
                ? 'border-t-4 border-t-rose-600'
                : confirmState.options.tone === 'warning'
                ? 'border-t-4 border-t-amber-500'
                : 'border-t-4 border-t-[#226380]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-[0.16em] font-semibold ${
                  confirmState.options.tone === 'danger'
                    ? 'text-rose-600 dark:text-rose-400'
                    : confirmState.options.tone === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-[#226380] dark:text-[#A3C3C7]'
                }`}>
                  {confirmState.options.badge || 'Província BRM • Confirmação'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="w-7 h-7 rounded-[6px] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-3 flex items-start gap-4">
              {/* Icon Container */}
              <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${
                confirmState.options.tone === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60'
                  : confirmState.options.tone === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60'
                  : 'bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/20'
              }`}>
                {confirmState.options.tone === 'danger' ? (
                  confirmState.options.icon === 'shield' ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />
                ) : confirmState.options.tone === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>

              {/* Text Information */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#113240] dark:text-slate-100 font-cinzel leading-snug">
                  {confirmState.options.title || (
                    confirmState.options.tone === 'danger' ? 'Confirmar Exclusão' : 'Confirmação Necessária'
                  )}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed break-words">
                  {confirmState.options.message}
                </p>

                {confirmState.options.detail && (
                  <div className="mt-2.5 p-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-words">
                    {confirmState.options.detail}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 mt-2 bg-slate-50/80 dark:bg-[#12161c] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="px-4 py-2 text-xs font-semibold rounded-[6px] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                {confirmState.options.cancelLabel || 'Cancelar'}
              </button>

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => confirmState.resolve(true)}
                className={`px-4 py-2 text-xs font-semibold rounded-[6px] text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-[0.98] ${
                  confirmState.options.tone === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : confirmState.options.tone === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-[#113240] hover:bg-[#226380] dark:bg-[#226380] dark:hover:bg-[#1a4e66] shadow-[#113240]/20'
                }`}
              >
                {confirmState.options.confirmLabel || (
                  confirmState.options.tone === 'danger' ? 'Sim, Excluir' : 'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {alertState?.isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm motion-backdrop animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => alertState.resolve()}
        >
          <div 
            className={`bg-white dark:bg-[#161b22] rounded-[10px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col motion-modal animate-in zoom-in-95 duration-200 ${
              alertState.options.tone === 'danger'
                ? 'border-t-4 border-t-rose-600'
                : alertState.options.tone === 'warning'
                ? 'border-t-4 border-t-amber-500'
                : 'border-t-4 border-t-[#226380]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <span className={`text-[10px] font-mono uppercase tracking-[0.16em] font-semibold ${
                alertState.options.tone === 'danger'
                  ? 'text-rose-600 dark:text-rose-400'
                  : alertState.options.tone === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-[#226380] dark:text-[#A3C3C7]'
              }`}>
                {alertState.options.badge || 'Província BRM • Comunicado'}
              </span>
              <button
                type="button"
                onClick={() => alertState.resolve()}
                className="w-7 h-7 rounded-[6px] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-3 flex items-start gap-4">
              <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${
                alertState.options.tone === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60'
                  : alertState.options.tone === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60'
                  : 'bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/20'
              }`}>
                {alertState.options.tone === 'danger' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : alertState.options.tone === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#113240] dark:text-slate-100 font-cinzel leading-snug">
                  {alertState.options.title || 'Aviso do Sistema'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed break-words">
                  {alertState.options.message}
                </p>

                {alertState.options.detail && (
                  <div className="mt-2.5 p-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-words">
                    {alertState.options.detail}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 mt-2 bg-slate-50/80 dark:bg-[#12161c] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
              <button
                ref={alertBtnRef}
                type="button"
                onClick={() => alertState.resolve()}
                className="px-5 py-2 text-xs font-semibold rounded-[6px] bg-[#113240] hover:bg-[#226380] dark:bg-[#226380] dark:hover:bg-[#1a4e66] text-white transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                {alertState.options.buttonLabel || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOASTS CONTAINER */}
      <div 
        className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md rounded-[8px] border shadow-xl p-3.5 flex items-start gap-3 transition-all duration-300 ease-out transform translate-y-0 opacity-100 ${
              t.type === 'success'
                ? 'border-emerald-500/30 shadow-emerald-500/5'
                : t.type === 'error'
                ? 'border-rose-500/30 shadow-rose-500/5'
                : t.type === 'warning'
                ? 'border-amber-500/30 shadow-amber-500/5'
                : 'border-[#226380]/30 shadow-[#226380]/5'
            }`}
          >
            {/* Icon */}
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#226380] dark:text-[#A3C3C7]" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-xs">
              {t.title && (
                <h4 className="font-semibold text-slate-900 dark:text-white mb-0.5 leading-snug">
                  {t.title}
                </h4>
              )}
              <p className="text-slate-600 dark:text-slate-300 font-sans leading-relaxed break-words">
                {t.message}
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
              aria-label="Fechar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback deve ser utilizado dentro de um FeedbackProvider');
  }
  return context;
};
