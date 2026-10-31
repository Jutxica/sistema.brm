import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { getPasswordResetRedirectUrl, getSystemLoginUrl } from '../../lib/portalUrls';

/** Inline delay for the entrance sequence */
const enter = (ms: number) => ({ ['--enter-delay' as string]: `${ms}ms` }) as React.CSSProperties;

interface PortalLoginProps {
  onSuccess: (userId: string) => Promise<void> | void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({ onSuccess }) => {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Recovery state
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const targetEmail = identificador.trim().toLowerCase();
      if (!targetEmail.includes('@')) {
        setAuthError('Use o e-mail cadastrado na sua conta para entrar.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: senha,
      });

      if (error) {
        setAuthError(
          error.message === 'Invalid login credentials'
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : error.message
        );
      } else if (data.session && data.session.user) {
        await onSuccess(data.session.user.id);
      }
    } catch (err) {
      console.error('Erro ao autenticar:', err);
      setAuthError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor da Província.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = recoveryEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setAuthError('Informe o e-mail da sua conta institucional.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl('portal'),
      });
      if (error) throw error;
      setAuthSuccess('Se houver uma conta associada a este e-mail, as instruções de redefinição foram enviadas.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível solicitar a redefinição de senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="brm-auth-page relative isolate min-h-screen flex flex-col justify-between overflow-hidden px-4 font-sans text-[#203136] transition-colors duration-200 dark:text-[#edf2f1]">
      {/* Background with Sem Corupá view */}
      <img
        src="/rodape-brm.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-[1.02] object-cover object-center opacity-50 blur-[2px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-slate-950/25" />

      {/* Top spacing */}
      <div className="relative z-10 h-10 md:h-14" />

      {/* Login Card */}
      <div className="relative z-10 flex flex-grow items-center justify-center py-6">
        <div className="brm-auth-card brm-enter-card relative w-full max-w-[440px] overflow-hidden rounded-2xl p-7 transition-all sm:p-10">
          
          {/* Brand & Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <img src="/logo-sistema.png" alt="Província BRM" style={enter(100)} className="brm-enter-crest mb-3 h-12 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" style={enter(100)} className="brm-enter-crest mb-3 hidden h-12 w-auto object-contain dark:block" />
            <h1 style={enter(200)} className="brm-enter-rise text-[1.5rem] font-semibold tracking-tight text-[#113240] dark:text-white font-serif">
              Portal do Religioso
            </h1>
            <p style={enter(260)} className="brm-enter-rise text-[13px] text-[#66777b] dark:text-[#a0aeaf] mt-1">
              Província Brasileira Meridional
            </p>
            <span style={enter(320)} className="brm-enter-fade mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#66777b] dark:text-[#a0aeaf]">
              <span style={{ ...enter(360), ['--line-origin' as string]: 'right' }} className="brm-enter-line h-px w-5 bg-[#b58a55]" />
              Espaço do Religioso
              <span style={{ ...enter(360), ['--line-origin' as string]: 'left' }} className="brm-enter-line h-px w-5 bg-[#b58a55]" />
            </span>
          </div>

          {/* Alert Messages */}
          {authError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs mb-6 border border-red-200/80 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs mb-6 border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed">{authSuccess}</span>
            </div>
          )}

          {/* Recovery Form Mode */}
          {recoveryMode ? (
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div style={enter(400)} className="brm-enter-rise space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200 block">
                  E-mail institucional ou pessoal
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="seu.email@brm.org.br"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#226380]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div style={enter(500)} className="brm-enter-rise pt-3 space-y-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="brm-auth-submit brm-button-sheen w-full py-3 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-[#A3C3C7] dark:hover:bg-white text-white dark:text-[#102b35] text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando link...</span>
                    </>
                  ) : (
                    <span>Enviar link de recuperação</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode(false);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao login</span>
                </button>
              </div>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Field */}
              <div style={enter(400)} className="brm-enter-rise space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200 block">
                  E-mail institucional ou pessoal
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="seu.email@brm.org.br"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#226380]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={enter(450)} className="brm-enter-rise space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200 block">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMode(true);
                      setRecoveryEmail(identificador);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-[11px] font-medium text-[#226380] hover:text-[#113240] dark:text-[#A3C3C7] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#226380]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div style={enter(500)} className="brm-enter-rise pt-3">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="brm-auth-submit brm-button-sheen w-full py-3 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-[#A3C3C7] dark:hover:bg-white text-white dark:text-[#102b35] text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <span>Entrar no Portal</span>
                  )}
                </button>
              </div>

              {/* Link to Admin Login */}
              <div style={enter(560)} className="brm-enter-rise pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
                <span className="text-[12px] text-slate-500 dark:text-slate-400 block mb-1">
                  Acesso administrativo da Cúria ou Secretaria?
                </span>
                <a
                  href={getSystemLoginUrl()}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8fc1c2] hover:text-[#b6d6d5] transition-colors"
                >
                  <span>Acessar o Sistema BRM</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer style={enter(640)} className="brm-enter-fade relative z-10 w-full py-6 text-center text-xs text-white/80 drop-shadow">
        <p>Província Brasileira Meridional dos Sacerdotes do Sagrado Coração de Jesus · Corupá – SC</p>
      </footer>
    </div>
  );
};

export default PortalLogin;
