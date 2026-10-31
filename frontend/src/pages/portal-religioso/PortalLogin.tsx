import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { validateCpf } from '../../lib/cpf';
import { getPortalRedirectUrl, getPasswordResetRedirectUrl } from '../../lib/portalUrls';

interface PortalLoginProps {
  onSuccess: (userId: string) => Promise<void> | void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Recovery state
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // Register form state
  const [regNomeCivil, setRegNomeCivil] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regDataNascimento, setRegDataNascimento] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirmarSenha, setRegConfirmarSenha] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const targetEmail = identificador.trim().toLowerCase();
      if (!targetEmail.includes('@')) {
        setAuthError('Use o e-mail cadastrado na sua conta para entrar. O CPF não é utilizado como login.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: senha,
      });

      if (error) {
        setAuthError(
          error.message === 'Invalid login credentials'
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : error.message
        );
      } else if (data.session && data.session.user) {
        await onSuccess(data.session.user.id);
      }
    } catch (err) {
      console.error('Erro ao autenticar:', err);
      setAuthError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor da Província.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const cleanCpf = regCpf.replace(/\D/g, '');
    if (!validateCpf(cleanCpf)) {
      setAuthError('CPF inválido. Confira os 11 dígitos verificadores.');
      setAuthLoading(false);
      return;
    }

    if (!consentAccepted) {
      setAuthError('É necessário confirmar o termo de consentimento dos dados.');
      setAuthLoading(false);
      return;
    }

    if (!regDataNascimento || regDataNascimento >= new Date().toISOString().slice(0, 10)) {
      setAuthError('Informe uma data de nascimento válida.');
      setAuthLoading(false);
      return;
    }

    if (regSenha.length < 6) {
      setAuthError('A senha deve possuir no mínimo 6 caracteres.');
      setAuthLoading(false);
      return;
    }

    if (regSenha !== regConfirmarSenha) {
      setAuthError('As senhas digitadas não coincidem.');
      setAuthLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regSenha,
        options: {
          emailRedirectTo: getPortalRedirectUrl(),
          data: {
            nome: regNomeCivil.trim(),
            cpf: cleanCpf,
            data_nascimento: regDataNascimento,
            consentimento_dados: 'true',
          },
        },
      });

      if (authError) {
        setAuthError(
          authError.message.includes('already registered')
            ? 'Este e-mail já possui cadastro. Faça login ou recupere sua senha.'
            : authError.message
        );
        return;
      }

      if (authData.session && authData.user) {
        await onSuccess(authData.user.id);
      } else {
        setAuthSuccess(
          'Acesso registrado. Enviamos uma confirmação para seu e-mail. Após confirmar, você poderá acessar o portal com sua senha.'
        );
        setAuthMode('login');
        setIdentificador(regEmail.trim().toLowerCase());
        setSenha('');
      }
    } catch (err) {
      console.error('Erro ao registrar:', err);
      setAuthError(err instanceof Error ? err.message : 'Falha ao registrar conta de confrade.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = recoveryEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setAuthError('Informe o e-mail da sua conta institucional.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl('portal'),
      });
      if (error) throw error;
      setAuthSuccess('Se houver uma conta associada a este e-mail, as instruções de redefinição foram enviadas.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível solicitar a redefinição de senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F6F5] dark:bg-[#0E171B] text-[#203136] dark:text-[#EDF2F1] transition-colors duration-150">
      {/* Top Bar with quick reference */}
      <header className="border-b border-[#DCE4E2] dark:border-[#203038] bg-white dark:bg-[#131E24] px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-7 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="h-7 w-auto object-contain hidden dark:block" />
            <span className="text-[13px] font-semibold text-[#113240] dark:text-[#EDF2F1] hidden sm:inline">
              Província Brasileira Meridional · Sacerdotes do Sagrado Coração de Jesus
            </span>
          </div>

          <div className="flex items-center gap-4 text-[13px]">
            <a
              href="/cadastro-religiosos"
              className="text-slate-700 dark:text-slate-300 hover:text-[#113240] dark:hover:text-white"
            >
              Ficha Pública
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl rounded-xl border border-[#DCE4E2] dark:border-[#22333B] bg-white dark:bg-[#142027] overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Column 1: Institutional Lineage & Identity (Navy) */}
          <section className="md:col-span-5 bg-[#113240] text-white p-5 sm:p-8 md:p-10 flex flex-col justify-between relative">
            <div>
              <div className="flex items-center gap-3 mb-4 sm:mb-8">
                <img
                  src="/logo-branco.png"
                  alt="Província Brasileira Meridional"
                  className="h-9 sm:h-12 w-auto object-contain"
                />
              </div>

              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white mb-1 sm:mb-2">
                Província Brasileira Meridional
              </h2>
              <p className="text-[13px] text-[#A3C3C7] mb-3 sm:mb-6">
                Sacerdotes do Sagrado Coração de Jesus · Dehonianos
              </p>

              <div className="hidden md:block space-y-3.5 text-[13px] leading-relaxed text-slate-200">
                <p>
                  Ambiente institucional reservado aos confrades da Província para comunhão, acompanhamento comunitário e serviços canônicos.
                </p>
                <div className="space-y-2 text-slate-300 pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B58A55] shrink-0 mt-2" />
                    <span>Consulta ao Elenco Provincial e contatos dos religiosos</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B58A55] shrink-0 mt-2" />
                    <span>Circulares, decretos oficiais e agenda da Província</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B58A55] shrink-0 mt-2" />
                    <span>Solicitações de hospedagem nas casas de acolhida</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B58A55] shrink-0 mt-2" />
                    <span>Atualização cadastral contínua junto à Secretaria</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block pt-6 border-t border-white/10 mt-6 sm:mt-8">
              <div className="border-l-2 border-[#B58A55] pl-3 py-0.5">
                <p className="text-[13px] italic text-slate-200">
                  &ldquo;Sint Unum&rdquo; · Jo 17, 21
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Curitiba – PR · Curia Provincial BRM
                </p>
              </div>
            </div>
          </section>

          {/* Column 2: Authentication & Registration (Paper Surface) */}
          <section className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white dark:bg-[#142027]">
            <div>
              {/* Title and Subtitle */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[#113240] dark:text-white">
                  {recoveryMode ? 'Recuperação de Senha' : 'Portal do Confrade'}
                </h1>
                <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1">
                  {recoveryMode
                    ? 'Informe o e-mail cadastrado para receber as instruções de recuperação.'
                    : authMode === 'login'
                    ? 'Acesse com seu e-mail institucional e senha.'
                    : 'Informe seus dados civis para iniciar o vínculo com a Secretaria Provincial.'}
                </p>
              </div>

              {/* Mode Selector Tabs (Login / Register) */}
              {!recoveryMode && (
                <div role="tablist" aria-label="Opções de acesso" className="flex border-b border-[#DCE4E2] dark:border-[#273840] mb-6">
                  <button
                    role="tab"
                    id="tab-login"
                    aria-selected={authMode === 'login'}
                    aria-controls="panel-auth"
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`pb-3 px-1 mr-6 text-[13px] font-semibold border-b-2 transition-colors duration-150 cursor-pointer ${
                      authMode === 'login'
                        ? 'border-[#113240] text-[#113240] dark:border-[#A3C3C7] dark:text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Acesso do Confrade
                  </button>

                  <button
                    role="tab"
                    id="tab-register"
                    aria-selected={authMode === 'register'}
                    aria-controls="panel-auth"
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`pb-3 px-1 text-[13px] font-semibold border-b-2 transition-colors duration-150 cursor-pointer ${
                      authMode === 'register'
                        ? 'border-[#113240] text-[#113240] dark:border-[#A3C3C7] dark:text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Primeiro Acesso
                  </button>
                </div>
              )}

              {/* Alerts */}
              {authError && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-[13px] border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div role="status" aria-live="polite" className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-[13px] border border-emerald-200 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="leading-relaxed">{authSuccess}</span>
                </div>
              )}

              {/* Recovery Form */}
              {recoveryMode ? (
                <form onSubmit={handlePasswordRecovery} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="portal-recovery-email" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      E-mail institucional ou cadastrado
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="portal-recovery-email"
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="confrade@brm.org.br"
                        className="w-full pl-10 pr-4 py-2.5 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#19485c] text-white text-[13.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando link...</span>
                        </>
                      ) : (
                        <span>Enviar Link de Recuperação</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode(false);
                        setAuthError(null);
                      }}
                      className="w-full py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:text-[#113240] dark:hover:text-white transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar ao login</span>
                    </button>
                  </div>
                </form>
              ) : authMode === 'login' ? (
                /* Login Form */
                <form id="panel-auth" role="tabpanel" aria-labelledby="tab-login" onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="portal-login-email" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      E-mail institucional
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="portal-login-email"
                        type="email"
                        required
                        value={identificador}
                        onChange={(e) => setIdentificador(e.target.value)}
                        autoComplete="email"
                        placeholder="confrade@brm.org.br"
                        className="w-full pl-10 pr-4 py-2.5 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="portal-login-password" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode(true);
                          setRecoveryEmail(identificador);
                          setAuthError(null);
                        }}
                        className="text-xs font-medium text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="portal-login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#19485c] text-white text-[13.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Autenticando...</span>
                        </>
                      ) : (
                        <span>Entrar no Portal</span>
                      )}
                    </button>

                    {import.meta.env.DEV && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('brm_e2e_preview', 'true');
                          localStorage.setItem('brm_e2e_role', 'religioso');
                          window.location.reload();
                        }}
                        className="mt-2.5 w-full py-2 px-3 rounded-lg border border-dashed border-[#226380]/40 text-[#226380] dark:text-[#A3C3C7] text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#10191F] transition-colors duration-150 cursor-pointer"
                      >
                        Acesso Rápido de Confrade (Demonstração)
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                /* Registration Form */
                <form id="panel-auth" role="tabpanel" aria-labelledby="tab-register" onSubmit={handleRegister} className="space-y-3.5">
                  <div className="space-y-1">
                    <label htmlFor="portal-reg-nome" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      Nome civil completo
                    </label>
                    <input
                      id="portal-reg-nome"
                      type="text"
                      required
                      value={regNomeCivil}
                      onChange={(e) => setRegNomeCivil(e.target.value)}
                      placeholder="Nome completo de registro"
                      className="w-full px-3 py-2 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="portal-reg-cpf" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        CPF
                      </label>
                      <input
                        id="portal-reg-cpf"
                        type="text"
                        required
                        maxLength={14}
                        value={regCpf}
                        onChange={(e) => setRegCpf(formatCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="portal-reg-nasc" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        Data de nascimento
                      </label>
                      <input
                        id="portal-reg-nasc"
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        value={regDataNascimento}
                        onChange={(e) => setRegDataNascimento(e.target.value)}
                        className="w-full px-3 py-2 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="portal-reg-email" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      E-mail institucional ou principal
                    </label>
                    <input
                      id="portal-reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seu.email@brm.org.br"
                      className="w-full px-3 py-2 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="portal-reg-pass" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        Senha
                      </label>
                      <input
                        id="portal-reg-pass"
                        type="password"
                        required
                        minLength={6}
                        value={regSenha}
                        onChange={(e) => setRegSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="portal-reg-pass-conf" className="block text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        Confirmar senha
                      </label>
                      <input
                        id="portal-reg-pass-conf"
                        type="password"
                        required
                        minLength={6}
                        value={regConfirmarSenha}
                        onChange={(e) => setRegConfirmarSenha(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full px-3 py-2 text-[13.5px] bg-white dark:bg-[#10191F] text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none transition-colors duration-150"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 pt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      required
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#113240] focus:ring-[#226380] shrink-0"
                    />
                    <span>
                      Declaro ser membro ou formando da Província Brasileira Meridional e autorizo o tratamento destes dados pela Secretaria Provincial para fins institucionais e canônicos.
                    </span>
                  </label>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#113240] hover:bg-[#19485c] text-white text-[13.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cadastrando...</span>
                        </>
                      ) : (
                        <span>Criar Acesso e Conectar</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Support Information */}
            <div className="mt-8 pt-4 border-t border-[#DCE4E2] dark:border-[#273840] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Dificuldades de acesso? Contate a Secretaria Provincial</span>
              <a
                href="/privacidade"
                className="text-[#226380] dark:text-[#A3C3C7] font-medium hover:underline"
              >
                Privacidade
              </a>
            </div>
          </section>

        </div>
      </main>

      {/* Grounded Institutional Footer */}
      <footer className="border-t border-[#DCE4E2] dark:border-[#203038] py-4 px-4 text-center text-xs text-slate-600 dark:text-slate-400">
        <p>Província Brasileira Meridional dos Sacerdotes do Sagrado Coração de Jesus · Curitiba – PR</p>
      </footer>
    </div>
  );
};

export default PortalLogin;
