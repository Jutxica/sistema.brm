import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, Building, CheckCircle2, ChevronLeft, ChevronRight, Loader2, UserRound } from 'lucide-react';

interface ObraPublica {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
}

interface FormDataReligioso {
  grau: string;
  nome_civil: string;
  nome_religioso: string;
  data_nascimento: string;
  local_nascimento: string;
  municipio_nascimento: string;
  estado_nascimento: string;
  pais_nascimento: string;
  nacionalidade: string;
  cpf: string;
  rg: string;
  rg_orgao_expedidor: string;
  rg_data_emissao: string;
  titulo_eleitor: string;
  pis: string;
  cnh: string;
  cnh_categoria: string;
  passaporte: string;
  obra_atual_id: string;
  email_institucional: string;
  email_pessoal: string;
  telefone_celular: string;
  whatsapp: string;
  pai_nome: string;
  mae_nome: string;
  contato_nome: string;
  contato_parentesco: string;
  contato_telefone: string;
  batismo_data: string;
  batismo_paroquia: string;
  primeira_profissao_data: string;
  votos_perpetuos_data: string;
  ordenacao_data: string;
  plano_saude: string;
  tipo_sanguineo: string;
  alergias: string;
  medicamentos: string;
  observacoes: string;
  consentimento_dados: boolean;
}

const initialForm: FormDataReligioso = {
  grau: 'Padre',
  nome_civil: '',
  nome_religioso: '',
  data_nascimento: '',
  local_nascimento: '',
  municipio_nascimento: '',
  estado_nascimento: '',
  pais_nascimento: 'Brasil',
  nacionalidade: 'Brasileira',
  cpf: '',
  rg: '',
  rg_orgao_expedidor: '',
  rg_data_emissao: '',
  titulo_eleitor: '',
  pis: '',
  cnh: '',
  cnh_categoria: '',
  passaporte: '',
  obra_atual_id: '',
  email_institucional: '',
  email_pessoal: '',
  telefone_celular: '',
  whatsapp: '',
  pai_nome: '',
  mae_nome: '',
  contato_nome: '',
  contato_parentesco: '',
  contato_telefone: '',
  batismo_data: '',
  batismo_paroquia: '',
  primeira_profissao_data: '',
  votos_perpetuos_data: '',
  ordenacao_data: '',
  plano_saude: '',
  tipo_sanguineo: '',
  alergias: '',
  medicamentos: '',
  observacoes: '',
  consentimento_dados: false,
};

const inputClass = 'w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all';

export const CadastroReligiosoPublico: React.FC = () => {
  const [obras, setObras] = useState<ObraPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataReligioso>(initialForm);

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const { data } = await supabase
          .from('obras')
          .select('id,nome,cidade,estado')
          .eq('status', 'Ativa')
          .order('nome', { ascending: true });
        setObras((data || []) as ObraPublica[]);
      } catch (err) {
        console.error('Erro ao carregar obras:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPublicData();
  }, []);

  const updateField = <K extends keyof FormDataReligioso>(key: K, value: FormDataReligioso[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = () => {
    if (step === 1 && (!formData.nome_civil || !formData.grau || !formData.cpf)) {
      return 'Preencha nome civil, grau e CPF.';
    }
    if (step === 2 && (!formData.email_institucional && !formData.email_pessoal) && !formData.telefone_celular) {
      return 'Informe ao menos um e-mail ou telefone de contato.';
    }
    if (step === 4 && !formData.consentimento_dados) {
      return 'Confirme a autorização de uso dos dados para atualização cadastral.';
    }
    return null;
  };

  const nextStep = () => {
    const message = validateStep();
    if (message) {
      setErrorMsg(message);
      return;
    }
    setErrorMsg(null);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = validateStep();
    if (message) {
      setErrorMsg(message);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      origem_cadastro: 'publico',
      status_cadastro: 'Em revisão',
      status: 'Ativo',
      grau: formData.grau,
      nome_civil: formData.nome_civil,
      nome_religioso: formData.nome_religioso || null,
      data_nascimento: formData.data_nascimento || null,
      local_nascimento: formData.local_nascimento || null,
      municipio_nascimento: formData.municipio_nascimento || null,
      estado_nascimento: formData.estado_nascimento || null,
      pais_nascimento: formData.pais_nascimento || null,
      nacionalidade: formData.nacionalidade || null,
      cpf: formData.cpf || null,
      rg: formData.rg || null,
      rg_orgao_expedidor: formData.rg_orgao_expedidor || null,
      rg_data_emissao: formData.rg_data_emissao || null,
      titulo_eleitor: formData.titulo_eleitor || null,
      pis: formData.pis || null,
      cnh: formData.cnh || null,
      cnh_categoria: formData.cnh_categoria || null,
      passaporte: formData.passaporte || null,
      obra_atual_id: formData.obra_atual_id || null,
      email_institucional: formData.email_institucional || null,
      email_pessoal: formData.email_pessoal || null,
      telefone_celular: formData.telefone_celular || null,
      whatsapp: formData.whatsapp || null,
      familia: {
        pai_nome: formData.pai_nome,
        mae_nome: formData.mae_nome,
        contato_responsavel: {
          nome: formData.contato_nome,
          parentesco: formData.contato_parentesco,
          telefone: formData.contato_telefone,
        },
      },
      sacramentos: {
        batismo: {
          data: formData.batismo_data,
          paroquia: formData.batismo_paroquia,
        },
      },
      etapas_formacao: {
        primeira_profissao: { data: formData.primeira_profissao_data },
        votos_perpetuos: { data: formData.votos_perpetuos_data },
      },
      ministerios_ordens: {
        presbiterado: { data: formData.ordenacao_data },
      },
      saude: {
        plano_saude: formData.plano_saude,
        tipo_sanguineo: formData.tipo_sanguineo,
        alergias: formData.alergias,
        medicamentos: formData.medicamentos,
      },
      observacoes: formData.observacoes || null,
      consentimento_dados: formData.consentimento_dados,
    };

    try {
      const { error } = await supabase.from('religiosos').insert([payload]);
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Erro inesperado ao enviar cadastro.';
      setErrorMsg(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-sm font-medium text-slate-500">Carregando formulário...</span>
        </div>
      </PublicShell>
    );
  }

  if (success) {
    return (
      <PublicShell>
        <div className="w-full max-w-xl mx-auto rounded-2xl glass shadow-premium p-8 text-center border-t-4 border-t-emerald-500 bg-white/90">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary dark:text-slate-100">Cadastro enviado</h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Recebemos a atualização cadastral. A secretaria da Província fará a conferência antes de liberar os dados no painel.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setFormData(initialForm);
            }}
            className="mt-7 px-6 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10"
          >
            Enviar outro cadastro
          </button>
        </div>
      </PublicShell>
    );
  }

  const steps = ['Identificação', 'Contato', 'Família e Vida Religiosa', 'Saúde e Revisão'];

  return (
    <PublicShell>
      <form onSubmit={handleSubmit} className="relative w-full max-w-4xl mx-auto rounded-2xl glass shadow-premium p-6 sm:p-8 bg-white/90">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary mb-3">
            <UserRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary dark:text-slate-100">Atualização de Dados dos Religiosos</h1>
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mt-1">Província BRM</p>
        </div>

        <div className="mb-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            {steps.map((label, index) => {
              const stepIndex = index + 1;
              const active = step === stepIndex;
              const complete = step > stepIndex;
              return (
                <div key={label} className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${complete ? 'bg-emerald-500 text-white' : active ? 'bg-secondary text-white ring-4 ring-secondary/10' : 'bg-slate-100 text-slate-400'}`}>
                    {complete ? <CheckCircle2 className="w-4 h-4" /> : stepIndex}
                  </div>
                  <span className={`hidden sm:block mt-2 text-[10px] font-bold ${active ? 'text-secondary' : 'text-slate-400'}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 p-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 && (
          <SectionGrid>
            <Field label="Grau">
              <select className={inputClass} value={formData.grau} onChange={(e) => updateField('grau', e.target.value)}>
                {['Frater', 'Irmão', 'Diácono', 'Padre', 'Bispo'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="Nome completo">
              <input required className={inputClass} value={formData.nome_civil} onChange={(e) => updateField('nome_civil', e.target.value)} />
            </Field>
            <Field label="Nome religioso">
              <input className={inputClass} value={formData.nome_religioso} onChange={(e) => updateField('nome_religioso', e.target.value)} />
            </Field>
            <Field label="CPF">
              <input required inputMode="numeric" className={inputClass} value={formData.cpf} onChange={(e) => updateField('cpf', e.target.value)} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className={inputClass} value={formData.data_nascimento} onChange={(e) => updateField('data_nascimento', e.target.value)} />
            </Field>
            <Field label="Local de nascimento">
              <input className={inputClass} value={formData.local_nascimento} onChange={(e) => updateField('local_nascimento', e.target.value)} />
            </Field>
            <Field label="Município">
              <input className={inputClass} value={formData.municipio_nascimento} onChange={(e) => updateField('municipio_nascimento', e.target.value)} />
            </Field>
            <Field label="Estado">
              <input className={inputClass} value={formData.estado_nascimento} onChange={(e) => updateField('estado_nascimento', e.target.value)} />
            </Field>
            <Field label="Nacionalidade">
              <input className={inputClass} value={formData.nacionalidade} onChange={(e) => updateField('nacionalidade', e.target.value)} />
            </Field>
            <Field label="RG">
              <input className={inputClass} value={formData.rg} onChange={(e) => updateField('rg', e.target.value)} />
            </Field>
            <Field label="Órgão expedidor">
              <input className={inputClass} value={formData.rg_orgao_expedidor} onChange={(e) => updateField('rg_orgao_expedidor', e.target.value)} />
            </Field>
            <Field label="Data de emissão do RG">
              <input type="date" className={inputClass} value={formData.rg_data_emissao} onChange={(e) => updateField('rg_data_emissao', e.target.value)} />
            </Field>
          </SectionGrid>
        )}

        {step === 2 && (
          <SectionGrid>
            <Field label="Obra atual">
              <select className={inputClass} value={formData.obra_atual_id} onChange={(e) => updateField('obra_atual_id', e.target.value)}>
                <option value="">Selecione, se aplicável</option>
                {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome} {obra.cidade ? `- ${obra.cidade}/${obra.estado || ''}` : ''}</option>)}
              </select>
            </Field>
            <Field label="E-mail institucional">
              <input type="email" className={inputClass} value={formData.email_institucional} onChange={(e) => updateField('email_institucional', e.target.value)} />
            </Field>
            <Field label="E-mail pessoal">
              <input type="email" className={inputClass} value={formData.email_pessoal} onChange={(e) => updateField('email_pessoal', e.target.value)} />
            </Field>
            <Field label="Celular">
              <input inputMode="tel" className={inputClass} value={formData.telefone_celular} onChange={(e) => updateField('telefone_celular', e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <input inputMode="tel" className={inputClass} value={formData.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} />
            </Field>
            <Field label="Passaporte">
              <input className={inputClass} value={formData.passaporte} onChange={(e) => updateField('passaporte', e.target.value)} />
            </Field>
            <Field label="Título de eleitor">
              <input className={inputClass} value={formData.titulo_eleitor} onChange={(e) => updateField('titulo_eleitor', e.target.value)} />
            </Field>
            <Field label="PIS">
              <input className={inputClass} value={formData.pis} onChange={(e) => updateField('pis', e.target.value)} />
            </Field>
            <Field label="CNH / Categoria">
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass} value={formData.cnh} onChange={(e) => updateField('cnh', e.target.value)} />
                <input className={inputClass} value={formData.cnh_categoria} onChange={(e) => updateField('cnh_categoria', e.target.value)} />
              </div>
            </Field>
          </SectionGrid>
        )}

        {step === 3 && (
          <SectionGrid>
            <Field label="Nome do pai">
              <input className={inputClass} value={formData.pai_nome} onChange={(e) => updateField('pai_nome', e.target.value)} />
            </Field>
            <Field label="Nome da mãe">
              <input className={inputClass} value={formData.mae_nome} onChange={(e) => updateField('mae_nome', e.target.value)} />
            </Field>
            <Field label="Contato familiar responsável">
              <input className={inputClass} value={formData.contato_nome} onChange={(e) => updateField('contato_nome', e.target.value)} />
            </Field>
            <Field label="Parentesco">
              <input className={inputClass} value={formData.contato_parentesco} onChange={(e) => updateField('contato_parentesco', e.target.value)} />
            </Field>
            <Field label="Telefone do familiar">
              <input inputMode="tel" className={inputClass} value={formData.contato_telefone} onChange={(e) => updateField('contato_telefone', e.target.value)} />
            </Field>
            <Field label="Data do batismo">
              <input type="date" className={inputClass} value={formData.batismo_data} onChange={(e) => updateField('batismo_data', e.target.value)} />
            </Field>
            <Field label="Paróquia do batismo">
              <input className={inputClass} value={formData.batismo_paroquia} onChange={(e) => updateField('batismo_paroquia', e.target.value)} />
            </Field>
            <Field label="Primeira profissão">
              <input type="date" className={inputClass} value={formData.primeira_profissao_data} onChange={(e) => updateField('primeira_profissao_data', e.target.value)} />
            </Field>
            <Field label="Votos perpétuos">
              <input type="date" className={inputClass} value={formData.votos_perpetuos_data} onChange={(e) => updateField('votos_perpetuos_data', e.target.value)} />
            </Field>
            <Field label="Ordenação presbiteral">
              <input type="date" className={inputClass} value={formData.ordenacao_data} onChange={(e) => updateField('ordenacao_data', e.target.value)} />
            </Field>
          </SectionGrid>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <SectionGrid>
              <Field label="Plano de saúde">
                <input className={inputClass} value={formData.plano_saude} onChange={(e) => updateField('plano_saude', e.target.value)} />
              </Field>
              <Field label="Tipo sanguíneo">
                <input className={inputClass} value={formData.tipo_sanguineo} onChange={(e) => updateField('tipo_sanguineo', e.target.value)} />
              </Field>
              <Field label="Alergias">
                <input className={inputClass} value={formData.alergias} onChange={(e) => updateField('alergias', e.target.value)} />
              </Field>
              <Field label="Medicamentos de uso contínuo">
                <input className={inputClass} value={formData.medicamentos} onChange={(e) => updateField('medicamentos', e.target.value)} />
              </Field>
            </SectionGrid>
            <Field label="Observações complementares">
              <textarea rows={4} className={inputClass} value={formData.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} />
            </Field>
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.consentimento_dados}
                onChange={(e) => updateField('consentimento_dados', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-secondary"
              />
              <span>Autorizo o uso destes dados pela Província BRM para atualização cadastral, gestão institucional e contato pastoral/administrativo.</span>
            </label>
          </div>
        )}

        <div className="flex justify-between pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          {step < 4 ? (
            <button type="button" onClick={nextStep} className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10">
              Avançar
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Enviar cadastro
            </button>
          )}
        </div>
      </form>
    </PublicShell>
  );
};

const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-50/60 dark:bg-[#061320] py-12 px-4 flex items-center justify-center transition-colors duration-300">
    <div className="fixed top-6 left-6 flex items-center gap-3 text-primary dark:text-secondary">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 dark:bg-secondary/10">
        <Building className="w-5 h-5" />
      </div>
      <div>
        <p className="font-serif font-semibold leading-tight">BRM</p>
        <p className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">Sistema</p>
      </div>
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500">{label}</label>
    {children}
  </div>
);

const SectionGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {children}
  </div>
);

export default CadastroReligiosoPublico;
