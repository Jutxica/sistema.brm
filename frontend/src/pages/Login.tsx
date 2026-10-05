import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
        navigate('/inicio');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f7] dark:bg-[#0b0f17] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 font-sans select-none transition-colors duration-300">
      
      {/* Top spacing */}
      <div className="h-12 md:h-16" />

      {/* Login Card */}
      <div className="flex-grow flex items-center justify-center py-6">
        <div className="w-full max-w-[380px] bg-white dark:bg-[#161b22] rounded-2xl p-8 sm:p-9 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
          
          {/* Brand & Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="/logo-sistema.png" 
              alt="Província BRM" 
              className="h-12 w-auto object-contain mb-3 dark:hidden"
            />
            <img 
              src="/logo-branco.png" 
              alt="Província BRM" 
              className="h-12 w-auto object-contain mb-3 hidden dark:block"
            />
            <h1 className="text-xl font-semibold tracking-tight text-[#113240] dark:text-white">
              Sistema BRM
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Província Brasil Meridional
            </p>
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                Senha
              </label>
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
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        sistema.brm.org - todos os direitos reservados-2026
      </footer>
    </div>
  );
};

export default Login;
