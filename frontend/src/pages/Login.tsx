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
    <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f7] dark:bg-[#090a0f] text-[#1d1d1f] dark:text-[#e6edf3] px-4 transition-colors duration-500 select-none">
      
      {/* Spacer to push content down */}
      <div className="h-6" />

      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center py-10">
        <div className="w-full max-w-[440px] bg-white dark:bg-[#12151e] rounded-[28px] p-8 sm:p-12 border-0 shadow-none transition-colors duration-500">
          
          {/* Header & Brand */}
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src={logoBrm} 
              alt="Sistema BRM" 
              className="h-12 object-contain mb-5 select-none pointer-events-none"
            />
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              Sistema BRM
            </h1>
            <p className="text-[#707070] dark:text-[#8b949e] text-xs font-medium mt-1">
              Gerencie suas hospedagens com segurança.
            </p>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#fafafc] dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 text-xs mb-6 border border-[#d6d6d6] dark:border-rose-950/20 animate-shake">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span className="font-sans leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#707070] dark:text-[#8b949e] tracking-tight ml-1 block">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#707070] dark:text-[#8b949e] pointer-events-none">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@brm.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#ffffff] dark:bg-[#090a0f] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#d6d6d6] dark:placeholder-slate-800 text-sm rounded-xl border border-[#d6d6d6] dark:border-slate-800 focus:border-[#0071e3] dark:focus:border-[#7f00ff] focus:ring-4 focus:ring-[#0071e3]/10 dark:focus:ring-[#7f00ff]/10 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-semibold text-[#707070] dark:text-[#8b949e] tracking-tight block">
                  Senha
                </label>
                <a href="#" className="text-xs text-[#0066cc] dark:text-[#00f2fe] hover:underline font-normal transition-all">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#707070] dark:text-[#8b949e] pointer-events-none">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-11 pr-11 py-3 bg-[#ffffff] dark:bg-[#090a0f] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#d6d6d6] dark:placeholder-slate-800 text-sm rounded-xl border border-[#d6d6d6] dark:border-slate-800 focus:border-[#0071e3] dark:focus:border-[#7f00ff] focus:ring-4 focus:ring-[#0071e3]/10 dark:focus:ring-[#7f00ff]/10 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#707070] dark:text-[#8b949e] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button - Pill Shape */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-3 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] dark:bg-[#7f00ff] dark:hover:bg-[#8e1aff] text-white font-medium text-sm transition-all duration-250 cursor-pointer mt-6 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin mr-2" />
                  <span>Conectando...</span>
                </>
              ) : (
                <span>Iniciar sessão</span>
              )}
            </button>

          </form>
        </div>
      </div>

      {/* Footer Navigation - Standard Apple-Style footer */}
      <footer className="w-full max-w-[980px] mx-auto py-5 border-t border-[#d6d6d6] dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-center text-[11px] text-[#707070] dark:text-[#8b949e] font-sans gap-3">
        <div>
          Sistema BRM &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Políticas de Privacidade</a>
          <a href="#" className="hover:underline">Termos de Uso</a>
          <a href="#" className="hover:underline">Suporte</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
