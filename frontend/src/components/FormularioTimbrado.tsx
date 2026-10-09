import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, FileText, Printer, ShieldCheck, 
  Send, Calendar, Clock, MapPin, Download, ArrowLeft, Building2, User 
} from 'lucide-react';
import { PapelTimbradoBRM, type OrientacaoDocumento } from './PapelTimbradoBRM';

export interface VariavelCampo {
  id: string;
  label: string;
  categoria: string;
  obrigatorio: boolean;
  tipo: 'text' | 'email' | 'tel' | 'date' | 'select' | 'boolean' | 'textarea';
  opcoes?: string[];
  placeholder?: string;
  ajuda?: string;
}

export interface FormularioTimbradoProps {
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  numeroProtocolo?: string;
  campos: VariavelCampo[];
  valoresIniciais?: Record<string, any>;
  onSubmit?: (respostas: Record<string, any>) => Promise<void> | void;
  modo?: 'fill' | 'preview' | 'print';
  orientacao?: OrientacaoDocumento;
  carregando?: boolean;
  onVoltar?: () => void;
  nomeEvento?: string;
  dataEvento?: string;
  localEvento?: string;
  cabecalhoPersonalizado?: {
    congregacao?: string;
    provincia?: string;
    orgao?: string;
    lema?: string;
    emailContato?: string;
  };
}

export const FormularioTimbrado: React.FC<FormularioTimbradoProps> = ({
  titulo,
  subtitulo,
  descricao,
  numeroProtocolo,
  campos,
  valoresIniciais = {},
  onSubmit,
  modo = 'fill',
  orientacao = 'vertical',
  carregando = false,
  onVoltar,
  nomeEvento,
  dataEvento,
  localEvento,
  cabecalhoPersonalizado
}) => {
  const [respostas, setRespostas] = useState<Record<string, any>>(valoresIniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviadoSucesso, setEnviadoSucesso] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState(numeroProtocolo || `FORM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Agrupar campos por categoria mantendo ordem
  const categoriasMap: Record<string, VariavelCampo[]> = {};
  campos.forEach(campo => {
    const cat = campo.categoria || 'Geral';
    if (!categoriasMap[cat]) categoriasMap[cat] = [];
    categoriasMap[cat].push(campo);
  });

  const handleChange = (id: string, value: any) => {
    setRespostas(prev => ({ ...prev, [id]: value }));
    if (erros[id]) {
      setErros(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'preview') return;

    // Validar campos obrigatórios
    const novosErros: Record<string, string> = {};
    campos.forEach(c => {
      if (c.obrigatorio) {
        const val = respostas[c.id];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          novosErros[c.id] = 'Este campo é de preenchimento obrigatório.';
        }
      }
    });

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(respostas);
      }
      setEnviadoSucesso(true);
    } catch (err) {
      console.error('Erro ao enviar formulário:', err);
    }
  };

  if (enviadoSucesso) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 md:p-10 rounded-[6px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-5 animate-fade-in border-t-4 border-t-[#113240]">
        <div className="w-16 h-16 rounded-full bg-[#113240]/10 text-[#113240] dark:text-[#A3C3C7] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#226380] font-semibold block">
          Secretaria Provincial BRM
        </span>
        <h2 className="text-2xl font-bold text-[#113240] dark:text-white font-cinzel">
          Inscrição Confirmada com Sucesso
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
          Seus dados foram protocolados oficialmente na Secretaria Provincial da Província Brasil Meridional.
        </p>

        <div className="p-4 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-left font-mono text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Protocolo:</span>
            <span className="font-bold text-[#113240] dark:text-white">{protocoloGerado}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Data & Hora:</span>
            <span className="text-slate-700 dark:text-slate-300">{new Date().toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="text-[#226380] dark:text-[#A3C3C7] font-semibold">Confirmado</span>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer motion-press"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Comprovante</span>
          </button>
          {onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] bg-[#113240] text-white hover:bg-[#226380] text-xs font-semibold transition-all cursor-pointer shadow-sm motion-press"
            >
              <span>Voltar ao Painel</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const congregacao = cabecalhoPersonalizado?.congregacao || 'CONGREGAÇÃO DOS PADRES DO SAGRADO CORAÇÃO DE JESUS';
  const provincia = cabecalhoPersonalizado?.provincia || 'PROVÍNCIA BRASIL MERIDIONAL (SCJ)';
  const orgao = cabecalhoPersonalizado?.orgao || 'SECRETARIA PROVINCIAL';
  const lema = cabecalhoPersonalizado?.lema || '«COR JESU, IN TE CONFIDO • SINT UNUM»';
  const emailContato = cabecalhoPersonalizado?.emailContato || 'secretaria@brm.org.br';

  return (
    <PapelTimbradoBRM
      orientacao={orientacao}
      permitirTrocaOrientacao={true}
      orgaoEmissor={orgao}
      protocolo={protocoloGerado}
      dataEmissao={new Date().toLocaleDateString('pt-BR')}
      subtituloDocumento={subtitulo || 'Instrumento Canônico de Inscrição & Registro'}
      tituloDocumento={titulo}
      mostrarControles={modo !== 'print'}
      onVoltar={onVoltar}
      className={modo === 'preview' ? 'ring-2 ring-[#226380]/20' : ''}
    >
      {/* Cartão de Resumo do Evento (se vinculado) */}
      {nomeEvento && (
        <div className="mb-6 p-3 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#113240] dark:text-white font-semibold">
            <FileText className="w-3.5 h-3.5 text-[#226380]" />
            <span>Evento: {nomeEvento}</span>
          </div>
          {dataEvento && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-[#226380]" />
              <span>{dataEvento}</span>
            </div>
          )}
          {localEvento && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#226380]" />
              <span>{localEvento}</span>
            </div>
          )}
        </div>
      )}

      {descricao && (
        <p className="mb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          {descricao}
        </p>
      )}

      {/* CORPO DO FORMULÁRIO COM AS VARIÁVEIS SELECIONADAS */}
      <form onSubmit={handleSubmit} className="brm-letterhead-form space-y-8">
        {campos.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-[6px]">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">
              Nenhuma variável foi selecionada para este formulário. Adicione campos através do construtor.
            </p>
          </div>
        ) : (
          Object.entries(categoriasMap).map(([categoriaNome, camposGrupo], catIndex) => (
            <section key={categoriaNome} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#113240] text-[10px] font-bold text-white font-mono">
                  {catIndex + 1}
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#113240] dark:text-white font-cinzel">
                  {categoriaNome}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {camposGrupo.map(campo => {
                  const isFullWidth = campo.tipo === 'textarea' || campo.id === 'nome_completo' || campo.id === 'comunidade_atual';
                  const valor = respostas[campo.id] ?? '';
                  const erro = erros[campo.id];

                  return (
                    <div 
                      key={campo.id} 
                      className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}
                    >
                      <label 
                        htmlFor={campo.id} 
                        className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <span className="flex items-center gap-1 font-sans">
                          {campo.label}
                          {campo.obrigatorio && <span className="text-red-500 font-bold">*</span>}
                        </span>
                        {campo.obrigatorio && (
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7]">
                            Obrigatório
                          </span>
                        )}
                      </label>

                      {campo.tipo === 'text' && (
                        <input
                          id={campo.id}
                          type="text"
                          disabled={modo === 'preview'}
                          value={valor}
                          onChange={(e) => handleChange(campo.id, e.target.value)}
                          placeholder={campo.placeholder || `Informe ${campo.label.toLowerCase()}...`}
                          className={`w-full px-3.5 py-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all font-sans ${
                            erro 
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380]'
                          }`}
                        />
                      )}

                      {campo.tipo === 'email' && (
                        <input
                          id={campo.id}
                          type="email"
                          disabled={modo === 'preview'}
                          value={valor}
                          onChange={(e) => handleChange(campo.id, e.target.value)}
                          placeholder={campo.placeholder || 'exemplo@brm.org.br'}
                          className={`w-full px-3.5 py-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all font-sans ${
                            erro 
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380]'
                          }`}
                        />
                      )}

                      {campo.tipo === 'tel' && (
                        <input
                          id={campo.id}
                          type="tel"
                          disabled={modo === 'preview'}
                          value={valor}
                          onChange={(e) => handleChange(campo.id, e.target.value)}
                          placeholder={campo.placeholder || '(00) 00000-0000'}
                          className={`w-full px-3.5 py-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all font-sans ${
                            erro 
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380]'
                          }`}
                        />
                      )}

                      {campo.tipo === 'date' && (
                        <input
                          id={campo.id}
                          type="date"
                          disabled={modo === 'preview'}
                          value={valor}
                          onChange={(e) => handleChange(campo.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all font-sans ${
                            erro 
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380]'
                          }`}
                        />
                      )}

                      {campo.tipo === 'select' && (
                        <select
                          id={campo.id}
                          disabled={modo === 'preview'}
                          value={valor}
                          onChange={(e) => handleChange(campo.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all font-sans cursor-pointer ${
                            erro 
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380]'
                          }`}
                        >
                          <option value="">Selecione uma opção...</option>
                          {(campo.opcoes || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {campo.tipo === 'boolean' && (
                        <div className="flex items-center gap-3 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="radio"
                              name={campo.id}
                              disabled={modo === 'preview'}
                              checked={valor === true || valor === 'Sim'}
                              onChange={() => handleChange(campo.id, 'Sim')}
                              className="accent-[#226380] w-4 h-4 cursor-pointer"
                            />
                            <span>Sim</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="radio"
                              name={campo.id}
                              disabled={modo === 'preview'}
                              checked={valor === false || valor === 'Não'}
                              onChange={() => handleChange(campo.id, 'Não')}
                              className="accent-[#226380] w-4 h-4 cursor-pointer"
                            />
                            <span>Não</span>
                          </label>
                        </div>
                      )}

                      {campo.tipo === 'textarea' && (
                        <textarea
                          id={campo.id}
                          rows={3}
                          disabled={modo === 'preview'}
                          value={valor}
                          onChange={(e) => handleChange(campo.id, e.target.value)}
                          placeholder={campo.placeholder || 'Observações pertinentes...'}
                          className={`w-full px-3.5 py-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all resize-y font-sans ${
                            erro 
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380]'
                          }`}
                        />
                      )}

                      {erro && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{erro}</span>
                        </p>
                      )}

                      {campo.ajuda && !erro && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                          {campo.ajuda}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Botão de Envio no modo preenchimento */}
        {modo === 'fill' && campos.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <span className="text-[11px] text-slate-500 font-mono">
              * Campos marcados com asterisco são obrigatórios.
            </span>
            <button
              type="submit"
              disabled={carregando}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm disabled:opacity-50 motion-press"
            >
              {carregando ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Processando envio...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submeter Inscrição Oficial</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </PapelTimbradoBRM>
  );
};

export default FormularioTimbrado;
