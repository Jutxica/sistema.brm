import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Share2, 
  ArrowLeft, 
  Check, 
  FileText,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../hooks/useFeedback';
import { CabecalhoTimbradoBRM, RodapeTimbradoBRM, type OrientacaoDocumento } from '../../components/PapelTimbradoBRM';

interface FichaCanonicaPDFProps {
  religiosoId?: string;
  onBack?: () => void;
}

export const FichaCanonicaPDF: React.FC<FichaCanonicaPDFProps> = ({ 
  religiosoId, 
  onBack 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  const [orientacao, setOrientacao] = useState<OrientacaoDocumento>('vertical');
  const isE2E = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true';

  useEffect(() => {
    const carregarDadosFicha = async () => {
      setLoading(true);
      try {
        if (isE2E && !religiosoId) {
          setData({
            nome_civil: 'Carlos Eduardo da Silva',
            nome_religioso: 'Pe. Carlos Eduardo, SCJ',
            grau: 'Padre',
            status_cadastro: 'Aprovado',
            status: 'Ativo',
            data_nascimento: '1984-06-15',
            municipio_nascimento: 'Brusque',
            estado_nascimento: 'SC',
            pais_nascimento: 'Brasil',
            nacionalidade: 'Brasileira',
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            rg_orgao_expedidor: 'SSP/SC',
            titulo_eleitor: '987654321098',
            pis: '123.45678.90-1',
            cnh: '01234567890',
            cnh_categoria: 'B',
            comunidade_atual_nome: 'Sede Provincial BRM, Curitiba/PR',
            email_institucional: 'pe.carlos@brm.org.br',
            email_pessoal: 'carlos.scj@gmail.com',
            telefone_celular: '(41) 99876-5432',
            whatsapp: '(41) 99876-5432',
            data_ingresso: '2004-02-10',
            data_primeiros_votos: '2006-02-02',
            data_votos_perpetuos: '2010-02-02',
            data_diaconato: '2011-06-19',
            data_presbiterato: '2011-12-10',
            bispo_ordenante: 'Dom Wilson Tadeu Jönck, SCJ',
            local_ordenacao: 'Santuário Sagrado Coração de Jesus, Joinville/SC',
            formacoes: [
              { curso: 'Bacharelado em Filosofia', instituicao: 'Faculdade Dehoniana', ano: '2007' },
              { curso: 'Bacharelado em Teologia', instituicao: 'Faculdade Dehoniana', ano: '2011' },
              { curso: 'Pós-graduação em Espiritualidade Dehoniana', instituicao: 'Centro Dehoniano', ano: '2016' }
            ],
            familiares: [
              { tipo: 'Pai', nome: 'Antônio da Silva', estado_civil: 'Casado' },
              { tipo: 'Mãe', nome: 'Maria Aparecida da Silva', estado_civil: 'Casada' }
            ]
          });
          setLoading(false);
          return;
        }

        let targetId = religiosoId || user?.religiosoId;

        if (!targetId && user?.id) {
          const { data: rel } = await supabase
            .from('religiosos')
            .select('id')
            .or(`auth_user_id.eq.${user.id},email_institucional.eq.${user.email},email_pessoal.eq.${user.email}`)
            .maybeSingle();
          if (rel) targetId = rel.id;
        }

        if (!targetId) {
          const { data: list } = await supabase.from('religiosos').select('id').limit(1);
          if (list && list.length > 0) targetId = list[0].id;
        }

        if (targetId) {
          const { data: relRecord } = await supabase
            .from('religiosos')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();

          // Buscar votos se houver tabela
          const { data: votos } = await supabase
            .from('religiosos_profissoes_votos')
            .select('*')
            .eq('religioso_id', targetId)
            .order('data', { ascending: true });

          // Buscar ordens se houver tabela
          const { data: ordens } = await supabase
            .from('religiosos_ministerios_ordens')
            .select('*')
            .eq('religioso_id', targetId)
            .order('data', { ascending: true });

          // Buscar formações acadêmicas se houver tabela
          const { data: formacoes } = await supabase
            .from('religiosos_formacao_academica')
            .select('*')
            .eq('religioso_id', targetId);

          // Buscar familiares se houver tabela
          const { data: familiares } = await supabase
            .from('religiosos_familiares')
            .select('*')
            .eq('religioso_id', targetId);

          setData({
            ...relRecord,
            votosList: votos || [],
            ordensList: ordens || [],
            formacoes: formacoes || [],
            familiares: familiares || []
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados da ficha canônica:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosFicha();
  }, [religiosoId, user, isE2E]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const nome = data?.nome_religioso || data?.nome_civil || 'Ficha do Confrade';
    const textoCompartilhar = `Ficha Cadastral Canônica - Província Brasil Meridional (SCJ)\nReligioso: ${nome}\nComunidade: ${data?.comunidade_atual_nome || 'Província BRM'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha Canônica - ${nome}`,
          text: textoCompartilhar,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Ignora cancelamento
      }
    }

    try {
      await navigator.clipboard.writeText(`${textoCompartilhar}\nLink: ${window.location.href}`);
      setCopiado(true);
      showToast.success('Link copiado para a área de transferência.');
      setTimeout(() => setCopiado(false), 3000);
    } catch (e) {
      showToast.info('Link copiado para a área de transferência.');
    }
  };

  const formatarData = (d?: string) => {
    if (!d) return '—';
    try {
      const parts = d.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return d;
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-16">
        <div className="w-8 h-8 rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3] animate-spin" />
        <span className="text-[12px] font-medium text-[#707070] dark:text-[#86868b] mt-3">
          Gerando Ficha Canônica Oficial...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* BARRA DE AÇÕES SUPERIOR (OCULTADA NA IMPRESSÃO) */}
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#161617] p-4 rounded-[20px] border border-[#d6d6d6]/60 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#323236] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Painel</span>
            </button>
          )}
          <div>
            <h2 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              Ficha Canônica Individual
            </h2>
            <span className="text-[11px] text-[#707070] dark:text-[#86868b]">
              Visualização oficial estilo documento / A4 para impressão e arquivamento
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#323236] transition-all cursor-pointer border border-[#d6d6d6]/60 dark:border-white/10"
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOrientacao(prev => (prev === 'vertical' ? 'horizontal' : 'vertical'))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#323236] transition-all cursor-pointer"
            title="Alternar orientação entre Vertical (Retrato) e Horizontal (Paisagem)"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>{orientacao === 'horizontal' ? 'Vertical' : 'Horizontal'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Injeção de regras @page para orientação dinâmica */}
      <style>
        {`
          @media print {
            @page {
              size: A4 ${orientacao === 'horizontal' ? 'landscape' : 'portrait'};
              margin: ${orientacao === 'horizontal' ? '10mm 15mm 12mm 15mm' : '12mm 16mm 14mm 16mm'};
            }
          }
        `}
      </style>

      {/* DOCUMENTO ESTILO FOLHA OFICIAL A4 / PDF */}
      <div className={`mx-auto bg-white text-[#1d1d1f] p-8 sm:p-12 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#d6d6d6]/60 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:rounded-none transition-all ${orientacao === 'horizontal' ? 'max-w-[1140px]' : 'max-w-[850px]'}`}>
        
        {/* CABEÇALHO OFICIAL DO PAPEL TIMBRADO BRM */}
        <CabecalhoTimbradoBRM
          protocolo={data?.id ? data.id.slice(0, 8).toUpperCase() : 'BRM-2026'}
          dataEmissao={new Date().toLocaleDateString('pt-BR')}
          subtituloDocumento="Ficha Cadastral Canônica Oficial"
        />

        {/* IDENTIFICAÇÃO DO RELIGIOSO (FOTO + DADOS PRINCIPAIS) */}
        <div className="bg-[#fbfbfd] rounded-[16px] border border-[#d6d6d6]/60 p-5 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-28 rounded-[12px] bg-white border border-[#d6d6d6] flex flex-col items-center justify-center text-[#707070] shrink-0 overflow-hidden shadow-sm">
            {data?.foto_url ? (
              <img src={data.foto_url} alt="Foto do Religioso" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <FileText className="w-8 h-8 text-[#a1a1a6] mb-1" />
                <span className="text-[9px] uppercase font-semibold text-[#707070]">3x4 Oficial</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] block mb-1">
              {data?.grau || 'Padre'} • Dehoniano SCJ
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">
              {data?.nome_religioso || data?.nome_civil}
            </h2>
            <p className="text-xs text-[#707070] mt-0.5">
              Nome civil completo: <span className="font-semibold text-[#1d1d1f]">{data?.nome_civil}</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-[#d6d6d6]/50 text-xs">
              <div>
                <span className="text-[#707070]">Comunidade de Residência: </span>
                <span className="font-semibold text-[#1d1d1f]">{data?.comunidade_atual_nome || 'A definir'}</span>
              </div>
              <div>
                <span className="text-[#707070]">Status Canônico: </span>
                <span className="font-semibold text-emerald-700">{data?.status || 'Ativo'}</span>
              </div>
              <div>
                <span className="text-[#707070]">E-mail Institucional: </span>
                <span className="font-medium text-[#1d1d1f]">{data?.email_institucional || '—'}</span>
              </div>
              <div>
                <span className="text-[#707070]">WhatsApp / Celular: </span>
                <span className="font-medium text-[#1d1d1f]">{data?.whatsapp || data?.telefone_celular || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: DADOS CIVIS & REGISTROS */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-[#1d1d1f]/20 pb-1.5 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0071e3]">
              01 • Registro Civil & Identificação Pessoal
            </span>
          </div>

          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium w-1/4">Data de Nascimento:</td>
                <td className="py-2 font-semibold text-[#1d1d1f] w-1/4">{formatarData(data?.data_nascimento)}</td>
                <td className="py-2 text-[#707070] font-medium w-1/4">Naturalidade / UF:</td>
                <td className="py-2 font-semibold text-[#1d1d1f] w-1/4">
                  {data?.municipio_nascimento ? `${data.municipio_nascimento}/${data?.estado_nascimento || ''}` : '—'}
                </td>
              </tr>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium">Nacionalidade:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">{data?.nacionalidade || 'Brasileira'}</td>
                <td className="py-2 text-[#707070] font-medium">CPF:</td>
                <td className="py-2 font-mono font-semibold text-[#1d1d1f]">{data?.cpf || '—'}</td>
              </tr>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium">RG / Órgão:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">
                  {data?.rg ? `${data.rg} (${data?.rg_orgao_expedidor || 'SSP'})` : '—'}
                </td>
                <td className="py-2 text-[#707070] font-medium">Título de Eleitor:</td>
                <td className="py-2 font-mono font-semibold text-[#1d1d1f]">{data?.titulo_eleitor || '—'}</td>
              </tr>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium">PIS / PASEP:</td>
                <td className="py-2 font-mono font-semibold text-[#1d1d1f]">{data?.pis || '—'}</td>
                <td className="py-2 text-[#707070] font-medium">CNH / Categoria:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">
                  {data?.cnh ? `${data.cnh} (Cat. ${data?.cnh_categoria || 'B'})` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 2: DADOS VOCACIONAIS & CANÔNICOS */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-[#1d1d1f]/20 pb-1.5 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0071e3]">
              02 • Trajetória Religiosa & Ministério Eclesiástico
            </span>
          </div>

          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium w-1/4">Ingresso / Postulado:</td>
                <td className="py-2 font-semibold text-[#1d1d1f] w-1/4">{formatarData(data?.data_ingresso)}</td>
                <td className="py-2 text-[#707070] font-medium w-1/4">Primeira Profissão Religiosa:</td>
                <td className="py-2 font-semibold text-[#1d1d1f] w-1/4">{formatarData(data?.data_primeiros_votos)}</td>
              </tr>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium">Votos Perpétuos:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">{formatarData(data?.data_votos_perpetuos)}</td>
                <td className="py-2 text-[#707070] font-medium">Ordenação Diaconal:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">{formatarData(data?.data_diaconato)}</td>
              </tr>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium">Ordenação Presbiteral:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">{formatarData(data?.data_presbiterato)}</td>
                <td className="py-2 text-[#707070] font-medium">Bispo Ordenante:</td>
                <td className="py-2 font-semibold text-[#1d1d1f]">{data?.bispo_ordenante || '—'}</td>
              </tr>
              <tr className="border-b border-[#e5e5ea]">
                <td className="py-2 text-[#707070] font-medium">Local da Ordenação:</td>
                <td colSpan={3} className="py-2 font-semibold text-[#1d1d1f]">
                  {data?.local_ordenacao || 'Província Brasil Meridional'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 3: FORMAÇÃO ACADÊMICA & HABILITAÇÕES */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-[#1d1d1f]/20 pb-1.5 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0071e3]">
              03 • Formação Acadêmica & Graus Obtidos
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {data?.formacoes && data.formacoes.length > 0 ? (
              data.formacoes.map((f: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1.5 border-b border-[#e5e5ea]">
                  <span className="font-semibold text-[#1d1d1f]">{f.curso}</span>
                  <span className="text-[#707070]">{f.instituicao} ({f.ano})</span>
                </div>
              ))
            ) : (
              <div className="py-2 text-[#707070] italic">
                Filosofia e Teologia — Província Brasil Meridional
              </div>
            )}
          </div>
        </div>

        {/* BLOC DE AUTENTICAÇÃO E ASSINATURAS (SECRETARIA PROVINCIAL) */}
        <div className="mt-12 pt-6 border-t-2 border-[#1d1d1f] flex flex-col sm:flex-row justify-between items-end gap-8">
          <div className="text-left text-[11px] text-[#707070] max-w-sm">
            <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secretaria Provincial • Província BRM</span>
            </div>
            <p>
              Documento canônico expedido em {new Date().toLocaleDateString('pt-BR')}, com fé pública perante a Sede Provincial e registros canônicos dos Padres Dehonianos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 w-full sm:w-auto">
            <div className="text-center min-w-[180px]">
              <div className="border-b border-[#1d1d1f] mb-1.5 h-10" />
              <span className="text-[10px] font-semibold text-[#1d1d1f] block uppercase">
                {data?.nome_religioso || data?.nome_civil}
              </span>
              <span className="text-[9px] text-[#707070] block">Assinatura do Religioso</span>
            </div>

            <div className="text-center min-w-[180px]">
              <div className="border-b border-[#1d1d1f] mb-1.5 h-10" />
              <span className="text-[10px] font-semibold text-[#1d1d1f] block uppercase">
                Secretário Provincial
              </span>
              <span className="text-[9px] text-[#707070] block">Sede Provincial BRM</span>
            </div>
          </div>
        </div>

        {/* Rodapé Oficial Timbrado BRM */}
        <RodapeTimbradoBRM />
      </div>
    </div>
  );
};

export default FichaCanonicaPDF;
