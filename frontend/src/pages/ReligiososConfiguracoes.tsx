import React, { useEffect, useState } from 'react';
import { Check, Loader2, Save, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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
  id: '00000000-0000-0000-0000-000000000001', ativo: true, titulo: 'Atualização de Dados dos Religiosos',
  mensagem_abertura: '', mensagem_fechamento: '', mensagem_confirmacao: '', termos: '', exigir_documentos: true,
  email_notificacao: '', assunto_notificacao: '', instrucoes_documentos: '',
};
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900';

export const ReligiososConfiguracoes: React.FC = () => {
  const [config, setConfig] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const update = <K extends keyof ReligiososConfig>(key: K, value: ReligiososConfig[K]) => setConfig(previous => ({ ...previous, [key]: value }));

  useEffect(() => {
    supabase.from('religiosos_configuracoes').select('*').eq('id', defaults.id).maybeSingle().then(({ data, error }) => {
      if (error) console.error('Erro ao carregar configurações dos religiosos:', error);
      if (data) setConfig({ ...defaults, ...data });
      setLoading(false);
    });
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setSaved(false);
    const { error } = await supabase.from('religiosos_configuracoes').upsert({ ...config, id: defaults.id, updated_by: null }, { onConflict: 'id' });
    if (error) window.alert(`Não foi possível salvar: ${error.message}`);
    else setSaved(true);
    setSaving(false);
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>;

  return <form onSubmit={save} className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="font-serif text-2xl font-bold text-primary">Configurações dos Religiosos</h1><p className="mt-1 text-xs text-slate-500">Controle o comportamento e as mensagens do cadastro público.</p></div><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar configurações</button></header>
    {saved && <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700"><Check className="h-4 w-4" />Configurações salvas.</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium dark:border-slate-800 dark:bg-slate-900/70"><div className="mb-5 flex items-center gap-3"><Settings2 className="h-5 w-5 text-primary" /><div><h2 className="font-serif text-lg font-bold text-primary">Inscrições públicas</h2><p className="text-xs text-slate-500">Defina quando o formulário pode receber novos cadastros.</p></div></div><label className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm font-semibold dark:bg-slate-800/60"><span>{config.ativo ? 'Inscrições abertas' : 'Inscrições fechadas'}<small className="mt-1 block text-xs font-normal text-slate-500">O site público respeita este estado imediatamente.</small></span><input type="checkbox" checked={config.ativo} onChange={event => update('ativo', event.target.checked)} className="h-5 w-5 accent-secondary" /></label></section>
    <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-premium dark:border-slate-800 dark:bg-slate-900/70 md:grid-cols-2"><TextField label="Título do formulário" value={config.titulo} onChange={value => update('titulo', value)} /><TextField label="E-mail para notificações" type="email" value={config.email_notificacao} onChange={value => update('email_notificacao', value)} /><TextArea label="Mensagem de abertura" value={config.mensagem_abertura} onChange={value => update('mensagem_abertura', value)} /><TextArea label="Mensagem de fechamento" value={config.mensagem_fechamento} onChange={value => update('mensagem_fechamento', value)} /><TextArea label="Mensagem de confirmação" value={config.mensagem_confirmacao} onChange={value => update('mensagem_confirmacao', value)} /><TextField label="Assunto da notificação" value={config.assunto_notificacao} onChange={value => update('assunto_notificacao', value)} /><TextArea label="Instruções para documentos" value={config.instrucoes_documentos} onChange={value => update('instrucoes_documentos', value)} /><TextArea label="Termos e autorização de dados" value={config.termos} onChange={value => update('termos', value)} /><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={config.exigir_documentos} onChange={event => update('exigir_documentos', event.target.checked)} className="h-4 w-4 accent-secondary" />Exigir anexos de documentos para enviar</label></section>
  </form>;
};

const TextField: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => <label className="space-y-1.5"><span className="text-xs font-semibold text-slate-500">{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} className={inputClass} /></label>;
const TextArea: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-semibold text-slate-500">{label}</span><textarea rows={4} value={value} onChange={event => onChange(event.target.value)} className={inputClass} /></label>;

export default ReligiososConfiguracoes;
