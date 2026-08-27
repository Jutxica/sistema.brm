import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Loader2, CheckCircle2, ChevronRight, ChevronLeft, Building, 
  AlertCircle, FileText
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
  main_mensagememail: string;
}

interface Modulo {
  idmodulos: string;
  mod_nome: string;
}

interface Lavanderia {
  idlavanderia: string;
  lav_servico: string;
}

export const InscricaoPublica: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // System Settings / Metadata
  const [config, setConfig] = useState<Config | null>(null);
  const [estadias, setEstadias] = useState<Estadia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [lavanderias, setLavanderias] = useState<Lavanderia[]>([]);

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

  // Load configuration and lists
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [
          { data: configData },
          { data: estadiasData },
          { data: modulosData },
          { data: lavanderiaData }
        ] = await Promise.all([
          supabase.from('confighospedagens').select('*').eq('idconfighospedagens', 1).maybeSingle(),
          supabase.from('mainhospedagem').select('*').eq('main_status', 'Ativo').order('idmainhospedagem', { ascending: false }),
          supabase.from('modulos').select('*').eq('mod_status', 'Ativo').order('idmodulos', { ascending: false }),
          supabase.from('lavanderia').select('*').order('idlavanderia', { ascending: false })
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

        // Pre-select first course
        if (estList.length > 0) {
          setFormData(prev => ({ ...prev, hos_estadiamotivo: estList[0].idmainhospedagem }));
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

  const handleNextStep = () => {
    // Basic step validation
    if (step === 1) {
      if (!formData.hos_estadiamotivo) {
        setErrorMsg("Selecione o Curso ou Estadia.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.hos_nome || !formData.hos_email || !formData.hos_cpfrg || !formData.hos_telefone) {
        setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
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

    const payload: any = { ...formData };
    
    // Format foreign keys
    payload.hos_estadiamotivo = parseInt(formData.hos_estadiamotivo);
    payload.hos_modulo = formData.hos_modulo ? parseInt(formData.hos_modulo) : null;
    payload.hos_status = null; // defaults to pending
    payload.hos_inscricao = new Date().toISOString(); // registration date/time
    payload.hos_quarto = null; // admin assigns this later

    try {
      const { data, error } = await supabase
        .from('hospedagens')
        .insert([payload])
        .select('idhospedagens')
        .single();

      if (error) throw error;

      if (data) {
        setRegistrationId(String(data.idhospedagens));
      }
      setSuccess(true);
    } catch (err: any) {
      console.error("Erro ao registrar inscrição:", err);
      setErrorMsg(err.message || "Erro inesperado ao registrar inscrição. Verifique suas informações.");
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
        
        <div className="relative w-full max-w-xl rounded-2xl glass shadow-premium p-8 z-10 text-center border-l-4 border-l-amber-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto mb-4">
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
        
        <div className="relative w-full max-w-xl rounded-2xl glass shadow-premium p-8 z-10 text-center border-l-4 border-l-amber-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto mb-4">
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50/60 dark:bg-[#061320] px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1 z-0" />
        <div className="absolute bottom-[-15%] left-[5%] w-[35rem] h-[35rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2 z-0" />
        
        <div className="relative w-full max-w-xl rounded-2xl glass shadow-premium p-8 z-10 text-center border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto mb-5 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary dark:text-slate-100">Inscrição Enviada!</h2>
          <p className="text-slate-400 text-xs font-mono tracking-wider mt-1 uppercase">Inscrição Nº {registrationId || 'N/A'}</p>
          
          <div className="mt-6 text-sm text-slate-600 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4 text-left whitespace-pre-line">
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
              className="px-6 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10 hover:scale-[1.02] transition-all cursor-pointer"
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

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#061320] py-12 px-4 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Blurs */}
      <div className="absolute top-[-10%] right-[-5%] w-[45rem] h-[45rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1 z-0" />
      <div className="absolute bottom-[-15%] left-[5%] w-[38rem] h-[38rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2 z-0" />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl rounded-2xl glass shadow-premium p-6 sm:p-8 z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary dark:text-slate-100">Ficha de Inscrição</h1>
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mt-1">Hospedagens Sistema BRM</p>
          
          {config?.chos_acolhida && step === 1 && (
            <div className="mt-4 text-xs text-slate-500 max-w-lg leading-relaxed bg-white/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
              {config.chos_acolhida}
            </div>
          )}
        </div>

        {/* Multi-step progress bar */}
        <div className="mb-8 max-w-xl mx-auto">
          <div className="flex items-center justify-between relative">
            {stepsLabel.map((lbl, idx) => {
              const stepIndex = idx + 1;
              const isCompleted = step > stepIndex;
              const isActive = step === stepIndex;

              return (
                <div key={lbl} className="flex flex-col items-center z-10">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all
                      ${isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : isActive 
                          ? 'bg-secondary text-white ring-4 ring-secondary/20' 
                          : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                  >
                    {stepIndex}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1.5 hidden sm:block">{lbl}</span>
                </div>
              );
            })}
            {/* Background line */}
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />
            <div 
              className="absolute top-3.5 left-0 h-0.5 bg-secondary transition-all duration-350 -z-10"
              style={{ width: `${((step - 1) / (stepsLabel.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs mb-6 border border-red-100 dark:border-red-950/50">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: CURSO & ESTADIA */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Qual o Curso / Motivo da Estadia?</label>
                <select
                  required
                  value={formData.hos_estadiamotivo}
                  onChange={(e) => setFormData({ ...formData, hos_estadiamotivo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all cursor-pointer"
                >
                  <option value="" disabled>Selecione um curso...</option>
                  {estadias.map(item => (
                    <option key={item.idmainhospedagem} value={item.idmainhospedagem}>{item.main_motivo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Módulo Correspondente (se aplicável)</label>
                <select
                  value={formData.hos_modulo}
                  onChange={(e) => setFormData({ ...formData, hos_modulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all cursor-pointer"
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
                  <label className="text-xs font-semibold text-slate-500">Categoria</label>
                  <select
                    value={formData.hos_categoria}
                    onChange={(e) => setFormData({ ...formData, hos_categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
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
                  <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_nome}
                    onChange={(e) => setFormData({ ...formData, hos_nome: e.target.value })}
                    placeholder="Escreva seu nome completo"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Nascimento</label>
                  <input
                    type="date"
                    required
                    value={formData.hos_nascimento}
                    onChange={(e) => setFormData({ ...formData, hos_nascimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">CPF / RG</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_cpfrg}
                    onChange={(e) => setFormData({ ...formData, hos_cpfrg: e.target.value })}
                    placeholder="Apenas números"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.hos_email}
                    onChange={(e) => setFormData({ ...formData, hos_email: e.target.value })}
                    placeholder="exemplo@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Celular / Whatsapp</label>
                  <input
                    type="tel"
                    required
                    value={formData.hos_telefone}
                    onChange={(e) => setFormData({ ...formData, hos_telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Contato de Urgência (Nome/Tel)</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_telefoneemergencia}
                    onChange={(e) => setFormData({ ...formData, hos_telefoneemergencia: e.target.value })}
                    placeholder="Nome - (00) 00000-0000"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
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
                  <label className="text-xs font-semibold text-slate-500">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.hos_cep}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, hos_cep: val });
                        if (val.replace(/\D/g, '').length === 8) {
                          handleCepLookup(val, false);
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                    />
                    {cepLoading && (
                      <span className="absolute right-3.5 top-3 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Logradouro / Endereço</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_logradouro}
                    onChange={(e) => setFormData({ ...formData, hos_logradouro: e.target.value })}
                    placeholder="Rua, Avenida..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Número</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_numero}
                    onChange={(e) => setFormData({ ...formData, hos_numero: e.target.value })}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-semibold text-slate-500">Bairro</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_bairro}
                    onChange={(e) => setFormData({ ...formData, hos_bairro: e.target.value })}
                    placeholder="Nome do Bairro"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Cidade</label>
                  <input
                    type="text"
                    required
                    value={formData.hos_cidade}
                    onChange={(e) => setFormData({ ...formData, hos_cidade: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Estado (UF)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.hos_estado}
                    onChange={(e) => setFormData({ ...formData, hos_estado: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
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
                  <label className="text-xs font-semibold text-slate-500">Tem alguma Alergia?</label>
                  <select
                    value={formData.hos_alergico}
                    onChange={(e) => setFormData({ ...formData, hos_alergico: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                {formData.hos_alergico === 'Sim' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Especifique a Alergia</label>
                    <input
                      type="text"
                      required
                      value={formData.hos_especifiquealergia}
                      onChange={(e) => setFormData({ ...formData, hos_especifiquealergia: e.target.value })}
                      placeholder="Medicamentos, poeira..."
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Tem restrição alimentar?</label>
                  <select
                    value={formData.hos_restricaoalimentar}
                    onChange={(e) => setFormData({ ...formData, hos_restricaoalimentar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                {formData.hos_restricaoalimentar === 'Sim' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Especifique a Restrição</label>
                    <input
                      type="text"
                      required
                      value={formData.hos_especifiquerestricao}
                      onChange={(e) => setFormData({ ...formData, hos_especifiquerestricao: e.target.value })}
                      placeholder="Sem glúten, sem lactose..."
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Serviço de Lavanderia?</label>
                  <select
                    value={formData.hos_lavanderia}
                    onChange={(e) => setFormData({ ...formData, hos_lavanderia: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Não">Não precisarei</option>
                    {lavanderias.map(l => (
                      <option key={l.idlavanderia} value={l.lav_servico}>{l.lav_servico}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Previsão de Chegada</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.hos_previsaochegada}
                    onChange={(e) => setFormData({ ...formData, hos_previsaochegada: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Previsão de Saída</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.hos_previsaosaida}
                    onChange={(e) => setFormData({ ...formData, hos_previsaosaida: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FATURAMENTO E RECIBO */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Como emitir o recibo de pagamento?</label>
                <select
                  value={formData.hos_recibo}
                  onChange={(e) => setFormData({ ...formData, hos_recibo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary cursor-pointer"
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
                      <label className="text-xs font-semibold text-slate-500">Nome / Razão Social do Terceiro</label>
                      <input
                        type="text"
                        required
                        value={formData.hos_recnome}
                        onChange={(e) => setFormData({ ...formData, hos_recnome: e.target.value })}
                        placeholder="Nome da Diocese ou Empresa"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">CPF ou CNPJ do Terceiro</label>
                      <input
                        type="text"
                        required
                        value={formData.hos_reccpfcnpj}
                        onChange={(e) => setFormData({ ...formData, hos_reccpfcnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">CEP do Terceiro</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.hos_reccep}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, hos_reccep: val });
                            if (val.replace(/\D/g, '').length === 8) {
                              handleCepLookup(val, true);
                            }
                          }}
                          placeholder="00000-000"
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                        />
                        {recCepLoading && (
                          <span className="absolute right-3.5 top-3 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Endereço de Faturamento</label>
                      <input
                        type="text"
                        required
                        value={formData.hos_reclogradouro}
                        onChange={(e) => setFormData({ ...formData, hos_reclogradouro: e.target.value })}
                        placeholder="Rua, Avenida..."
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Número</label>
                      <input
                        type="text"
                        required
                        value={formData.hos_recnumero}
                        onChange={(e) => setFormData({ ...formData, hos_recnumero: e.target.value })}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-semibold text-slate-500">Bairro</label>
                      <input
                        type="text"
                        required
                        value={formData.hos_recbairro}
                        onChange={(e) => setFormData({ ...formData, hos_recbairro: e.target.value })}
                        placeholder="Bairro"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Cidade</label>
                      <input
                        type="text"
                        required
                        value={formData.hos_reccidade}
                        onChange={(e) => setFormData({ ...formData, hos_reccidade: e.target.value })}
                        placeholder="Cidade"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Estado (UF)</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={formData.hos_recestado}
                        onChange={(e) => setFormData({ ...formData, hos_recestado: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-secondary"
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
                <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-350 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line scrollbar-thin">
                  {selectedCourse?.main_termos || "Eu concordo com as regras e regulamentos estabelecidos pela hospedagem do Sistema BRM."}
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="termo_aceite"
                  checked={formData.hos_termo === 'Aceito'}
                  onChange={(e) => setFormData({ ...formData, hos_termo: e.target.checked ? 'Aceito' : 'Não' })}
                  className="w-4.5 h-4.5 mt-0.5 border border-slate-200 dark:border-slate-800 rounded text-secondary focus:ring-secondary/25 cursor-pointer"
                />
                <label htmlFor="termo_aceite" className="text-xs font-semibold text-slate-500 dark:text-slate-400 select-none cursor-pointer leading-tight">
                  Li e concordo integralmente com os termos de regulamento descritos acima.
                </label>
              </div>
            </div>
          )}

          {/* BUTTONS CONTROL */}
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
                className="flex items-center gap-1.5 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Avançar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || formData.hos_termo !== 'Aceito'}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
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
      </div>
    </div>
  );
};

export default InscricaoPublica;
