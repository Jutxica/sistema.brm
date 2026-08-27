import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Shield, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.' 
          : authError.message);
      } else if (data.session) {
        navigate('/inicio');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#ffffff] dark:bg-[#061320] px-4 overflow-hidden transition-colors duration-300">
      {/* Premium background decorative shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[35rem] h-[35rem] sm:w-[45rem] sm:h-[45rem] rounded-full bg-primary/10 dark:bg-primary/20 blur-[120px] pointer-events-none animate-float-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[30rem] h-[30rem] sm:w-[40rem] sm:h-[40rem] rounded-full bg-secondary/10 dark:bg-secondary/20 blur-[130px] pointer-events-none animate-float-2" />

      {/* Grid Pattern overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08284205_1px,transparent_1px),linear-gradient(to_bottom,#08284205_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Login Container */}
      <div className="relative w-full max-w-[440px] z-10 animate-fade-in">
        <div className="glass shadow-premium rounded-3xl p-8 sm:p-10 bg-white/75 dark:bg-[#0b1c2e]/75 border border-white/40 dark:border-white/5">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 dark:bg-secondary/25 text-secondary dark:text-secondary mb-4 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-primary dark:text-slate-100 text-center tracking-tight">
              Sistema BRM
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-mono tracking-wider mt-1.5 uppercase">
              Painel de Acesso Seguro
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm mb-6 border border-rose-100 dark:border-rose-950/30 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide block ml-1">
                E-mail
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-secondary transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@brm.com"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-850 dark:text-slate-100 text-sm placeholder-slate-400 focus:border-secondary dark:focus:border-secondary focus:ring-2 focus:ring-secondary/15 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide block">
                  Senha
                </label>
                <a href="#" className="text-xs text-secondary hover:text-accent font-medium transition-colors">
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-secondary transition-colors">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-850 dark:text-slate-100 text-sm placeholder-slate-400 focus:border-secondary dark:focus:border-secondary focus:ring-2 focus:ring-secondary/15 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-3.5 rounded-2xl bg-secondary hover:bg-secondary/95 text-white font-semibold text-sm shadow-premium shadow-secondary/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Acessando...</span>
                </>
              ) : (
                <span>Entrar no Sistema</span>
              )}
            </button>

          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 font-mono">
          Sistema BRM &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
