import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getPasswordResetRedirectUrl } from '../lib/portalUrls';
import { Lock, Mail, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const RedefinirSenha: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const origem = searchParams.get('origem') || 'sistema';

  // Estados
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form de nova senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Form de solicitação de e-mail (caso acesse sem token)
  const [emailSolicitacao, setEmailSolicitacao] = useState('');
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Mensagens
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Verificar se a URL possui tokens de recuperação no hash ou search
    const hash = window.location.hash;
    const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token');
    const isRecoveryParam = searchParams.get('type') === 'recovery';

    // 2. Escutar eventos do Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryHash)) {
        setHasRecoverySession(true);
      } else if (session) {
        // Se já existe sessão e veio de um link de recuperação
        if (isRecoveryHash || isRecoveryParam) {
          setHasRecoverySession(true);
        }
      }
    });

    // 3. Checar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && (isRecoveryHash || isRecoveryParam)) {
        setHasRecoverySession(true);
      } else if (isRecoveryHash) {
        // O hash indica recuperação, aguarda o cliente do Supabase processar
        setHasRecoverySession(true);
      }
      setLoadingInitial(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  // Ação: Salvar nova senha
  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (novaSenha.length < 6) {
      setErrorMsg('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setSubmittingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        throw error;
      }
      setPasswordSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao atualizar a senha.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Ação: Solicitar e-mail de recuperação
  const handleSolicitarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailSentSuccess(false);

    const email = emailSolicitacao.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setSendingResetEmail(true);
    try {
      const redirectUrl = getPasswordResetRedirectUrl(origem === 'portal' ? 'portal' : 'sistema');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setEmailSentSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível solicitar a recuperação.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const voltarUrl = origem === 'portal' ? '/portal-religioso' : '/login';
  const voltarTexto = origem === 'portal' ? 'Voltar ao Portal do Confrade' : 'Voltar ao Login Administrativo';

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
      <div className="relative z-10 h-10 md:h-14" />

      {/* Main Card */}
      <div className="relative z-10 flex flex-grow items-center justify-center py-6">
        <div className="brm-auth-card relative w-full max-w-[460px] overflow-hidden rounded-2xl p-7 transition-all sm:p-10 shadow-2xl bg-white/95 dark:bg-[#161f22]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80">

          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <img src="/logo-sistema.png" alt="Província BRM" className="mb-3 h-12 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="mb-3 hidden h-12 w-auto object-contain dark:block" />
            <h1 className="text-[1.4rem] font-semibold tracking-tight text-[#113240] dark:text-white">
              {hasRecoverySession ? 'Redefinir Senha' : 'Recuperar Acesso'}
            </h1>
            <p className="text-[12px] text-[#66777b] dark:text-[#a0aeaf] mt-1">
              Província Brasil Meridional · {origem === 'portal' ? 'Portal do Confrade' : 'Sistema de Gestão'}
            </p>
          </div>

          {/* Erro Geral */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs mb-5 border border-red-200/80 dark:border-red-900/40 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#226380]" />
              <span className="text-xs text-slate-500">Verificando autorização...</span>
            </div>
          ) : passwordSuccess ? (
            /* Tela de Sucesso ao Atualizar Senha */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-[#113240] dark:text-white">
                Senha atualizada com sucesso!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Sua credencial de acesso foi alterada. Você já pode fazer login normalmente com a sua nova senha.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate(origem === 'portal' ? '/portal-religioso' : '/login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-[#A3C3C7] dark:hover:bg-white text-white dark:text-[#102b35] text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {origem === 'portal' ? 'Acessar o Portal do Confrade' : 'Acessar o Sistema Administrativo'}
                </button>
              </div>
            </div>
          ) : hasRecoverySession ? (
            /* Formulário: Digitar Nova Senha */
            <form onSubmit={handleAtualizarSenha} className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                Crie uma nova senha segura com no mínimo 6 caracteres para a sua conta.
              </p>

              {/* Campo Nova Senha */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-700 dark:text-slate-200 block">
                  Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNovaSenha ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#226380]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNovaSenha(!showNovaSenha)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Nova Senha */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-700 dark:text-slate-200 block">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmarSenha ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#226380]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-[#A3C3C7] dark:hover:bg-white text-white dark:text-[#102b35] text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {submittingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <span>Salvar Nova Senha</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Formulário: Solicitar Envio de Link para o E-mail */
            <form onSubmit={handleSolicitarEmail} className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Digite o endereço de e-mail associado à sua conta. Enviaremos um link de confirmação para você cadastrar uma nova senha.
              </p>

              {emailSentSuccess && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200/80 dark:border-emerald-900/40 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span className="leading-relaxed">
                    Se houver uma conta cadastrada com este e-mail, as instruções de recuperação foram enviadas.
                    <strong className="block mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
                      Importante: verifique também a pasta de Lixo Eletrônico / Spam.
                    </strong>
                  </span>
                </div>
              )}

              {/* Campo E-mail */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-700 dark:text-slate-200 block">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={emailSolicitacao}
                    onChange={(e) => setEmailSolicitacao(e.target.value)}
                    placeholder="seu.email@brm.org.br"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#226380]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Botão de Solicitação */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sendingResetEmail}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#1a4b60] dark:bg-[#A3C3C7] dark:hover:bg-white text-white dark:text-[#102b35] text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {sendingResetEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando link...</span>
                    </>
                  ) : (
                    <span>Enviar Link de Recuperação</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Rodapé do Card com link de retorno */}
          <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
            <button
              type="button"
              onClick={() => navigate(voltarUrl)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#226380] hover:text-[#113240] dark:text-[#A3C3C7] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{voltarTexto}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white/80 drop-shadow">
        sistema.brm.org - Província Brasil Meridional · 2026
      </footer>
    </div>
  );
};

export default RedefinirSenha;
