import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Building, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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
      setError('Erro ao conectar com o Supabase. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50/60 dark:bg-[#061320] px-4 overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2" />

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-2xl glass shadow-premium p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          {/* Logo container */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 dark:bg-secondary/15 text-primary dark:text-secondary mb-4">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary dark:text-slate-100 text-center">
            Conventinho SCJ
          </h2>
          <p className="text-slate-400 text-xs font-mono tracking-wider mt-1 uppercase">
            Área de Acesso
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm mb-6 border border-red-100 dark:border-red-950/50">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
              Endereço de E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:border-secondary dark:focus:border-secondary focus:ring-1 focus:ring-secondary/25 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                Senha
              </label>
              <a href="#" className="text-xs text-secondary hover:underline font-medium">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:border-secondary dark:focus:border-secondary focus:ring-1 focus:ring-secondary/25 outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full py-3 rounded-xl bg-secondary hover:bg-secondary/95 text-white font-semibold text-sm shadow-premium shadow-secondary/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no sistema</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
