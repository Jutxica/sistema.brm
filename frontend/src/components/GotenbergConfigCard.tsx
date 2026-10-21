import React, { useState } from 'react';
import { 
  Server, RefreshCw, Loader2, Download, CheckCircle2, 
  AlertCircle, Sparkles, ExternalLink, FileText, X, Check, BookOpen 
} from 'lucide-react';
import { gotenbergService } from '../services/gotenbergService';
import { showToast } from '../hooks/useFeedback';

type TipoDocumentoEmissao = 'decreto' | 'portaria' | 'celebret' | 'votos' | 'circular';

export const GotenbergConfigCard: React.FC = () => {
  const [url, setUrl] = useState(() => gotenbergService.obterUrlBase());
  const [testando, setTestando] = useState(false);
  const [status, setStatus] = useState<{ online: boolean; mensagem: string } | null>(null);

  // Estados do Modal de Emissão
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoDoc, setTipoDoc] = useState<TipoDocumentoEmissao>('decreto');
  const [gerando, setGerando] = useState(false);

  // Campos do Formulário do Documento
  const [numeroDoc, setNumeroDoc] = useState('DEC-BRM-014/2026');
  const [assuntoDoc, setAssuntoDoc] = useState('Provisão Canônica de Pároco e Reitor');
  const [religiosoNome, setReligiosoNome] = useState('Pe. João Maria dehoniano, scj');
  const [oficioReligioso, setOficioReligioso] = useState('Pároco e Reitor');
  const [comunidadeDestino, setComunidadeDestino] = useState('Paróquia São Luiz Gonzaga');
  const [cidadeUf, setCidadeUf] = useState('Brusque / SC');
  const [textoCorpo, setTextoCorpo] = useState(
    'O presbítero empossado exercerá seu ministério pastoral e sacramental em conformidade com as constituições dehonianas e normas canônicas vigentes, promovendo o cuidado aos fiéis e o bem da Igreja.'
  );

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

  const handleTrocarTipo = (novoTipo: TipoDocumentoEmissao) => {
    setTipoDoc(novoTipo);
    if (novoTipo === 'decreto') {
      setNumeroDoc('DEC-BRM-014/2026');
      setAssuntoDoc('Provisão Canônica de Pároco e Reitor');
      setOficioReligioso('Pároco e Reitor');
    } else if (novoTipo === 'portaria') {
      setNumeroDoc('PORT-BRM-008/2026');
      setAssuntoDoc('Constituição da Comissão Provincial de Pastoral Vocacional');
      setTextoCorpo('Fica instituída a Comissão Preparatória para o Ano Vocacional Dehoniano da Província BRM, com mandato até dezembro de 2027.');
    } else if (novoTipo === 'celebret') {
      setNumeroDoc('CEL-BRM-2026/045');
      setAssuntoDoc('Declaração Canônica de Uso de Ordens (Celebret)');
      setTextoCorpo('Certifica-se a idoneidade e o pleno uso de ordens sagradas para viagens apostólicas e celebrações litúrgicas.');
    } else if (novoTipo === 'votos') {
      setNumeroDoc('VOT-BRM-2026/012');
      setAssuntoDoc('Certidão Canônica de Profissão de Votos Perpétuos');
      setTextoCorpo('Assento lavrado no Livro III de Votos Perpétuos da Província BRM.');
    } else if (novoTipo === 'circular') {
      setNumeroDoc('CIRC-BRM-005/2026');
      setAssuntoDoc('Mensagem Pastoral do Padre Provincial para a Páscoa da Ressurreição');
      setTextoCorpo('Caríssimos confrades, que a vitória do Coração Ressuscitado de Cristo renove nossas comunidades e anime nossa entrega apostólica neste tempo jubilar.');
    }
  };

  const handleEmitirDocumento = async () => {
    setGerando(true);
    const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    try {
      let blob: Blob;
      let nomeArquivo = `Documento_${numeroDoc.replace(/\//g, '-')}.pdf`;

      if (tipoDoc === 'decreto') {
        blob = await gotenbergService.gerarDecretoPdf({
          numeroDecreto: numeroDoc,
          ano: 2026,
          assunto: assuntoDoc,
          religiosoNome,
          religiosoOficio: oficioReligioso,
          destinoComunidade: comunidadeDestino,
          cidadeUf,
          textoProvisao: textoCorpo,
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj',
          secretarioNome: 'Pe. Secretário Provincial, scj'
        });
      } else if (tipoDoc === 'portaria') {
        blob = await gotenbergService.gerarPortariaPdf({
          numeroPortaria: numeroDoc,
          assunto: assuntoDoc,
          destinatarios: religiosoNome,
          finalidade: comunidadeDestino,
          textoPortaria: textoCorpo,
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj',
          secretarioNome: 'Pe. Secretário Provincial, scj'
        });
      } else if (tipoDoc === 'celebret') {
        blob = await gotenbergService.gerarCelebretPdf({
          numeroCertidao: numeroDoc,
          religiosoNome,
          grauMinisterial: 'Presbítero',
          dataOrdenacao: '12 de dezembro de 2018',
          bispoOrdenante: 'Dom Murilo Sebastião Ramos Krieger, scj',
          validadeAte: '1 ano após a data de emissão',
          observacoes: 'Nada consta contra o exercício de suas ordens sacras.',
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj'
        });
      } else if (tipoDoc === 'votos') {
        blob = await gotenbergService.gerarCertidaoVotosPdf({
          numeroRegistro: numeroDoc,
          religiosoNome,
          tipoVotos: 'Perpétuos',
          dataProfissao: '02 de fevereiro de 2022',
          localProfissao: 'Igreja Matriz São Luiz Gonzaga - Brusque/SC',
          superiorRecebedor: 'Pe. Superior Provincial, scj',
          livroRegistro: '04',
          folhaRegistro: '128',
          termoRegistro: '254',
          dataEmissao: dataHoje,
          secretarioNome: 'Pe. Secretário Provincial, scj'
        });
      } else {
        blob = await gotenbergService.gerarCircularPdf({
          numeroCircular: numeroDoc,
          assunto: assuntoDoc,
          saudacao: 'Caríssimos Confrades, Paz e Bem no Coração de Jesus!',
          corpoTexto: `<p>${textoCorpo}</p>`,
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj'
        });
      }

      gotenbergService.baixarBlob(blob, nomeArquivo);
      showToast.success(`Documento ${numeroDoc} emitido com sucesso em padrão PDF/A!`, 'Emissão Concluída');
      setModalAberto(false);
    } catch (err: any) {
      showToast.error(`Erro ao gerar PDF: ${err?.message || 'Verifique a conexão com o Gotenberg.'}`, 'Erro Gotenberg');
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
              Central de Emissão de Documentos Canônicos (Gotenberg / Easypanel)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emissão oficial de Decretos, Portarias, Celebret (Idoneidade), Certidões de Votos e Circulares no Papel Timbrado BRM.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#226380] hover:bg-[#113240] text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Emitir Documento Oficial</span>
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono mb-1">
            URL do Serviço Gotenberg no Easypanel:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => handleSalvarUrl(e.target.value)}
              placeholder="https://sitebrm-gotenberg.ryk9yi.easypanel.host"
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
      </div>

      {/* Modal Emissor de Documentos Canônicos */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[20px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl">
            
            {/* Topo do Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#226380] dark:text-[#A3C3C7]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-cinzel leading-tight">
                    Emissão de Documento Oficial Canônico
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Renderização direta com Papel Timbrado Oficial via Gotenberg
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Seletor de Tipo de Documento */}
              <div>
                <label className="block text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 mb-2">
                  Selecione o Tipo de Documento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {([
                    ['decreto', 'Decreto'],
                    ['portaria', 'Portaria'],
                    ['celebret', 'Celebret'],
                    ['votos', 'Votos SCJ'],
                    ['circular', 'Circular']
                  ] as const).map(([tipo, label]) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleTrocarTipo(tipo)}
                      className={`py-2 px-3 rounded-[6px] font-mono text-xs font-semibold border transition-all cursor-pointer text-center ${
                        tipoDoc === tipo
                          ? 'border-[#226380] bg-[#226380] text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Número do Registro / Protocolo:
                  </label>
                  <input
                    type="text"
                    value={numeroDoc}
                    onChange={(e) => setNumeroDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Nome do Confrade / Religioso:
                  </label>
                  <input
                    type="text"
                    value={religiosoNome}
                    onChange={(e) => setReligiosoNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Assunto / Ementa do Documento:
                  </label>
                  <input
                    type="text"
                    value={assuntoDoc}
                    onChange={(e) => setAssuntoDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                {tipoDoc === 'decreto' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                        Ofício Canônico Designado:
                      </label>
                      <input
                        type="text"
                        value={oficioReligioso}
                        onChange={(e) => setOficioReligioso(e.target.value)}
                        className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                        Comunidade / Cidade / UF:
                      </label>
                      <input
                        type="text"
                        value={`${comunidadeDestino} • ${cidadeUf}`}
                        onChange={(e) => setComunidadeDestino(e.target.value)}
                        className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Texto / Disposições Canônicas:
                  </label>
                  <textarea
                    rows={4}
                    value={textoCorpo}
                    onChange={(e) => setTextoCorpo(e.target.value)}
                    className="w-full p-3 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[11px] font-mono text-slate-500">
                Padrão Arquivístico ISO PDF/A-1b • A4
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEmitirDocumento}
                  disabled={gerando}
                  className="px-5 py-2 rounded-[6px] bg-[#113240] hover:bg-[#226380] text-white text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-60"
                >
                  {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{gerando ? 'Gerando no Gotenberg...' : 'Gerar e Baixar PDF'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
