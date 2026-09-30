import React, { useEffect, useState } from 'react';
import { Check, Loader2, Save, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';

interface ReligiososConfig {
  id: string;
  ativo: boolean;
  titulo: string;
  mensagem_abertura: string;
  mensagem_fechamento: string;
  mensagem_confirmacao: string;
  termos: string;
  exigir_documentos: boolean;
  email_notificacao: string;
  assunto_notificacao: string;
  instrucoes_documentos: string;
}

const defaults: ReligiososConfig = {
  id: '00000000-0000-0000-0000-000000000001', 
  ativo: true, 
  titulo: 'Atualização de Dados dos Religiosos',
  mensagem_abertura: '', 
  mensagem_fechamento: '', 
  mensagem_confirmacao: '', 
  termos: '', 
  exigir_documentos: true,
  email_notificacao: '', 
  assunto_notificacao: '', 
  instrucoes_documentos: '',
};

export const ReligiososConfiguracoes: React.FC = () => {
  const [config, setConfig] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const update = <K extends keyof ReligiososConfig>(key: K, value: ReligiososConfig[K]) => 
    setConfig(previous => ({ ...previous, [key]: value }));

  useEffect(() => {
    supabase.from('religiosos_configuracoes').select('*').eq('id', defaults.id).maybeSingle().then(({ data, error }) => {
      if (error) console.error('Erro ao carregar configurações dos religiosos:', error);
      if (data) setConfig({ ...defaults, ...data });
      setLoading(false);
    });
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); 
    setSaving(true); 
    setSaved(false);
    const { error } = await supabase.from('religiosos_configuracoes').upsert({ ...config, id: defaults.id, updated_by: null }, { onConflict: 'id' });
    if (error) {
      showToast.error(`Não foi possível salvar: ${error.message}`);
    } else {
      setSaved(true);
      showToast.success('Configurações do cadastro de religiosos salvas com sucesso.');
      setTimeout(() => setSaved(false), 4000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Parâmetros do Módulo • Religiosos
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">
            Configurações dos Religiosos
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Controle a abertura, instruções e parâmetros do cadastro público institucional.
          </p>
        </div>

        <button 
          type="submit"
          disabled={saving} 
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#0c242e] disabled:opacity-50 cursor-pointer rounded-[6px] shadow-sm transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* SAVED TOAST ALERT */}
      {saved && (
        <div className="flex items-center gap-3 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 animate-fade-in shadow-sm">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Configurações atualizadas com sucesso.</span>
        </div>
      )}

      {/* STATUS SWITCH CARD */}
      <section className="apple-card rounded-[6px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-[#113240] dark:text-white font-cinzel">
              Status do Formulário de Cadastro
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {config.ativo 
                ? 'Inscrições abertas: o formulário público aceita novos envios.' 
                : 'Inscrições suspensas: o formulário público exibirá mensagem de encerramento.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={config.ativo} 
              onChange={event => update('ativo', event.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#226380] transition-colors"></div>
          </label>
        </div>
      </section>

      {/* TEXT AND GENERAL PARAMS CARD */}
      <section className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-cinzel">
            Textos e Comunicação com o Religioso
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <TextField 
            label="Título do formulário público" 
            value={config.titulo} 
            onChange={value => update('titulo', value)} 
          />
          <TextField 
            label="E-mail de notificação de envios" 
            type="email" 
            value={config.email_notificacao} 
            onChange={value => update('email_notificacao', value)} 
          />
          <TextArea 
            label="Mensagem de introdução (abertura)" 
            value={config.mensagem_abertura} 
            onChange={value => update('mensagem_abertura', value)} 
          />
          <TextArea 
            label="Mensagem de fechamento (quando suspenso)" 
            value={config.mensagem_fechamento} 
            onChange={value => update('mensagem_fechamento', value)} 
          />
          <TextArea 
            label="Mensagem de confirmação pós-envio" 
            value={config.mensagem_confirmacao} 
            onChange={value => update('mensagem_confirmacao', value)} 
          />
          <TextField 
            label="Assunto do e-mail de notificação" 
            value={config.assunto_notificacao} 
            onChange={value => update('assunto_notificacao', value)} 
          />
          <TextArea 
            label="Instruções para anexação de documentos" 
            value={config.instrucoes_documentos} 
            onChange={value => update('instrucoes_documentos', value)} 
          />
          <TextArea 
            label="Termos de consentimento e LGPD" 
            value={config.termos} 
            onChange={value => update('termos', value)} 
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Obrigatoriedade de documentos
            </span>
            <span className="text-[11px] text-slate-400 block">
              Exigir anexos de RG/CPF, certidões e comprovantes para validar a finalização.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={config.exigir_documentos} 
              onChange={event => update('exigir_documentos', event.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#226380] transition-colors"></div>
          </label>
        </div>
      </section>
    </form>
  );
};

const TextField: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <label className="space-y-1.5 block">
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    <input 
      type={type} 
      value={value} 
      onChange={event => onChange(event.target.value)} 
      className="w-full apple-input rounded-[6px] px-3.5 py-2.5 text-xs outline-none transition-all font-inter" 
    />
  </label>
);

const TextArea: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="space-y-1.5 block md:col-span-2">
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    <textarea 
      rows={3} 
      value={value} 
      onChange={event => onChange(event.target.value)} 
      className="w-full apple-input rounded-[6px] px-3.5 py-2.5 text-xs outline-none transition-all resize-y font-inter" 
    />
  </label>
);

export default ReligiososConfiguracoes;
