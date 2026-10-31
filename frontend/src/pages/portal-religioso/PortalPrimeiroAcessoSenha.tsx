import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { showToast } from '../../hooks/useFeedback';

interface PortalPrimeiroAcessoSenhaProps {
  confradeNome: string;
  onSuccess: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export const PortalPrimeiroAcessoSenha: React.FC<PortalPrimeiroAcessoSenhaProps> = ({
  confradeNome,
  onSuccess,
  onLogout,
}) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 6) {
      setError('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
        data: { precisa_trocar_senha: false },
      });

      if (updateError) throw updateError;

      showToast.success('Senha definitiva cadastrada com sucesso! Bem-vindo.');
      await onSuccess();
    } catch (err) {
      console.error('Erro ao definir nova senha:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a nova senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F6F5] dark:bg-[#0E171B] text-[#203136] dark:text-[#EDF2F1] transition-colors duration-150">
      {/* Header */}
      <header className="border-b border-[#DCE4E2] dark:border-[#203038] bg-white dark:bg-[#131E24] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-7 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="h-7 w-auto object-contain hidden dark:block" />
            <span className="text-[13px] font-semibold text-[#113240] dark:text-[#EDF2F1] hidden sm:inline">
              Província Brasileira Meridional · Sacerdotes do Sagrado Coração de Jesus
            </span>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg rounded-xl border border-[#DCE4E2] dark:border-[#22333B] bg-white dark:bg-[#142027] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#113240]/10 dark:bg-white/10 flex items-center justify-center text-[#113240] dark:text-white shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#226380] dark:text-[#A3C3C7]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#113240] dark:text-white font-serif">
                Primeiro Acesso: Definição de Senha
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Segurança canônica e institucional
              </p>
            </div>
          </div>

          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            Seja bem-vindo, <strong className="text-slate-900 dark:text-white">{confradeNome}</strong>! Como este é seu primeiro acesso com a credencial inicial, defina agora sua nova senha pessoal definitiva para continuar.
          </p>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-[13px] border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="senha-nova" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                Nova senha definitiva
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="senha-nova"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="senha-confirmar" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                Confirmar nova senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="senha-confirmar"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#19485c] text-white text-[13.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando senha...</span>
                  </>
                ) : (
                  <span>Salvar Senha e Entrar no Portal</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCE4E2] dark:border-[#203038] py-4 px-4 text-center text-xs text-slate-600 dark:text-slate-400">
        <p>Província Brasileira Meridional dos Sacerdotes do Sagrado Coração de Jesus · Curitiba – PR</p>
      </footer>
    </div>
  );
};

export default PortalPrimeiroAcessoSenha;
