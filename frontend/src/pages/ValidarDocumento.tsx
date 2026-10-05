import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  FileCheck2, 
  Building2, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { consultarAutenticidade, type RegistroAutenticidade } from '../lib/autenticacaoDocumental';
import { RodapeTimbradoBRM } from '../components/PapelTimbradoBRM';

export const ValidarDocumento: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { codigo: codigoParam } = useParams<{ codigo?: string }>();

  const codigoInicial = searchParams.get('codigo') || codigoParam || '';
  const [codigoInput, setCodigoInput] = useState(codigoInicial);
  const [resultado, setResultado] = useState<RegistroAutenticidade | null>(null);
  const [consultado, setConsultado] = useState(false);
  const [loading, setLoading] = useState(false);

  const executarValidacao = (codigoParaValidar: string) => {
    if (!codigoParaValidar.trim()) {
      setResultado(null);
      setConsultado(false);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const reg = consultarAutenticidade(codigoParaValidar.trim());
      setResultado(reg);
      setConsultado(true);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    if (codigoInicial) {
      executarValidacao(codigoInicial);
    }
  }, [codigoInicial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executarValidacao(codigoInput);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* CABEÇALHO OFICIAL INSTITUCIONAL */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-timbrado-brm.png" 
              alt="Emblema Dehoniano BRM" 
              className="h-16 w-auto object-contain"
            />
            <div>
              <p className="font-timbrado text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Congregação dos Sacerdotes do Sagrado Coração de Jesus
              </p>
              <h1 className="font-timbrado text-lg sm:text-xl font-bold text-[#113240] dark:text-white">
                Província Brasileira Meridional
              </h1>
              <p className="text-[11px] font-mono text-slate-500">
                Sede Provincial — Corupá / SC · Portal de Validação de Fé Pública
              </p>
            </div>
          </div>

          <Link 
            to="/login" 
            className="text-xs font-mono text-slate-500 hover:text-[#113240] dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Acesso ao Sistema</span>
          </Link>
        </div>
      </header>

      {/* ÁREA CENTRAL DE CONSULTA */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-[#113240] dark:text-cyan-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#113240] dark:text-white">
            Conferência de Autenticidade Notarial
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mt-1">
            Verifique a autenticidade e fé pública de documentos físicos ou digitais expedidos pelos arquivos da Secretaria Provincial e do Economato da Província BRM.
          </p>
        </div>

        {/* FORMULÁRIO DE DIGITAÇÃO DO CÓDIGO */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={codigoInput}
                onChange={e => setCodigoInput(e.target.value.toUpperCase())}
                placeholder="Ex: BRM-2026-XXXX-YYYY"
                className="w-full px-4 py-2.5 pl-10 font-mono text-sm uppercase tracking-wider rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113240] dark:focus:ring-cyan-500 shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading || !codigoInput.trim()}
              className="px-5 py-2.5 bg-[#113240] hover:bg-[#1a4a5e] text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Consultando...' : 'Verificar'}
            </button>
          </div>
        </form>

        {/* RESULTADO DA VERIFICAÇÃO */}
        {consultado && (
          <div className="animate-in fade-in duration-300">
            {resultado ? (
              /* CARD DE DOCUMENTO AUTÊNTICO (VERDE / INSTITUCIONAL) */
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3 pb-4 border-b border-emerald-100 dark:border-emerald-950/60 mb-5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                      Selo de Fé Pública Digital Ativo
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Documento Oficial Autenticado
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Código Verificador:</span>
                    <strong className="font-mono text-sm tracking-wider text-slate-900 dark:text-slate-100">
                      {resultado.codigo}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Situação Cadastral:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {resultado.situacao}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-slate-500 block text-[10.5px]">Denominação Oficial do Bem / Registro:</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-serif">
                      {resultado.titulo}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Classificação / Categoria:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {resultado.tipo}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Identificador / Registro:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {resultado.identificador_oficial || 'Inscrito no Livro de Tombo'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Comunidade / Localidade:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {resultado.comunidade_obra}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Data de Emissão no Sistema:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {new Date(resultado.data_emissao).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 block text-[10.5px]">Órgão Expedidor:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {resultado.emissor}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                  "Certifica-se a conformidade deste registro com os assentos oficiais do Livro de Tombo e arquivos provinciais da Província Brasileira Meridional da Congregação dos Sacerdotes do Sagrado Coração de Jesus."
                </div>
              </div>
            ) : (
              /* CARD DE DOCUMENTO NÃO ENCONTRADO (ALERTA VERMELHO DE FRAUDE) */
              <div className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3 pb-4 border-b border-red-100 dark:border-red-950/60 mb-5">
                  <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-700 dark:text-red-400">
                      Alerta de Integridade
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Documento Não Localizado / Ausência de Fé Pública
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  O código verificador <strong className="font-mono text-red-600 dark:text-red-400">{codigoInput}</strong> não corresponde a nenhum assento oficial expedido pelos arquivos da Sede Provincial da Província BRM.
                </p>

                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300">
                  <strong>Atenção para prevenção de fraudes:</strong> Documentos impressos ou gerados externamente que não constam na base central de validação são desprovidos de fé pública e não possuem validade jurídica ou canônica perante a Congregação.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ OFICIAL TIMBRADO */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <RodapeTimbradoBRM />
        </div>
      </div>
    </div>
  );
};

export default ValidarDocumento;
