import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useReducedMotion } from '../hooks/useMotion';

/** Inline delay for the welcome entrance sequence (see .brm-enter-* in index.css) */
const enter = (ms: number) => ({ ['--enter-delay' as string]: `${ms}ms` }) as React.CSSProperties;

/** Duration of the card exit before navigating to the dashboard */
const EXIT_MS = 260;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona imediatamente caso caia na rota de login com tokens de recuperação
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      navigate(`/redefinir-senha${hash}${search}`, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : authError.message
        );
      } else if (data.session) {
        if (reducedMotion) {
          navigate('/inicio');
        } else {
          // Brief card exit so the dashboard greeting reads as a continuation
          setLeaving(true);
          window.setTimeout(() => navigate('/inicio'), EXIT_MS);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brm-auth-page relative isolate min-h-screen flex flex-col justify-between overflow-hidden px-4 font-sans text-[#203136] transition-colors duration-200 dark:text-[#edf2f1]">
      <img
        src="/rodape-brm.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-[1.02] object-cover object-center opacity-50 blur-[2px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-slate-950/25" />
      
      {/* Top spacing */}
      <div className="relative z-10 h-12 md:h-16" />

      {/* Login Card */}
      <div className="relative z-10 flex flex-grow items-center justify-center py-6">
        <div className={`brm-auth-card brm-enter-focus relative w-full max-w-[440px] overflow-hidden rounded-2xl p-7 transition-all sm:p-10${leaving ? ' is-leaving' : ''}`}>
          
          {/* Brand & Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <img src="/logo-sistema.png" alt="Província BRM" style={enter(120)} className="brm-enter-focus mb-3 h-12 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" style={enter(120)} className="brm-enter-focus mb-3 hidden h-12 w-auto object-contain dark:block" />
            <h1 style={enter(220)} className="brm-enter-rise text-[1.5rem] font-semibold tracking-tight text-[#113240] dark:text-white">
              Sistema BRM
            </h1>
            <p style={enter(280)} className="brm-enter-rise text-[13px] text-[#66777b] dark:text-[#a0aeaf] mt-1">
              Província Brasil Meridional
            </p>
            <span style={enter(340)} className="brm-enter-fade mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#66777b] dark:text-[#a0aeaf]">
              <span style={{ ...enter(380), ['--line-origin' as string]: 'right' }} className="brm-enter-line h-px w-5 bg-[#b58a55]" />
              Espaço administrativo
              <span style={{ ...enter(380), ['--line-origin' as string]: 'left' }} className="brm-enter-line h-px w-5 bg-[#b58a55]" />
            </span>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs mb-6 border border-red-200/80 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div style={enter(400)} className="brm-enter-rise space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200 block">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <Link
                  to="/redefinir-senha?origem=sistema"
                  className="text-[11px] font-medium text-[#226380] hover:text-[#113240] dark:text-[#A3C3C7] dark:hover:text-white transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
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
                disabled={loading || leaving}
                className="brm-auth-submit w-full py-3 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-[#A3C3C7] dark:hover:bg-white text-white dark:text-[#102b35] text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading || leaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </div>

            <div style={enter(560)} className="brm-enter-rise pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
              <span className="text-[12px] text-slate-500 dark:text-slate-400 block mb-1">
                É confrade ou religioso da Província?
              </span>
              <a
                href="/portal-religioso"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#113240] hover:text-[#226380] dark:text-[#A3C3C7] dark:hover:text-white transition-colors"
              >
                <span>Acessar o Portal do Confrade</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>

          </form>

        </div>
      </div>

      {/* Footer */}
      <footer style={enter(640)} className="brm-enter-fade relative z-10 w-full py-6 text-center text-xs text-white/80 drop-shadow">
        sistema.brm.org - todos os direitos reservados-2026
      </footer>
    </div>
  );
};

export default Login;
