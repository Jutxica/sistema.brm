import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Check, 
  Download,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../hooks/useFeedback';
import { PapelTimbradoBRM, type OrientacaoDocumento } from '../../components/PapelTimbradoBRM';
import { gotenbergService } from '../../services/gotenbergService';
import { obterFotoReligiosoBase64 } from '../../services/religiosoFotoService';
import { atribuirNomeReligioso, formatarComunidadeReligiosa } from '../../lib/religiosoNome';

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
  const [exportandoGotenberg, setExportandoGotenberg] = useState(false);
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
            comunidade_atual_nome: 'Sede Provincial – Seminário Sagrado Coração de Jesus, Corupá/SC',
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

          const { data: designacoes } = await supabase
            .from('religiosos_designacoes')
            .select('*, comunidades(nome), religiosos_obras_referencia(nome)')
            .eq('religioso_id', targetId);

          const { data: historicoComunidades } = await supabase
            .from('religiosos_historico_comunidades')
            .select('*')
            .eq('religioso_id', targetId)
            .order('periodo_inicio', { ascending: true });

          const { data: missoesServicos } = await supabase
            .from('religiosos_missoes_servicos')
            .select('*')
            .eq('religioso_id', targetId)
            .order('created_at', { ascending: true });

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
            familiares: familiares || [],
            designacoes: designacoes || [],
            historicoComunidades: historicoComunidades || [],
            missoesServicos: missoesServicos || []
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

  const handleExportarGotenberg = async () => {
    if (!data) return;
    setExportandoGotenberg(true);
    try {
      const trabalhos: Array<{
        periodo: string;
        instituicao: string;
        funcao: string;
        local?: string;
        observacoes?: string;
      }> = [];

      (data.designacoes || []).forEach((d: any) => {
        const nomeInst = d.religiosos_obras_referencia?.nome || formatarComunidadeReligiosa(d.comunidades?.nome) || 'Comunidade Provincial';
        const ano = d.ano_referencia || (d.vigencia_inicio ? new Date(d.vigencia_inicio).getFullYear() : '');
        const fim = d.vigencia_fim ? new Date(d.vigencia_fim).getFullYear() : 'Atual';
        const periodoStr = ano ? (ano === fim ? String(ano) : `${ano} - ${fim}`) : 'Vigente';
        trabalhos.push({
          periodo: periodoStr,
          instituicao: nomeInst,
          funcao: d.funcao || d.tipo_vinculo || 'Membro',
          local: 'Província BRM',
          observacoes: d.tipo_vinculo ? `Vínculo: ${d.tipo_vinculo}` : undefined
        });
      });

      (data.historicoComunidades || []).forEach((h: any) => {
        const pIni = h.periodo_inicio ? new Date(h.periodo_inicio).getFullYear() : '';
        const pFim = h.periodo_fim ? new Date(h.periodo_fim).getFullYear() : '';
        const periodoStr = pIni && pFim ? (pIni === pFim ? String(pIni) : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Atual` : '—');
        trabalhos.push({
          periodo: periodoStr,
          instituicao: h.instituicao || 'Instituição SCJ',
          funcao: h.funcao || 'Atuação Pastoral',
          local: h.local || undefined,
          observacoes: h.observacoes || undefined
        });
      });

      if (trabalhos.length === 0 && data.comunidade_atual_nome) {
        trabalhos.push({
          periodo: 'Atual',
          instituicao: formatarComunidadeReligiosa(data.comunidade_atual_nome),
          funcao: data.grau || 'Confrade',
          local: 'Província BRM'
        });
      }

      const fotoBase64 = await obterFotoReligiosoBase64(data);

      const blob = await gotenbergService.gerarFichaReligiosoPdf({
        nomeCivil: data.nome_civil,
        nomeReligioso: atribuirNomeReligioso(data.grau, data.nome_civil) || data.nome_religioso || undefined,
        grau: data.grau || 'Padre',
        numeroCadastro: data.numero_cadastro || undefined,
        statusCadastro: data.status_cadastro || 'Aprovado',
        dataNascimento: formatarData(data.data_nascimento),
        naturalidade: naturalidadeTexto,
        nacionalidade: data.nacionalidade || 'Brasileira',
        cpf: formatCpfMask(data.cpf),
        rg: data.rg || undefined,
        rgOrgao: data.rg_orgao_expedidor || undefined,
        tituloEleitor: data.titulo_eleitor || undefined,
        pis: data.pis || undefined,
        cnh: data.cnh || undefined,
        cnhCategoria: data.cnh_categoria || undefined,
        filiacaoPai: pai || undefined,
        filiacaoMae: mae || undefined,
        fotoUrl: fotoBase64 || data.foto_url || undefined,
        comunidadeAtualNome: formatarComunidadeReligiosa(data.comunidade_atual_nome) || undefined,
        oficioAtual: data.designacoes?.[0]?.funcao || undefined,
        telefoneCelular: data.telefone_celular || undefined,
        whatsapp: data.whatsapp || undefined,
        emailInstitucional: data.email_institucional || undefined,
        emailPessoal: data.email_pessoal || undefined,
        dataBatismo: batismo?.data ? formatarData(batismo.data) : undefined,
        paroquiaBatismo: batismo?.paroquia || undefined,
        dataPrimeirosVotos: formatarData(data.data_primeiros_votos),
        dataVotosPerpetuos: formatarData(data.data_votos_perpetuos),
        dataDiaconato: formatarData(data.data_diaconato),
        dataPresbiterato: formatarData(data.data_presbiterato),
        bispoOrdenante: data.bispo_ordenante || undefined,
        localPresbiterato: data.local_ordenacao || undefined,
        historicoTrabalhos: trabalhos,
        missoesServicos: (data.missoesServicos || []).map((m: any) => ({ tipo: m.tipo, instituicao: m.instituicao, funcao: m.funcao, periodo: m.periodo, local: m.local })),
        formacoesAcademicas: (data.formacoes || []).map((f: any) => ({ curso: f.curso || f.categoria || '', instituicao: f.instituicao || '', anoOuPeriodo: f.ano || f.periodo })),
        dataEmissao: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      });

      const nomeLimpo = (data.nome_religioso || data.nome_civil).replace(/[^a-zA-Z0-9]/g, '_');
      gotenbergService.baixarBlob(blob, `Ficha_Canonica_${nomeLimpo}.pdf`);
      showToast.success('Ficha Canônica com Trajetória e Brasão gerada com sucesso!', 'Gotenberg PDF');
    } catch (err: any) {
      showToast.error(`Erro ao gerar PDF: ${err.message || 'Verifique o serviço Gotenberg.'}`, 'Erro Gotenberg');
    } finally {
      setExportandoGotenberg(false);
    }
  };

  const handleShare = async () => {
    const nome = data?.nome_religioso || data?.nome_civil || 'Ficha do Religioso';
    const textoCompartilhar = `Ficha Cadastral Canônica - Província Brasileira Meridional (SCJ)\nReligioso: ${nome}\nComunidade: ${data?.comunidade_atual_nome || 'Província BRM'}`;

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
        <div className="w-8 h-8 rounded-full border-2 border-[#226380]/20 border-t-[#226380] animate-spin" />
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
      <PapelTimbradoBRM
        orientacao={orientacao}
        permitirTrocaOrientacao={true}
        orgaoEmissor="Arquivo Provincial · Chancelaria"
        protocolo={data?.numero_cadastro ? String(data.numero_cadastro).padStart(4, '0') : (data?.id ? data.id.slice(0, 8).toUpperCase() : 'BRM-2026')}
        dataEmissao={new Date().toLocaleDateString('pt-BR')}
        subtituloDocumento="Arquivo Provincial · Chancelaria"
        tituloDocumento="FICHA CANÔNICA CADASTRAL OFICIAL"
        onVoltar={onBack}
        rodapeComplementar={
          <div className="flex justify-between text-[6.5pt] font-mono text-slate-500 print:text-slate-600">
            <span>Emitido eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · sistema.brm.org.br</span>
            <span>Documento canônico reservado · Protegido pela LGPD</span>
          </div>
        }
        acoesExtras={
          <>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
              onClick={handleExportarGotenberg}
              disabled={exportandoGotenberg}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Emitir Ficha Oficial Canônica em PDF com Brasão Dehoniano"
            >
              {exportandoGotenberg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#226380]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#226380]" />
              )}
              <span>Exportar PDF Oficial</span>
            </button>
          </>
        }
      >

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
                {atribuirNomeReligioso(data?.grau, data?.nome_civil) || data?.nome_religioso || data?.nome_civil}
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
              <p className="font-medium text-slate-900">{atribuirNomeReligioso(data?.grau, data?.nome_civil) || data?.nome_religioso || '—'}</p>
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

        {/* Bloco 04: Trajetória de Comunidades e Trabalhos */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            04. Trajetória de Comunidades e Trabalhos (Onde Trabalhou • Ofícios e Funções)
          </p>
          <div className="space-y-1 text-[8pt]">
            {(data?.historicoComunidades && data.historicoComunidades.length > 0) || (data?.designacoes && data.designacoes.length > 0) ? (
              <table className="w-full border-collapse text-[8pt]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[7pt] uppercase text-left">
                    <th className="py-1 w-24">Período</th>
                    <th className="py-1">Comunidade / Paróquia / Casa</th>
                    <th className="py-1">Ofício / Função</th>
                    <th className="py-1">Local</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.designacoes || []).map((d: any, idx: number) => (
                    <tr key={`desig-${idx}`} className="py-1">
                      <td className="font-mono text-slate-500 py-1">{d.ano_referencia || 'Vigente'}</td>
                      <td className="font-semibold text-slate-900 py-1">{d.religiosos_obras_referencia?.nome || formatarComunidadeReligiosa(d.comunidades?.nome) || 'Comunidade Provincial'}</td>
                      <td className="text-[#226380] font-medium py-1">{d.funcao || d.tipo_vinculo || 'Membro'}</td>
                      <td className="text-slate-600 py-1">Província BRM</td>
                    </tr>
                  ))}
                  {(data.historicoComunidades || []).map((h: any, idx: number) => (
                    <tr key={`hist-${idx}`} className="py-1">
                      <td className="font-mono text-slate-500 py-1">
                        {h.periodo_inicio ? new Date(h.periodo_inicio).getFullYear() : '—'}
                        {h.periodo_fim ? ` - ${new Date(h.periodo_fim).getFullYear()}` : ' - Atual'}
                      </td>
                      <td className="font-semibold text-slate-900 py-1">{h.instituicao}</td>
                      <td className="text-[#226380] font-medium py-1">{h.funcao || 'Atuação Pastoral'}</td>
                      <td className="text-slate-600 py-1">{h.local || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic py-1">Comunidade Atual: <strong>{data?.comunidade_atual_nome || 'Sede Provincial BRM'}</strong></p>
            )}
          </div>
        </div>

        {/* Bloco 5: Formação Acadêmica & Graus Obtidos */}
        <div className="mb-6">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            05. Formação Acadêmica & Graus Obtidos
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
              <p className="text-slate-500 italic py-1">Filosofia e Teologia — Província Brasileira Meridional</p>
            )}
          </div>
        </div>

        {/* Assinaturas Institucionais */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[7.5pt] break-inside-avoid">
          <div>
            <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
            <p className="font-semibold text-slate-800">{atribuirNomeReligioso(data?.grau, data?.nome_civil) || data?.nome_religioso || data?.nome_civil}</p>
            <p className="text-[6.5pt] text-slate-400">Assinatura do Religioso</p>
          </div>
          <div>
            <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
            <p className="font-semibold text-slate-800">Chancelaria · Arquivo Provincial</p>
            <p className="text-[6.5pt] text-slate-400">Assinatura e carimbo</p>
          </div>
        </div>
      </PapelTimbradoBRM>
    </div>
  );
};

export default FichaCanonicaPDF;
