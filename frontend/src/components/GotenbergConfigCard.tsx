import React, { useState } from 'react';
import { Server, RefreshCw, Loader2, Download, CheckCircle2, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { gotenbergService } from '../services/gotenbergService';
import { showToast } from '../hooks/useFeedback';

export const GotenbergConfigCard: React.FC = () => {
  const [url, setUrl] = useState(() => gotenbergService.obterUrlBase());
  const [testando, setTestando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [status, setStatus] = useState<{ online: boolean; mensagem: string } | null>(null);

  const handleSalvarUrl = (novaUrl: string) => {
    setUrl(novaUrl);
    gotenbergService.definirUrlBase(novaUrl);
  };

  const handleTestar = async () => {
    setTestando(true);
    try {
      const res = await gotenbergService.testarConexao();
      setStatus(res);
      if (res.online) {
        showToast.success('Servidor Gotenberg conectado com sucesso!', 'Gotenberg Online');
      } else {
        showToast.warning(res.mensagem, 'Gotenberg Offline');
      }
    } finally {
      setTestando(false);
    }
  };

  const handleEmitirDecretoTeste = async () => {
    setGerando(true);
    try {
      const blob = await gotenbergService.gerarDecretoPdf({
        numeroDecreto: 'DEC-BRM-014/2026',
        ano: 2026,
        assunto: 'Provisão Canônica de Pároco e Reitor',
        religiosoNome: 'Pe. João Maria dehoniano, scj',
        religiosoOficio: 'Pároco e Reitor',
        destinoComunidade: 'Paróquia São Luiz Gonzaga',
        cidadeUf: 'Brusque / SC',
        textoProvisao: 'O presbítero empossado exercerá seu ministério pastoral e sacramental em conformidade com as constituições dehonianas e normas canônicas vigentes.',
        dataEmissao: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        provincialNome: 'Pe. Superior Provincial, scj',
        secretarioNome: 'Pe. Secretário Provincial, scj'
      });
      gotenbergService.baixarBlob(blob, 'Decreto_Canônico_Teste_BRM_Gotenberg.pdf');
      showToast.success('Decreto em padrão PDF/A gerado e baixado com sucesso!', 'Gotenberg Ativo');
    } catch (err: any) {
      showToast.error(`Erro ao gerar PDF: ${err?.message || 'Verifique se o serviço está ativo.'}`, 'Erro Gotenberg');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#226380] dark:text-[#A3C3C7]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-cinzel">
              Motor de Renderização PDF (Template Gotenberg / Easypanel)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geração de Decretos, Certidões Sacramentais e Dossiês com cabeçalho/rodapé oficial e padrão arquivístico PDF/A.
          </p>
        </div>

        <a
          href="https://gotenberg.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#226380] dark:text-[#A3C3C7] hover:underline flex items-center gap-1 self-start sm:self-auto font-mono"
        >
          <span>Docs Gotenberg</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono mb-1">
            URL do Serviço no Easypanel:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => handleSalvarUrl(e.target.value)}
              placeholder="https://pdf.seu-dominio.com.br"
              className="flex-1 px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-[#226380]"
            />
            <button
              type="button"
              onClick={handleTestar}
              disabled={testando}
              className="px-3.5 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {testando ? <Loader2 className="w-3 h-3 animate-spin text-[#226380]" /> : <RefreshCw className="w-3 h-3" />}
              <span>Testar Conexão</span>
            </button>
            <button
              type="button"
              onClick={handleEmitirDecretoTeste}
              disabled={gerando}
              className="px-4 py-2 rounded-[6px] bg-[#113240] hover:bg-[#226380] text-white font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              {gerando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              <span>Emitir Decreto Teste (PDF/A)</span>
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`p-3 rounded-[6px] border flex items-center gap-2.5 font-mono text-xs ${
              status.online
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
            }`}
          >
            {status.online ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{status.mensagem}</span>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-[6px] border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Como subir no Easypanel em 2 minutos:</span>
          </div>
          <p>
            1. No seu Easypanel, clique em <strong>+ Service → Template</strong>.
          </p>
          <p>
            2. Busque por <strong>Gotenberg</strong> e clique em <strong>Install</strong>.
          </p>
          <p>
            3. Na aba <em>Domains</em>, configure o domínio (ex: <code>https://pdf.seudominio.com.br</code>) e cole a URL no campo acima.
          </p>
        </div>
      </div>
    </div>
  );
};
