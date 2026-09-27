import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class AppleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppleErrorBoundary capturou uma falha não tratada:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleNavigateHome = () => {
    window.location.href = '/inicio';
  };

  private handleClearCache = () => {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117] flex items-center justify-center p-4 select-none transition-colors">
          <div className="w-full max-w-xl rounded-[8px] bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-800 border-t-2 border-t-[#226380] p-8 sm:p-12 shadow-[0_4px_24px_-4px_rgba(17,50,64,0.08)] text-center">
            {/* Logo */}
            <div className="mx-auto flex items-center justify-center mb-5">
              <img src="/logo-sistema.png" alt="BRM" className="h-14 w-auto object-contain dark:hidden" />
              <img src="/logo-branco.png" alt="BRM" className="h-14 w-auto object-contain hidden dark:block" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-3">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Interrupção Inesperada</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#113240] dark:text-white font-cinzel">
              Algo não saiu como esperado
            </h1>

            <p className="mt-3 text-sm text-[#707070] dark:text-[#86868b] leading-relaxed max-w-md mx-auto font-sans">
              Ocorreu uma falha temporária ao carregar este módulo. Seus dados cadastrais seguros foram preservados no banco de dados.
            </p>

            {/* Action Pills */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#113240] hover:bg-[#226380] text-white border border-[#113240] text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer rounded-[6px] shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recarregar Tela</span>
              </button>

              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[#113240] dark:text-slate-200 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer rounded-[6px] hover:bg-slate-50 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ir para o Início</span>
              </button>
            </div>

            {/* Error Details Toggle */}
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10 text-left">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="text-xs text-[#226380] hover:underline font-medium cursor-pointer"
                >
                  {this.state.showDetails ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos do erro'}
                </button>

                <button
                  type="button"
                  onClick={this.handleClearCache}
                  className="text-[11px] text-[#707070] dark:text-[#86868b] hover:text-[#113240] dark:hover:white transition-colors cursor-pointer"
                >
                  Limpar sessão
                </button>
              </div>

              {this.state.showDetails && (
                <div className="mt-3 p-4 rounded-[6px] bg-[#f5f5f7] dark:bg-black/40 border border-black/10 dark:border-white/10 overflow-x-auto text-[11px] font-mono text-rose-700 dark:text-rose-300">
                  <p className="font-bold">{this.state.error?.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-[10px] text-[#707070] dark:text-[#86868b] whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppleErrorBoundary;
