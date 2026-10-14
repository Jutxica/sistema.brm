import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Loader2, CheckCircle2, ChevronRight, ChevronLeft, Building, 
  AlertCircle, FileText, ShieldCheck
} from 'lucide-react';

interface Config {
  chos_acolhida: string;
  chos_ativar: 'Sim' | 'Não';
  chos_txtinativo: string;
}

interface Estadia {
  idmainhospedagem: string;
  main_motivo: string;
  main_termos: string;
  main_mensagemtela: string;
}

interface PublicRegistrationResult {
  idhospedagens: number;
  recibo_token: string;
}

const isPublicRegistrationResult = (value: unknown): value is PublicRegistrationResult => (
  typeof value === 'object'
  && value !== null
  && 'idhospedagens' in value
  && typeof value.idhospedagens === 'number'
  && 'recibo_token' in value
  && typeof value.recibo_token === 'string'
);

interface Modulo {
  idmodulos: string;
  mod_nome: string;
}

interface Lavanderia {
  idlavanderia: string;
  lav_servico: string;
}

interface CasaReferencia {
  id: string;
  nome: string;
  tipo?: string;
  localidade?: string;
  cidade?: string;
  uf?: string;
}

export const InscricaoPublica: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftError, setDraftError] = useState(false);
  const [draftDisabled, setDraftDisabled] = useState(false);
  const draftWasRestored = useRef(false);
  const draftKey = `brm_hospedagem_inscricao_rascunho_v1:${new URLSearchParams(window.location.search).get('casa') || 'geral'}`;

  // System Settings / Metadata
  const [config, setConfig] = useState<Config | null>(null);
  const [estadias, setEstadias] = useState<Estadia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [lavanderias, setLavanderias] = useState<Lavanderia[]>([]);
  const [casasAcolhida, setCasasAcolhida] = useState<CasaReferencia[]>([]);

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hos_categoria: 'Leigo(a)',
    hos_nome: '',
    hos_nascimento: '',
    hos_cpfrg: '',
    hos_email: '',
    hos_telefone: '',
    hos_telefoneemergencia: '',
    hos_logradouro: '',
    hos_numero: '',
    hos_cep: '',
    hos_bairro: '',
    hos_cidade: '',
    hos_estado: '',
    hos_alergico: 'Não',
    hos_especifiquealergia: '',
    hos_restricaoalimentar: 'Não',
    hos_especifiquerestricao: '',
    hos_lavanderia: 'Não',
    hos_casa_acolhida: '',
    hos_estadiamotivo: '',
    hos_modulo: '',
    hos_previsaochegada: '',
    hos_previsaosaida: '',
    hos_recibo: 'Emitir o recibo no meu próprio nome.',
    hos_recnome: '',
    hos_reccpfcnpj: '',
    hos_reclogradouro: '',
    hos_recnumero: '',
    hos_reccep: '',
    hos_recbairro: '',
    hos_reccidade: '',
    hos_recestado: '',
    hos_termo: 'Não'
  });

  const [cepLoading, setCepLoading] = useState(false);
  const [recCepLoading, setRecCepLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          typeof parsed === 'object' && parsed !== null
          && 'savedAt' in parsed && typeof parsed.savedAt === 'string'
          && Number.isFinite(new Date(parsed.savedAt).getTime())
          && Date.now() - new Date(parsed.savedAt).getTime() < 30 * 24 * 60 * 60 * 1000
          && 'formData' in parsed && typeof parsed.formData === 'object'
          && parsed.formData !== null && !Array.isArray(parsed.formData)
        ) {
          const validEntries = Object.entries(parsed.formData).filter(([key, value]) =>
            key.startsWith('hos_') && typeof value === 'string',
          );
          setFormData(current => ({ ...current, ...Object.fromEntries(validEntries) }));
          if ('step' in parsed && typeof parsed.step === 'number' && parsed.step >= 1 && parsed.step <= 6) {
            setStep(parsed.step);
          }
          draftWasRestored.current = true;
          setDraftRestoredAt(parsed.savedAt);
          setDraftSavedAt(parsed.savedAt);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch (error) {
      console.error('Não foi possível recuperar o rascunho da inscrição:', error);
      setDraftError(true);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || loading || success || draftDisabled) return;
    const persistDraft = () => {
      const savedAt = new Date().toISOString();
      try {
        localStorage.setItem(draftKey, JSON.stringify({ savedAt, step, formData }));
        setDraftSavedAt(savedAt);
        setDraftError(false);
      } catch (error) {
        console.error('Não foi possível salvar o rascunho da inscrição:', error);
        setDraftError(true);
      }
    };
    const timer = window.setTimeout(persistDraft, 600);
    window.addEventListener('pagehide', persistDraft);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', persistDraft);
    };
  }, [draftKey, draftReady, draftDisabled, loading, success, step, formData]);

  useEffect(() => {
    if (draftDisabled) setDraftDisabled(false);
  }, [formData]);

  // Load configuration and lists
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [
          { data: configData },
          { data: estadiasData },
          { data: modulosData },
          { data: lavanderiaData },
          { data: obrasData }
        ] = await Promise.all([
          supabase.from('confighospedagens').select('idconfighospedagens, chos_acolhida, chos_ativar, chos_txtinativo').eq('idconfighospedagens', 1).maybeSingle(),
          supabase.from('mainhospedagem').select('idmainhospedagem, main_motivo, main_termos, main_mensagemtela, main_status').eq('main_status', 'Ativo').order('idmainhospedagem', { ascending: false }),
          supabase.from('modulos').select('idmodulos, mod_nome').eq('mod_status', 'Ativo').order('idmodulos', { ascending: false }),
          supabase.from('lavanderia').select('idlavanderia, lav_servico').order('idlavanderia', { ascending: false }),
          supabase.from('religiosos_obras_referencia').select('id, nome, tipo, localidade, cidade, uf').eq('status', 'Ativa').order('nome')
        ]);

        if (configData) {
          setConfig({
            chos_acolhida: configData.chos_acolhida || '',
            chos_ativar: (configData.chos_ativar === 'ativo' || configData.chos_ativar === 'Sim') ? 'Sim' : 'Não',
            chos_txtinativo: configData.chos_txtinativo || 'As inscrições externas estão suspensas no momento.'
          });
        }

        const estList = (estadiasData || []).map(e => ({ ...e, idmainhospedagem: String(e.idmainhospedagem) })) as Estadia[];
        setEstadias(estList);
        setModulos((modulosData || []).map(m => ({ ...m, idmodulos: String(m.idmodulos) })) as Modulo[]);
        setLavanderias((lavanderiaData || []).map(l => ({ ...l, idlavanderia: String(l.idlavanderia) })) as Lavanderia[]);
        setCasasAcolhida((obrasData || []) as CasaReferencia[]);

        // Verificar pré-seleção vinda de URL (?casa=...)
        const urlParams = new URLSearchParams(window.location.search);
        const casaParam = urlParams.get('casa');
        if (casaParam && !draftWasRestored.current) {
          const decoded = decodeURIComponent(casaParam);
          setFormData(prev => ({ ...prev, hos_casa_acolhida: decoded }));
        }
      } catch (err) {
        console.error("Erro ao carregar dados da página pública:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const selectedCourse = estadias.find(e => e.idmainhospedagem === formData.hos_estadiamotivo);

  // Address lookup via ViaCEP API
  const handleCepLookup = async (cepValue: string, isBilling: boolean) => {
    const cleanedCep = cepValue.replace(/\D/g, '');
    if (cleanedCep.length !== 8) return;

    if (isBilling) {
      setRecCepLoading(true);
    } else {
      setCepLoading(true);
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        if (isBilling) {
          setFormData(prev => ({
            ...prev,
            hos_reclogradouro: data.logradouro,
            hos_recbairro: data.bairro,
            hos_reccidade: data.localidade,
            hos_recestado: data.uf
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            hos_logradouro: data.logradouro,
            hos_bairro: data.bairro,
            hos_cidade: data.localidade,
            hos_estado: data.uf
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    } finally {
      if (isBilling) {
        setRecCepLoading(false);
      } else {
        setCepLoading(false);
      }
    }
  };

  // Valida CPF (11 dígitos, dígitos verificadores)
  const validateCpf = (cpf: string): boolean => {
    const cleaned = (cpf || '').replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(.)(\1){10}$/.test(cleaned)) return false; // todos iguais
    const calc = (base: string, factorStart: number): number => {
      let sum = 0;
      for (let i = 0; i < base.length; i++) sum += parseInt(base[i]) * (factorStart + i);
      const rest = sum % 11;
      return rest < 2 ? 0 : 11 - rest;
    };
    const base = cleaned.slice(0, 9);
    const d1 = calc(base, 10);
    const d2 = calc(base + d1, 11);
    return cleaned.endsWith('' + d1 + d2);
  };

  const handleNextStep = () => {
    // Basic step validation
    if (step === 1) {
      if (!formData.hos_estadiamotivo) {
        setErrorMsg("Por favor, selecione um Curso ou Estadia para continuar.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.hos_nome || !formData.hos_email || !formData.hos_cpfrg || !formData.hos_telefone) {
        setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
      if (!validateCpf(formData.hos_cpfrg)) {
        setErrorMsg("CPF inválido. Digite 11 números sem pontos ou traços.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.hos_cep || !formData.hos_logradouro || !formData.hos_numero || !formData.hos_cidade || !formData.hos_estado) {
        setErrorMsg("Por favor, preencha as informações do endereço.");
        return;
      }
    }
    if (step === 4) {
      if (!formData.hos_previsaochegada || !formData.hos_previsaosaida) {
        setErrorMsg("Selecione a previsão de chegada e saída.");
        return;
      }
      const checkin = new Date(formData.hos_previsaochegada);
      const checkout = new Date(formData.hos_previsaosaida);
      if (isNaN(checkin.getTime()) || isNaN(checkout.getTime())) {
        setErrorMsg("Datas inválidas. Use o formato dd/mm/aaaa.");
        return;
      }
      if (checkout <= checkin) {
        setErrorMsg("A previsão de saída deve ser posterior à de chegada.");
        return;
      }
    }
    if (step === 5) {
      if (formData.hos_recibo === 'Emitir o recibo no nome de terceiro.') {
        if (!formData.hos_recnome || !formData.hos_reccpfcnpj || !formData.hos_reccep || !formData.hos_reclogradouro || !formData.hos_recnumero || !formData.hos_reccidade || !formData.hos_recestado) {
          setErrorMsg("Preencha todos os campos do endereço de faturamento do terceiro.");
          return;
        }
      }
    }

    setErrorMsg(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.hos_termo !== 'Aceito') {
      setErrorMsg("Você precisa aceitar os termos e regulamentos para prosseguir.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      ...formData,
      hos_estadiamotivo: Number(formData.hos_estadiamotivo),
      hos_modulo: formData.hos_modulo ? Number(formData.hos_modulo) : null,
    };

    try {
      const { data, error } = await supabase
        .rpc('hospedagem_inscricao_publica', { p_payload: payload })
        .single();
      if (error) throw error;
      if (!isPublicRegistrationResult(data)) {
        throw new Error('O servidor não retornou um protocolo válido para a inscrição.');
      }

      setRegistrationId(String(data.idhospedagens));
      try {
        localStorage.removeItem(draftKey);
        setDraftRestoredAt(null);
        setDraftSavedAt(null);
      } catch (draftCleanupError) {
        console.error('Inscrição concluída, mas não foi possível remover o rascunho local:', draftCleanupError);
        setDraftError(true);
      }
      void supabase.functions.invoke('send-receipt', {
        body: { id: data.idhospedagens, token: data.recibo_token }
      }).then(({ error: emailError }) => {
        if (emailError) console.warn('Aviso: não foi possível iniciar o envio do e-mail de confirmação:', emailError.message);
      }).catch((emailError: unknown) => {
        console.warn('Aviso: falha ao iniciar o envio do e-mail de confirmação:', emailError);
      });
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Erro ao registrar inscrição:', err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Erro inesperado ao registrar inscrição. Verifique suas informações.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/60 dark:bg-[#061320] relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[45rem] h-[45rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1 z-0" />
        <div className="absolute bottom-[-15%] left-[5%] w-[38rem] h-[38rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2 z-0" />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-sm font-medium text-slate-500">Carregando formulário...</span>
        </div>
      </div>
    );
  }

  // Handle closed registrations
  if (config && config.chos_ativar === 'Não') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/60 dark:bg-[#061320] px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1 z-0" />
        <div className="absolute bottom-[-15%] left-[5%] w-[35rem] h-[35rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2 z-0" />
        
        <div className="relative w-full max-w-xl rounded-[6px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-8 z-10 text-center border-l-4 border-l-amber-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-[6px] border border-amber-500/20 bg-amber-500/10 text-amber-500 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-primary dark:text-slate-100">Inscrições Suspensas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono tracking-wider mt-1 uppercase">Comunicado Importante</p>
          <div className="mt-6 text-sm text-slate-600 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
            {config.chos_txtinativo}
          </div>
        </div>
      </div>
    );
  }

  // Handle empty courses list
  if (estadias.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/60 dark:bg-[#061320] px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1 z-0" />
        <div className="absolute bottom-[-15%] left-[5%] w-[35rem] h-[35rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2 z-0" />
        
        <div className="relative w-full max-w-xl rounded-[6px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-8 z-10 text-center border-l-4 border-l-amber-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-[6px] border border-amber-500/20 bg-amber-500/10 text-amber-500 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-primary dark:text-slate-100">Inscrições Indisponíveis</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono tracking-wider mt-1 uppercase">Aviso</p>
          <div className="mt-6 text-sm text-slate-600 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
            Não há cursos ou estadias com inscrições abertas no momento. Por favor, acesse o painel administrativo de <b>Configurações</b> para cadastrar e ativar um novo curso primeiro.
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117] px-4 transition-colors">
        <div className="relative w-full max-w-xl rounded-[6px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center transition-colors">
          <div className="flex items-center justify-center w-16 h-16 rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white font-serif">Inscrição Enviada!</h2>
          <p className="text-[#707070] dark:text-[#86868b] text-xs font-medium uppercase tracking-wider mt-1">Inscrição Nº {registrationId || 'N/A'}</p>
          
          <div className="mt-6 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-5 text-left whitespace-pre-line">
            {selectedCourse?.main_mensagemtela || "Sua inscrição foi realizada com sucesso no sistema. Aguarde a confirmação por e-mail."}
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                setSuccess(false);
                setStep(1);
                setFormData(prev => ({
                  ...prev,
                  hos_nome: '',
                  hos_nascimento: '',
                  hos_cpfrg: '',
                  hos_email: '',
                  hos_telefone: '',
                  hos_telefoneemergencia: '',
                  hos_termo: 'Não'
                }));
              }}
              className="px-7 py-3 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white text-xs font-semibold rounded-[6px] transition-all cursor-pointer shadow-none active:scale-[0.98]"
            >
              Realizar Nova Inscrição
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepsLabel = [
    "Curso", "Pessoal", "Endereço", "Estadia", "Faturamento", "Termos"
  ];
  const stepsDescription = [
    "Escolha o local e o motivo da sua hospedagem.",
    "Conte-nos quem você é e como podemos entrar em contato.",
    "Informe o endereço para o cadastro.",
    "Planeje as datas da sua estadia.",
    "Revise os dados para emissão do recibo.",
    "Leia os termos e confirme sua inscrição.",
  ];
  const progressPercentage = Math.round((step / stepsLabel.length) * 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_12%_5%,rgba(193,217,207,.48),transparent_36rem),radial-gradient(ellipse_at_92%_18%,rgba(220,233,229,.78),transparent_32rem),linear-gradient(145deg,#f2f6f4,#f8faf9_50%,#edf3f1)] px-4 py-8 transition-colors dark:bg-[radial-gradient(ellipse_at_12%_5%,rgba(34,99,128,.15),transparent_36rem),linear-gradient(145deg,#07151b,#0d1820_50%,#10212a)] sm:py-12">
      {/* Main Container */}
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_28px_90px_rgba(17,50,64,0.14)] transition-colors dark:border-slate-700/80 dark:bg-[#121d24] sm:p-9">
      <style>{`
        .hosting-form input:not([type="radio"]):not([type="checkbox"]):not([type="file"]),
        .hosting-form select,
        .hosting-form textarea {
          width: 100%;
          min-height: 3rem;
          border: 1px solid #dce7e4;
          border-radius: .9rem;
          background: #fbfdfc;
          padding: .8rem .95rem;
          font-size: .9rem;
          color: #203a42;
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .hosting-form textarea { min-height: 7rem; }
        .hosting-form input:focus,
        .hosting-form select:focus,
        .hosting-form textarea:focus {
          outline: none;
          border-color: #226380;
          background: white;
          box-shadow: 0 0 0 4px rgba(34, 99, 128, 0.11);
        }
        .hosting-form label {
          display: block;
          margin-bottom: .4rem;
          color: #405a62;
          font-size: .8rem;
          font-weight: 650;
          line-height: 1.45;
        }
        .hosting-form > div[class*="animate-fade-in"] {
          border: 1px solid #e3ece9;
          border-radius: 1.5rem;
          background: linear-gradient(145deg, #f8fbfa, #fff 72%);
          padding: 1.25rem;
          box-shadow: 0 8px 28px rgba(17,50,64,.045);
        }
        .hosting-form .hosting-step-actions {
          position: sticky;
          bottom: .75rem;
          z-index: 10;
          margin: 1.5rem -.25rem -.25rem;
          padding: .85rem;
          border: 1px solid rgba(220,231,228,.92);
          border-radius: 1.25rem;
          background: rgba(255,255,255,.94);
          box-shadow: 0 12px 32px rgba(17,50,64,.11);
          backdrop-filter: blur(16px);
        }
        .dark .hosting-form input:not([type="radio"]):not([type="checkbox"]):not([type="file"]),
        .dark .hosting-form select,
        .dark .hosting-form textarea {
          border-color: #33474e;
          background: #17252c;
          color: #edf4f2;
        }
        .dark .hosting-form label { color: #cedad8; }
        .dark .hosting-form > div[class*="animate-fade-in"] {
          border-color: #30444b;
          background: linear-gradient(145deg, rgba(23,37,44,.95), rgba(18,29,36,.98));
        }
        .dark .hosting-form .hosting-step-actions {
          border-color: #33474e;
          background: rgba(18,29,36,.94);
        }
        @media (max-width: 640px) {
          .hosting-form > div[class*="animate-fade-in"] { padding: 1rem; }
          .hosting-form .hosting-step-actions { bottom: .35rem; }
        }
      `}</style>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113240] to-[#226380] text-white shadow-lg shadow-[#113240]/20">
            <Building className="w-6 h-6" />
          </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#163642] dark:text-white sm:text-3xl">Vamos preparar sua estadia</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#56808a] dark:text-[#a3c3c7]">Hospedagens · Província BRM</p>
          
          {config?.chos_acolhida && step === 1 && (
            <div className="mt-5 max-w-lg rounded-2xl border border-[#dce8e6] bg-[#f5f9f8] p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-300">
              {config.chos_acolhida}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mb-7 rounded-2xl border border-[#e2ece9] bg-[#f8fbfa] p-4 dark:border-slate-700 dark:bg-white/[0.035]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#6c898d] dark:text-[#a3c3c7]">
                Etapa {String(step).padStart(2, '0')} de {stepsLabel.length}
              </p>
              <p className="mt-1 text-base font-semibold text-[#163642] dark:text-white">{stepsLabel[step - 1]}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#42656e] shadow-sm dark:bg-white/10 dark:text-slate-200">
              {progressPercentage}% concluído
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[#e5eeeb] dark:bg-slate-700"
            role="progressbar"
            aria-label="Progresso da inscrição"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-[#226380] to-[#63a79c] transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="leading-relaxed">{stepsDescription[step - 1]}</span>
            <span className="shrink-0">{Math.max(1, Math.ceil((stepsLabel.length - step) * 1.2))} min restantes</span>
          </div>
        </div>
        <div className="mb-7 flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {stepsLabel.map((lbl, idx) => {
            const stepIndex = idx + 1;
            const isCompleted = step > stepIndex;
            const isActive = step === stepIndex;

            return (
              <div key={lbl} className="flex min-w-0 flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { if (stepIndex < step) setStep(stepIndex); }}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Etapa ${stepIndex}: ${lbl}${isCompleted ? ', concluída' : isActive ? ', atual' : ''}`}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#163e4b] text-white border-[#163e4b] shadow-md shadow-[#163e4b]/20 dark:bg-[#a3c3c7] dark:text-[#10242b] dark:border-[#a3c3c7]'
                      : isCompleted 
                        ? 'bg-[#e7f2ee] text-[#367164] dark:bg-emerald-950/40 dark:text-emerald-300 border-[#bbd9cf] dark:border-emerald-700/50'
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-700 text-[#809194] dark:text-[#9aa9aa]'}`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepIndex}
                </button>
                <span className={`hidden truncate text-[10px] font-medium xl:inline ${isActive ? 'text-[#163e4b] dark:text-white' : 'text-slate-400'}`}>{lbl}</span>
                {idx < stepsLabel.length - 1 && <span className={`mx-1 h-px min-w-2 flex-1 ${isCompleted ? 'bg-[#9dc7b9]' : 'bg-[#e0e9e6] dark:bg-slate-700'}`} />}
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-[6px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs mb-6 border border-rose-200 dark:border-rose-900/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {(draftRestoredAt || draftSavedAt || draftError) && (
          <aside className="mb-5 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                {draftError ? 'Não foi possível salvar ou recuperar o rascunho neste navegador.' :
                  draftRestoredAt ? 'Encontramos seu rascunho e restauramos o preenchimento.' : 'Seu preenchimento está sendo salvo automaticamente.'}
              </p>
              <p className="mt-1 text-xs opacity-80">
                O rascunho fica apenas neste navegador por até 30 dias. Em computador compartilhado, apague-o após concluir.
              </p>
            </div>
            {(draftRestoredAt || draftSavedAt) && (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(draftKey);
                    setDraftRestoredAt(null);
                    setDraftSavedAt(null);
                    setDraftDisabled(true);
                    setDraftError(false);
                  } catch (error) {
                    console.error('Não foi possível apagar o rascunho da inscrição:', error);
                    setDraftError(true);
                  }
                }}
                className="shrink-0 rounded-xl border border-sky-300 px-3 py-2 text-xs font-semibold transition hover:bg-white dark:border-sky-800 dark:hover:bg-sky-900/40"
              >
                Apagar rascunho deste dispositivo
              </button>
            )}
          </aside>
        )}

        <form onSubmit={handleSubmit} className="hosting-form space-y-6">
          {/* STEP 1: CURSO & ESTADIA */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {/* Casa / Comunidade de Acolhida da Província BRM */}
              <div className="space-y-1.5">
                <label htmlFor="f_casa_acolhida" className="text-xs font-semibold text-slate-500">
                  Casa / Comunidade de Acolhida da Província BRM (Destino da Estadia) *
                </label>
                <select
                  id="f_casa_acolhida"
                  required
                  value={formData.hos_casa_acolhida}
                  onChange={(e) => {
                    setFormData({ ...formData, hos_casa_acolhida: e.target.value });
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled>Selecione a Casa ou Obra de destino...</option>
                  {casasAcolhida.map(c => {
                    const label = `${c.nome} • ${c.cidade || c.localidade || ''}/${c.uf || ''}`;
                    return <option key={c.id} value={label}>{label} ({c.tipo || 'Comunidade'})</option>;
                  })}
                </select>
                <span className="text-[11px] text-slate-400 block">
                  Selecione a casa religiosa oficial da Província BRM onde você solicita hospedagem.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Qual o Curso / Motivo da Estadia?</label>
                <select
                    id="f_estadiamotivo"
                  required
                  value={formData.hos_estadiamotivo}
                  onChange={(e) => {
                    setFormData({ ...formData, hos_estadiamotivo: e.target.value });
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all cursor-pointer"
                >
                  <option value="" disabled>Selecione um curso...</option>
                  {estadias.map(item => (
                    <option key={item.idmainhospedagem} value={item.idmainhospedagem}>{item.main_motivo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="f_modulo" className="text-xs font-semibold text-slate-500">Módulo Correspondente (se aplicável)</label>
                <select
                    id="f_modulo"
                  value={formData.hos_modulo}
                  onChange={(e) => setFormData({ ...formData, hos_modulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all cursor-pointer"
                >
                  <option value="">Nenhum / Não se aplica</option>
                  {modulos.map(item => (
                    <option key={item.idmodulos} value={item.idmodulos}>{item.mod_nome}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: DADOS PESSOAIS */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="fCategoria" className="text-xs font-semibold text-slate-500">Categoria</label>
                  <select
                    value={formData.hos_categoria}
                    onChange={(e) => setFormData({ ...formData, hos_categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Padre">Padre</option>
                    <option value="Diácono">Diácono</option>
                    <option value="Irmão">Irmão</option>
                    <option value="Seminarista">Seminarista</option>
                    <option value="Leigo(a)">Leigo(a)</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="f_nome" className="text-xs font-semibold text-slate-500">Nome Completo<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_nome"                    type="text"
                    required
                    autoComplete="name"
                    value={formData.hos_nome}
                    onChange={(e) => setFormData({ ...formData, hos_nome: e.target.value })}
                    placeholder="Escreva seu nome completo"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="f_nascimento" className="text-xs font-semibold text-slate-500">Nascimento<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_nascimento"                    type="date"
                    required
                    value={formData.hos_nascimento}
                    onChange={(e) => setFormData({ ...formData, hos_nascimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="f_cpfrg" className="text-xs font-semibold text-slate-500">CPF / RG<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_cpfrg"                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    value={formData.hos_cpfrg}
                    onChange={(e) => setFormData({ ...formData, hos_cpfrg: e.target.value })}
                    placeholder="Apenas números"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="f_email" className="text-xs font-semibold text-slate-500">E-mail<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_email"                    type="email"
                    required
                    autoComplete="email"
                    value={formData.hos_email}
                    onChange={(e) => setFormData({ ...formData, hos_email: e.target.value })}
                    placeholder="exemplo@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="f_telefone" className="text-xs font-semibold text-slate-500">Celular / Whatsapp<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_telefone"                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.hos_telefone}
                    onChange={(e) => setFormData({ ...formData, hos_telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="f_telefoneemergencia" className="text-xs font-semibold text-slate-500">Contato de Urgência (Nome/Tel)<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_telefoneemergencia"                    type="text"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.hos_telefoneemergencia}
                    onChange={(e) => setFormData({ ...formData, hos_telefoneemergencia: e.target.value })}
                    placeholder="Nome - (00) 00000-0000"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ENDEREÇO */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 relative">
                  <label htmlFor="f_cep" className="text-xs font-semibold text-slate-500">CEP<span className="text-red-400 ml-0.5">*</span></label>
                  <div className="relative">
                    <input
                    id="f_cep"                      type="text"
                      required
                    inputMode="numeric"
                    autoComplete="postal-code"
                      value={formData.hos_cep}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, hos_cep: val });
                        if (val.replace(/\D/g, '').length === 8) {
                          handleCepLookup(val, false);
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                    />
                    {cepLoading && (
                      <span className="absolute right-3.5 top-3 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="f_logradouro" className="text-xs font-semibold text-slate-500">Logradouro / Endereço<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_logradouro"                    type="text"
                    required
                    autoComplete="street-address"
                    value={formData.hos_logradouro}
                    onChange={(e) => setFormData({ ...formData, hos_logradouro: e.target.value })}
                    placeholder="Rua, Avenida..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="f_numero" className="text-xs font-semibold text-slate-500">Número<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_numero"                    type="text"
                    required
                    inputMode="numeric"
                    value={formData.hos_numero}
                    onChange={(e) => setFormData({ ...formData, hos_numero: e.target.value })}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label htmlFor="f_bairro" className="text-xs font-semibold text-slate-500">Bairro<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_bairro"                    type="text"
                    required
                    autoComplete="address-level2"
                    value={formData.hos_bairro}
                    onChange={(e) => setFormData({ ...formData, hos_bairro: e.target.value })}
                    placeholder="Nome do Bairro"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="f_cidade" className="text-xs font-semibold text-slate-500">Cidade<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_cidade"                    type="text"
                    required
                    autoComplete="address-level2"
                    value={formData.hos_cidade}
                    onChange={(e) => setFormData({ ...formData, hos_cidade: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="f_estado" className="text-xs font-semibold text-slate-500">Estado (UF)<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_estado"
                    type="text"
                    required
                    maxLength={2}
                    value={formData.hos_estado}
                    onChange={(e) => setFormData({ ...formData, hos_estado: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SAÚDE & ESTADIA */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="f_alergico" className="text-xs font-semibold text-slate-500">Tem alguma Alergia?</label>
                  <select
                    id="f_alergico"
                    value={formData.hos_alergico}
                    onChange={(e) => setFormData({ ...formData, hos_alergico: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                {formData.hos_alergico === 'Sim' && (
                  <div className="space-y-1.5">
                    <label htmlFor="f_especifiquealergia" className="text-xs font-semibold text-slate-500">Especifique a Alergia</label>
                    <input
                    id="f_especifiquealergia"                      type="text"
                      required
                      value={formData.hos_especifiquealergia}
                      onChange={(e) => setFormData({ ...formData, hos_especifiquealergia: e.target.value })}
                      placeholder="Medicamentos, poeira..."
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="f_restricaoalimentar" className="text-xs font-semibold text-slate-500">Tem restrição alimentar?</label>
                  <select
                    id="f_restricaoalimentar"
                    value={formData.hos_restricaoalimentar}
                    onChange={(e) => setFormData({ ...formData, hos_restricaoalimentar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                {formData.hos_restricaoalimentar === 'Sim' && (
                  <div className="space-y-1.5">
                    <label htmlFor="f_especifiqueresticao" className="text-xs font-semibold text-slate-500">Especifique a Restrição</label>
                    <input
                      type="text"
                      required
                      value={formData.hos_especifiquerestricao}
                      onChange={(e) => setFormData({ ...formData, hos_especifiquerestricao: e.target.value })}
                      placeholder="Sem glúten, sem lactose..."
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="f_lavanderia" className="text-xs font-semibold text-slate-500">Serviço de Lavanderia?</label>
                  <select
                    id="f_lavanderia"
                    value={formData.hos_lavanderia}
                    onChange={(e) => setFormData({ ...formData, hos_lavanderia: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Não">Não precisarei</option>
                    {lavanderias.map(l => (
                      <option key={l.idlavanderia} value={l.lav_servico}>{l.lav_servico}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="f_chegada" className="text-xs font-semibold text-slate-500">Previsão de Chegada<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="f_chegada"                    type="datetime-local"
                    required
                    value={formData.hos_previsaochegada}
                    onChange={(e) => setFormData({ ...formData, hos_previsaochegada: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="faida" className="text-xs font-semibold text-slate-500">Previsão de Saída<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    id="faida"                    type="datetime-local"
                    required
                    value={formData.hos_previsaosaida}
                    onChange={(e) => setFormData({ ...formData, hos_previsaosaida: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FATURAMENTO E RECIBO */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label htmlFor="f_recibo" className="text-xs font-semibold text-slate-500">Como emitir o recibo de pagamento?</label>
                <select
                    id="f_recibo"
                  value={formData.hos_recibo}
                  onChange={(e) => setFormData({ ...formData, hos_recibo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                >
                  <option value="Emitir o recibo no meu próprio nome.">Emitir no meu próprio nome (dados pessoais)</option>
                  <option value="Emitir o recibo no nome de terceiro.">Emitir no nome de terceiro (empresa, diocese, etc.)</option>
                  <option value="Não é necessário recibo.">Não é necessário recibo</option>
                </select>
              </div>

              {formData.hos_recibo === 'Emitir o recibo no nome de terceiro.' && (
                <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="f_recnome" className="text-xs font-semibold text-slate-500">Nome / Razão Social do Terceiro<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                    id="f_recnome"                        type="text"
                        required
                    autoComplete="name"
                        value={formData.hos_recnome}
                        onChange={(e) => setFormData({ ...formData, hos_recnome: e.target.value })}
                        placeholder="Nome da Diocese ou Empresa"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="f_reccpfcnpj" className="text-xs font-semibold text-slate-500">CPF ou CNPJ do Terceiro<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                    id="f_reccpfcnpj"                        type="text"
                        required
                    inputMode="numeric"
                    autoComplete="off"
                        value={formData.hos_reccpfcnpj}
                        onChange={(e) => setFormData({ ...formData, hos_reccpfcnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="f_reccep" className="text-xs font-semibold text-slate-500">CEP do Terceiro<span className="text-red-400 ml-0.5">*</span></label>
                      <div className="relative">
                        <input
                    id="f_reccep"                          type="text"
                          required
                    inputMode="numeric"
                    autoComplete="postal-code"
                          value={formData.hos_reccep}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, hos_reccep: val });
                            if (val.replace(/\D/g, '').length === 8) {
                              handleCepLookup(val, true);
                            }
                          }}
                          placeholder="00000-000"
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                        />
                        {recCepLoading && (
                          <span className="absolute right-3.5 top-3 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="f_recRua" className="text-xs font-semibold text-slate-500">Endereço de Faturamento<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                    id="f_recRua"                        type="text"
                        required
                    autoComplete="street-address"
                        value={formData.hos_reclogradouro}
                        onChange={(e) => setFormData({ ...formData, hos_reclogradouro: e.target.value })}
                        placeholder="Rua, Avenida..."
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="f_recnumero" className="text-xs font-semibold text-slate-500">Número<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                    id="f_recnumero"                        type="text"
                        required
                    inputMode="numeric"
                        value={formData.hos_recnumero}
                        onChange={(e) => setFormData({ ...formData, hos_recnumero: e.target.value })}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label htmlFor="f_recbairro" className="text-xs font-semibold text-slate-500">Bairro<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                    id="f_recbairro"                        type="text"
                        required
                    autoComplete="address-level2"
                        value={formData.hos_recbairro}
                        onChange={(e) => setFormData({ ...formData, hos_recbairro: e.target.value })}
                        placeholder="Bairro"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="f_reccidade" className="text-xs font-semibold text-slate-500">Cidade<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                    id="f_reccidade"                        type="text"
                        required
                    autoComplete="address-level2"
                        value={formData.hos_reccidade}
                        onChange={(e) => setFormData({ ...formData, hos_reccidade: e.target.value })}
                        placeholder="Cidade"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="f_recestado" className="text-xs font-semibold text-slate-500">Estado (UF)<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                        id="f_recestado"
                        type="text"
                        required
                        maxLength={2}
                        value={formData.hos_recestado}
                        onChange={(e) => setFormData({ ...formData, hos_recestado: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: REGULAMENTO & ACEITE */}
          {step === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span>Regulamento da Hospedagem & Termos</span>
                </label>
                <div className="w-full p-4 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-350 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line scrollbar-thin">
                  {selectedCourse?.main_termos || "Eu concordo com as regras e regulamentos estabelecidos pela hospedagem do Sistema BRM."}
                </div>
              </div>

              {/* LGPD Information Card */}
              <div className="p-4 rounded-[6px] bg-[#226380]/5 border border-[#226380]/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#226380] dark:text-[#A3C3C7]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</span>
                </div>
                <p className="text-[#474747] dark:text-[#86868b] leading-relaxed text-[11px]">
                  Os dados informados (incluindo identificação, contatos e eventuais necessidades ou restrições alimentares) serão tratados exclusivamente para a gestão da hospedagem, acolhida e atendimento de emergência médica nas dependências da Província BRM. Conheça nossa{' '}
                  <Link to="/privacidade" target="_blank" className="font-semibold underline text-[#226380] dark:text-[#A3C3C7]">
                    Política de Privacidade
                  </Link>.
                </p>
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="termo_aceite"
                  checked={formData.hos_termo === 'Aceito'}
                  onChange={(e) => setFormData({ ...formData, hos_termo: e.target.checked ? 'Aceito' : 'Não' })}
                  className="w-4.5 h-4.5 mt-0.5 border border-slate-200 dark:border-slate-800 rounded text-[#226380] focus:ring-[#226380]/25 cursor-pointer accent-[#226380]"
                />
                <label htmlFor="termo_aceite" className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer leading-tight">
                  Li e concordo com o regulamento e autorizo o tratamento dos meus dados pessoais nos termos da LGPD.
                </label>
              </div>
            </div>
          )}

          {/* Apple Pill Action Buttons */}
          <div className="hosting-step-actions flex items-center justify-between gap-3 border-t border-[#e5e5ea] pt-4 dark:border-white/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-[#1d1d1f] dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <div />
            )}

            {step < stepsLabel.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#163e4b] to-[#226380] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#163e4b]/15 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span>Avançar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || formData.hos_termo !== 'Aceito'}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#163e4b] to-[#226380] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#163e4b]/15 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Inscrição</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <div className="text-center mt-6">
          <Link to="/privacidade" target="_blank" className="text-[11px] text-[#707070] dark:text-[#86868b] hover:text-[#226380] transition-colors">
            Política de Privacidade & Termos LGPD
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InscricaoPublica;
