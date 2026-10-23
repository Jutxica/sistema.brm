import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Globe, Info, Link2, Loader2, Save, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { siteSyncService, type SiteConfig } from '../services/siteSyncService';

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
  site_url?: string;
  site_supabase_url?: string;
  site_supabase_key?: string;
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
  site_url: 'https://scj-brm.onrender.com',
  site_supabase_url: '',
  site_supabase_key: '',
};

export const ReligiososConfiguracoes: React.FC = () => {
  const [config, setConfig] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  const update = <K extends keyof ReligiososConfig>(key: K, value: ReligiososConfig[K]) => 
    setConfig(previous => ({ ...previous, [key]: value }));

  useEffect(() => {
    async function loadConfig() {
      try {
        const siteCfg = await siteSyncService.getConfig();
        const { data, error } = await supabase
          .from('religiosos_configuracoes')
          .select('*')
          .eq('id', defaults.id)
          .maybeSingle();

        if (error) console.error('Erro ao carregar configurações dos religiosos:', error);
        setConfig(prev => ({
          ...prev,
          ...(data || {}),
          site_url: data?.site_url || siteCfg.site_url,
          site_supabase_url: data?.site_supabase_url || siteCfg.site_supabase_url,
          site_supabase_key: data?.site_supabase_key || siteCfg.site_supabase_key,
        }));
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const result = await siteSyncService.testConnection({
        site_url: config.site_url,
        site_supabase_url: config.site_supabase_url,
        site_supabase_key: config.site_supabase_key,
      });
      setConnectionStatus(result);
      if (result.success) {
        showToast.success('Conexão com o site oficial validada!');
      } else {
        showToast.error(result.message);
      }
    } catch (err: any) {
      setConnectionStatus({ success: false, message: err.message || 'Erro ao testar conexão' });
      showToast.error(err.message || 'Falha ao conectar no site');
    } finally {
      setTestingConnection(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); 
    setSaving(true); 
    setSaved(false);

    try {
      // 1. Salva configurações do site pelo serviço (salva em localStorage e tenta banco)
      await siteSyncService.saveConfig({
        site_url: config.site_url,
        site_supabase_url: config.site_supabase_url,
        site_supabase_key: config.site_supabase_key,
      });

      // 2. Salva campos base na tabela do Supabase
      const payload: any = { ...config, id: defaults.id, updated_by: null };
      const { error } = await supabase.from('religiosos_configuracoes').upsert(payload, { onConflict: 'id' });
      
      if (error) {
        // Se a tabela ainda não tiver as colunas do site, remove e salva os campos base
        if (error.message.includes('column') || error.message.includes('site_')) {
          const { site_url, site_supabase_url, site_supabase_key, ...basePayload } = payload;
          const { error: retryError } = await supabase.from('religiosos_configuracoes').upsert(basePayload, { onConflict: 'id' });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      setSaved(true);
      showToast.success('Configurações salvas com sucesso.');
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      showToast.error(`Não foi possível salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
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

      {/* INTEGRAÇÃO COM SITE OFICIAL (SCJ-BRM / SISTEMA.SCJ) */}
      <section className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#226380]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-cinzel">
              Integração com o Site Oficial
            </h2>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[6px] transition cursor-pointer disabled:opacity-50 shadow-2xs shrink-0 self-start sm:self-auto motion-press"
          >
            {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />}
            <span>Testar Conexão</span>
          </button>
        </div>

        <div className="rounded-[6px] bg-slate-50/80 dark:bg-slate-900/40 p-4 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#226380] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-medium text-slate-800 dark:text-slate-200 block">
              Comunicação direta banco a banco
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              A publicação grava os dados canônicos, fotos 4x4 e vínculos comunitários diretamente no banco de dados do portal. Caso ocorra alteração de domínio público (ex.: migração para <span className="font-medium text-slate-700 dark:text-slate-300">scj.org.br</span>), basta atualizar o endereço abaixo sem impacto na conectividade.
            </p>
          </div>
        </div>

        {connectionStatus && (
          <div className={`p-3.5 rounded-[6px] text-xs font-medium border flex items-center gap-2.5 ${
            connectionStatus.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' 
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
          }`}>
            {connectionStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-semibold mr-1.5">{connectionStatus.success ? 'Conexão validada:' : 'Falha na conexão:'}</span>
              <span>{connectionStatus.message}</span>
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <TextField 
            label="URL Pública do Site Oficial" 
            value={config.site_url || ''} 
            onChange={value => update('site_url', value)} 
          />
          <TextField 
            label="URL do Supabase do Site (ex: https://xxx.supabase.co)" 
            value={config.site_supabase_url || ''} 
            onChange={value => update('site_supabase_url', value)} 
          />
          <div className="md:col-span-2">
            <TextField 
              label="Chave de API / Service Key do Supabase do Site" 
              type="password"
              value={config.site_supabase_key || ''} 
              onChange={value => update('site_supabase_key', value)} 
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Chave com permissão de gravação nas tabelas <code className="font-mono">religiosos</code> e <code className="font-mono">locais</code> do projeto do site.
            </span>
          </div>
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
