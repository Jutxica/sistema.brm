import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, UserCheck } from 'lucide-react';

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
        setError(authError.message === 'Invalid login credentials' 
          ? 'Credenciais inválidas. Verifique seu e-mail e senha de administrador.' 
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
    <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 transition-colors duration-500 font-sans select-none">
      
      {/* Top spacing */}
      <div className="h-8 md:h-12" />

      {/* Main Cathedral Showcase */}
      <div className="flex-grow flex items-center justify-center py-8">
        <div className="w-full max-w-[460px] bg-white dark:bg-[#161b22] rounded-[8px] p-8 sm:p-12 border border-[#d6d6d6] dark:border-slate-800 shadow-[0_4px_24px_-4px_rgba(17,50,64,0.07)] transition-all duration-300">
          
          {/* Header & Brand */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-5">
              <img 
                src="/logo-sistema.png" 
                alt="Província BRM" 
                className="h-16 w-auto object-contain select-none pointer-events-none dark:hidden"
              />
              <img 
                src="/logo-branco.png" 
                alt="Província BRM" 
                className="h-16 w-auto object-contain select-none pointer-events-none hidden dark:block"
              />
            </div>
            
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#226380] font-cinzel block">
              Província Brasil Meridional
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#113240] dark:text-white mt-1 font-cinzel">
              Sistema BRM
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1.5 leading-relaxed">
              Gestão da Sede Provincial & Governança Provincial
            </p>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-[6px] bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs mb-6 border border-red-200 dark:border-red-900/40 animate-shake font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 block">
                E-mail Institucional
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
                  placeholder="admin@brm.org.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-[6px] border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 block">
                  Senha
                </label>
                <a 
                  href="#" 
                  className="text-xs text-[#226380] hover:text-[#113240] dark:text-[#A3C3C7] hover:underline font-mono transition-colors"
                >
                  Esqueceu a senha?
                </a>
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
                  placeholder="Digite sua senha"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-[6px] border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-[6px] bg-[#113240] hover:bg-[#226380] dark:bg-white text-white dark:text-slate-900 text-xs font-mono uppercase tracking-wider font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 border border-[#113240] dark:border-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <span>Acessar Painel da Sede Provincial</span>
                )}
              </button>

              {/* Botão de Demonstração / Acesso Rápido */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('brm_e2e_preview', 'true');
                  localStorage.removeItem('brm_e2e_role');
                  window.location.href = '/inicio';
                }}
                className="w-full py-2.5 px-4 rounded-[6px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#113240] dark:text-slate-300 text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer border border-dashed border-[#A3C3C7] dark:border-slate-700 flex items-center justify-center gap-2"
              >
                <span>Entrar como Administrador (Acesso Rápido)</span>
              </button>
            </div>

          </form>

          {/* Atalho Fraterno para Área do Confrade */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2.5 font-normal">
              É um religioso da Província BRM?
            </span>
            <Link
              to="/portal-religioso"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#226380] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#113240] dark:text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all"
            >
              <UserCheck className="w-4 h-4 text-[#226380]" />
              <span>Acessar Área do Confrade</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Cathedral Footer */}
      <footer className="w-full max-w-[980px] mx-auto py-6 border-t border-[#d6d6d6]/60 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-[#707070] dark:text-[#86868b] gap-3">
        <div>
          Sistema BRM &copy; {new Date().getFullYear()}. Província Brasil Meridional.
        </div>
        <div className="flex gap-5">
          <Link to="/privacidade" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            Políticas de Privacidade
          </Link>
          <Link to="/privacidade" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            Termos de Uso
          </Link>
          <a href="mailto:secretaria@brm.org.br" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            Secretaria Provincial
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
