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
          const { data: rel, error } = await supabase
            .from('religiosos')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (error) throw error;
          if (rel) targetId = rel.id;
        }

        if (targetId) {
          let query = supabase.from('religiosos').select('*').eq('id', targetId);
          if (!religiosoId && user?.id) {
            query = query.eq('auth_user_id', user.id);
          }
          const { data: relRecord, error } = await query.maybeSingle();
          if (error) throw error;
          if (!relRecord) {
            setData(null);
            setLoading(false);
            return;
          }

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

          // Buscar etapas de formação religiosa
          const { data: formacaoReligiosa } = await supabase
            .from('religiosos_formacao_religiosa')
            .select('*')
            .eq('religioso_id', targetId)
            .order('data_ingresso', { ascending: true });

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

          // Obter foto assinada se foto_path existir
          let resolvedFotoUrl = relRecord.foto_url || null;
          if (relRecord.foto_path) {
            try {
              const { data: signedData } = await supabase.storage
                .from('religiosos-perfil')
                .createSignedUrl(relRecord.foto_path, 3600);
              if (signedData?.signedUrl) {
                resolvedFotoUrl = signedData.signedUrl;
              }
            } catch (storageErr) {
              console.warn('Não foi possível obter URL assinada da foto:', storageErr);
            }
          }

          // Derivar marcos canônicos a partir das listas reais do banco
          const postulantado = formacaoReligiosa?.find((f: any) => (f.etapa || '').toLowerCase().includes('postulan'));
          const noviciado = formacaoReligiosa?.find((f: any) => (f.etapa || '').toLowerCase().includes('novici'));
          const primVotos = votos?.find((v: any) => (v.tipo || '').toLowerCase().includes('primeir'));
          const perpVotos = votos?.find((v: any) => (v.tipo || '').toLowerCase().includes('perp'));
          const diaconato = ordens?.find((o: any) => (o.tipo || '').toLowerCase().includes('diacon'));
          const presbiterato = ordens?.find((o: any) => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));

          setData({
            ...relRecord,
            foto_url: resolvedFotoUrl,
            data_ingresso: relRecord.data_ingresso || postulantado?.data_ingresso || noviciado?.data_ingresso || '',
            data_primeiros_votos: relRecord.data_primeiros_votos || primVotos?.data || '',
            data_votos_perpetuos: relRecord.data_votos_perpetuos || perpVotos?.data || '',
            data_diaconato: relRecord.data_diaconato || diaconato?.data || '',
            data_presbiterato: relRecord.data_presbiterato || presbiterato?.data || '',
            bispo_ordenante: relRecord.bispo_ordenante || presbiterato?.bispo_ordenante || diaconato?.bispo_ordenante || '',
            local_ordenacao: relRecord.local_ordenacao || presbiterato?.local || diaconato?.local || '',
            votosList: votos || [],
            ordensList: ordens || [],
            formacaoReligiosa: formacaoReligiosa || [],
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

  if (!data) {
    return (
      <div className="rounded-[6px] border border-[#d6d6d6] bg-white p-8 text-center">
        <p className="text-sm text-[#707070]">Não foi encontrada uma ficha vinculada à sua conta.</p>
        {onBack && (
          <button type="button" onClick={onBack} className="mt-4 text-sm font-medium text-[#226380] hover:underline">
            Voltar ao portal
          </button>
        )}
      </div>
    );
  }

  const formatCpfMask = (cpf?: string | null) => {
    if (!cpf) return '—';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const naturalidadeTexto = [data?.municipio_nascimento, data?.estado_nascimento].filter(Boolean).join(' - ') || '—';
  const pai = data?.familiares?.find((f: any) => (f.parentesco || f.tipo || '').toLowerCase().includes('pai'))?.nome;
  const mae = data?.familiares?.find((f: any) => (f.parentesco || f.tipo || '').toLowerCase().includes('mãe') || (f.parentesco || f.tipo || '').toLowerCase().includes('mae'))?.nome;
  const paisTexto = [pai, mae].filter(Boolean).join(' e ') || '—';

  const anoIngresso = data?.data_ingresso ? data.data_ingresso.slice(0, 4) : '—';
  const batismo = data?.sacramentosList?.find((s: any) => (s.tipo || '').toLowerCase().includes('batis')) || null;

  return (
    <div className="w-full">
      {/* BARRA DE AÇÕES SUPERIOR (OCULTADA NA IMPRESSÃO) */}
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#161617] p-4 rounded-[8px] border border-slate-200 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Painel</span>
            </button>
          )}
          <div>
            <h2 className="text-sm font-semibold text-[#113240] dark:text-[#f5f5f7]">
              Ficha Canônica Individual
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-[#86868b]">
              Visualização oficial no padrão institucional A4 para impressão e arquivamento
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#226380]" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOrientacao(prev => (prev === 'vertical' ? 'horizontal' : 'vertical'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Alternar orientação entre Vertical (Retrato) e Horizontal (Paisagem)"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#226380]" />
            <span>{orientacao === 'horizontal' ? 'Vertical' : 'Horizontal'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[6px] bg-[#113240] hover:bg-[#226380] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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

      {/* DOCUMENTO ESTILO FOLHA OFICIAL INSTITUCIONAL A4 */}
      <div className={`mx-auto bg-white text-slate-900 p-8 sm:p-12 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none transition-all font-sans leading-tight ${orientacao === 'horizontal' ? 'max-w-[1140px]' : 'max-w-[850px]'}`}>
        
        {/* Cabeçalho Oficial com Brasão Dehoniano */}
        <header className="border-b border-slate-300 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-timbrado-brm.png" alt="Província BRM" className="h-14 w-auto object-contain" />
              <div>
                <p className="font-mono text-[8pt] uppercase tracking-[0.15em] text-slate-500 font-semibold">
                  Congregação dos Sacerdotes do Sagrado Coração de Jesus
                </p>
                <h1 className="text-[14pt] font-serif font-bold text-slate-900 tracking-tight mt-0.5">
                  Província Brasil Meridional
                </h1>
                <p className="text-[8.5pt] font-mono text-slate-600">Arquivo Provincial · Chancelaria</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[7pt] uppercase tracking-wider text-slate-400">Cadastro / Protocolo</p>
              <p className="font-mono text-[10pt] font-bold text-slate-800">
                {data?.numero_cadastro ? String(data.numero_cadastro).padStart(4, '0') : (data?.id ? data.id.slice(0, 8).toUpperCase() : 'BRM-2026')}
              </p>
            </div>
          </div>
        </header>

        {/* Identificação do Religioso */}
        <div className="flex items-end justify-between border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-4">
            {data?.foto_url && (
              <img
                src={data.foto_url}
                alt="Foto"
                className="w-14 h-16 object-cover border border-slate-300 rounded-[2px]"
              />
            )}
            <div>
              <p className="font-mono text-[7.5pt] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                Ficha Cadastral Canônica
              </p>
              <h2 className="text-[17pt] font-serif font-bold text-slate-900 mt-0.5">
                {data?.nome_religioso || data?.nome_civil}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 border border-slate-900 px-2.5 py-0.5 text-[8pt] font-mono font-semibold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <span>Cadastro {data?.status_cadastro || data?.status || 'Aprovado'}</span>
          </div>
        </div>

        {/* Faixa de Indicadores Rápidos */}
        <div className="grid grid-cols-4 border border-slate-200 bg-white text-center mb-4">
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Grau</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{data?.grau || 'Padre'}</p>
          </div>
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Ingresso</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{anoIngresso}</p>
          </div>
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Votos Perpétuos</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_votos_perpetuos)}</p>
          </div>
          <div className="p-2">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Ordenação</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_presbiterato || data?.data_diaconato)}</p>
          </div>
        </div>

        {/* Bloco 1: Ficha Geral & Registro Civil */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            01. Ficha Geral & Registro Civil
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Civil</p>
              <p className="font-medium text-slate-900">{data?.nome_civil || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Religioso</p>
              <p className="font-medium text-slate-900">{data?.nome_religioso || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Data de Nascimento</p>
              <p className="font-medium text-slate-900">{formatarData(data?.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">CPF</p>
              <p className="font-mono font-medium text-slate-900">{formatCpfMask(data?.cpf)}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">RG / Órgão Expedidor</p>
              <p className="font-medium text-slate-900">{data?.rg ? `${data.rg} (${data?.rg_orgao_expedidor || 'SSP'})` : '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Naturalidade</p>
              <p className="font-medium text-slate-900">{naturalidadeTexto}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nacionalidade</p>
              <p className="font-medium text-slate-900">{data?.nacionalidade || 'Brasileira'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Título de Eleitor / PIS</p>
              <p className="font-mono font-medium text-slate-900">{[data?.titulo_eleitor, data?.pis].filter(Boolean).join(' · ') || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">E-mail Institucional</p>
              <p className="font-medium text-slate-900">{data?.email_institucional || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Celular / WhatsApp</p>
              <p className="font-medium text-slate-900">{data?.whatsapp || data?.telefone_celular || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Filiação</p>
              <p className="font-medium text-slate-900">{paisTexto}</p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Vínculo Provincial & Residência */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            02. Vínculo Provincial & Residência
          </p>
          <div className="grid grid-cols-3 gap-x-4 text-[8.5pt]">
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Comunidade Atual</p>
              <p className="font-medium text-slate-900">{data?.comunidade_atual_nome || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Status Canônico</p>
              <p className="font-medium text-slate-900">{data?.status || 'Ativo'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Bispo Ordenante</p>
              <p className="font-medium text-slate-900">{data?.bispo_ordenante || '—'}</p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Trajetória Canônica (Linha do Tempo Visual) */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            03. Trajetória Canônica
          </p>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Batismo</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{batismo?.data ? formatarData(batismo.data) : '—'}</p>
              {batismo?.paroquia && <p className="text-[6.5pt] text-slate-500 truncate">{batismo.paroquia}</p>}
            </div>
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Primeira Profissão</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_primeiros_votos)}</p>
            </div>
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Profissão Perpétua</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_votos_perpetuos)}</p>
            </div>
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Ordenação</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_presbiterato || data?.data_diaconato)}</p>
              {data?.local_ordenacao && <p className="text-[6.5pt] text-slate-500 truncate">{data.local_ordenacao}</p>}
            </div>
          </div>
        </div>

        {/* Bloco 4: Formação Acadêmica & Graus Obtidos */}
        <div className="mb-6">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            04. Formação Acadêmica & Graus Obtidos
          </p>
          <div className="space-y-1 text-[8pt]">
            {data?.formacoes && data.formacoes.length > 0 ? (
              data.formacoes.map((f: any, idx: number) => {
                const titulo = f.curso || f.categoria || 'Formação Acadêmica';
                const inst = f.instituicao || 'Instituição';
                const anoPeriodo = f.periodo || f.ano || '';
                return (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-900">{titulo}</span>
                    <span className="text-slate-600">{inst}{anoPeriodo ? ` (${anoPeriodo})` : ''}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 italic py-1">Filosofia e Teologia — Província Brasil Meridional</p>
            )}
          </div>
        </div>

        {/* Assinaturas Institucionais */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[7.5pt] break-inside-avoid">
          <div>
            <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
            <p className="font-semibold text-slate-800">{data?.nome_religioso || data?.nome_civil}</p>
            <p className="text-[6.5pt] text-slate-400">Assinatura do Religioso</p>
          </div>
          <div>
            <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
            <p className="font-semibold text-slate-800">Chancelaria · Arquivo Provincial</p>
            <p className="text-[6.5pt] text-slate-400">Assinatura e carimbo</p>
          </div>
        </div>

        {/* Linha Canônica da Sede e Rodapé */}
        <div className="mt-8 pt-2 border-t border-[#a0a0a0] text-center select-none">
          <p className="font-serif text-[8.5pt] text-slate-700 leading-snug">
            Rua Padre Gabriel Lux, 900 – Caixa Postal 21 – Corupá/SC | CEP 89278-000
          </p>
          <p className="font-serif text-[8pt] text-slate-600 mt-0.5 leading-snug">
            Telefone: +55 (47) 3375-1194 | E-mail: secretaria@brm.org.br | Site: scj.org.br
          </p>
        </div>

        <footer className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[6.5pt] font-mono text-slate-400">
          <span>Emitido eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · sistema.brm.org.br</span>
          <span>Documento reservado · Dados pessoais protegidos pela LGPD</span>
        </footer>
      </div>
    </div>
  );
};

export default FichaCanonicaPDF;
