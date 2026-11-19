import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ShieldAlert, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../hooks/useFeedback';

const PADRAO_SENHA_PROVISORIA = /^brm@(\d{8}|2026scj)$/i;

export const TrocaSenhaGenericaModal: React.FC = () => {
  const { user, logout, marcarSenhaAtualizada, refreshUserProfile } = useAuth();
  const location = useLocation();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecoveryRoute =
    location.pathname.startsWith('/redefinir-senha') ||
    location.pathname.startsWith('/reset-password');

  if (!user || !user.precisaTrocarSenha || isRecoveryRoute) {
    return null;
  }

  const nomeExibicao = user.religiosoNome || user.nome || user.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 6) {
      setError('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (PADRAO_SENHA_PROVISORIA.test(novaSenha.trim())) {
      setError('Escolha uma senha pessoal diferente da senha provisória institucional (brm@...).');
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

      if (updateError) {
        if (updateError.message.toLowerCase().includes('different from the old password')) {
          setError('A nova senha precisa ser diferente da senha provisória atual.');
          return;
        }
        throw updateError;
      }

      setNovaSenha('');
      setConfirmarSenha('');
      marcarSenhaAtualizada();
      await refreshUserProfile(user.id);
      showToast.success('Senha pessoal cadastrada com sucesso.');
    } catch (err) {
      console.error('Erro ao atualizar senha provisória:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a nova senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-troca-senha-obrigatoria"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#DCE4E2] dark:border-[#22333B] bg-white dark:bg-[#131F26] shadow-2xl overflow-hidden">
        {/* Faixa superior institucional */}
        <div className="bg-[#113240] px-6 py-5 border-b border-[#226380]/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#A3C3C7] shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3C3C7]">
                Segurança de Acesso · Província BRM
              </p>
              <h2
                id="titulo-troca-senha-obrigatoria"
                className="text-lg font-semibold text-white font-serif leading-snug mt-0.5"
              >
                Defina sua senha pessoal
              </h2>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6">
          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            Prezado <strong className="text-slate-900 dark:text-white">{nomeExibicao}</strong>, identificamos que sua conta ainda está usando a <strong>senha provisória</strong>. Para continuar utilizando o sistema com segurança, cadastre agora uma nova senha pessoal definitiva.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/40"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="modal-nova-senha"
                className="block text-[13px] font-medium text-slate-800 dark:text-slate-200"
              >
                Nova senha pessoal
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="modal-nova-senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoFocus
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-white dark:bg-[#0E171C] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="modal-confirmar-senha"
                className="block text-[13px] font-medium text-slate-800 dark:text-slate-200"
              >
                Confirmar nova senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="modal-confirmar-senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-white dark:bg-[#0E171C] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#19485c] text-white text-[13.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <span>Salvar nova senha e continuar</span>
                )}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => void logout()}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da conta</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrocaSenhaGenericaModal;
