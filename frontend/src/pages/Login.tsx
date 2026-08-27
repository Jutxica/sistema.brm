import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoBrm from '../assets/logo-brm.png';

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
    <div className="relative min-h-screen flex items-center justify-center bg-[#ffffff] dark:bg-[#061320] px-4 overflow-hidden transition-colors duration-500">
      
      {/* Decorative blurred background shapes - Ultra-modern organic layout */}
      <div className="absolute top-[-30%] left-[-20%] w-[50rem] h-[50rem] rounded-full bg-gradient-to-tr from-primary/20 to-secondary/10 dark:from-primary/30 dark:to-secondary/5 blur-[140px] pointer-events-none animate-float-1" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[45rem] h-[45rem] rounded-full bg-gradient-to-br from-secondary/15 to-accent/10 dark:from-secondary/20 dark:to-accent/5 blur-[150px] pointer-events-none animate-float-2" />

      {/* Elegant minimalist grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08284203_1px,transparent_1px),linear-gradient(to_bottom,#08284203_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Card with premium hover effect and layout */}
      <div className="relative w-full max-w-[430px] z-10 animate-fade-in">
        <div className="glass shadow-premium rounded-[32px] p-8 sm:p-10 bg-white/70 dark:bg-[#0b1c2e]/70 border border-white/50 dark:border-white/5 backdrop-blur-xl">
          
          {/* Logo container using image from assets */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full flex justify-center mb-3">
              <img 
                src={logoBrm} 
                alt="Sistema BRM" 
                className="max-h-20 object-contain drop-shadow-sm select-none"
              />
            </div>
            <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full opacity-60 mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-mono tracking-[0.2em] uppercase select-none">
              Acesso Administrativo
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm mb-6 border border-rose-100 dark:border-rose-950/30 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-sans leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase ml-1">
                E-mail
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4.5 text-slate-400 dark:text-slate-500 group-focus-within:text-secondary transition-colors duration-200">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 focus:border-secondary dark:focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  Senha
                </label>
                <a href="#" className="text-xs text-secondary hover:text-accent font-semibold transition-colors duration-200">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4.5 text-slate-400 dark:text-slate-500 group-focus-within:text-secondary transition-colors duration-200">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 focus:border-secondary dark:focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-3.5 rounded-2xl bg-secondary hover:bg-secondary/95 text-white font-semibold text-sm shadow-premium shadow-secondary/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200 cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>

          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-6 font-mono tracking-wide">
          Sistema BRM &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
